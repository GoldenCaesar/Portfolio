const playerCanvas = document.getElementById('player-canvas');
const fogCanvas = document.getElementById('fog-canvas');
const shadowCanvas = document.getElementById('player-shadow-canvas');
const gridCanvas = document.getElementById('grid-canvas');
const playerMapContainer = document.getElementById('player-map-container');
const pCtx = playerCanvas ? playerCanvas.getContext('2d') : null;
const fCtx = fogCanvas ? fogCanvas.getContext('2d') : null;

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
let currentGridData = null;
const imageCache = new Map();
let dmCanvasAspectRatio = null;
let lastViewRectangle = null;
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
let currentFogOfWarUrl = null;

let shadowAnimationId = null;

function drawFogOfWar() {
    if (!fCtx || !currentFogOfWarUrl || !currentMapImage) {
        if (fCtx) fCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
        return;
    }

    const fogImg = new Image();
    fogImg.onload = () => {
        // First, draw the greyed-out version of the map. This is our "historical" view.
        fCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
        fCtx.save();
        fCtx.translate(currentMapTransform.originX, currentMapTransform.originY);
        fCtx.scale(currentMapTransform.scale, currentMapTransform.scale);
        fCtx.drawImage(currentMapImage, 0, 0, currentMapImage.width, currentMapImage.height);
        fCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        fCtx.globalCompositeOperation = 'source-atop';
        fCtx.fillRect(0, 0, currentMapImage.width, currentMapImage.height);
        fCtx.restore();

        // Now, use the fog mask from the DM to "cut out" the unexplored areas.
        fCtx.save();
        fCtx.globalCompositeOperation = 'destination-out';
        fCtx.translate(currentMapTransform.originX, currentMapTransform.originY);
        fCtx.scale(currentMapTransform.scale, currentMapTransform.scale);
        fCtx.drawImage(fogImg, 0, 0, currentMapImage.width, currentMapImage.height);
        fCtx.restore();

        // Finally, clear the fog from areas that are currently visible.
        if (lightMapCanvas) {
            fCtx.save();
            fCtx.globalCompositeOperation = 'destination-in';
            fCtx.translate(currentMapTransform.originX, currentMapTransform.originY);
            fCtx.scale(currentMapTransform.scale, currentMapTransform.scale);
            fCtx.drawImage(lightMapCanvas, 0, 0, currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight);
            fCtx.restore();
        }
    };
    fogImg.src = currentFogOfWarUrl;
}

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

function drawGrid() {
    if (!gridCanvas || !currentMapImage || !currentGridData || !currentGridData.visible) {
        if (gridCanvas) {
            const gridCtx = gridCanvas.getContext('2d');
            gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        }
        return;
    }

    const gridCtx = gridCanvas.getContext('2d');
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    const { scale, originX, originY } = currentMapTransform;
    const { imgWidth, imgHeight } = currentMapDisplayData;

    gridCtx.save();
    gridCtx.translate(originX, originY);
    gridCtx.scale(scale, scale);

    gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    gridCtx.lineWidth = 1 / scale;

    const gridSize = currentGridData.scale;

    for (let x = 0; x <= imgWidth; x += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, imgHeight);
        gridCtx.stroke();
    }

    for (let y = 0; y <= imgHeight; y += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(imgWidth, y);
        gridCtx.stroke();
    }

    gridCtx.restore();
}

function resizePlayerCanvas() {
    if (!playerMapContainer || !playerCanvas) return;

    const containerWidth = playerMapContainer.clientWidth;
    const containerHeight = playerMapContainer.clientHeight;

    let newWidth, newHeight;

    if (dmCanvasAspectRatio) {
        const containerAspectRatio = containerWidth / containerHeight;
        if (dmCanvasAspectRatio > containerAspectRatio) {
            newWidth = containerWidth;
            newHeight = newWidth / dmCanvasAspectRatio;
        } else {
            newHeight = containerHeight;
            newWidth = newHeight * dmCanvasAspectRatio;
        }
    } else {
        newWidth = containerWidth;
        newHeight = containerHeight;
    }

    playerCanvas.width = newWidth;
    playerCanvas.height = newHeight;

    const top = (containerHeight - newHeight) / 2;
    const left = (containerWidth - newWidth) / 2;
    playerCanvas.style.top = `${top}px`;
    playerCanvas.style.left = `${left}px`;

    if (shadowCanvas) {
        shadowCanvas.width = newWidth;
        shadowCanvas.height = newHeight;
        shadowCanvas.style.top = `${top}px`;
        shadowCanvas.style.left = `${left}px`;
    }
    if (gridCanvas) {
        gridCanvas.width = newWidth;
        gridCanvas.height = newHeight;
        gridCanvas.style.top = `${top}px`;
        gridCanvas.style.left = `${left}px`;
    }
    if (fogCanvas) {
        fogCanvas.width = newWidth;
        fogCanvas.height = newHeight;
        fogCanvas.style.top = `${top}px`;
        fogCanvas.style.left = `${left}px`;
    }
}

