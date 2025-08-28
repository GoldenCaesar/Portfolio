const playerCanvas = document.getElementById('player-canvas');
const shadowCanvas = document.getElementById('player-shadow-canvas');
const playerMapContainer = document.getElementById('player-map-container');
const pCtx = playerCanvas ? playerCanvas.getContext('2d') : null;

// Dice Roller Elements
const diceRollerIcon = document.getElementById('dice-roller-icon');
const diceRollerOverlay = document.getElementById('dice-roller-overlay');
const diceRollerCloseButton = document.getElementById('dice-roller-close-button');

// Slideshow elements
const slideshowContainer = document.getElementById('slideshow-container');
const contentContainer = document.getElementById('content-container');
const portraitImg = document.getElementById('portrait-img');
const portraitInitials = document.getElementById('portrait-initials');
const quoteText = document.getElementById('quote-text');
const authorText = document.getElementById('author-text');

let slideshowActive = false;
let slideshowPlaylist = [];
let currentSlideIndex = 0;
let slideshowTimeout = null;

function updateSlide() {
    if (slideshowPlaylist.length === 0 || currentSlideIndex >= slideshowPlaylist.length) {
        return;
    }

    const slideData = slideshowPlaylist[currentSlideIndex];
    const character = slideData.character;

    console.log(`Updating slide for character: ${character.name}`);

    if (character.isDetailsVisible) {
        if (character.sheetData.character_portrait) {
            portraitImg.src = character.sheetData.character_portrait;
            portraitImg.style.display = 'block';
            portraitInitials.style.display = 'none';
        } else {
            portraitImg.style.display = 'none';
            portraitInitials.textContent = getInitials(character.name);
            portraitInitials.style.display = 'flex';
        }
        authorText.textContent = `${character.name} (${character.sheetData.player_name || 'N/A'})`;
    } else {
        portraitImg.style.display = 'none';
        portraitInitials.textContent = '??';
        portraitInitials.style.display = 'flex';
        authorText.textContent = '???';
    }

    quoteText.textContent = `"${slideData.quote}"`;
}

function animateSlideshow() {
    if (!slideshowActive) return;

    if (currentSlideIndex >= slideshowPlaylist.length) {
        console.log("Slideshow playlist finished.");
        slideshowActive = false;
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'slideshowFinished' }, '*');
        }
        return;
    }

    console.log(`Animating slide ${currentSlideIndex + 1}/${slideshowPlaylist.length}`);

    contentContainer.classList.remove("animate-out");
    contentContainer.classList.add("animate-in");

    updateSlide();

    slideshowTimeout = setTimeout(() => {
        if (!slideshowActive) return;
        contentContainer.classList.remove("animate-in");
        contentContainer.classList.add("animate-out");

        slideshowTimeout = setTimeout(() => {
            if (!slideshowActive) return;
            currentSlideIndex++;
            animateSlideshow();
        }, 1000);
    }, 6000);
}


let currentMapImage = null;
let currentOverlays = [];
let initiativeTokens = [];
let currentMapTransform = { scale: 1, originX: 0, originY: 0 };
const imageCache = new Map();
let currentMapDisplayData = {
    img: null,
    ratio: 1,
    offsetX: 0,
    offsetY: 0,
    imgWidth: 0,
    imgHeight: 0,
    scaledWidth: 0,
    scaledHeight: 0
};
let activeInitiative = [];
let initiativeTurn = -1;

// Rendering optimization state
let lightMapCanvas = null;
let lightMapCtx = null;
let isLightMapDirty = true;
let renderQuality = 0.5; // Default quality, will be updated by DM

let shadowAnimationId = null;

function getPolygonSignedArea(polygon) {
    let area = 0;
    if (polygon.length < 4) { // A closed polygon needs at least 4 points (e.g., A, B, C, A)
        return 0;
    }
    for (let i = 0; i < polygon.length - 1; i++) {
        const p1 = polygon[i];
        const p2 = polygon[i + 1];
        area += (p1.x * p2.y - p2.x * p1.y);
    }
    return area / 2;
}

function isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].x, yi = polygon[i].y;
        let xj = polygon[j].x, yj = polygon[j].y;
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getLineIntersection(p1, p2) {
    const dX = p1.x2 - p1.x1;
    const dY = p1.y2 - p1.y1;
    const dX2 = p2.x2 - p2.x1;
    const dY2 = p2.y2 - p2.y1;
    const denominator = dX * dY2 - dY * dX2;

    if (denominator === 0) return null;

    const t = ((p2.x1 - p1.x1) * dY2 - (p2.y1 - p1.y1) * dX2) / denominator;
    const u = -((p1.x1 - p2.x1) * dY - (p1.y1 - p2.y1) * dX) / denominator;

    if (t >= 0 && u >= 0 && u <= 1) {
        return { x: p1.x1 + t * dX, y: p1.y1 + t * dY };
    }

    return null;
}

