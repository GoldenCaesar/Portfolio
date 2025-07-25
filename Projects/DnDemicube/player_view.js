const playerCanvas = document.getElementById('player-canvas');
// Ensure the container ID matches what's in player_view.html, e.g., "player-map-container"
const playerMapContainer = document.getElementById('player-map-container');
const pCtx = playerCanvas ? playerCanvas.getContext('2d') : null;
let currentMapImage = null;
let currentOverlays = [];
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

function drawMapAndOverlays() {
    if (!playerCanvas || !pCtx) {
        console.error("Player canvas or context not initialized.");
        return;
    }
    if (!currentMapImage || !currentMapImage.complete) {
        drawPlaceholder("Map image not loaded or incomplete.");
        // console.log("drawMapAndOverlays: currentMapImage not ready or null.");
        return;
    }
    if (!playerMapContainer) {
        console.error("Player map container not found for drawing.");
        return;
    }

    const containerWidth = playerMapContainer.clientWidth;
    const containerHeight = playerMapContainer.clientHeight;

    // Calculate the aspect ratio of the image
    const imgAspectRatio = currentMapImage.width / currentMapImage.height;

    // Calculate the dimensions of the canvas to fit the image within the container
    let canvasWidth = containerWidth;
    let canvasHeight = canvasWidth / imgAspectRatio;

    if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * imgAspectRatio;
    }

    playerCanvas.width = Math.floor(canvasWidth);
    playerCanvas.height = Math.floor(canvasHeight);

    pCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);

    // Recalculate ratio and offsets for drawing the image centered on the (potentially resized) canvas
    const hRatioCanvas = playerCanvas.width / currentMapImage.width;
    const vRatioCanvas = playerCanvas.height / currentMapImage.height;
    const ratioCanvas = Math.min(hRatioCanvas, vRatioCanvas);

    const finalImgScaledWidth = currentMapImage.width * ratioCanvas;
    const finalImgScaledHeight = currentMapImage.height * ratioCanvas;

    const finalCenterShift_x = (playerCanvas.width - finalImgScaledWidth) / 2;
    const finalCenterShift_y = (playerCanvas.height - finalImgScaledHeight) / 2;

    pCtx.drawImage(currentMapImage, 0, 0, currentMapImage.width, currentMapImage.height,
                  finalCenterShift_x, finalCenterShift_y, finalImgScaledWidth, finalImgScaledHeight);

    currentMapDisplayData = {
        img: currentMapImage,
        ratio: ratioCanvas,
        offsetX: finalCenterShift_x,
        offsetY: finalCenterShift_y,
        imgWidth: currentMapImage.width,
        imgHeight: currentMapImage.height,
        scaledWidth: finalImgScaledWidth,
        scaledHeight: finalImgScaledHeight
    };

    drawOverlays_PlayerView(currentOverlays);
}

function drawOverlays_PlayerView(overlays) {
    if (!pCtx || !overlays || overlays.length === 0 || !currentMapDisplayData.img) return;

    overlays.forEach(overlay => {
        if (overlay.type === 'childMapLink' && overlay.polygon) {
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(100, 100, 255, 0.4)';
            pCtx.lineWidth = 2;
            overlay.polygon.forEach((point, index) => {
                const canvasX = (point.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const canvasY = (point.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                if (index === 0) {
                    pCtx.moveTo(canvasX, canvasY);
                } else {
                    pCtx.lineTo(canvasX, canvasY);
                }
            });
            if (overlay.polygon.length > 2) {
                const firstPoint = overlay.polygon[0];
                const firstPointCanvasX = (firstPoint.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const firstPointCanvasY = (firstPoint.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                pCtx.lineTo(firstPointCanvasX, firstPointCanvasY);
            }
            pCtx.stroke();
        } else if (overlay.type === 'noteLink' && overlay.position) {
            const iconSize = 20;
            const canvasX = (overlay.position.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
            const canvasY = (overlay.position.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
            pCtx.fillStyle = 'rgba(102, 255, 102, 0.9)';
            pCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.strokeStyle = 'black';
            pCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.fillStyle = 'black';
            pCtx.font = `${iconSize * 0.8}px sans-serif`;
            pCtx.textAlign = 'center';
            pCtx.textBaseline = 'middle';
            pCtx.fillText('📝', canvasX, canvasY);
        }
    });
}

window.addEventListener('message', (event) => {
    // Basic security: check origin if DM view is on a different domain in production.
    // Example: if (event.origin !== "https://your-dm-view-domain.com") return;
    const data = event.data;
    console.log('Player view received message:', data);

    if (data && data.type) {
        switch (data.type) {
            case 'loadMap':
                if (data.mapDataUrl) {
                    // console.log(`Player view received loadMap: ${data.mapDataUrl.substring(0,30)}...`);
                    const img = new Image();
                    img.onload = () => {
                        currentMapImage = img;
                        currentOverlays = data.overlays || [];
                        console.log("Player view: Map image loaded, drawing map and overlays. Overlays received:", currentOverlays.length);
                        drawMapAndOverlays();
                    };
                    img.onerror = () => {
                        console.error(`Error loading image for player view (loadMap).`);
                        drawPlaceholder("Error loading map.");
                        currentMapImage = null;
                        currentOverlays = [];
                    };
                    img.src = data.mapDataUrl; // Expecting base64 Data URL
                } else {
                    console.warn("loadMap message received without mapDataUrl.");
                    drawPlaceholder("Received invalid map data from DM.");
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
            case 'clearMap':
                console.log("Player view received clearMap message.");
                currentMapImage = null;
                currentOverlays = [];
                drawPlaceholder("Map cleared by DM.");
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
            default:
                console.log("Player view received unhandled message type:", data.type);
                break;
        }
    } else {
        console.log("Player view received non-standard message:", data);
    }
});

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
});

// Fallback if script runs before DOM is fully ready and elements aren't found.
if (!playerCanvas || !playerMapContainer || !pCtx) {
    console.warn("Player view: Script parsed, but canvas/container/context not immediately available. Waiting for DOMContentLoaded.");
}