function recalculateAndApplyTransform() {
    if (!lastViewRectangle || !playerCanvas) {
        return;
    }
    const viewRect = lastViewRectangle;
    const hScale = playerCanvas.width / viewRect.width;
    const vScale = playerCanvas.height / viewRect.height;
    const scale = Math.min(hScale, vScale);
    const renderedWidth = viewRect.width * scale;
    const renderedHeight = viewRect.height * scale;
    currentMapTransform.scale = scale;
    currentMapTransform.originX = -viewRect.x * scale + (playerCanvas.width - renderedWidth) / 2;
    currentMapTransform.originY = -viewRect.y * scale + (playerCanvas.height - renderedHeight) / 2;
    isLightMapDirty = true;
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

function createDarkvisionMask_Player() {
    if (!currentGridData || !currentGridData.visible || !currentMapDisplayData.img) {
        return null;
    }

    const darkvisionMaskCanvas = document.createElement('canvas');
    darkvisionMaskCanvas.width = currentMapDisplayData.imgWidth;
    darkvisionMaskCanvas.height = currentMapDisplayData.imgHeight;
    const maskCtx = darkvisionMaskCanvas.getContext('2d');
    maskCtx.fillStyle = 'black';

    const tokensWithVision = initiativeTokens.filter(token => {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        return character && character.vision === true;
    });

    if (tokensWithVision.length === 0) {
        return null;
    }

    tokensWithVision.forEach(token => {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (character && character.sheetData) {
            const visionFt = parseInt(character.sheetData.vision_ft, 10) || 0;
            const gridSqftValue = currentGridData.sqft || 5;
            const gridPixelSize = currentGridData.scale || 50;

            if (visionFt > 0 && gridSqftValue > 0) {
                const visionRadiusInGridSquares = visionFt / gridSqftValue;
                const visionRadiusInPixels = visionRadiusInGridSquares * gridPixelSize;

                maskCtx.beginPath();
                maskCtx.arc(token.x, token.y, visionRadiusInPixels, 0, Math.PI * 2, true);
                maskCtx.fill();
            }
        }
    });

    return darkvisionMaskCanvas;
}

function calculateTokenVisionPolygon(sourcePosition, allSegments) {
    const imgWidth = currentMapDisplayData.imgWidth;
    const imgHeight = currentMapDisplayData.imgHeight;

    const allVertices = [];
    allSegments.forEach(seg => {
        allVertices.push(seg.p1, seg.p2);
    });

    const visiblePoints = [];
    const angles = new Set();

    const smartObjects = allSegments.map(s => s.parent).filter(p => p.type === 'smart_object');
    let sourceIsInsideObject = false;
    for (const so of smartObjects) {
        if (isPointInPolygon(sourcePosition, so.polygon)) {
            sourceIsInsideObject = true;
            break;
        }
    }

    allVertices.forEach(vertex => {
        const angle = Math.atan2(vertex.y - sourcePosition.y, vertex.x - sourcePosition.x);
        angles.add(angle - 0.0001);
        angles.add(angle);
        angles.add(angle + 0.0001);
    });

    const sortedAngles = Array.from(angles).sort((a, b) => a - b);

    sortedAngles.forEach(angle => {
        const ray = {
            x1: sourcePosition.x,
            y1: sourcePosition.y,
            x2: sourcePosition.x + (imgWidth + imgHeight) * 2 * Math.cos(angle),
            y2: sourcePosition.y + (imgWidth + imgHeight) * 2 * Math.sin(angle)
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
                    const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
                    const lightVector = { x: intersectionPoint.x - sourcePosition.x, y: intersectionPoint.y - sourcePosition.y };
                    const dot = (lightVector.x * normal.x) + (lightVector.y * normal.y);
                    if (!sourceIsInsideObject && dot > 0) {
                        ignoreThisIntersection = true;
                    }
                }

                if (!ignoreThisIntersection) {
                    const distance = Math.sqrt(Math.pow(intersectionPoint.x - sourcePosition.x, 2) + Math.pow(intersectionPoint.y - sourcePosition.y, 2));
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

    return visiblePoints;
}

function generateLightSourceMask() {
    if (!currentOverlays || !currentMapDisplayData.img) return null;

    const lightSourceMaskCanvas = document.createElement('canvas');
    lightSourceMaskCanvas.width = currentMapDisplayData.imgWidth;
    lightSourceMaskCanvas.height = currentMapDisplayData.imgHeight;
    const lightSourceCtx = lightSourceMaskCanvas.getContext('2d');

    const dmLightSources = currentOverlays.filter(o => o.type === 'lightSource').map(light => ({
        position: { x: light.position.x, y: light.position.y }
    }));

    if (dmLightSources.length === 0) return null;

    const walls = currentOverlays.filter(o => o.type === 'wall');
    const closedDoors = currentOverlays.filter(o => o.type === 'door' && !o.isOpen);
    const smartObjects = currentOverlays.filter(o => o.type === 'smart_object');

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
         allSegments.push({ p1: object.polygon[object.polygon.length - 1], p2: object.polygon[0], parent: object });
    });

    const imgWidth = currentMapDisplayData.imgWidth;
    const imgHeight = currentMapDisplayData.imgHeight;
    allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });

    lightSourceCtx.fillStyle = 'black';
    lightSourceCtx.beginPath();

    dmLightSources.forEach(light => {
        const visiblePoints = calculateTokenVisionPolygon(light.position, allSegments);

        if (visiblePoints.length > 0) {
            const firstPoint = visiblePoints[0];
            lightSourceCtx.moveTo(firstPoint.x, firstPoint.y);
            visiblePoints.forEach(point => {
                lightSourceCtx.lineTo(point.x, point.y);
            });
            lightSourceCtx.closePath();
        }
    });
    lightSourceCtx.fill();

    return lightSourceMaskCanvas;
}