function recalculateLightMap_Player() {
    if (!isLightMapDirty) return;

    if (!currentMapDisplayData.img) {
        if (lightMapCtx) {
            lightMapCtx.clearRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);
        }
        isLightMapDirty = false;
        return;
    }

    const requiredWidth = Math.floor(currentMapDisplayData.imgWidth * renderQuality);
    const requiredHeight = Math.floor(currentMapDisplayData.imgHeight * renderQuality);

    if (!lightMapCanvas || lightMapCanvas.width !== requiredWidth || lightMapCanvas.height !== requiredHeight) {
        lightMapCanvas = document.createElement('canvas');
        lightMapCanvas.width = requiredWidth;
        lightMapCanvas.height = requiredHeight;
        lightMapCtx = lightMapCanvas.getContext('2d');
    }

    const dmLightSources = currentOverlays.filter(o => o.type === 'lightSource');
    const tokenLightSources = initiativeTokens
        .filter(token => token.isDetailsVisible !== false)
        .map(token => ({
            type: 'lightSource',
            position: { x: token.x, y: token.y },
            radius: 40 // A reasonable default radius for a token
        }));
    const lightSources = [...dmLightSources, ...tokenLightSources];
    const walls = currentOverlays.filter(o => o.type === 'wall');
    const closedDoors = currentOverlays.filter(o => o.type === 'door' && !o.isOpen);
    // Smart objects are only visible to the DM, so we don't filter them here for the player.
    const smartObjects = currentOverlays.filter(o => o.type === 'smart_object');

    lightMapCtx.clearRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);
    lightMapCtx.fillStyle = 'rgba(0, 0, 0, 1)'; // Full black for player fog of war
    lightMapCtx.fillRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);

    const lightScale = renderQuality;
    const imgWidth = currentMapDisplayData.imgWidth;
    const imgHeight = currentMapDisplayData.imgHeight;

    const allSegments = [];
    walls.forEach(wall => {
        for (let i = 0; i < wall.points.length - 1; i++) {
            allSegments.push({ p1: wall.points[i], p2: wall.points[i + 1], parent: wall });
        }
    });
    closedDoors.forEach(door => {
        allSegments.push({ p1: door.points[0], p2: door.points[1], parent: door });
    });
    smartObjects.forEach(object => {
        for (let i = 0; i < object.polygon.length - 1; i++) {
            allSegments.push({ p1: object.polygon[i], p2: object.polygon[i + 1], parent: object });
        }
    });

    allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });

    const allVertices = [];
    allSegments.forEach(seg => {
        allVertices.push(seg.p1, seg.p2);
    });

    lightSources.forEach(light => {
        const visiblePoints = [];
        const angles = new Set();

        let lightIsInsideObject = false;
        for (const so of smartObjects) {
            if (isPointInPolygon(light.position, so.polygon)) {
                lightIsInsideObject = true;
                break;
            }
        }

        allVertices.forEach(vertex => {
            const angle = Math.atan2(vertex.y - light.position.y, vertex.x - light.position.x);
            angles.add(angle - 0.0001);
            angles.add(angle);
            angles.add(angle + 0.0001);
        });

        const sortedAngles = Array.from(angles).sort((a, b) => a - b);

        sortedAngles.forEach(angle => {
            const ray = {
                x1: light.position.x,
                y1: light.position.y,
                x2: light.position.x + (imgWidth + imgHeight) * 2 * Math.cos(angle),
                y2: light.position.y + (imgWidth + imgHeight) * 2 * Math.sin(angle)
            };

            let closestIntersection = null;
            let minDistance = Infinity;

            allSegments.forEach(segment => {
                const intersectionPoint = getLineIntersection(ray, { x1: segment.p1.x, y1: segment.p1.y, x2: segment.p2.x, y2: segment.p2.y });
                if (intersectionPoint) {
                    let ignoreThisIntersection = false;
                    if (segment.parent.type === 'smart_object') {
                        const p1 = segment.p1;
                        const p2 = segment.p2;
                        const normal = { x: p2.y - p1.y, y: p1.x - p2.x }; // Outward-facing normal for clockwise polygons
                        const lightVector = { x: intersectionPoint.x - light.position.x, y: intersectionPoint.y - light.position.y };
                        const dot = (lightVector.x * normal.x) + (lightVector.y * normal.y);

                        if (!lightIsInsideObject && dot > 0) {
                            ignoreThisIntersection = true;
                        }
                    }

                    if (!ignoreThisIntersection) {
                        const distance = Math.sqrt(Math.pow(intersectionPoint.x - light.position.x, 2) + Math.pow(intersectionPoint.y - light.position.y, 2));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIntersection = intersectionPoint;
                        }
                    }
                }
            });

            if (closestIntersection) {
                visiblePoints.push(closestIntersection);
            } else {
                visiblePoints.push({ x: ray.x2, y: ray.y2 });
            }
        });

        lightMapCtx.save();
        lightMapCtx.globalCompositeOperation = 'destination-out';
        lightMapCtx.beginPath();
        if (visiblePoints.length > 0) {
            const firstPoint = visiblePoints[0];
            lightMapCtx.moveTo(firstPoint.x * lightScale, firstPoint.y * lightScale);
            visiblePoints.forEach(point => {
                lightMapCtx.lineTo(point.x * lightScale, point.y * lightScale);
            });
            lightMapCtx.closePath();
            lightMapCtx.fill();
        }
        lightMapCtx.restore();
    });

    isLightMapDirty = false;
}