function generateVisionMask_Player() {
    if (!currentOverlays || !currentMapDisplayData.img) return null;

    const walls = currentOverlays.filter(o => o.type === 'wall');
    const closedDoors = currentOverlays.filter(o => o.type === 'door' && !o.isOpen);
    const smartObjects = currentOverlays.filter(o => o.type === 'smart_object');

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
         allSegments.push({ p1: object.polygon[object.polygon.length - 1], p2: object.polygon[0], parent: object });
    });
    const imgWidth = currentMapDisplayData.imgWidth;
    const imgHeight = currentMapDisplayData.imgHeight;
    allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
    allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });


    const lightSourceMask = generateLightSourceMask();

    const tokensWithVision = initiativeTokens.filter(token => {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        return character && character.vision === true;
    });

    if (tokensWithVision.length === 0) {
        return lightSourceMask;
    }

    const combinedVisionCanvas = document.createElement('canvas');
    combinedVisionCanvas.width = currentMapDisplayData.imgWidth;
    combinedVisionCanvas.height = currentMapDisplayData.imgHeight;
    const combinedCtx = combinedVisionCanvas.getContext('2d');
    combinedCtx.fillStyle = 'black';

    for (const token of tokensWithVision) {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (!character) continue;

        const tokenPosition = { x: token.x, y: token.y };

        const losPoints = calculateTokenVisionPolygon(tokenPosition, allSegments);

        const losCanvas = document.createElement('canvas');
        losCanvas.width = combinedVisionCanvas.width;
        losCanvas.height = combinedVisionCanvas.height;
        const losCtx = losCanvas.getContext('2d');
        losCtx.fillStyle = 'black';
        losCtx.beginPath();
        losCtx.moveTo(losPoints[0].x, losPoints[0].y);
        for (let i = 1; i < losPoints.length; i++) {
            losCtx.lineTo(losPoints[i].x, losPoints[i].y);
        }
        losCtx.closePath();
        losCtx.fill();

        if (currentGridData && currentGridData.visible) {
            const visionFt = parseInt(character.sheetData.vision_ft, 10) || 0;
            if (visionFt > 0 && currentGridData.sqft > 0) {
                const visionRadiusInPixels = (visionFt / currentGridData.sqft) * currentGridData.scale;

                const darkvisionLOSCanvas = document.createElement('canvas');
                darkvisionLOSCanvas.width = combinedVisionCanvas.width;
                darkvisionLOSCanvas.height = combinedVisionCanvas.height;
                const dvLosCtx = darkvisionLOSCanvas.getContext('2d');
                dvLosCtx.drawImage(losCanvas, 0, 0);
                dvLosCtx.globalCompositeOperation = 'source-in';
                dvLosCtx.fillStyle = 'black';
                dvLosCtx.beginPath();
                dvLosCtx.arc(tokenPosition.x, tokenPosition.y, visionRadiusInPixels, 0, Math.PI * 2);
                dvLosCtx.fill();

                combinedCtx.drawImage(darkvisionLOSCanvas, 0, 0);
            }
        }

        if (lightSourceMask) {
            const litAreasVisibleCanvas = document.createElement('canvas');
            litAreasVisibleCanvas.width = combinedVisionCanvas.width;
            litAreasVisibleCanvas.height = combinedVisionCanvas.height;
            const litCtx = litAreasVisibleCanvas.getContext('2d');

            litCtx.drawImage(lightSourceMask, 0, 0);
            litCtx.globalCompositeOperation = 'source-in';
            litCtx.drawImage(losCanvas, 0, 0);

            combinedCtx.drawImage(litAreasVisibleCanvas, 0, 0);
        }
    }

    tokensWithVision.forEach(token => {
        const minRadius = currentGridData ? currentGridData.scale / 2 : 25;
        combinedCtx.beginPath();
        combinedCtx.arc(token.x, token.y, minRadius, 0, Math.PI * 2);
        combinedCtx.fill();
    });

    return combinedVisionCanvas;
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

    // Player view starts with full black.
    lightMapCtx.clearRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);
    lightMapCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    lightMapCtx.fillRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);

    // Generate the vision mask which includes line-of-sight and darkvision limits.
    const visionMask = generateVisionMask_Player();

    if (visionMask) {
        // Use 'destination-out' to erase the parts of the black overlay that are visible.
        lightMapCtx.globalCompositeOperation = 'destination-out';
        lightMapCtx.drawImage(visionMask, 0, 0, lightMapCanvas.width, lightMapCanvas.height);
        lightMapCtx.globalCompositeOperation = 'source-over'; // Reset composite operation
    }

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

    pCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
    pCtx.save();

    pCtx.translate(currentMapTransform.originX, currentMapTransform.originY);
    pCtx.scale(currentMapTransform.scale, currentMapTransform.scale);

    pCtx.drawImage(currentMapImage, 0, 0, currentMapImage.width, currentMapImage.height);

    drawGrid();
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
        }
        });
    }

    // The main drawMapAndOverlays function now handles drawing tokens.
}

window.addEventListener('message', (event) => {
    // Basic security: check origin if DM view is on a different domain in production.
    // Example: if (event.origin !== "https://your-dm-view-domain.com") return;
    const data = event.data;
    console.log('Player view received message:', data);

    if (data && data.type) {
        switch (data.type) {
            case 'startSlideshow':
                console.log("Player view received startSlideshow message.");
                slideshowPlaylist = data.playlist;
                currentSlideIndex = data.startIndex || 0;

                slideshowActive = true;
                playerMapContainer.style.display = 'none';
                slideshowContainer.style.display = 'flex';

                if (slideshowPlaylist && slideshowPlaylist.length > 0) {
                    animateSlideshow();
                } else {
                    // Display a placeholder message if there's no playlist
                    portraitImg.style.display = 'none';
                    portraitInitials.style.display = 'none';
                    authorText.textContent = '';
                    quoteText.textContent = "The DM is currently editing the map...";
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
                if (data.dmCanvasWidth && data.dmCanvasHeight) {
                    dmCanvasAspectRatio = data.dmCanvasWidth / data.dmCanvasHeight;
                }
                resizePlayerCanvas();

                slideshowContainer.style.display = 'none';
                playerMapContainer.style.display = 'flex';

                if (data.mapDataUrl) {
                    const img = new Image();
                    img.onload = () => {
                        currentMapImage = img;
                        currentOverlays = data.overlays || [];
                        currentGridData = data.gridData || null;
                        currentFogOfWarUrl = null; // Clear old fog data
                        if (fCtx) fCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);

                        if (data.viewRectangle) {
                            lastViewRectangle = data.viewRectangle;
                            recalculateAndApplyTransform();
                        }
                        drawMapAndOverlays(); // This draws the main map

                        isLightMapDirty = true;
                        toggleShadowAnimation(data.active);
                    };
                    img.onerror = () => {
                        drawPlaceholder("Error loading map.");
                        if (fCtx) fCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
                        currentMapImage = null;
                        currentFogOfWarUrl = null;
                        toggleShadowAnimation(false);
                    };
                    img.src = data.mapDataUrl;
                } else {
                    drawPlaceholder("Received invalid map data from DM.");
                    toggleShadowAnimation(false);
                }
                break;
            case 'mapTransformUpdate':
                if (data.dmCanvasWidth && data.dmCanvasHeight) {
                    dmCanvasAspectRatio = data.dmCanvasWidth / data.dmCanvasHeight;
                }
                resizePlayerCanvas();

                if (data.viewRectangle) {
                    lastViewRectangle = data.viewRectangle;
                    recalculateAndApplyTransform();
                    drawMapAndOverlays();
                    drawFogOfWar();
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
            case 'gridUpdate':
                currentGridData = data.gridData;
                drawMapAndOverlays();
                break;
            case 'fogOfWarUpdate':
                currentFogOfWarUrl = data.fogOfWarDataUrl;
                drawFogOfWar();
                break;
            case 'toggleQuestOverlay': // Legacy or simple toggle
                const questLogOverlayToggle = document.getElementById('quest-log-overlay');
                if (questLogOverlayToggle) {
                    questLogOverlayToggle.style.display = data.visible ? 'flex' : 'none';
                }
                break;
            case 'updateQuestOverlay':
                const questLogOverlay = document.getElementById('quest-log-overlay');
                const titleEl = document.getElementById('quest-title');
                const stepsContainer = document.getElementById('quest-steps-container');

                if (questLogOverlay && titleEl && stepsContainer) {
                    questLogOverlay.style.display = data.visible ? 'flex' : 'none';
                    if (data.visible && data.quest) {
                        titleEl.textContent = data.quest.title;

                        stepsContainer.innerHTML = ''; // Clear previous steps

                        // Render completed steps
                        if (data.quest.completedSteps && data.quest.completedSteps.length > 0) {
                            data.quest.completedSteps.forEach(stepText => {
                                const completedStepEl = document.createElement('div');
                                completedStepEl.className = 'flex items-center gap-4 opacity-60';
                                completedStepEl.innerHTML = `
                                    <div class="flex items-center justify-center size-10 bg-border-color/40 rounded-full border-2 border-rune-gold/50">
                                        <svg class="text-rune-gold" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-lg font-medium leading-normal line-through text-text-muted">${stepText}</p>
                                    </div>
                                `;
                                stepsContainer.appendChild(completedStepEl);
                            });
                        }

                        // Render separator if there are completed steps and a next step
                        if (data.quest.completedSteps && data.quest.completedSteps.length > 0 && data.quest.nextStep !== 'All steps completed!') {
                             const separatorEl = document.createElement('div');
                             separatorEl.className = 'my-6 h-px bg-gradient-to-r from-transparent via-rune-gold/50 to-transparent';
                             stepsContainer.appendChild(separatorEl);
                        }

                        // Render next step
                        if (data.quest.nextStep) {
                            const nextStepEl = document.createElement('div');
                            if (data.quest.nextStep === 'All steps completed!') {
                                nextStepEl.className = 'flex items-center justify-center p-4 rounded-lg border-2 border-primary-gold/50';
                                nextStepEl.innerHTML = `<p class="text-xl font-bold leading-tight text-primary-gold">${data.quest.nextStep}</p>`;
                            } else {
                                nextStepEl.className = 'flex items-center gap-4 bg-primary-gold/10 p-4 rounded-lg border-2 border-primary-gold shadow-[0_0_15px_rgba(244,199,37,0.5)]';
                                nextStepEl.innerHTML = `
                                    <div class="flex items-center justify-center size-10 bg-primary-gold rounded-full shrink-0 animate-pulse">
                                        <svg class="text-dark-bg" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M208,88H152V32a8,8,0,0,0-16,0V88H80V32a8,8,0,0,0-16,0V88H48a16,16,0,0,0-16,16v56a16,16,0,0,0,16,16H64v48a8,8,0,0,0,16,0V176h56v48a8,8,0,0,0,16,0V176h56v48a8,8,0,0,0,16,0V176h16a16,16,0,0,0,16-16V104A16,16,0,0,0,208,88Zm0,72H48V104H208v56Z"></path></svg>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xl font-bold leading-tight text-primary-gold">${data.quest.nextStep}</p>
                                        <p class="text-sm font-normal leading-normal text-text-light">Next Step</p>
                                    </div>
                                `;
                            }
                            stepsContainer.appendChild(nextStepEl);
                        }
                    }
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
    resizePlayerCanvas();
    if (currentMapImage && currentMapImage.complete) {
        recalculateAndApplyTransform();
        drawMapAndOverlays();
    } else {
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