function animateShadows() {
    if (!shadowAnimationId) return;

    if (isLightMapDirty) {
        recalculateLightMap_Player();
    }

    const shadowCtx = shadowCanvas.getContext('2d');
    shadowCanvas.width = playerCanvas.width;
    shadowCanvas.height = playerCanvas.height;
    shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);

    if (lightMapCanvas) {
        const { scale, originX, originY } = currentMapTransform;
        shadowCtx.save();
        shadowCtx.translate(originX, originY);
        shadowCtx.scale(scale, scale);
        shadowCtx.imageSmoothingEnabled = false;
        shadowCtx.drawImage(lightMapCanvas, 0, 0, currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight);
        shadowCtx.restore();
    }

    requestAnimationFrame(animateShadows);
}

function toggleShadowAnimation(start) {
    if (start && !shadowAnimationId) {
        shadowAnimationId = requestAnimationFrame(animateShadows);
    } else if (!start && shadowAnimationId) {
        cancelAnimationFrame(shadowAnimationId);
        shadowAnimationId = null;
        const shadowCtx = shadowCanvas.getContext('2d');
        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
    }
}

function drawMapAndOverlays() {
    console.log('drawMapAndOverlays called. Transform:', JSON.stringify(currentMapTransform));
    if (!playerCanvas || !pCtx) {
        console.error("Player canvas or context not initialized.");
        return;
    }
    if (!currentMapImage || !currentMapImage.complete) {
        drawPlaceholder("Map image not loaded or incomplete.");
        return;
    }
    if (!playerMapContainer) {
        console.error("Player map container not found for drawing.");
        return;
    }

    playerCanvas.width = playerMapContainer.clientWidth;
    playerCanvas.height = playerMapContainer.clientHeight;

    pCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
    pCtx.save();

    pCtx.translate(currentMapTransform.originX, currentMapTransform.originY);
    pCtx.scale(currentMapTransform.scale, currentMapTransform.scale);

    pCtx.drawImage(currentMapImage, 0, 0, currentMapImage.width, currentMapImage.height);

    drawOverlays_PlayerView(currentOverlays);

    // Draw initiative tokens on top of everything else, still within the transformed context
    if (initiativeTokens.length > 0) {
        initiativeTokens.forEach(token => {
            drawToken(pCtx, token);
        });
    }

    pCtx.restore();

    const hRatio = playerCanvas.width / currentMapImage.width;
    const vRatio = playerCanvas.height / currentMapImage.height;
    const fitRatio = Math.min(hRatio, vRatio);

    currentMapDisplayData = {
        img: currentMapImage,
        ratio: fitRatio,
        imgWidth: currentMapImage.width,
        imgHeight: currentMapImage.height,
        scaledWidth: currentMapImage.width * currentMapTransform.scale,
        scaledHeight: currentMapImage.height * currentMapTransform.scale,
        offsetX: currentMapTransform.originX,
        offsetY: currentMapTransform.originY,
        scale: currentMapTransform.scale
    };
}

function drawOverlays_PlayerView(overlays) {
    if (!pCtx || (!overlays || overlays.length === 0) && initiativeTokens.length === 0 || !currentMapDisplayData.img) return;

    if(overlays) {
        overlays.forEach(overlay => {
            if (overlay.type === 'childMapLink' && overlay.polygon) {
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(100, 100, 255, 0.4)';
            pCtx.lineWidth = 2 / currentMapTransform.scale; // Keep line width consistent
            overlay.polygon.forEach((point, index) => {
                const canvasX = point.x;
                const canvasY = point.y;
                if (index === 0) {
                    pCtx.moveTo(canvasX, canvasY);
                } else {
                    pCtx.lineTo(canvasX, canvasY);
                }
            });
            if (overlay.polygon.length > 2) {
                const firstPoint = overlay.polygon[0];
                const firstPointCanvasX = firstPoint.x;
                const firstPointCanvasY = firstPoint.y;
                pCtx.lineTo(firstPointCanvasX, firstPointCanvasY);
            }
            pCtx.stroke();
        } else if (overlay.type === 'noteLink' && overlay.position) {
            const iconSize = 20 / currentMapTransform.scale;
            const canvasX = overlay.position.x;
            const canvasY = overlay.position.y;
            pCtx.fillStyle = 'rgba(102, 255, 102, 0.9)';
            pCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.strokeStyle = 'black';
            pCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.fillStyle = 'black';
            pCtx.font = `${iconSize * 0.8}px sans-serif`;
            pCtx.textAlign = 'center';
            pCtx.textBaseline = 'middle';
            pCtx.fillText('📝', canvasX, canvasY);
        } else if (overlay.type === 'characterLink' && overlay.position) {
            const iconSize = 20 / currentMapTransform.scale;
            const canvasX = overlay.position.x;
            const canvasY = overlay.position.y;

            let fillStyle = 'rgba(102, 255, 102, 0.9)'; // Greenish if visible to player

            pCtx.fillStyle = fillStyle;
            pCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.strokeStyle = 'black';
            pCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

            pCtx.fillStyle = 'black';
            pCtx.font = `${iconSize * 0.8}px sans-serif`;
            pCtx.textAlign = 'center';
            pCtx.textBaseline = 'middle';
            pCtx.fillText('👤', canvasX, canvasY);

            if (overlay.character_portrait) {
                let img = imageCache.get(overlay.character_portrait);
                if (!img) {
                    img = new Image();
                    img.src = overlay.character_portrait;
                    // No onload redraw to prevent race conditions. The browser will draw it when it loads.
                    imageCache.set(overlay.character_portrait, img);
                }

                if (img.complete) {
                    pCtx.beginPath();
                    pCtx.arc(canvasX, canvasY, iconSize / 2, 0, Math.PI * 2, true);
                    pCtx.closePath();
                    pCtx.clip();
                    pCtx.drawImage(img, canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
                    pCtx.beginPath(); // Reset path after clipping
                }
            }
        } else if (overlay.type === 'placedAsset' && overlay.position && overlay.dataUrl) {
                let img = imageCache.get(overlay.dataUrl);
                if (!img) {
                    img = new Image();
                    img.src = overlay.dataUrl;
                    img.onload = () => {
                        // Request a redraw from the main logic once the image is loaded
                        drawMapAndOverlays();
                    };
                    imageCache.set(overlay.dataUrl, img);
                }

                if (img.complete) {
                    const assetScale = overlay.scale || 1;
                    const assetRotation = overlay.rotation || 0;

                    // The context is already transformed by the map scale, so we just use asset properties
                    const assetRenderWidth = overlay.width * assetScale;
                    const assetRenderHeight = overlay.height * assetScale;

                    pCtx.save();
                    pCtx.translate(overlay.position.x, overlay.position.y);
                    pCtx.rotate(assetRotation);

                    pCtx.drawImage(img, -assetRenderWidth / 2, -assetRenderHeight / 2, assetRenderWidth, assetRenderHeight);

                    pCtx.restore();
                }
            }
        });
    }

    // The main drawMapAndOverlays function now handles drawing tokens.
}

window.addEventListener('message', (event) => {
    // Basic security: check origin if DM view is on a different domain in production.
    // Example: if (event.origin !== "https://your-dm-view-domain.com") return;
    console.log('[Player View] Received message:', event.data);
    const data = event.data;

    if (data && data.type) {
        switch (data.type) {
            case 'startSlideshow':
                console.log("Player view received startSlideshow message.");
                slideshowPlaylist = data.playlist;
                currentSlideIndex = data.startIndex || 0;

                if (slideshowPlaylist && slideshowPlaylist.length > 0) {
                    slideshowActive = true;
                    playerMapContainer.style.display = 'none';
                    slideshowContainer.style.display = 'flex';
                    animateSlideshow();
                }
                break;
            case 'loadMap':
                if (slideshowActive) {
                    slideshowActive = false;
                    if (slideshowTimeout) {
                        clearTimeout(slideshowTimeout);
                    }
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage({ type: 'slideshowPaused', index: currentSlideIndex }, '*');
                    }
                }

            case 'loadMap':
                console.log("[Player View] Executing 'loadMap' case.");
                slideshowContainer.style.display = 'none';
                playerMapContainer.style.display = 'flex';

                if (data.mapDataUrl) {
                    const img = new Image();
                    img.onload = () => {
                        console.log('[Player View] Image successfully loaded.', {
                            imgWidth: img.width,
                            imgHeight: img.height,
                            containerWidth: playerMapContainer.clientWidth,
                            containerHeight: playerMapContainer.clientHeight
                        });
                        currentMapImage = img;
                        currentOverlays = data.overlays || [];
                        if (data.viewRectangle) {
                            const viewRect = data.viewRectangle;
                            const hScale = playerCanvas.width / viewRect.width;
                            const vScale = playerCanvas.height / viewRect.height;
                            const scale = playerCanvas.width / viewRect.width;
                            const renderedWidth = viewRect.width * scale;
                            const renderedHeight = viewRect.height * scale;
                            currentMapTransform.scale = scale;
                            currentMapTransform.originX = -viewRect.x * scale + (playerCanvas.width - renderedWidth) / 2;
                            currentMapTransform.originY = -viewRect.y * scale + (playerCanvas.height - renderedHeight) / 2;
                        }
                        drawMapAndOverlays();
                        isLightMapDirty = true;
                        toggleShadowAnimation(data.active);
                    };
                    img.onerror = () => {
                        console.error("[Player View] Error loading map image.", { src: data.mapDataUrl });
                        drawPlaceholder("Error loading map.");
                        currentMapImage = null;
                        toggleShadowAnimation(false);
                    };
                    console.log('[Player View] Setting image src to load map.');
                    img.src = data.mapDataUrl;
                } else {
                    drawPlaceholder("Received invalid map data from DM.");
                    toggleShadowAnimation(false);
                }
                break;
            case 'mapTransformUpdate':
                if (data.viewRectangle) {
                    const viewRect = data.viewRectangle;
                    const scale = playerCanvas.width / viewRect.width;
                    const renderedWidth = viewRect.width * scale;
                    const renderedHeight = viewRect.height * scale;
                    currentMapTransform.scale = scale;
                    currentMapTransform.originX = -viewRect.x * scale + (playerCanvas.width - renderedWidth) / 2;
                    currentMapTransform.originY = -viewRect.y * scale + (playerCanvas.height - renderedHeight) / 2;
                    isLightMapDirty = true;
                    drawMapAndOverlays();
                }
                break;
            // Note: 'polygonVisibilityUpdate' from DM is largely superseded by DM sending
            // the full 'loadMap' with the updated set of visible overlays.
            // Handling it here defensively or if DM's strategy changes.
            case 'polygonVisibilityUpdate':
                 if (currentMapImage && data.mapFileName && currentMapDisplayData.img && data.mapFileName === currentMapDisplayData.img.name) {
                    const polygonIdToUpdate = data.polygonIdentifier;
                    let changed = false;
                    if (data.isVisible) {
                        // This case implies DM would need to send the polygon data for it to be added.
                        // Current DM logic resends the whole map.
                        console.log("Player view: 'polygonVisibilityUpdate' (visible:true) received. Expecting DM to have sent full map state.");
                        // If polygonData was included in message:
                        // if (data.polygonData && !currentOverlays.some(ov => JSON.stringify(ov.polygon) === polygonIdToUpdate)) {
                        //    currentOverlays.push(data.polygonData);
                        //    changed = true;
                        // }
                    } else { // isVisible is false
                        const initialOverlayCount = currentOverlays.length;
                        currentOverlays = currentOverlays.filter(ov => JSON.stringify(ov.polygon) !== polygonIdToUpdate);
                        if (currentOverlays.length < initialOverlayCount) {
                            changed = true;
                        }
                    }
                    if (changed) {
                        console.log("Player view: Overlays updated by polygonVisibilityUpdate, redrawing.");
                        drawMapAndOverlays();
                    }
                } else {
                     console.warn("Player view: Received polygonVisibilityUpdate for a non-matching/non-loaded map.");
                }
                break;
            case 'showNotePreview':
                const notePreviewOverlay = document.getElementById('note-preview-overlay');
                const notePreviewBody = document.getElementById('note-preview-body');
                if (notePreviewOverlay && notePreviewBody && data.content) {
                    notePreviewBody.innerHTML = data.content;
                    notePreviewOverlay.style.display = 'flex';
                }
                break;
            case 'hideNotePreview':
                const notePreviewOverlayToHide = document.getElementById('note-preview-overlay');
                if (notePreviewOverlayToHide) {
                    notePreviewOverlayToHide.style.display = 'none';
                }
                break;
            case 'showCharacterPreview':
                const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                const characterPreviewBody = document.getElementById('character-preview-body');
                if (characterPreviewOverlay && characterPreviewBody && data.content) {
                    characterPreviewBody.innerHTML = data.content;
                    characterPreviewOverlay.style.display = 'flex';
                }
                break;
            case 'hideCharacterPreview':
                const characterPreviewOverlayToHide = document.getElementById('character-preview-overlay');
                if (characterPreviewOverlayToHide) {
                    characterPreviewOverlayToHide.style.display = 'none';
                }
                break;
            case 'diceMenuState':
                if (diceRollerOverlay) {
                    diceRollerOverlay.style.display = data.isOpen ? 'flex' : 'none';
                }
                break;
            case 'diceRoll':
                const diceResultSum = document.getElementById('dice-result-sum');
                const diceResultDetails = document.getElementById('dice-result-details');
                if (diceResultSum && diceResultDetails) {
                    diceResultSum.textContent = data.sum;
                    diceResultDetails.textContent = `Rolls: [${data.results.join(', ')}]`;
                }
                break;
            case 'diceIconMenuState':
                const diceIconMenu = document.getElementById('dice-icon-menu');
                if (diceIconMenu) {
                    diceIconMenu.style.display = data.isOpen ? 'block' : 'none';
                }
                break;
            case 'initiativeTrackerState':
                const initiativeTrackerOverlay = document.getElementById('initiative-tracker-overlay');
                if (initiativeTrackerOverlay) {
                    initiativeTrackerOverlay.style.display = data.isOpen ? 'flex' : 'none';
                }
                break;
            case 'actionLogState':
                const diceDialogueRecord = document.getElementById('dice-dialogue-record');
                if (diceDialogueRecord) {
                    diceDialogueRecord.style.display = data.isOpen ? 'flex' : 'none';
                    if (data.isOpen) {
                        diceDialogueRecord.classList.add('persistent-log');
                        diceDialogueRecord.innerHTML = ''; // Clear content

                        if (!diceDialogueRecord.querySelector('.overlay-minimize-button')) {
                            const minimizeButton = document.createElement('button');
                            minimizeButton.className = 'overlay-minimize-button';
                            minimizeButton.textContent = '—';
                            minimizeButton.onclick = () => {
                                diceDialogueRecord.classList.remove('persistent-log');
                                diceDialogueRecord.style.display = 'none';
                            };
                            diceDialogueRecord.prepend(minimizeButton);
                        }

                        if (data.history) {
                            data.history.forEach(logEntry => {
                                const card = createLogCard(logEntry);
                                if (diceDialogueRecord.firstChild) {
                                    diceDialogueRecord.insertBefore(card, diceDialogueRecord.firstChild.nextSibling);
                                } else {
                                    diceDialogueRecord.appendChild(card);
                                }
                            });
                        }
                    } else {
                        diceDialogueRecord.classList.remove('persistent-log');
                    }
                }
                break;
            case 'toast':
                displayToast(createLogCard(data.rollData));
                break;
            case 'initiativeDataUpdate':
                activeInitiative = data.activeInitiative || [];
                initiativeTurn = data.initiativeTurn ?? -1;
                initiativeTokens = data.initiativeTokens || [];
                isLightMapDirty = true;

                const gameTimeTimer = document.getElementById('game-time-timer');
                if(gameTimeTimer) gameTimeTimer.textContent = `${data.gameTime || 0}s`;

                renderInitiativeList();
                drawMapAndOverlays();
                break;
            case 'tokenStatBlockState':
                if (data.show) {
                    populateAndShowStatBlock_Player(data.character, data.position);
                } else {
                    const tokenStatBlock = document.getElementById('token-stat-block');
                    if (tokenStatBlock) {
                        tokenStatBlock.style.display = 'none';
                    }
                }
                break;
            case 'renderQualityUpdate':
                if (typeof data.quality === 'number') {
                    renderQuality = data.quality;
                    isLightMapDirty = true; // Recalculate with new quality
                    console.log(`Player view render quality updated to: ${renderQuality}`);
                }
                break;
            default:
                console.log("Player view received unhandled message type:", data.type);
                break;
        }
    } else {
        console.log("Player view received non-standard message:", data);
    }
});

function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.substring(0, 2);
}

function createLogCard(data) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('dice-dialogue-message');

    const cardContent = document.createElement('div');
    cardContent.classList.add('dice-roll-card-content'); // Reuse styles
    messageElement.appendChild(cardContent);

    if (data.type === 'roll') {
        const profilePic = document.createElement('div');
        profilePic.classList.add('dice-roll-profile-pic');
        if (data.characterPortrait) {
            profilePic.style.backgroundImage = `url('${data.characterPortrait}')`;
        } else {
            profilePic.textContent = data.characterInitials || getInitials(data.characterName);
        }
        cardContent.appendChild(profilePic);

        const textContainer = document.createElement('div');
        textContainer.classList.add('dice-roll-text-container');
        cardContent.appendChild(textContainer);

        const namePara = document.createElement('p');
        namePara.classList.add('dice-roll-name');
        namePara.innerHTML = `<strong>${data.characterName}</strong> played by <strong>${data.playerName}</strong>`;
        textContainer.appendChild(namePara);

        const detailsPara = document.createElement('p');
        detailsPara.classList.add('dice-roll-details');
        detailsPara.innerHTML = `<strong class="dice-roll-sum-text">${data.sum}</strong> | ${data.roll}`;
        textContainer.appendChild(detailsPara);
    } else { // System or Note
        const detailsPara = document.createElement('p');
        detailsPara.classList.add('dice-roll-details');
        detailsPara.innerHTML = data.message;
        cardContent.appendChild(detailsPara);
    }

    return messageElement;
}

let activeToastTimers = [];
function displayToast(messageElement) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer || document.querySelector('.dice-dialogue.persistent-log')) {
        return;
    }

    const toastNode = messageElement.cloneNode(true);
    toastNode.classList.add('toast-message');
    toastContainer.appendChild(toastNode);

    const timerId = setTimeout(() => {
        toastNode.style.animation = 'toast-fade-out 0.5s ease-out forwards';
        toastNode.addEventListener('animationend', () => {
            toastNode.remove();
            const index = activeToastTimers.indexOf(timerId);
            if (index > -1) {
                activeToastTimers.splice(index, 1);
            }
        });
    }, 4500);

    activeToastTimers.push(timerId);
}

function drawToken(ctx, token) {
    // This function is now called within a transformed context,
    // so we draw relative to the image's own coordinate system.
    const canvasX = token.x;
    const canvasY = token.y;

    const percentage = token.size / 100;
    const baseDimension = currentMapDisplayData.imgWidth;
    const pixelSizeOnImage = percentage * baseDimension;
    // We don't scale the size here because the context is already scaled.
    const size = pixelSizeOnImage;
    const invScale = 1 / currentMapDisplayData.scale;

    if (initiativeTurn !== -1 && activeInitiative[initiativeTurn] && activeInitiative[initiativeTurn].uniqueId === token.uniqueId) {
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, (size / 2) + (5 * invScale), 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fill();
    }

    const characterInInitiative = activeInitiative.find(c => c.uniqueId === token.uniqueId);
    if (characterInInitiative && characterInInitiative.sheetData) {
        const maxHp = parseInt(characterInInitiative.sheetData.hp_max, 10);
        const currentHp = parseInt(characterInInitiative.sheetData.hp_current, 10);

        if (!isNaN(maxHp) && !isNaN(currentHp) && maxHp > 0) {
            const healthPercentage = Math.max(0, currentHp / maxHp);
            const ringRadius = (size / 2) + (8 * invScale);
            const ringWidth = 6 * invScale;

            ctx.beginPath();
            ctx.arc(canvasX, canvasY, ringRadius, 0, Math.PI * 2, false);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = ringWidth;
            ctx.stroke();

            if (healthPercentage > 0) {
                ctx.beginPath();
                ctx.arc(canvasX, canvasY, ringRadius, -Math.PI / 2, (-Math.PI / 2) + (healthPercentage * Math.PI * 2), false);
                ctx.strokeStyle = 'green';
                ctx.lineWidth = ringWidth;
                ctx.stroke();
            }
        }
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#4a5f7a';
    ctx.fill();
    ctx.clip();

    if (token.portrait) {
        let img = imageCache.get(token.portrait);
        if (!img) {
            img = new Image();
            img.src = token.portrait;
            // No onload redraw to prevent race conditions. The browser will draw it when it loads.
            imageCache.set(token.portrait, img);
        }

        if (img.complete) {
            ctx.drawImage(img, canvasX - size / 2, canvasY - size / 2, size, size);
        } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.font = `${size * 0.4}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(token.initials, canvasX, canvasY);
        }
    } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = `${size * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.initials, canvasX, canvasY);
    }

    ctx.restore();
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2 * invScale;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2 * invScale;
    ctx.font = `bold ${12 * invScale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(token.name, canvasX, canvasY + size / 2 + (14 * invScale));
    ctx.font = `${10 * invScale}px sans-serif`;
    ctx.fillText(`(${token.playerName})`, canvasX, canvasY + size / 2 + (26 * invScale));
    ctx.shadowBlur = 0;
}


function createInitiativeCharacterCard(character) {
    const li = document.createElement('li');
    li.className = 'initiative-character-card';

    if (character.sheetData?.character_portrait) {
        const portrait = document.createElement('img');
        portrait.src = character.sheetData.character_portrait;
        li.appendChild(portrait);
    } else {
        const initials = document.createElement('div');
        initials.className = 'initiative-character-initials';
        initials.textContent = getInitials(character.name);
        li.appendChild(initials);
    }

    const info = document.createElement('div');
    info.className = 'initiative-character-info';

    const name = document.createElement('h4');
    name.textContent = character.name;
    info.appendChild(name);

    const details = document.createElement('p');
    details.textContent = `${character.sheetData?.class_level || 'N/A'} ${character.sheetData?.race || ''}`;
    info.appendChild(details);

    li.appendChild(info);

    const hp = document.createElement('div');
    hp.className = 'initiative-character-hp';
    hp.innerHTML = `HP: <span>${character.sheetData?.hp_current || ''} / ${character.sheetData?.hp_max || 'N/A'}</span>`;
    li.appendChild(hp);

    const initiativeValue = document.createElement('div');
    initiativeValue.className = 'initiative-value';
    initiativeValue.textContent = character.initiative ?? '-';
    li.appendChild(initiativeValue);

    return li;
}

function renderInitiativeList() {
    const activeInitiativeList = document.getElementById('initiative-active-list');
    if (!activeInitiativeList) return;

    activeInitiativeList.innerHTML = '';
    activeInitiative.forEach((character, index) => {
        const card = createInitiativeCharacterCard(character);
        if (index === initiativeTurn) {
            card.classList.add('active-turn');
        }
        activeInitiativeList.appendChild(card);
    });
}

function populateAndShowStatBlock_Player(character, position) {
    const tokenStatBlock = document.getElementById('token-stat-block');
    if (!tokenStatBlock || !character) {
        if(tokenStatBlock) tokenStatBlock.style.display = 'none';
        return;
    }

    document.getElementById('token-stat-block-char-name').textContent = character.name;
    document.getElementById('token-stat-block-player-name').textContent = `(${character.sheetData.player_name || 'N/A'})`;
    document.getElementById('token-stat-block-hp').textContent = character.sheetData.hp_current || 0;
    document.getElementById('token-stat-block-max-hp').textContent = `/ ${character.sheetData.hp_max || 'N/A'}`;

    tokenStatBlock.style.display = 'block'; // Make it visible to measure it

    const canvasRect = playerCanvas.getBoundingClientRect();
    const statBlockRect = tokenStatBlock.getBoundingClientRect();
    const containerRect = playerMapContainer.getBoundingClientRect();

    // The canvas is also inside the container. We need its position relative to the container.
    const canvasTopInContainer = canvasRect.top - containerRect.top;
    const canvasRightInContainer = (canvasRect.left - containerRect.left) + canvasRect.width;

    // Position at the top right of the canvas, with a 10px margin
    const top = canvasTopInContainer + 10;
    const left = canvasRightInContainer - statBlockRect.width - 10;

    tokenStatBlock.style.left = `${left}px`;
    tokenStatBlock.style.top = `${top}px`;
}


function resizeAndRedraw() {
    if (currentMapImage && currentMapImage.complete) {
        // console.log("Player view: Resizing and redrawing map.");
        drawMapAndOverlays();
    } else {
        // console.log("Player view: Resizing and redrawing placeholder.");
        drawPlaceholder("Waiting for DM to share map...");
    }
}

window.addEventListener('resize', () => {
    // Debounce resize event
    setTimeout(resizeAndRedraw, 50);
});

function drawPlaceholder(message = "Waiting for DM to share map...") {
    if (!playerCanvas || !pCtx || !playerMapContainer) {
        // console.error("drawPlaceholder: Canvas, context, or container not available.");
        return;
    }

    playerCanvas.width = playerMapContainer.clientWidth;
    playerCanvas.height = playerMapContainer.clientHeight;

    pCtx.fillStyle = '#2a3138';
    pCtx.fillRect(0, 0, playerCanvas.width, playerCanvas.height);
    pCtx.fillStyle = '#777';
    pCtx.font = '20px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText(message, playerCanvas.width / 2, playerCanvas.height / 2);
    // console.log("Player view: Placeholder drawn with message - " + message);
}

// Initial DOMContentLoaded setup
document.addEventListener('DOMContentLoaded', () => {
    // Re-check elements as they should be available now.
    const localPlayerCanvas = document.getElementById('player-canvas');
    const localPlayerMapContainer = document.getElementById('player-map-container');
    const localPCtx = localPlayerCanvas ? localPlayerCanvas.getContext('2d') : null;

    if (localPlayerCanvas && localPlayerMapContainer && localPCtx) {
        // console.log("Player view: DOMContentLoaded - Canvas and container found. Drawing initial placeholder.");
        // It's important that global pCtx is also updated if it wasn't available at script parse time.
        // However, playerCanvas, pCtx, playerMapContainer are already assigned globally.
        // This check is more for ensuring they are indeed found before first draw.
        drawPlaceholder();
    } else {
        console.error("Player view: DOMContentLoaded - Critical elements (canvas, container, or context) not found.");
    }

    if (window.opener && !window.opener.closed) {
        setTimeout(() => {
            window.opener.postMessage({ type: 'playerViewReady' }, '*');
            // console.log("Player view sent playerViewReady message to opener.");
        }, 100);
    }

    const characterPreviewClose = document.getElementById('character-preview-close');
    if (characterPreviewClose) {
        characterPreviewClose.addEventListener('click', () => {
            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
            if (characterPreviewOverlay) {
                characterPreviewOverlay.style.display = 'none';
            }
        });
    }

    // Dice Roller Overlay Logic is now controlled by the DM
});

// Fallback if script runs before DOM is fully ready and elements aren't found.
if (!playerCanvas || !playerMapContainer || !pCtx) {
    console.warn("Player view: Script parsed, but canvas/container/context not immediately available. Waiting for DOMContentLoaded.");
}
