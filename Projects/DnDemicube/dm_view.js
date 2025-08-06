document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const mapsList = document.getElementById('maps-list');
    const openPlayerViewButton = document.getElementById('open-player-view-button'); // Added for player view
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container');
    const noteEditorContainer = document.getElementById('note-editor-container'); // New container for the editor
    const hoverLabel = document.getElementById('hover-label');
    const polygonContextMenu = document.getElementById('polygon-context-menu');
    const noteContextMenu = document.getElementById('note-context-menu');
    const characterContextMenu = document.getElementById('character-context-menu');
    const mapToolsContextMenu = document.getElementById('map-tools-context-menu');
    const displayedFileNames = new Set();

    // Notes Tab Elements
    const createNewNoteButton = document.getElementById('create-new-note-button');
    const editNotesIcon = document.getElementById('edit-notes-icon');
    const notesList = document.getElementById('notes-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const saveNoteButton = document.getElementById('save-note-button');
    const markdownEditorTextarea = document.getElementById('markdown-editor');
    const tabNotes = document.getElementById('tab-notes');

    // Characters Tab Elements
    const addCharacterButton = document.getElementById('add-character-button');
    const editCharactersIcon = document.getElementById('edit-characters-icon');
    const charactersList = document.getElementById('characters-list');
    const characterNameInput = document.getElementById('character-name-input');
    const saveCharacterButton = document.getElementById('save-character-button');
    const clearFieldsButton = document.getElementById('clear-fields-button');
    const fillFromButton = document.getElementById('fill-from-button');
    const fillFromDropdown = document.getElementById('fill-from-dropdown');
    const fillFromPdfOption = document.getElementById('fill-from-pdf-option');
    const fillFromJsonOption = document.getElementById('fill-from-json-option');
    const jsonModal = document.getElementById('json-modal');
    const jsonModalCloseButton = document.getElementById('json-modal-close-button');
    const jsonInputTextarea = document.getElementById('json-input-textarea');
    const fillFromJsonButton = document.getElementById('fill-from-json-button');
    const cancelJsonButton = document.getElementById('cancel-json-button');
    const pdfUploadInput = document.getElementById('pdf-upload-input');
    const characterSheetContainer = document.getElementById('character-sheet-container');
    const characterSheetIframe = document.getElementById('character-sheet-iframe');
    const tabCharacters = document.getElementById('tab-characters');
    const characterNotesButton = document.getElementById('character-notes-button');
    const viewCharacterButton = document.getElementById('view-character-button');
    const characterNotesEditorContainer = document.getElementById('character-notes-editor-container');
    const characterMarkdownEditor = document.getElementById('character-markdown-editor');
    const modeToggleSwitch = document.getElementById('mode-toggle-switch');
    const viewPdfButton = document.getElementById('view-pdf-button');
    const deletePdfButton = document.getElementById('delete-pdf-button');
    const characterSheetContent = document.getElementById('character-sheet-content');
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');


    // Map Tools Elements
    const mapToolsSection = document.getElementById('map-tools-section');
    // const mapObjectURLs = new Map(); // Old: To store filename -> objectURL mapping for Manage Maps
    // New structure: fileName -> { url: objectURL, name: fileName, overlays: [] }
    const detailedMapData = new Map();
    let isEditMode = false;

    // Core state variables
    let selectedMapFileName = null;

    // Notes State Variables
    let notesData = []; // Array of note objects: { id: uniqueId, title: "Note 1", content: "# Markdown" }
    let selectedNoteId = null;
    let isNotesEditMode = false;
    let easyMDE = null;

    // Characters State Variables
    let charactersData = []; // Array of character objects: { id: uniqueId, name: "Character 1", sheetData: "...", notes: "" }
    let selectedCharacterId = null;
    let isCharactersEditMode = false;
    let characterEasyMDE = null;


    // State for 'Link to Child Map' tool
    let isLinkingChildMap = false;
    let isLinkingNote = false;
    let isLinkingCharacter = false;
    let currentPolygonPoints = [];
    let polygonDrawingComplete = false; // Will be used in Phase 2
    let selectedPolygonForContextMenu = null; // Added: To store right-clicked polygon info
    let selectedNoteForContextMenu = null;
    let selectedCharacterForContextMenu = null;
    let isChangingChildMapForPolygon = false; // Added: State for "Change Child Map" action
    let isRedrawingPolygon = false; // Added: State for "Redraw Polygon" action
    let preservedLinkedMapNameForRedraw = null; // Added: To store linked map name during redraw

    // Player View window reference
    let playerWindow = null;

    let isMovingPolygon = false; // Added: State for "Move Polygon" action
    let polygonBeingMoved = null; // Added: { overlay: reference, originalPoints: copy, parentMapName: string }
    let isMovingNote = false;
    let noteBeingMoved = null;
    let isMovingCharacter = false;
    let characterBeingMoved = null;
    let moveStartPoint = null; // Added: {x, y} image-relative coords for drag start
    let currentDragOffsets = {x: 0, y: 0};

    let currentMapDisplayData = { // To store details of the currently displayed map for coordinate conversion
        img: null,
        ratio: 1,
        offsetX: 0,
        offsetY: 0,
        imgWidth: 0,
        imgHeight: 0
    };


    // Debounce utility function
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    function filterPlayerContent(content) {
        if (!content) return "";
        return content.replace(/\[dm\](.*?)\[\/dm\]/gs, '');
    }

    // Function to resize the canvas to fit its container
    function resizeCanvas() {
        if (dmCanvas && mapContainer) {
            const style = window.getComputedStyle(mapContainer);
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            const paddingTop = parseFloat(style.paddingTop) || 0;
            const paddingBottom = parseFloat(style.paddingBottom) || 0;

            const canvasWidth = mapContainer.clientWidth - paddingLeft - paddingRight;
            const canvasHeight = mapContainer.clientHeight - paddingTop - paddingBottom;

            let mapWasDisplayed = currentMapDisplayData.img && currentMapDisplayData.img.complete;
            let currentFileNameToRedraw = selectedMapFileName;

            if (mapWasDisplayed) {
                // Note: isLinkingChildMap implies selectedMapFileName is the map being drawn on.
                
                // Invalidate current display data BEFORE canvas dimensions change and before displayMapOnCanvas.
                currentMapDisplayData.img = null; 
                console.log("Invalidated currentMapDisplayData.img due to resize preparation.");
            }
            
            // Apply new dimensions to the canvas
            dmCanvas.width = canvasWidth;
            dmCanvas.height = canvasHeight;
            console.log(`Canvas resized to: ${dmCanvas.width}x${dmCanvas.height} (Container clientW/H: ${mapContainer.clientWidth}x${mapContainer.clientHeight}, Padding L/R/T/B: ${paddingLeft}/${paddingRight}/${paddingTop}/${paddingBottom})`);

            if (mapWasDisplayed && currentFileNameToRedraw) {
                displayMapOnCanvas(currentFileNameToRedraw);
            } else if (!mapWasDisplayed) {
                // If no map was displayed but one is selected (e.g. initial load scenario or after clearing canvas)
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                } else {
                    // No map was displayed and no map is selected, ensure canvas is clear.
                    const ctx = dmCanvas.getContext('2d');
                    ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                }
            } else {
                 // mapWasDisplayed was true, but currentFileNameToRedraw is null (should not happen if logic is correct)
                 // or mapWasDisplayed was false, and some other condition.
                 // Ensure canvas is clear if no specific map is being redrawn.
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            }
        }
    }

    // function enableMapTools() { // Replaced by updateButtonStates or direct enabling in displayMapOnCanvas
    //     if (mapToolsSection) {
    //         // mapToolsSection.classList.remove('disabled'); // Or however you manage overall section appearance
    //     }
    //     // mapToolButtons.forEach(button => button.disabled = false); // This was too broad
    //     console.log("Map tools potentially enabled by displayMapOnCanvas");
    // }

    // function disableMapTools() { // Replaced by updateButtonStates
    //     if (mapToolsSection) {
    //         // mapToolsSection.classList.add('disabled'); // Or however you manage overall section appearance
    //     }
    //    // mapToolButtons.forEach(button => button.disabled = true); // This was too broad
    //     console.log("Map tools potentially disabled");
    // }

    function displayMapOnCanvas(fileName) {
        if (!dmCanvas || !mapContainer) {
            console.error("DM Canvas or Map Container not found!");
            return;
        }

        // --- Start: Added logic to update canvas dimensions ---
        // Ensure canvas dimensions are up-to-date based on container size each time a map is displayed.
        // This is similar to the dimension calculation in resizeCanvas.
        const style = window.getComputedStyle(mapContainer);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingBottom = parseFloat(style.paddingBottom) || 0;

        const newCanvasWidth = mapContainer.clientWidth - paddingLeft - paddingRight;
        const newCanvasHeight = mapContainer.clientHeight - paddingTop - paddingBottom;

        // Only resize if dimensions actually changed, to avoid unnecessary redraws if called repeatedly.
        // However, for this specific problem, we want to ensure it *always* sets it before image load.
        // Let's consider if this check is needed or if we should always set it.
        // For now, let's always set it to ensure it's fresh.
        dmCanvas.width = newCanvasWidth;
        dmCanvas.height = newCanvasHeight;
        // console.log(`displayMapOnCanvas: Canvas dimensions set to ${dmCanvas.width}x${dmCanvas.height}`);
        // --- End: Added logic ---

        const mapData = detailedMapData.get(fileName);
        if (!mapData || !mapData.url) {
            console.error(`Map data or URL not found for ${fileName}`);
            return;
        }

        const ctx = dmCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);

            const hRatio = dmCanvas.width / img.width;
            const vRatio = dmCanvas.height / img.height;
            const ratio = Math.min(hRatio, vRatio);

            const imgScaledWidth = img.width * ratio;
            const imgScaledHeight = img.height * ratio;

            const centerShift_x = (dmCanvas.width - imgScaledWidth) / 2;
            const centerShift_y = (dmCanvas.height - imgScaledHeight) / 2;

            ctx.drawImage(img, 0, 0, img.width, img.height,
                          centerShift_x, centerShift_y, imgScaledWidth, imgScaledHeight);

            currentMapDisplayData = {
                img: img,
                ratio: ratio,
                offsetX: centerShift_x,
                offsetY: centerShift_y,
                imgWidth: img.width,
                imgHeight: img.height,
                scaledWidth: imgScaledWidth,
                scaledHeight: imgScaledHeight
            };

            // Draw existing overlays for this map
            if (mapData.overlays) {
                drawOverlays(mapData.overlays);
            }

            // If actively drawing a new polygon, draw it on top
            if (isLinkingChildMap && currentPolygonPoints.length > 0 && selectedMapFileName === fileName) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'edit') {
                    drawCurrentPolygon(true); // Pass true to indicate it's a new, temporary polygon
                }
            }
        };
        img.onerror = () => {
            console.error(`Error loading image for ${fileName} from ${mapData.url}`);
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            currentMapDisplayData = { img: null, ratio: 1, offsetX: 0, offsetY: 0, imgWidth: 0, imgHeight: 0, scaledWidth: 0, scaledHeight: 0 };
            ctx.fillText(`Error loading: ${fileName}`, 10, 50);
        };
        img.src = mapData.url;
    }

    function drawOverlays(overlays, isPlayerViewContext = false) {
        if (!overlays || overlays.length === 0 || !currentMapDisplayData.img) return;
        const ctx = dmCanvas.getContext('2d');

        overlays.forEach(overlay => {
            if (overlay.type === 'childMapLink' && overlay.polygon) {
                // For DM view, respect playerVisible for styling. For player view, this function won't be called if not visible.
                // The actual filtering for player view happens before calling drawOverlays in sendMapToPlayerView.
                if (isPlayerViewContext && (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible)) {
                    return; // Don't draw if not player visible in player view context (though filtering should prevent this)
                }

                ctx.beginPath();
                let currentPointsToDraw = overlay.polygon;
                let strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Default: Blue for 'edit' mode
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') { // Special styling for 'view' mode
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red and more transparent if hidden from player
                    } else {
                        strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Green if visible to player in 'view' mode
                    }
                }
                // Moving polygon overrides visibility-based styling for immediate feedback
                if (isMovingPolygon && polygonBeingMoved && overlay === polygonBeingMoved.overlayRef) {
                    strokeStyle = 'rgba(255, 255, 0, 0.9)'; // Bright yellow while moving (changed from green for better contrast)
                    currentPointsToDraw = polygonBeingMoved.originalPoints.map(p => ({
                        x: p.x + currentDragOffsets.x,
                        y: p.y + currentDragOffsets.y
                    }));
                }

                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = 2;

                currentPointsToDraw.forEach((point, index) => {
                    const canvasX = (point.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                    const canvasY = (point.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                    if (index === 0) {
                        ctx.moveTo(canvasX, canvasY);
                    } else {
                        ctx.lineTo(canvasX, canvasY);
                    }
                });

                if (currentPointsToDraw.length > 2) { // Ensure there's a polygon to close
                    const firstPoint = currentPointsToDraw[0];
                    const lastPoint = currentPointsToDraw[currentPointsToDraw.length - 1];
                    // Close path if not already closed by data
                    if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
                        const firstPointCanvasX = (firstPoint.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                        const firstPointCanvasY = (firstPoint.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                        ctx.lineTo(firstPointCanvasX, firstPointCanvasY);
                    }
                }
                ctx.stroke();
            } else if (overlay.type === 'noteLink' && overlay.position) {
                const iconSize = 20; // The size of the icon on the canvas
                let position = overlay.position;
                if (isMovingNote && noteBeingMoved && overlay === noteBeingMoved.overlayRef) {
                    position = {
                        x: noteBeingMoved.originalPosition.x + currentDragOffsets.x,
                        y: noteBeingMoved.originalPosition.y + currentDragOffsets.y
                    };
                }

                const canvasX = (position.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const canvasY = (position.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;

                let fillStyle = 'rgba(255, 255, 102, 0.9)'; // Default yellow
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') {
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        fillStyle = 'rgba(255, 102, 102, 0.7)'; // Reddish if hidden from player
                    } else {
                        fillStyle = 'rgba(102, 255, 102, 0.9)'; // Greenish if visible to player
                    }
                }
                if (isMovingNote && noteBeingMoved && overlay === noteBeingMoved.overlayRef) {
                    fillStyle = 'rgba(255, 255, 0, 0.9)'; // Bright yellow when moving
                }

                ctx.fillStyle = fillStyle;
                ctx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                ctx.fillStyle = 'black';
                ctx.font = `${iconSize * 0.8}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📝', canvasX, canvasY);
            } else if (overlay.type === 'characterLink' && overlay.position) {
                const iconSize = 20; // The size of the icon on the canvas
                let position = overlay.position;
                if (isMovingCharacter && characterBeingMoved && overlay === characterBeingMoved.overlayRef) {
                    position = {
                        x: characterBeingMoved.originalPosition.x + currentDragOffsets.x,
                        y: characterBeingMoved.originalPosition.y + currentDragOffsets.y
                    };
                }

                const canvasX = (position.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const canvasY = (position.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;

                let fillStyle = 'rgba(135, 206, 250, 0.9)'; // Default light blue
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') {
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        fillStyle = 'rgba(255, 102, 102, 0.7)'; // Reddish if hidden from player
                    } else {
                        fillStyle = 'rgba(102, 255, 102, 0.9)'; // Greenish if visible to player
                    }
                }
                if (isMovingCharacter && characterBeingMoved && overlay === characterBeingMoved.overlayRef) {
                    fillStyle = 'rgba(255, 255, 0, 0.9)'; // Bright yellow when moving
                }

                ctx.fillStyle = fillStyle;
                ctx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                ctx.fillStyle = 'black';
                ctx.font = `${iconSize * 0.8}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👤', canvasX, canvasY);

                const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                if (character && character.sheetData && character.sheetData.character_portrait) {
                    const img = new Image();
                    img.onload = function() {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(canvasX, canvasY, iconSize / 2, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();

                        ctx.drawImage(img, canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                        ctx.restore();
                    };
                    img.src = character.sheetData.character_portrait;
                }
            }
        });
    }

    const characterPreviewClose = document.getElementById('character-preview-close');
    if (characterPreviewClose) {
        characterPreviewClose.addEventListener('click', () => {
            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
            if (characterPreviewOverlay) {
                characterPreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideCharacterPreview' }, '*');
                }
            }
        });
    }

    if (viewCharacterButton) {
        viewCharacterButton.addEventListener('click', () => {
            if (characterSheetIframe && characterSheetIframe.contentWindow) {
                characterSheetIframe.contentWindow.postMessage({ type: 'requestSheetDataForView' }, '*');
            }
        });
    }

    // Helper to convert canvas click coords to image-relative coords
    function getRelativeCoords(canvasX, canvasY) {
        // If currentMapDisplayData.img is null, it means we are in a resize/reload cycle.
        // If currentMapDisplayData.img.complete is false, the image is still loading.
        if (!currentMapDisplayData.img || !currentMapDisplayData.img.complete) {
            console.warn("getRelativeCoords: currentMapDisplayData.img is null or image not complete. Map not ready for coordinate conversion.");
            return null;
        }

        // Check if click is within the bounds of the displayed image
        // Ensure scaledWidth and scaledHeight are valid before using them
        if (typeof currentMapDisplayData.scaledWidth === 'undefined' || typeof currentMapDisplayData.scaledHeight === 'undefined') {
            console.warn("getRelativeCoords: scaledWidth or scaledHeight is undefined in currentMapDisplayData.");
            return null;
        }
        
        if (canvasX < currentMapDisplayData.offsetX || canvasX > currentMapDisplayData.offsetX + currentMapDisplayData.scaledWidth ||
            canvasY < currentMapDisplayData.offsetY || canvasY > currentMapDisplayData.offsetY + currentMapDisplayData.scaledHeight) {
            // console.log("Clicked outside map image area."); // This can be noisy, enable if needed for debugging
            return null; // Click was outside the image
        }

        const imageX = (canvasX - currentMapDisplayData.offsetX) / currentMapDisplayData.ratio;
        const imageY = (canvasY - currentMapDisplayData.offsetY) / currentMapDisplayData.ratio;
        return { x: imageX, y: imageY };
    }


    function drawCurrentPolygon(isNewTemporaryPolygon = false) {
        if (currentPolygonPoints.length === 0 || !currentMapDisplayData.img) return;
        const ctx = dmCanvas.getContext('2d');

        // If it's a new temporary polygon, we need to ensure the base image and existing overlays are drawn first.
        // displayMapOnCanvas already handles drawing the base image and its persistent overlays.
        // So, if this is called from displayMapOnCanvas for the new polygon, we don't need to redraw the base image here.
        // However, if called directly after adding a point (not from displayMapOnCanvas), we need to refresh.
        if (!isNewTemporaryPolygon) { // If called after adding a point, redraw base and existing overlays
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            ctx.drawImage(
                currentMapDisplayData.img, 0, 0,
                currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight,
                currentMapDisplayData.offsetX, currentMapDisplayData.offsetY,
                currentMapDisplayData.scaledWidth, currentMapDisplayData.scaledHeight
            );
            const parentMapData = detailedMapData.get(selectedMapInManager);
            if (parentMapData && parentMapData.overlays) {
                drawOverlays(parentMapData.overlays);
            }
        }


        ctx.beginPath();
        ctx.strokeStyle = 'yellow'; // Yellow for the polygon being actively drawn
        ctx.lineWidth = 2;

        currentPolygonPoints.forEach((point, index) => {
            // Convert stored original image coordinates back to canvas coordinates for drawing
            const canvasX = (point.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
            const canvasY = (point.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
            if (index === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
            // Draw a small circle for each point
            ctx.fillStyle = 'red';
            ctx.fillRect(canvasX - 3, canvasY - 3, 6, 6); // Small square/circle for vertex
        });

        if (currentPolygonPoints.length > 1 && polygonDrawingComplete) { // If complete, close the path
            const firstPointCanvasX = (currentPolygonPoints[0].x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
            const firstPointCanvasY = (currentPolygonPoints[0].y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
            ctx.lineTo(firstPointCanvasX, firstPointCanvasY);
        }
        ctx.stroke();
    }


    dmCanvas.addEventListener('click', (event) => {
        // If a move operation was just finalized by a mouseup, this click event might fire right after.
        // resetAllInteractiveStates() should have cleared isMovingPolygon.
        // If still in move mode (e.g. click-to-place without drag yet), this click should be handled carefully.
        if (isMovingPolygon) {
            // If user is in "isMovingPolygon" mode (selected from context menu) but hasn't started dragging (moveStartPoint is null)
            // A click could be interpreted as "finalize at current (original) position" or "cancel".
            // The mouseup listener is better for finalization. A simple click here while isMovingPolygon is true
            // and no drag has started (moveStartPoint is null) should probably do nothing or cancel.
            // For now, let's assume mouseup handles finalization and mousedown initiates drag.
            // A plain click here if isMovingPolygon is true and moveStartPoint is null could be a cancel.
            // However, the "Link to Child Map" button also acts as a global cancel.
            // Let's make this click do nothing if move mode is active but no drag has started,
            // to prevent interference with polygon drawing logic below.
            if (!moveStartPoint) { // In move mode, but not actively dragging (no mousedown on polygon yet)
                console.log("In move mode, click occurred but not on polygon to start drag. No action.");
                // Optionally, this could be a way to cancel: resetAllInteractiveStates(); alert("Move cancelled.");
                return;
            }
            // If moveStartPoint IS set, it means a drag was happening, and mouseup should have handled it.
            // This click listener should ideally not run if mouseup already reset isMovingPolygon.
            // This is a safeguard.
            return;
        }

        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) {
            // console.log("Clicked outside map image area.");
            return;
        }

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;

        // Priority 1: Polygon Drawing (New Link or Redraw) - Only in 'edit' mode
        if (selectedMapData.mode === 'edit' && (isLinkingChildMap || isRedrawingPolygon) && !polygonDrawingComplete) {
            const clickThreshold = 10 / currentMapDisplayData.ratio; // 10px radius on canvas, converted to image scale
            if (currentPolygonPoints.length > 0) {
                const firstPoint = currentPolygonPoints[0];
                const dx = Math.abs(imageCoords.x - firstPoint.x);
                const dy = Math.abs(imageCoords.y - firstPoint.y);

                if (currentPolygonPoints.length >= 2 && dx < clickThreshold && dy < clickThreshold) {
                    currentPolygonPoints.push({ x: firstPoint.x, y: firstPoint.y }); // Close the polygon
                    polygonDrawingComplete = true;
                    dmCanvas.style.cursor = 'auto';

                    if (isLinkingChildMap) {
                        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Select Child Map from List';
                        alert('Polygon complete for new link. Now select a map from the list to link as its child.');
                        console.log("New link polygon complete:", currentPolygonPoints);
                    } else if (isRedrawingPolygon) {
                        if (preservedLinkedMapNameForRedraw) {
                            const newOverlay = {
                                type: 'childMapLink',
                                polygon: [...currentPolygonPoints],
                                linkedMapName: preservedLinkedMapNameForRedraw
                            };
                            selectedMapData.overlays.push(newOverlay);
                            alert(`Polygon redrawn successfully, still linked to "${preservedLinkedMapNameForRedraw}".`);
                            console.log("Polygon redraw complete. New overlay:", newOverlay);
                            displayMapOnCanvas(selectedMapFileName);
                        } else {
                            console.error("Failed to save redrawn polygon: Missing preserved link name.");
                            alert("Error: Could not save the redrawn polygon.");
                        }
                        isRedrawingPolygon = false;
                        preservedLinkedMapNameForRedraw = null;
                        currentPolygonPoints = [];
                        polygonDrawingComplete = false;
                        selectedPolygonForContextMenu = null;
                    }
                } else {
                    currentPolygonPoints.push(imageCoords);
                }
            } else {
                currentPolygonPoints.push(imageCoords);
            }
            drawCurrentPolygon(false);
            return;
        }

        if (selectedMapData.mode === 'edit' && isLinkingNote) {
            const newOverlay = {
                type: 'noteLink',
                position: imageCoords,
                linkedNoteId: null,
                playerVisible: false
            };
            selectedMapData.overlays.push(newOverlay);
            console.log('Note icon placed. Overlay:', newOverlay);
            resetAllInteractiveStates();
            return;
        }

        if (selectedMapData.mode === 'edit' && isLinkingCharacter) {
            const newOverlay = {
                type: 'characterLink',
                position: imageCoords,
                linkedCharacterId: null,
                playerVisible: false
            };
            selectedMapData.overlays.push(newOverlay);
            console.log('Character icon placed. Overlay:', newOverlay);
            resetAllInteractiveStates();
            return;
        }

        // Priority 2: Interaction with Overlays in "View" mode
        if (selectedMapData.mode === 'view' && selectedMapData.overlays) {
            for (let i = selectedMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = selectedMapData.overlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    console.log("Clicked on child map link:", overlay);
                    const childMapName = overlay.linkedMapName;
                    const childMapData = detailedMapData.get(childMapName);
                    if (childMapData) {
                        childMapData.mode = 'view'; // Ensure child map is in view mode when navigated to this way
                        selectedMapFileName = childMapName;
                        clearAllSelections();
                        const mapItems = mapsList.querySelectorAll('li');
                        mapItems.forEach(li => {
                            if (li.dataset.fileName === childMapName) {
                                li.classList.add('selected-map-item');
                            }
                        });
                        displayMapOnCanvas(childMapName);
                        sendMapToPlayerView(childMapName);
                        console.log(`Switched to child map: ${childMapName}`);
                    } else {
                        alert(`Map "${childMapName}" not found.`);
                    }
                    return;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay)) {
                    if (overlay.linkedNoteId) {
                        const note = notesData.find(n => n.id === overlay.linkedNoteId);
                        if (note) {
                            const notePreviewOverlay = document.getElementById('note-preview-overlay');
                            const notePreviewBody = document.getElementById('note-preview-body');
                            if (notePreviewOverlay && notePreviewBody) {
                                const renderedHTML = easyMDE.options.previewRender(note.content);
                                notePreviewBody.innerHTML = renderedHTML;
                                notePreviewOverlay.style.display = 'flex';
                                if (playerWindow && !playerWindow.closed && overlay.playerVisible) {
                                    const playerNoteContent = filterPlayerContent(note.content);
                                    const playerRenderedHTML = easyMDE.options.previewRender(playerNoteContent);
                                    playerWindow.postMessage({
                                        type: 'showNotePreview',
                                        content: playerRenderedHTML
                                    }, '*');
                                }
                            }
                        }
                    }
                    return;
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay)) {
                    if (overlay.linkedCharacterId) {
                        const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                        if (character) {
                            const markdown = generateCharacterMarkdown(character.sheetData, character.notes, false, character.isDetailsVisible);
                            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                            const characterPreviewBody = document.getElementById('character-preview-body');
                            if (characterPreviewOverlay && characterPreviewBody) {
                                characterPreviewBody.innerHTML = markdown;
                                characterPreviewOverlay.style.display = 'flex';
                            }

                            if (playerWindow && !playerWindow.closed && overlay.playerVisible) {
                                const playerMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, true, character.isDetailsVisible);
                                playerWindow.postMessage({
                                    type: 'showCharacterPreview',
                                    content: playerMarkdown
                                }, '*');
                            }
                        }
                    }
                    return;
                }
            }
        }

        // If no interaction above, click might be for future pan/zoom or deselecting things.
        // console.log("Canvas clicked, no specific overlay interaction.", imageCoords);
    });

    // Point-in-polygon helper function (Ray casting algorithm)
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

    function isPointInNoteIcon(point, noteOverlay) {
        const iconSize = 20 / currentMapDisplayData.ratio; // icon size in image coordinates
        const notePos = noteOverlay.position;
        return point.x >= notePos.x - iconSize / 2 && point.x <= notePos.x + iconSize / 2 &&
               point.y >= notePos.y - iconSize / 2 && point.y <= notePos.y + iconSize / 2;
    }

    function isPointInCharacterIcon(point, characterOverlay) {
        const iconSize = 20 / currentMapDisplayData.ratio; // icon size in image coordinates
        const charPos = characterOverlay.position;
        return point.x >= charPos.x - iconSize / 2 && point.x <= charPos.x + iconSize / 2 &&
               point.y >= charPos.y - iconSize / 2 && point.y <= charPos.y + iconSize / 2;
    }

    function handleMouseMoveOnCanvas(event) {
        if (!currentMapDisplayData.img || !hoverLabel) return; // No map or label element

        const rect = dmCanvas.getBoundingClientRect();
        const canvasX = Math.round(event.clientX - rect.left);
        const canvasY = Math.round(event.clientY - rect.top);
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        let overlaysToCheck = selectedMapData ? selectedMapData.overlays : null;

        if (imageCoords && overlaysToCheck && overlaysToCheck.length > 0) {
            for (let i = overlaysToCheck.length - 1; i >= 0; i--) { // Iterate in reverse for top-most
                const overlay = overlaysToCheck[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    hoverLabel.textContent = overlay.linkedMapName;
                    hoverLabel.style.left = `${event.pageX + 10}px`;
                    hoverLabel.style.top = `${event.pageY + 10}px`;
                    hoverLabel.style.display = 'block';
                    return;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay) && overlay.linkedNoteId) {
                    const note = notesData.find(n => n.id === overlay.linkedNoteId);
                    if (note) {
                        hoverLabel.textContent = note.title;
                        hoverLabel.style.left = `${event.pageX + 10}px`;
                        hoverLabel.style.top = `${event.pageY + 10}px`;
                        hoverLabel.style.display = 'block';
                        return;
                    }
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay) && overlay.linkedCharacterId) {
                    const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                    if (character) {
                        hoverLabel.textContent = character.name;
                        hoverLabel.style.left = `${event.pageX + 10}px`;
                        hoverLabel.style.top = `${event.pageY + 10}px`;
                        hoverLabel.style.display = 'block';
                        return;
                    }
                }
            }
        }

        // If no overlay was hovered or mouse is outside image bounds for imageCoords
        hoverLabel.style.display = 'none';
    }

    function handleDelete(item) {
        const fileName = item.dataset.fileName;
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            const list = item.parentNode;
            item.remove();
            displayedFileNames.delete(fileName);

            // Revoke ObjectURL
            const mapDataEntry = detailedMapData.get(fileName);
            if (mapDataEntry && mapDataEntry.url) {
                URL.revokeObjectURL(mapDataEntry.url);
                detailedMapData.delete(fileName);
            }

            if (selectedMapFileName === fileName) {
                selectedMapFileName = null;
                if (modeToggleSwitch) modeToggleSwitch.disabled = true;
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            }

            updateMoveIconVisibility(list); // Update move icons in case first/last item changed
        }
    }

    function moveItemUp(item) {
        if (item.previousElementSibling) {
            item.parentNode.insertBefore(item, item.previousElementSibling);
            updateMoveIconVisibility(item.parentNode);
        }
    }

    function moveItemDown(item) {
        if (item.nextElementSibling) {
            item.parentNode.insertBefore(item.nextElementSibling, item);
            updateMoveIconVisibility(item.parentNode);
        }
    }

    function updateMoveIconVisibility(list) {
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-map-up');
            const downIcon = item.querySelector('.move-map-down');

            if (upIcon) upIcon.style.display = (index === 0) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1) ? 'none' : 'inline-block';
        });
    }


    // Modify existing dmCanvas click listener to NOT interfere if moving polygon (mouseup will handle finalization)
    // The dmCanvas click listener is complex; we need to ensure that if isMovingPolygon is true,
    // its default behavior (like trying to draw a new polygon or navigate) is suppressed
    // until the move is completed or cancelled.

    // New event listeners for polygon move:
    dmCanvas.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return; // Only main (left) click

        const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
        if (!imageCoords) return;

        if (isMovingPolygon && polygonBeingMoved) {
            if (isPointInPolygon(imageCoords, polygonBeingMoved.originalPoints.map(p => ({
                x: p.x + currentDragOffsets.x,
                y: p.y + currentDragOffsets.y
            })))) {
                moveStartPoint = imageCoords;
                moveStartPoint.x -= currentDragOffsets.x;
                moveStartPoint.y -= currentDragOffsets.y;
                console.log("Dragging polygon started at:", imageCoords);
                event.preventDefault();
            }
        } else if (isMovingNote && noteBeingMoved) {
            if (isPointInNoteIcon(imageCoords, noteBeingMoved.overlayRef)) {
                moveStartPoint = imageCoords;
                moveStartPoint.x -= currentDragOffsets.x;
                moveStartPoint.y -= currentDragOffsets.y;
                console.log("Dragging note started at:", imageCoords);
                event.preventDefault();
            }
        } else if (isMovingCharacter && characterBeingMoved) {
            if (isPointInCharacterIcon(imageCoords, characterBeingMoved.overlayRef)) {
                moveStartPoint = imageCoords;
                moveStartPoint.x -= currentDragOffsets.x;
                moveStartPoint.y -= currentDragOffsets.y;
                console.log("Dragging character started at:", imageCoords);
                event.preventDefault();
            }
        }
    });

    dmCanvas.addEventListener('mousemove', (event) => {
        // This is the general mousemove for hover labels.
        // We need to add drag logic here too, or ensure handleMouseMoveOnCanvas co-exists.
        // Let's keep hover logic and add drag logic.

        if ((isMovingPolygon && polygonBeingMoved && moveStartPoint) || (isMovingNote && noteBeingMoved && moveStartPoint) || (isMovingCharacter && characterBeingMoved && moveStartPoint)) {
            const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
            if (imageCoords) {
                currentDragOffsets.x = imageCoords.x - moveStartPoint.x;
                currentDragOffsets.y = imageCoords.y - moveStartPoint.y;

                const parentMapName = isMovingPolygon ? polygonBeingMoved.parentMapName : (isMovingNote ? noteBeingMoved.parentMapName : characterBeingMoved.parentMapName);

                if (selectedMapFileName === parentMapName && currentMapDisplayData.img && currentMapDisplayData.img.complete) {
                    const ctx = dmCanvas.getContext('2d');
                    ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                    ctx.drawImage(
                        currentMapDisplayData.img, 0, 0,
                        currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight,
                        currentMapDisplayData.offsetX, currentMapDisplayData.offsetY,
                        currentMapDisplayData.scaledWidth, currentMapDisplayData.scaledHeight
                    );
                    const mapData = detailedMapData.get(selectedMapFileName);
                    if (mapData && mapData.overlays) {
                        drawOverlays(mapData.overlays);
                    }
                } else if (selectedMapFileName === parentMapName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
            }
        } else {
            handleMouseMoveOnCanvas(event);
        }
    });

    dmCanvas.addEventListener('mouseup', (event) => {
        if (event.button !== 0) return;

        if (isMovingPolygon && polygonBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            polygonBeingMoved.overlayRef.polygon = polygonBeingMoved.originalPoints.map(p => ({
                x: p.x + finalDeltaX,
                y: p.y + finalDeltaY
            }));
            console.log(`Polygon moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Polygon moved to new position.`);
            resetAllInteractiveStates();
        } else if (isMovingNote && noteBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            noteBeingMoved.overlayRef.position = {
                x: noteBeingMoved.originalPosition.x + finalDeltaX,
                y: noteBeingMoved.originalPosition.y + finalDeltaY
            };
            console.log(`Note moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Note moved to new position.`);
            resetAllInteractiveStates();
        } else if (isMovingCharacter && characterBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            characterBeingMoved.overlayRef.position = {
                x: characterBeingMoved.originalPosition.x + finalDeltaX,
                y: characterBeingMoved.originalPosition.y + finalDeltaY
            };
            console.log(`Character moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Character moved to new position.`);
            resetAllInteractiveStates();
        }
    });

    // Modify the main canvas click listener (dmCanvas.addEventListener('click', ...))
    // to be aware of isMovingPolygon.
    // Original dmCanvas click listener:
    // dmCanvas.addEventListener('click', (event) => { ... });
    // We need to ensure that if isMovingPolygon is true, this listener doesn't execute
    // things like trying to draw a new polygon or navigate on overlay click.
    // One way is to add checks at the beginning of that listener.
    // (This will be done in a subsequent step if needed, the mousedown/move/mouseup should capture most interactions for move)


    function enableRename(listItem, textNode) {
        const currentName = textNode.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.classList.add('rename-input-active'); // For styling
        input.addEventListener('blur', () => finishRename(listItem, textNode, input, currentName));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger blur to save
            } else if (e.key === 'Escape') {
                // Revert to original name and remove input
                textNode.textContent = currentName;
                listItem.replaceChild(textNode, input);
            }
        });

        listItem.replaceChild(input, textNode);
        input.focus();
        input.select(); // Select the text in input for easy editing
    }

    function finishRename(listItem, textNode, input, originalName) {
        const newName = input.value.trim();
        if (newName && newName !== originalName) {
            if (displayedFileNames.has(newName)) {
                alert(`A map with the name "${newName}" already exists. Please choose a different name.`);
                textNode.textContent = originalName; // Revert to original text node content
                listItem.replaceChild(textNode, input); // Replace input with text node
            } else {
                textNode.textContent = newName; // Update text node content for display
                listItem.dataset.fileName = newName; // Update data attribute
                displayedFileNames.delete(originalName);
                displayedFileNames.add(newName);

                const mapDataEntry = detailedMapData.get(originalName);
                if (mapDataEntry) {
                    mapDataEntry.name = newName; // Update the name within the object
                    detailedMapData.delete(originalName);
                    detailedMapData.set(newName, mapDataEntry);

                    let displayedMapLinksUpdated = false;

                    // Update linkedMapName in all map overlays in detailedMapData
                    detailedMapData.forEach(dmEntry => {
                        if (dmEntry.overlays && dmEntry.overlays.length > 0) {
                            dmEntry.overlays.forEach(overlay => {
                                if (overlay.type === 'childMapLink' && overlay.linkedMapName === originalName) {
                                    overlay.linkedMapName = newName;
                                    console.log(`DM Overlay: Map '${dmEntry.name}' link to '${originalName}' changed to '${newName}'.`);
                                    if (dmEntry.name === selectedMapFileName && selectedMapFileName !== newName) {
                                        displayedMapLinksUpdated = true;
                                    }
                                }
                            });
                        }
                    });

                    let selectionUpdated = false;
                    if (selectedMapFileName === originalName) {
                        selectedMapFileName = newName;
                        selectionUpdated = true;
                    }

                    if (selectionUpdated || displayedMapLinksUpdated) {
                        if (selectedMapFileName) {
                            console.log(`Redrawing canvas for: ${selectedMapFileName} (Selection updated: ${selectionUpdated}, Links updated: ${displayedMapLinksUpdated})`);
                            displayMapOnCanvas(selectedMapFileName);
                        }
                    }
                }
                listItem.replaceChild(textNode, input); // Replace input with text node after successful rename
            }
        } else {
            // If name is empty or unchanged, revert to original
            textNode.textContent = originalName; // Ensure text node has original name
            listItem.replaceChild(textNode, input); // Replace input with text node
        }
    }


    if (editMapsIcon) {
        editMapsIcon.addEventListener('click', () => {
            isEditMode = !isEditMode;
            mapsList.classList.toggle('edit-mode-active', isEditMode);
            const mapItems = mapsList.querySelectorAll('li');
            mapItems.forEach(item => {
                item.classList.toggle('clickable-map', !isEditMode); // Toggle clickable state
                let actionsSpan = item.querySelector('.file-actions');
                if (!actionsSpan && isEditMode) {
                    actionsSpan = document.createElement('span');
                    actionsSpan.classList.add('file-actions');
                    actionsSpan.style.marginLeft = '10px';

                    const renameIcon = document.createElement('span');
                    renameIcon.textContent = '✏️';
                    renameIcon.classList.add('file-action-icon', 'rename-map');
                    renameIcon.title = 'Rename map';
                    renameIcon.style.cursor = 'pointer';
                    renameIcon.style.marginRight = '5px';
                    renameIcon.onclick = () => {
                        // Ensure only the text node is passed for renaming, not the whole li
                        const textNode = Array.from(item.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                        if (textNode) enableRename(item, textNode);
                    };

                    const deleteIcon = document.createElement('span');
                    deleteIcon.textContent = '🗑️';
                    deleteIcon.classList.add('file-action-icon', 'delete-map');
                    deleteIcon.title = 'Delete map';
                    deleteIcon.style.cursor = 'pointer';
                    deleteIcon.onclick = () => handleDelete(item); // Placeholder for delete

                    const upIcon = document.createElement('span');
                    upIcon.textContent = '↑';
                    upIcon.classList.add('file-action-icon', 'move-map-up');
                    upIcon.title = 'Move up';
                    upIcon.style.cursor = 'pointer';
                    upIcon.style.marginRight = '5px';
                    upIcon.onclick = () => moveItemUp(item);

                    const downIcon = document.createElement('span');
                    downIcon.textContent = '↓';
                    downIcon.classList.add('file-action-icon', 'move-map-down');
                    downIcon.title = 'Move down';
                    downIcon.style.cursor = 'pointer';
                    downIcon.onclick = () => moveItemDown(item);

                    actionsSpan.appendChild(renameIcon);
                    actionsSpan.appendChild(upIcon);
                    actionsSpan.appendChild(downIcon);
                    actionsSpan.appendChild(deleteIcon);
                    item.appendChild(actionsSpan);
                }
                if (actionsSpan) {
                    actionsSpan.style.display = isEditMode ? 'inline' : 'none';
                }
                updateMoveIconVisibility(mapsList); // Update visibility on mode toggle
                 // If exiting edit mode and an input field is active, revert it
                const activeInput = item.querySelector('.rename-input-active');
                if (!isEditMode && activeInput) {
                    const originalName = item.dataset.fileName; // Assuming original name is stored or can be retrieved
                    const textNode = document.createTextNode(originalName);
                    item.replaceChild(textNode, activeInput);
                    // Ensure the text node is correctly placed before the actions span if it exists
                    if (actionsSpan) item.insertBefore(textNode, actionsSpan);
                }
            });
            editMapsIcon.textContent = isEditMode ? '✅' : '✏️';
        });
    }

    if (uploadMapsInput && mapsList) {
        uploadMapsInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (!files) {
                return;
            }

            for (const file of files) {
                if (!displayedFileNames.has(file.name)) {
                    const listItem = document.createElement('li');

                    listItem.dataset.fileName = file.name;
                    listItem.classList.add('map-list-item');

                    const textNode = document.createTextNode(file.name);

                    listItem.appendChild(textNode);

                    mapsList.appendChild(listItem);
                    displayedFileNames.add(file.name);

                    const objectURL = URL.createObjectURL(file);
                    detailedMapData.set(file.name, {
                        url: objectURL,
                        name: file.name,
                        overlays: [],
                        mode: 'edit'
                    });

                    if (!isEditMode) {
                        listItem.classList.add('clickable-map');
                    }

                    if (isEditMode) {
                        const actionsSpan = document.createElement('span');
                        actionsSpan.classList.add('file-actions');
                        actionsSpan.style.marginLeft = '10px';
                        actionsSpan.style.display = 'inline';

                        const renameIcon = document.createElement('span');
                        renameIcon.textContent = '✏️';
                        renameIcon.classList.add('file-action-icon', 'rename-map');
                        renameIcon.title = 'Rename map';
                        renameIcon.style.cursor = 'pointer';
                        renameIcon.style.marginRight = '5px';
                        renameIcon.onclick = () => {
                            const textNode = Array.from(listItem.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                            if (textNode) enableRename(listItem, textNode);
                        };

                        const deleteIcon = document.createElement('span');
                        deleteIcon.textContent = '🗑️';
                        deleteIcon.classList.add('file-action-icon', 'delete-map');
                        deleteIcon.title = 'Delete map';
                        deleteIcon.style.cursor = 'pointer';
                        deleteIcon.onclick = () => handleDelete(listItem);

                        const upIcon = document.createElement('span');
                        upIcon.textContent = '↑';
                        upIcon.classList.add('file-action-icon', 'move-map-up');
                        upIcon.title = 'Move up';
                        upIcon.style.cursor = 'pointer';
                        upIcon.style.marginRight = '5px';
                        upIcon.onclick = () => moveItemUp(listItem);

                        const downIcon = document.createElement('span');
                        downIcon.textContent = '↓';
                        downIcon.classList.add('file-action-icon', 'move-map-down');
                        downIcon.title = 'Move down';
                        downIcon.style.cursor = 'pointer';
                        downIcon.onclick = () => moveItemDown(listItem);

                        actionsSpan.appendChild(renameIcon);
                        actionsSpan.appendChild(upIcon);
                        actionsSpan.appendChild(downIcon);
                        actionsSpan.appendChild(deleteIcon);
                        listItem.appendChild(actionsSpan);
                        updateMoveIconVisibility(mapsList);
                    }
                }
            }
            event.target.value = null;
            updateMoveIconVisibility(mapsList);
        });
    } else {
        console.error('Could not find the upload input or the list element. Check IDs.');
    }

    mapsList.addEventListener('click', (event) => {
        if (isEditMode) {
            return;
        }

        let targetItem = event.target;
        while (targetItem && targetItem.tagName !== 'LI' && targetItem !== mapsList) {
            targetItem = targetItem.parentNode;
        }

        if (targetItem && targetItem.tagName === 'LI' && targetItem.classList.contains('map-list-item')) {
            const clickedFileName = targetItem.dataset.fileName;
            if (clickedFileName) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);

                if (isChangingChildMapForPolygon && selectedPolygonForContextMenu && selectedMapData && selectedMapData.mode === 'edit') {
                    const { overlay, index, parentMapName } = selectedPolygonForContextMenu;
                    if (parentMapName === clickedFileName) {
                        alert("Cannot link a map to itself as a child. Please select a different map.");
                        return;
                    }
                    const parentMapData = detailedMapData.get(parentMapName);
                    if (parentMapData && parentMapData.overlays[index] === overlay) {
                        const oldLinkedMapName = overlay.linkedMapName;
                        parentMapData.overlays[index].linkedMapName = clickedFileName;
                        alert(`Child map for the selected polygon on "${parentMapName}" changed from "${oldLinkedMapName}" to "${clickedFileName}".`);
                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                    } else {
                        alert("An error occurred while trying to change the child map. Please try again.");
                    }
                    isChangingChildMapForPolygon = false;
                    selectedPolygonForContextMenu = null;
                } else if (isLinkingChildMap && polygonDrawingComplete && selectedMapData && selectedMapData.mode === 'edit') {
                    if (selectedMapFileName === clickedFileName) {
                        alert("Cannot link a map to itself. Please select a different map to be the child.");
                        return;
                    }

                    const parentMapData = detailedMapData.get(selectedMapFileName);
                    if (parentMapData) {
                        const newOverlay = {
                            type: 'childMapLink',
                            polygon: [...currentPolygonPoints],
                            linkedMapName: clickedFileName,
                            playerVisible: false
                        };
                        parentMapData.overlays.push(newOverlay);
                        alert(`Map "${clickedFileName}" successfully linked as a new child to "${parentMapData.name}".`);
                        resetAllInteractiveStates();
                        displayMapOnCanvas(selectedMapFileName);
                    } else {
                        alert("Error: Could not find data for the parent map. Linking failed.");
                        resetAllInteractiveStates();
                    }
                } else {
                    // Normal selection behavior
                    if (selectedMapFileName !== null && selectedMapFileName !== clickedFileName) {
                        resetAllInteractiveStates();
                    }
                    selectedMapFileName = clickedFileName;

                    clearAllSelections();
                    targetItem.classList.add('selected-map-item');

                    displayMapOnCanvas(clickedFileName);

                    const newSelectedMapData = detailedMapData.get(clickedFileName);
                    if (newSelectedMapData) {
                        modeToggleSwitch.checked = newSelectedMapData.mode === 'view';
                        modeToggleSwitch.disabled = false;
                        if (newSelectedMapData.mode === 'view') {
                            sendMapToPlayerView(clickedFileName);
                        }
                    } else {
                        modeToggleSwitch.disabled = true;
                    }
                }
            }
        }
    });

    if (modeToggleSwitch) {
        modeToggleSwitch.addEventListener('change', () => {
            if (!selectedMapFileName) return;
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (selectedMapData) {
                selectedMapData.mode = modeToggleSwitch.checked ? 'view' : 'edit';
                console.log(`Map '${selectedMapFileName}' mode changed to ${selectedMapData.mode}`);
                displayMapOnCanvas(selectedMapFileName);
                if (selectedMapData.mode === 'view') {
                    sendMapToPlayerView(selectedMapFileName);
                } else {
                    // If switching back to edit, clear player view
                    sendClearMessageToPlayerView();
                }
            }
        });
    }

    function clearAllSelections() {
        const allMapItems = document.querySelectorAll('#maps-list li');
        allMapItems.forEach(item => item.classList.remove('selected-map-item'));
    }



    // Initial canvas setup
    if (dmCanvas && mapContainer) {
        // Call resizeCanvas directly on initial load. The debounced version is for subsequent resize events.
        // resizeCanvas(); // This will be called as part of Initial setup calls below

        // Listen to resize events using the debounced version of resizeCanvas
        window.addEventListener('resize', debounce(resizeCanvas, 250)); 
        
        dmCanvas.addEventListener('mousemove', handleMouseMoveOnCanvas);
        dmCanvas.addEventListener('mouseout', () => {
            if (hoverLabel) {
                hoverLabel.style.display = 'none';
            }
        });
    } else {
        console.error("Could not find DM canvas or map container for initial sizing.");
    }

    // Initially disable map tools on load
    // disableMapTools(); // Will be handled by updateButtonStates

    // Initial setup calls
    resizeCanvas(); // Size canvas on load
    window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize

    // Notes Tab Initialisation
    renderNotesList();
    renderCharactersList();
    // Add other notes event listeners here if needed immediately, or within DOMContentLoaded


    // --- Campaign Save/Load ---
    const saveCampaignButton = document.getElementById('save-campaign-button');
    const loadCampaignInput = document.getElementById('load-campaign-input');

    async function saveCampaign() {
        saveCampaignButton.textContent = 'Saving...';
        saveCampaignButton.disabled = true;

        try {
            const zip = new JSZip();
            const imagesFolder = zip.folder("images");
            const charactersFolder = zip.folder("characters");

            // --- Handle Map Images ---
            const imagePromises = [];
            for (const [name, data] of detailedMapData.entries()) {
                if (data.url) {
                    const promise = fetch(data.url)
                        .then(response => response.blob())
                        .then(blob => {
                            imagesFolder.file(name, blob);
                            console.log(`Added map image to zip: ${name}`);
                        })
                        .catch(err => console.error(`Failed to fetch and zip map ${name}:`, err));
                    imagePromises.push(promise);
                }
            }
            await Promise.all(imagePromises);

            // --- Handle Character PDFs ---
            const charactersToSave = JSON.parse(JSON.stringify(charactersData));
            charactersToSave.forEach(character => {
                const originalCharacter = charactersData.find(c => c.id === character.id);
                if (originalCharacter && originalCharacter.pdfData && originalCharacter.pdfFileName) {
                    charactersFolder.file(originalCharacter.pdfFileName, originalCharacter.pdfData);
                    console.log(`Added character PDF to zip: ${originalCharacter.pdfFileName}`);
                    // We keep pdfFileName in the JSON, but remove the heavy data
                    delete character.pdfData;
                }
            });

            // --- Prepare and add campaign.json ---
            const serializableDetailedMapData = {};
            for (const [name, data] of detailedMapData) {
                serializableDetailedMapData[name] = {
                    name: data.name,
                    overlays: data.overlays,
                    mode: data.mode
                };
            }

            const campaignData = {
                mapDefinitions: serializableDetailedMapData,
                notes: notesData,
                selectedNoteId: selectedNoteId,
                characters: charactersToSave, // Use the version without pdfData
                selectedCharacterId: selectedCharacterId,
            };

            const campaignJSON = JSON.stringify(campaignData, null, 2);
            zip.file("campaign.json", campaignJSON);

            // --- Generate and Download Zip ---
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dndemicube-campaign.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("Campaign saved successfully to zip.");
            alert("Campaign saved successfully!");

        } catch (error) {
            console.error("Error saving campaign to zip:", error);
            alert("An error occurred while saving the campaign. Please check the console for details.");
        } finally {
            saveCampaignButton.textContent = 'Save Campaign';
            saveCampaignButton.disabled = false;
        }
    }

    async function loadCampaign(event) {
        const file = event.target.files[0];
        if (!file) return;

        const loadButtonLabel = document.querySelector('label[for="load-campaign-input"]');
        loadButtonLabel.textContent = 'Loading...';
        loadCampaignInput.disabled = true;

        try {
            // Reset entire application state
            resetApplicationState();

            if (file.name.endsWith('.zip')) {
                await loadFromZip(file);
            } else if (file.name.endsWith('.json')) {
                await loadFromJson(file);
            } else {
                throw new Error("Unsupported file type. Please select a .zip or .json file.");
            }

            // --- Final UI Refresh ---
            renderAllLists();

            // Restore selections and display
            if (selectedCharacterId) loadCharacterIntoEditor(selectedCharacterId);
            if (selectedNoteId) loadNoteIntoEditor(selectedNoteId);
            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            } else {
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            }

            alert("Campaign loaded successfully!");

        } catch (error) {
            console.error("Error loading campaign:", error);
            alert(`Failed to load campaign: ${error.message}`);
            resetApplicationState(); // Also reset on failure
            renderAllLists();
        } finally {
            loadButtonLabel.textContent = 'Load Campaign';
            loadCampaignInput.disabled = false;
            loadCampaignInput.value = null; // Reset input
        }
    }

    function resetApplicationState() {
        // Clear data arrays
        activeMapsData = [];
        notesData = [];
        charactersData = [];

        // Revoke old object URLs and clear map data
        for (const mapData of detailedMapData.values()) {
            if (mapData.url) {
                URL.revokeObjectURL(mapData.url);
            }
        }
        detailedMapData.clear();
        displayedFileNames.clear();

        // Clear selections
        selectedMapFileName = null;
        selectedNoteId = null;
        selectedCharacterId = null;

        // Reset UI components
        if (modeToggleSwitch) modeToggleSwitch.disabled = true;
        mapsList.innerHTML = '';
        notesList.innerHTML = '';
        charactersList.innerHTML = '';
        clearNoteEditor();
        clearCharacterEditor();
        const ctx = dmCanvas.getContext('2d');
        ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
    }

    function renderAllLists() {
        renderMapsList();
        renderNotesList();
        renderCharactersList();
    }

    async function loadFromZip(file) {
        const zip = await JSZip.loadAsync(file);
        const campaignFile = zip.file("campaign.json");
        if (!campaignFile) throw new Error("campaign.json not found in the zip file.");

        const campaignJSON = await campaignFile.async("string");
        const campaignData = JSON.parse(campaignJSON);

        // --- Restore Data Structures (without assets yet) ---
        notesData = campaignData.notes || [];
        charactersData = campaignData.characters || []; // This now includes pdfFileName
        charactersData.forEach(character => {
            if (typeof character.isDetailsVisible === 'undefined') {
                character.isDetailsVisible = true;
            }
        });
        selectedNoteId = campaignData.selectedNoteId || null;
        selectedCharacterId = campaignData.selectedCharacterId || null;
        // Selections for maps are not restored yet, as they depend on UI lists

        // --- Restore Assets ---
        const imagePromises = [];
        const imagesFolder = zip.folder("images");
        for (const mapName in campaignData.mapDefinitions) {
            const definition = campaignData.mapDefinitions[mapName];
            const imageFile = imagesFolder.file(mapName);
            if (imageFile) {
                const promise = imageFile.async("blob").then(blob => {
                    const url = URL.createObjectURL(blob);
                    const overlays = definition.overlays || [];
                    overlays.forEach(overlay => {
                        if (typeof overlay.playerVisible === 'undefined') {
                            overlay.playerVisible = true;
                        }
                    });
                    detailedMapData.set(mapName, {
                        name: definition.name,
                        url: url,
                        overlays: overlays,
                        mode: definition.mode || 'edit' // Backward compatibility
                    });
                    displayedFileNames.add(mapName);
                });
                imagePromises.push(promise);
            }
        }
        // Handle old save format
        if (campaignData.activeMaps) {
            campaignData.activeMaps.forEach(activeMap => {
                const mapData = detailedMapData.get(activeMap.fileName);
                if (mapData) {
                    mapData.mode = 'view';
                }
            });
        }
        await Promise.all(imagePromises);

        const characterPromises = [];
        const charactersFolder = zip.folder("characters");
        charactersData.forEach(character => {
            if (character.pdfFileName) {
                const pdfFile = charactersFolder.file(character.pdfFileName);
                if (pdfFile) {
                    const promise = pdfFile.async("uint8array").then(pdfData => {
                        character.pdfData = pdfData;
                    });
                    characterPromises.push(promise);
                }
            }
        });
        await Promise.all(characterPromises);
    }

    async function loadFromJson(file) {
        const campaignJSON = await file.text();
        const campaignData = JSON.parse(campaignJSON);

        // Legacy support: data structures are restored, but assets are missing.
        notesData = campaignData.notes || [];
        charactersData = campaignData.characters || [];
        charactersData.forEach(character => {
            if (typeof character.isDetailsVisible === 'undefined') {
                character.isDetailsVisible = true;
            }
        });
        selectedNoteId = campaignData.selectedNoteId || null;
        selectedCharacterId = campaignData.selectedCharacterId || null;

        if (campaignData.mapDefinitions) {
            for (const mapName in campaignData.mapDefinitions) {
                const definition = campaignData.mapDefinitions[mapName];
                detailedMapData.set(mapName, {
                    name: definition.name,
                    url: null, // No URL available in old format
                    overlays: definition.overlays || [],
                    mode: definition.mode || 'edit' // Backward compatibility
                });
                displayedFileNames.add(mapName);
            }
        }
        // Handle old save format
        if (campaignData.activeMaps) {
            campaignData.activeMaps.forEach(activeMap => {
                const mapData = detailedMapData.get(activeMap.fileName);
                if (mapData) {
                    mapData.mode = 'view';
                }
            });
        }
        alert("Legacy campaign loaded. Please re-upload map and character files manually.");
    }

    function renderMapsList() {
        mapsList.innerHTML = '';
        for (const mapName of displayedFileNames) {
            const mapData = detailedMapData.get(mapName);
            if (!mapData) continue;

            const listItem = document.createElement('li');
            listItem.dataset.fileName = mapName;
            listItem.classList.add('map-list-item');

            const textNode = document.createTextNode(mapName);

            listItem.appendChild(textNode);
            mapsList.appendChild(listItem);
        }
        if (isEditMode) {
            editMapsIcon.click();
            editMapsIcon.click();
        }
    }

    if (saveCampaignButton) {
        saveCampaignButton.addEventListener('click', saveCampaign);
    }
    if (loadCampaignInput) {
        loadCampaignInput.addEventListener('change', loadCampaign);
    }

    // --- Player View Communication ---
    function sendMapToPlayerView(mapFileName) {
        if (playerWindow && !playerWindow.closed && mapFileName) {
            const mapData = detailedMapData.get(mapFileName);

            if (mapData && mapData.url && mapData.mode === 'view') {
                fetch(mapData.url)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64dataUrl = reader.result;
                            const visibleOverlays = mapData.overlays
                                .filter(overlay => (typeof overlay.playerVisible === 'boolean' ? overlay.playerVisible : true))
                                .map(overlay => {
                                    if (overlay.type === 'characterLink' && overlay.linkedCharacterId) {
                                        const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                                        if (character && character.sheetData && character.sheetData.character_portrait) {
                                            return {
                                                ...overlay,
                                                character_portrait: character.sheetData.character_portrait
                                            };
                                        }
                                    }
                                    return overlay;
                                });

                            playerWindow.postMessage({
                                type: 'loadMap',
                                mapDataUrl: base64dataUrl,
                                overlays: JSON.parse(JSON.stringify(visibleOverlays))
                            }, '*');
                            console.log(`Sent map "${mapFileName}" and ${visibleOverlays.length} visible overlays to player view.`);
                        };
                        reader.onerror = () => {
                            console.error(`Error converting map "${mapFileName}" to data URL for player view.`);
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(error => {
                        console.error(`Error fetching blob for map "${mapFileName}" to send to player view:`, error);
                    });
            } else {
                console.warn(`Could not send map to player view: Map data, URL for "${mapFileName}", or mode is not 'view'.`);
            }
        }
    }

    function sendPolygonVisibilityUpdateToPlayerView(mapFileName, polygonIdentifier, isVisible) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({
                type: 'polygonVisibilityUpdate',
                mapFileName: mapFileName,
                polygonIdentifier: polygonIdentifier, // This needs to be a way to uniquely ID the polygon (e.g., its points array stringified)
                isVisible: isVisible
            }, '*');
            console.log(`Sent polygon visibility update to player view: Map: ${mapFileName}, Visible: ${isVisible}`);
        }
    }


    function sendClearMessageToPlayerView() {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({ type: 'clearMap', characters: charactersData }, '*');
            console.log("Sent clearMap message to player view with characters data.");
        }
    }

    // --- Player View Button ---
    if (openPlayerViewButton) {
        openPlayerViewButton.addEventListener('click', () => {
            const playerViewUrl = 'player_view.html'; // Corrected path assuming it's relative to dm_view.html
            if (playerWindow === null || playerWindow.closed) {
                playerWindow = window.open(playerViewUrl, 'PlayerViewDnDemicube', 'width=800,height=600,resizable=yes,scrollbars=yes');
                if (playerWindow) {
                    // Send current map after a short delay to allow the window to load its listeners
                    setTimeout(() => {
                        if (selectedMapFileName) {
                            sendMapToPlayerView(selectedMapFileName);
                        }
                    }, 500);
                }
            } else {
                playerWindow.focus();
                // If focused and a map is active, ensure it has the latest.
                if (selectedMapFileName) {
                     sendMapToPlayerView(selectedMapFileName);
                }
            }
        });
    }


    // --- Context Menu Logic ---
    dmCanvas.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent default browser context menu

        if (isMovingPolygon) {
            resetAllInteractiveStates(); // Cancel move mode on right-click
            alert("Polygon move cancelled.");
            console.log("Polygon move cancelled via right-click.");
            return;
        }

        polygonContextMenu.style.display = 'none'; // Hide previous menu first
        noteContextMenu.style.display = 'none';
        characterContextMenu.style.display = 'none';
        mapToolsContextMenu.style.display = 'none';
        selectedPolygonForContextMenu = null;
        selectedNoteForContextMenu = null;
        selectedCharacterForContextMenu = null;


        if (!selectedMapFileName) {
            return;
        }

        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) return;

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;

        // Check for overlay interaction first
        if (selectedMapData.overlays) {
            for (let i = selectedMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = selectedMapData.overlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    selectedPolygonForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };

                    const toggleVisibilityItem = polygonContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const changeChildMapItem = polygonContextMenu.querySelector('[data-action="change-child-map"]');
                    const redrawPolygonItem = polygonContextMenu.querySelector('[data-action="redraw-polygon"]');
                    const movePolygonItem = polygonContextMenu.querySelector('[data-action="move-polygon"]');
                    const deleteLinkItem = polygonContextMenu.querySelector('[data-action="delete-link"]');

                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'none';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'none';
                        if (movePolygonItem) movePolygonItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'list-item';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'list-item';
                        if (movePolygonItem) movePolygonItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }

                    polygonContextMenu.style.left = `${event.pageX}px`;
                    polygonContextMenu.style.top = `${event.pageY}px`;
                    polygonContextMenu.style.display = 'block';
                    console.log('Right-clicked on polygon:', selectedPolygonForContextMenu);
                    return;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay)) {
                    selectedNoteForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };

                    const toggleVisibilityItem = noteContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const linkToNewNoteItem = noteContextMenu.querySelector('[data-action="link-to-new-note"]');
                    const moveNoteItem = noteContextMenu.querySelector('[data-action="move-note"]');
                    const deleteLinkItem = noteContextMenu.querySelector('[data-action="delete-link"]');

                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (linkToNewNoteItem) linkToNewNoteItem.style.display = 'none';
                        if (moveNoteItem) moveNoteItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (linkToNewNoteItem) linkToNewNoteItem.style.display = 'list-item';
                        if (moveNoteItem) moveNoteItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }

                    noteContextMenu.style.left = `${event.pageX}px`;
                    noteContextMenu.style.top = `${event.pageY}px`;
                    noteContextMenu.style.display = 'block';
                    console.log('Right-clicked on note icon:', selectedNoteForContextMenu);
                    return;
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay)) {
                    selectedCharacterForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };

                    const toggleVisibilityItem = characterContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const linkToCharacterItem = characterContextMenu.querySelector('[data-action="link-to-character"]');
                    const moveCharacterItem = characterContextMenu.querySelector('[data-action="move-character"]');
                    const deleteLinkItem = characterContextMenu.querySelector('[data-action="delete-link"]');

                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (linkToCharacterItem) linkToCharacterItem.style.display = 'none';
                        if (moveCharacterItem) moveCharacterItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (linkToCharacterItem) linkToCharacterItem.style.display = 'list-item';
                        if (moveCharacterItem) moveCharacterItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }

                    characterContextMenu.style.left = `${event.pageX}px`;
                    characterContextMenu.style.top = `${event.pageY}px`;
                    characterContextMenu.style.display = 'block';
                    console.log('Right-clicked on character icon:', selectedCharacterForContextMenu);
                    return;
                }
            }
        }

        // If no overlay was hit, show the general map tools menu, but only in edit mode.
        if (selectedMapData.mode === 'edit') {
            mapToolsContextMenu.style.left = `${event.pageX}px`;
            mapToolsContextMenu.style.top = `${event.pageY}px`;
            mapToolsContextMenu.style.display = 'block';
        }
    });

    // Global click listener to hide context menu
    if (mapToolsContextMenu) {
        mapToolsContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;

            if (action) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (!selectedMapData || selectedMapData.mode !== 'edit') {
                    alert("Please select a map and ensure it is in 'Edit' mode to use map tools.");
                    return;
                }

                switch (action) {
                    case 'link-child-map':
                        isLinkingChildMap = true;
                        dmCanvas.style.cursor = 'crosshair';
                        alert("Click on the map to start drawing a polygon for the link. Click the first point to close the shape.");
                        break;
                    case 'link-note':
                        isLinkingNote = true;
                        dmCanvas.style.cursor = 'crosshair';
                        alert("Click on the map to place a note icon.");
                        break;
                    case 'link-character':
                        isLinkingCharacter = true;
                        dmCanvas.style.cursor = 'crosshair';
                        alert("Click on the map to place a character icon.");
                        break;
                }
            }
            mapToolsContextMenu.style.display = 'none';
        });
    }
    document.addEventListener('click', (event) => {
        if (polygonContextMenu.style.display === 'block') {
            // Check if the click was outside the context menu
            if (!polygonContextMenu.contains(event.target)) {
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
            }
        }
        if (noteContextMenu.style.display === 'block') {
            if (!noteContextMenu.contains(event.target)) {
                noteContextMenu.style.display = 'none';
                selectedNoteForContextMenu = null;
            }
        }
        if (characterContextMenu.style.display === 'block') {
            if (!characterContextMenu.contains(event.target)) {
                characterContextMenu.style.display = 'none';
                selectedCharacterForContextMenu = null;
            }
        }
        if (mapToolsContextMenu.style.display === 'block') {
            if (!mapToolsContextMenu.contains(event.target)) {
                mapToolsContextMenu.style.display = 'none';
            }
        }
    });

    // Prevent context menu click from propagating to the document listener and closing itself
    polygonContextMenu.addEventListener('click', (event) => {
        event.stopPropagation(); // Stop click from closing menu immediately
        const action = event.target.dataset.action;

        if (action && selectedPolygonForContextMenu) {
            const { overlay, index, parentMapName, source } = selectedPolygonForContextMenu;

            const parentMapData = detailedMapData.get(parentMapName);

            if (!parentMapData) {
                console.error(`Parent map data not found for context menu action. Name: ${parentMapName}, Source: ${source}`);
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
                return;
            }

            switch (action) {
                case 'toggle-player-visibility':
                    if (source === 'view') {
                        if (typeof overlay.playerVisible !== 'boolean') {
                            overlay.playerVisible = true;
                        }
                        overlay.playerVisible = !overlay.playerVisible;
                        console.log(`Polygon visibility for "${overlay.linkedMapName}" on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                        alert(`Player visibility for this area is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);

                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                            sendMapToPlayerView(parentMapName);
                        } else {
                            if (playerWindow && !playerWindow.closed) {
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                    } else {
                        console.warn("Toggle Player Visibility action called on a map not in 'view' mode.");
                        alert("This action is only available for maps in 'View' mode.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                case 'change-child-map':
                    if (source === 'edit') {
                        isChangingChildMapForPolygon = true;
                        alert(`"Change Child Map" selected for polygon linking to "${overlay.linkedMapName}". Please click a new map from the list to be its new child.`);
                    }
                    polygonContextMenu.style.display = 'none';
                    break;
                case 'redraw-polygon':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        isRedrawingPolygon = true;
                        preservedLinkedMapNameForRedraw = overlay.linkedMapName;
                        currentPolygonPoints = [];
                        polygonDrawingComplete = false;
                        parentMapData.overlays.splice(index, 1);
                        dmCanvas.style.cursor = 'crosshair';
                        alert(`Redrawing polygon for link to "${preservedLinkedMapNameForRedraw}". Click on the map to start drawing. Click the first point to close it.`);
                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                        console.log('Redraw Polygon initiated. Old polygon removed. Preserved link:', preservedLinkedMapNameForRedraw);
                    } else if (source === 'edit') {
                        console.error("Error initiating redraw: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to redraw.");
                    }
                    polygonContextMenu.style.display = 'none';
                    if (!isRedrawingPolygon) selectedPolygonForContextMenu = null;
                    break;
                case 'move-polygon':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        isMovingPolygon = true;
                        polygonBeingMoved = {
                            overlayRef: overlay,
                            originalPoints: JSON.parse(JSON.stringify(overlay.polygon)),
                            parentMapName: parentMapName,
                            originalIndex: index
                        };
                        moveStartPoint = null;
                        currentPolygonDragOffsets = {x: 0, y: 0};
                        dmCanvas.style.cursor = 'move';
                        alert(`Move mode activated for polygon linking to "${overlay.linkedMapName}". Click and drag the polygon. Click again to place, or right-click to cancel.`);
                        console.log('Move Polygon initiated for:', polygonBeingMoved);
                    } else if (source === 'edit') {
                        console.error("Error initiating move: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to move.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                case 'delete-link':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        if (confirm(`Are you sure you want to delete the link to "${overlay.linkedMapName}"?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Link to "${overlay.linkedMapName}" deleted from map "${parentMapName}".`);
                            alert(`Link to "${overlay.linkedMapName}" has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                    } else if (source === 'edit') {
                        console.error("Error deleting link: Parent map data or overlay not found.");
                        alert("Error: Could not find the link to delete.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
            }
        } else if (action) {
            console.warn("Context menu action clicked, but no polygon was selected.");
            polygonContextMenu.style.display = 'none';
            selectedPolygonForContextMenu = null;
        }
    });

    // --- Notes Tab Functionality ---

    function initEasyMDE() {
        if (easyMDE) {
            // console.log("EasyMDE already initialized.");
            return;
        }
        if (!markdownEditorTextarea) {
            console.error("Markdown textarea element not found for EasyMDE.");
            return;
        }
        try {
            easyMDE = new EasyMDE({
                element: markdownEditorTextarea,
                spellChecker: false,
                placeholder: "Type your markdown notes here...",
                minHeight: "150px",
                autosave: {
                    enabled: true,
                    uniqueId: selectedNoteId ? `note_${selectedNoteId}` : "dndemicube_unsaved_note", // Prefix to avoid collision
                    delay: 3000,
                },
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "table", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide", "|",
                    {
                        name: "dm-mode",
                        action: function(editor) {
                            const cm = editor.codemirror;
                            const selection = cm.getSelection();
                            cm.replaceSelection(`[dm]${selection}[/dm]`);
                        },
                        className: "fa fa-user-secret",
                        title: "DM Only Content",
                    }
                ],
                // Handle image uploads by pasting or dragging - converts to base64
                uploadImage: true,
                imageUploadFunction: function(file, onSuccess, onError) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        onSuccess(event.target.result); // Pass base64 data URL
                    };
                    reader.onerror = function (error) {
                        onError("Error reading file: " + error);
                    };
                    reader.readAsDataURL(file);
                },
            });
            // console.log("EasyMDE initialized. Autosave ID:", easyMDE.options.autosave.uniqueId);

            if (tabNotes && tabNotes.classList.contains('active') && easyMDE.codemirror) {
                setTimeout(() => easyMDE.codemirror.refresh(), 10);
            }
        } catch (e) {
            console.error("Error initializing EasyMDE:", e);
            easyMDE = null; // Ensure it's null if init failed
        }
    }

    function destroyEasyMDE() {
        if (easyMDE) {
            try {
                easyMDE.toTextArea();
            } catch (e) {
                console.error("Error destroying EasyMDE:", e);
            }
            easyMDE = null;
            // console.log("EasyMDE instance destroyed.");
        }
    }

    function clearNoteEditor() {
        if (noteTitleInput) noteTitleInput.value = "";

        if (easyMDE && typeof easyMDE.value === 'function') {
            easyMDE.value("");
        } else if (markdownEditorTextarea) {
             markdownEditorTextarea.value = "";
        }
    }


    function renderNotesList() {
        if (!notesList) return;
        const currentScrollTop = notesList.scrollTop; // Preserve scroll position
        notesList.innerHTML = '';

        notesData.forEach(note => {
            const listItem = document.createElement('li');
            listItem.dataset.noteId = note.id;
            listItem.classList.add('note-list-item');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('note-list-item-name');
            nameSpan.textContent = note.title;
            listItem.appendChild(nameSpan);


            if (note.id === selectedNoteId) {
                listItem.classList.add('selected-note-item');
            }

            if (isNotesEditMode) {
                notesList.classList.add('edit-mode-active');
                const actionsSpan = document.createElement('span');
                actionsSpan.classList.add('note-actions');

                const renameIconHTML = `<span class="note-action-icon rename-note" title="Rename Note" data-action="rename">✏️</span>`;
                const upIconHTML = `<span class="note-action-icon move-note-up" title="Move Up" data-action="move-up">↑</span>`;
                const downIconHTML = `<span class="note-action-icon move-note-down" title="Move Down" data-action="move-down">↓</span>`;
                const deleteIconHTML = `<span class="note-action-icon delete-note" title="Delete Note" data-action="delete">🗑️</span>`;

                actionsSpan.innerHTML = renameIconHTML + upIconHTML + downIconHTML + deleteIconHTML;
                listItem.appendChild(actionsSpan);
            } else {
                notesList.classList.remove('edit-mode-active');
            }
            notesList.appendChild(listItem);
        });
        updateNoteMoveIconVisibility();
        notesList.scrollTop = currentScrollTop; // Restore scroll position
    }

    function updateNoteMoveIconVisibility() {
        if (!notesList || !isNotesEditMode) return;
        const items = notesList.querySelectorAll('li.note-list-item');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-note-up');
            const downIcon = item.querySelector('.move-note-down');

            if (upIcon) upIcon.style.display = (index === 0 || items.length === 1) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1 || items.length === 1) ? 'none' : 'inline-block';
        });
    }

    function handleCreateNewNote() {
        const newNoteId = Date.now(); // Simple unique ID
        let noteCounter = 1;
        let newTitle = `Note ${noteCounter}`;
        while (notesData.some(note => note.title === newTitle)) {
            noteCounter++;
            newTitle = `Note ${noteCounter}`;
        }

        const newNote = {
            id: newNoteId,
            title: newTitle,
            content: `# ${newTitle}\n\nStart writing your notes here.`
        };
        notesData.push(newNote);

        loadNoteIntoEditor(newNoteId); // This will set selectedNoteId and init/update EasyMDE
        if (noteTitleInput) noteTitleInput.focus();
    }

    function loadNoteIntoEditor(noteId) {
        const note = notesData.find(n => n.id === noteId);
        if (!note) {
            console.error("Note not found for ID:", noteId);
            if (selectedNoteId === noteId) { // If the missing note was selected
                 selectedNoteId = null;
                 clearNoteEditor();
                 if (easyMDE && easyMDE.options.autosave) {
                    easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                 }
            }
            renderNotesList();
            return;
        }

        selectedNoteId = note.id;
        if (noteTitleInput) noteTitleInput.value = note.title;

        if (!easyMDE && markdownEditorTextarea) {
            initEasyMDE(); // Initialize with a generic or no specific ID first
        }

        if (easyMDE) {
            if (easyMDE.options.autosave) {
                // To prevent loading stale data from a previously selected note's autosave slot.
                if (easyMDE.options.autosave.uniqueId !== `note_${note.id}`) {
                     // console.log(`Switching autosave ID from ${easyMDE.options.autosave.uniqueId} to note_${note.id}`);
                     // EasyMDE doesn't have a direct way to clear *another* slot.
                     // It loads from current uniqueId on value set if content is empty.
                     // So, set uniqueId, then set value.
                }
                easyMDE.options.autosave.uniqueId = `note_${note.id}`;
            }
            easyMDE.value(note.content);
             if (easyMDE.codemirror && tabNotes.classList.contains('active')) {
                setTimeout(() => easyMDE.codemirror.refresh(), 0);
            }
        } else if (markdownEditorTextarea) {
            markdownEditorTextarea.value = note.content;
        }

        renderNotesList();
    }

    function handleSaveNote() {
        if (!selectedNoteId) {
            alert("No note selected to save.");
            return;
        }
        const note = notesData.find(n => n.id === selectedNoteId);
        if (!note) {
            alert("Error: Selected note not found in data.");
            return;
        }

        const newTitle = noteTitleInput ? noteTitleInput.value.trim() : note.title;
        if (!newTitle) {
            alert("Note title cannot be empty.");
            if (noteTitleInput) noteTitleInput.focus();
            return;
        }

        note.title = newTitle;
        if (easyMDE && typeof easyMDE.value === 'function') {
            note.content = easyMDE.value();
        } else if (markdownEditorTextarea) {
            note.content = markdownEditorTextarea.value;
        }

        renderNotesList();
        // console.log("Note saved:", note);
        // Autosave should handle persistence, explicit alert might be too much if autosaving frequently.
        // Consider a more subtle save indicator if needed.
    }

    function handleRenameNote(noteId) {
        const note = notesData.find(n => n.id === noteId);
        if (!note) return;

        const newTitle = prompt("Enter new name for the note:", note.title);
        if (newTitle && newTitle.trim() !== "" && newTitle.trim() !== note.title) {
            note.title = newTitle.trim();
            renderNotesList();
            if (note.id === selectedNoteId && noteTitleInput) {
                noteTitleInput.value = note.title;
            }
        }
    }

    function handleDeleteNote(noteId) {
        const noteIndex = notesData.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        const note = notesData[noteIndex];
        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {

            if (easyMDE && easyMDE.options.autosave.enabled && selectedNoteId === noteId) {
                // Temporarily change uniqueId to something else, clear, then set back or to generic.
                const oldUniqueId = easyMDE.options.autosave.uniqueId;
                easyMDE.options.autosave.uniqueId = `deleting_${noteId}_${Date.now()}`; // Temp unique
                easyMDE.clearAutosavedValue();
                // console.log("Cleared autosave for deleted note by changing ID and clearing:", oldUniqueId);
            }

            notesData.splice(noteIndex, 1);

            if (selectedNoteId === noteId) {
                selectedNoteId = null;
                clearNoteEditor();
                if (easyMDE && easyMDE.options.autosave) {
                    easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                    // console.log("Reset EasyMDE autosave ID to generic after delete:", easyMDE.options.autosave.uniqueId);
                }
            }
            renderNotesList();
        }
    }

    function handleMoveNote(noteId, direction) {
        const index = notesData.findIndex(n => n.id === noteId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [notesData[index - 1], notesData[index]] = [notesData[index], notesData[index - 1]];
        } else if (direction === 'down' && index < notesData.length - 1) {
            [notesData[index], notesData[index + 1]] = [notesData[index + 1], notesData[index]];
        }
        renderNotesList();
    }


    if (createNewNoteButton) {
        createNewNoteButton.addEventListener('click', handleCreateNewNote);
    }

    if (saveNoteButton) {
        saveNoteButton.addEventListener('click', handleSaveNote);
    }
    // Auto-save title when input blurs or Enter is pressed
    if (noteTitleInput) {
        noteTitleInput.addEventListener('blur', handleSaveNote);
        noteTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if any
                handleSaveNote();
                if(easyMDE) easyMDE.codemirror.focus(); // Move focus to editor
            }
        });
    }


    if (editNotesIcon) {
        editNotesIcon.addEventListener('click', () => {
            isNotesEditMode = !isNotesEditMode;
            editNotesIcon.textContent = isNotesEditMode ? '✅' : '✏️';
            renderNotesList();
        });
    }

    if (notesList) {
        notesList.addEventListener('click', (event) => {
            const listItem = event.target.closest('li.note-list-item');
            if (!listItem) return;

            const noteId = parseInt(listItem.dataset.noteId, 10);
            if (isNaN(noteId)) return;

            const actionIcon = event.target.closest('.note-action-icon');

            if (isNotesEditMode && actionIcon) {
                const action = actionIcon.dataset.action;
                if (action === 'rename') {
                    handleRenameNote(noteId);
                } else if (action === 'delete') {
                    handleDeleteNote(noteId);
                } else if (action === 'move-up') {
                    handleMoveNote(noteId, 'up');
                } else if (action === 'move-down') {
                    handleMoveNote(noteId, 'down');
                }
            } else if (!actionIcon) {
                if (selectedNoteForContextMenu) {
                    const { overlay, parentMapName, source } = selectedNoteForContextMenu;
                    overlay.linkedNoteId = noteId;
                    alert(`Note linked successfully.`);
                    selectedNoteForContextMenu = null;
                    switchTab('tab-dm-controls');
                    displayMapOnCanvas(parentMapName);
                } else {
                    if (selectedNoteId !== noteId) {
                        loadNoteIntoEditor(noteId);
                    }
                }
            }
        });
    }

    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        if (tabId === 'tab-notes') {
            if (mapContainer) mapContainer.classList.add('hidden');
            if (characterSheetContainer) characterSheetContainer.classList.remove('active');
            if (noteEditorContainer) noteEditorContainer.classList.add('active');

            if (!easyMDE && markdownEditorTextarea) {
                initEasyMDE();
            }
            if (easyMDE && easyMDE.codemirror) {
                setTimeout(() => {
                    easyMDE.codemirror.refresh();
                }, 10);
            }

            if (!selectedNoteId || !notesData.some(n => n.id === selectedNoteId)) {
                if (notesData.length > 0) {
                    loadNoteIntoEditor(notesData[0].id);
                } else {
                    clearNoteEditor();
                    if (easyMDE && easyMDE.options.autosave) {
                        easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                    }
                    renderNotesList();
                }
            } else {
                 if (easyMDE && easyMDE.codemirror) {
                    setTimeout(() => easyMDE.codemirror.refresh(), 10);
                }
            }
        } else if (tabId === 'tab-characters') {
            if (mapContainer) mapContainer.classList.add('hidden');
            if (noteEditorContainer) noteEditorContainer.classList.remove('active');
            if (characterSheetContainer) characterSheetContainer.classList.add('active');

            if (!selectedCharacterId || !charactersData.some(c => c.id === selectedCharacterId)) {
                if (charactersData.length > 0) {
                    loadCharacterIntoEditor(charactersData[0].id);
                } else {
                    clearCharacterEditor();
                    renderCharactersList();
                }
            }
        } else {
            if (mapContainer) mapContainer.classList.remove('hidden');
            if (noteEditorContainer) noteEditorContainer.classList.remove('active');
            if (characterSheetContainer) characterSheetContainer.classList.remove('active');
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    if (noteContextMenu) {
        noteContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;

            if (action && selectedNoteForContextMenu) {
                const { overlay, index, parentMapName, source } = selectedNoteForContextMenu;

                const parentMapData = detailedMapData.get(parentMapName);

                if (!parentMapData) {
                    console.error(`Parent map data not found for note context menu action. Name: ${parentMapName}, Source: ${source}`);
                    noteContextMenu.style.display = 'none';
                    selectedNoteForContextMenu = null;
                    return;
                }

                switch (action) {
                    case 'link-to-new-note':
                        if (source === 'edit') {
                            if (notesData.length === 0) {
                                alert("No notes available. Please create a new note first in the Notes tab.");
                                selectedNoteForContextMenu = null;
                            } else {
                                alert("Please select a note from the list in the Notes tab to link it.");
                                switchTab('tab-notes');
                            }
                        }
                        break;
                    case 'move-note':
                        if (source === 'edit') {
                            isMovingNote = true;
                            noteBeingMoved = {
                                overlayRef: overlay,
                                originalPosition: { ...overlay.position },
                                parentMapName: parentMapName,
                                originalIndex: index
                            };
                            moveStartPoint = null;
                            currentDragOffsets = { x: 0, y: 0 };
                            dmCanvas.style.cursor = 'move';
                            alert(`Move mode activated for note. Click and drag the note icon. Click again to place, or right-click to cancel.`);
                            console.log('Move Note initiated for:', noteBeingMoved);
                        }
                        break;
                    case 'delete-link':
                        if (source === 'edit' && confirm(`Are you sure you want to delete this note link?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Note link deleted from map "${parentMapName}".`);
                            alert(`Note link has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                        break;
                    case 'toggle-player-visibility':
                        if (source === 'view') {
                            if (typeof overlay.playerVisible !== 'boolean') {
                                overlay.playerVisible = true;
                            }
                            overlay.playerVisible = !overlay.playerVisible;
                            console.log(`Note visibility for note link on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                            alert(`Player visibility for this note is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                        break;
                }
            }
            noteContextMenu.style.display = 'none';
        });
    }

    const notePreviewClose = document.getElementById('note-preview-close');
    if (notePreviewClose) {
        notePreviewClose.addEventListener('click', () => {
            const notePreviewOverlay = document.getElementById('note-preview-overlay');
            if (notePreviewOverlay) {
                notePreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideNotePreview' }, '*');
                }
            }
        });
    }

    // --- Characters Tab Functionality ---

    function renderCharactersList() {
        if (!charactersList) return;
        const currentScrollTop = charactersList.scrollTop; // Preserve scroll position
        charactersList.innerHTML = '';

        charactersData.forEach(character => {
            const listItem = document.createElement('li');
            listItem.dataset.characterId = character.id;
            listItem.classList.add('character-list-item');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('character-list-item-name');
            nameSpan.textContent = character.name;
            listItem.appendChild(nameSpan);


            if (character.id === selectedCharacterId) {
                listItem.classList.add('selected-character-item');
            }

            if (isCharactersEditMode) {
                charactersList.classList.add('edit-mode-active');
                const actionsSpan = document.createElement('span');
                actionsSpan.classList.add('character-actions');

                const renameIconHTML = `<span class="character-action-icon rename-character" title="Rename Character" data-action="rename">✏️</span>`;
                const upIconHTML = `<span class="character-action-icon move-character-up" title="Move Up" data-action="move-up">↑</span>`;
                const downIconHTML = `<span class="character-action-icon move-character-down" title="Move Down" data-action="move-down">↓</span>`;
                const deleteIconHTML = `<span class="character-action-icon delete-character" title="Delete Character" data-action="delete">🗑️</span>`;

                actionsSpan.innerHTML = renameIconHTML + upIconHTML + downIconHTML + deleteIconHTML;
                listItem.appendChild(actionsSpan);
            } else {
                charactersList.classList.remove('edit-mode-active');
            }
            charactersList.appendChild(listItem);
        });
        updateCharacterMoveIconVisibility();
        charactersList.scrollTop = currentScrollTop; // Restore scroll position
    }

    function updateCharacterMoveIconVisibility() {
        if (!charactersList || !isCharactersEditMode) return;
        const items = charactersList.querySelectorAll('li.character-list-item');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-character-up');
            const downIcon = item.querySelector('.move-character-down');

            if (upIcon) upIcon.style.display = (index === 0 || items.length === 1) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1 || items.length === 1) ? 'none' : 'inline-block';
        });
    }

    function handleCreateCharacter() {
        const newCharacterId = Date.now(); // Simple unique ID
        let characterCounter = 1;
        let newName = `Character ${characterCounter}`;
        while (charactersData.some(character => character.name === newName)) {
            characterCounter++;
            newName = `Character ${characterCounter}`;
        }

        const newCharacter = {
            id: newCharacterId,
            name: newName,
            sheetData: {}, // Initially empty
            notes: "",
            isDetailsVisible: true
        };
        charactersData.push(newCharacter);

        loadCharacterIntoEditor(newCharacterId);
        if (characterNameInput) characterNameInput.focus();
    }

    function loadCharacterIntoEditor(characterId) {
        const character = charactersData.find(c => c.id === characterId);
        if (!character) {
            console.error("Character not found for ID:", characterId);
            if (selectedCharacterId === characterId) {
                selectedCharacterId = null;
                clearCharacterEditor();
            }
            renderCharactersList();
            return;
        }

        selectedCharacterId = character.id;
        if (characterNameInput) characterNameInput.value = character.name;

        if (characterSheetIframe && characterSheetIframe.contentWindow) {
            const dataToSend = {
                ...(character.sheetData || {}),
                isDetailsVisible: character.isDetailsVisible
            };
            characterSheetIframe.contentWindow.postMessage({ type: 'loadCharacterSheet', data: dataToSend }, '*');
        } else {
            // This case should not happen if the iframe is loaded, but as a fallback:
            console.warn("Character sheet iframe not ready to receive data.");
        }

        // Reset PDF viewer state
        if (pdfViewerIframe.src) {
            URL.revokeObjectURL(pdfViewerIframe.src);
            pdfViewerIframe.src = '';
        }
        characterSheetContent.style.display = 'block';
        pdfViewerContainer.style.display = 'none';
        characterNotesEditorContainer.style.display = 'none';
        viewPdfButton.textContent = 'View PDF';

        // Update button visibility based on whether the character has a PDF
        if (character.pdfData) {
            viewPdfButton.style.display = 'inline-block';
            deletePdfButton.style.display = 'inline-block';
        } else {
            viewPdfButton.style.display = 'none';
            deletePdfButton.style.display = 'none';
        }

        if (characterEasyMDE) {
            characterEasyMDE.value(character.notes || "");
        }

        renderCharactersList();
    }

    function handleSaveCharacter() {
        if (!selectedCharacterId) {
            alert("No character selected to save.");
            return;
        }
        const character = charactersData.find(c => c.id === selectedCharacterId);
        if (!character) {
            alert("Error: Selected character not found in data.");
            return;
        }

        const newName = characterNameInput ? characterNameInput.value.trim() : character.name;
        if (!newName) {
            alert("Character name cannot be empty.");
            if (characterNameInput) characterNameInput.focus();
            return;
        }

        character.name = newName;
        if (characterSheetIframe && characterSheetIframe.contentWindow) {
            characterSheetIframe.contentWindow.postMessage({ type: 'requestSheetData' }, '*');
        }
        if (characterEasyMDE) {
            character.notes = characterEasyMDE.value();
        }

        renderCharactersList();
    }

    function handleRenameCharacter(characterId) {
        const character = charactersData.find(c => c.id === characterId);
        if (!character) return;

        const newName = prompt("Enter new name for the character:", character.name);
        if (newName && newName.trim() !== "" && newName.trim() !== character.name) {
            character.name = newName.trim();
            renderCharactersList();
            if (character.id === selectedCharacterId && characterNameInput) {
                characterNameInput.value = character.name;
            }
        }
    }

    function handleDeleteCharacter(characterId) {
        const characterIndex = charactersData.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return;

        const character = charactersData[characterIndex];
        if (confirm(`Are you sure you want to delete "${character.name}"?`)) {
            charactersData.splice(characterIndex, 1);

            if (selectedCharacterId === characterId) {
                selectedCharacterId = null;
                clearCharacterEditor();
            }
            renderCharactersList();
        }
    }

    function handleMoveCharacter(characterId, direction) {
        const index = charactersData.findIndex(c => c.id === characterId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [charactersData[index - 1], charactersData[index]] = [charactersData[index], charactersData[index - 1]];
        } else if (direction === 'down' && index < charactersData.length - 1) {
            [charactersData[index], charactersData[index + 1]] = [charactersData[index + 1], charactersData[index]];
        }
        renderCharactersList();
    }

    function clearCharacterEditor() {
        if (characterNameInput) characterNameInput.value = "";
    }

    function initCharacterEasyMDE() {
        if (characterEasyMDE) {
            return;
        }
        if (!characterMarkdownEditor) {
            console.error("Character markdown textarea element not found for EasyMDE.");
            return;
        }
        try {
            characterEasyMDE = new EasyMDE({
                element: characterMarkdownEditor,
                spellChecker: false,
                placeholder: "Type your character notes here...",
                minHeight: "150px",
                autosave: {
                    enabled: true,
                    uniqueId: selectedCharacterId ? `character_note_${selectedCharacterId}` : "dndemicube_unsaved_character_note",
                    delay: 3000,
                },
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "table", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide", "|",
                    {
                        name: "dm-mode",
                        action: function(editor) {
                            const cm = editor.codemirror;
                            const selection = cm.getSelection();
                            cm.replaceSelection(`[dm]${selection}[/dm]`);
                        },
                        className: "fa fa-user-secret",
                        title: "DM Only Content",
                    }
                ],
            });
        } catch (e) {
            console.error("Error initializing Character EasyMDE:", e);
            characterEasyMDE = null;
        }
    }

    if (characterNotesButton) {
        characterNotesButton.addEventListener('click', () => {
            if (characterNotesEditorContainer.style.display === 'none') {
                characterNotesEditorContainer.style.display = 'block';
                characterSheetContent.style.display = 'none';
                pdfViewerContainer.style.display = 'none';
                initCharacterEasyMDE();
                if (characterEasyMDE) {
                    characterEasyMDE.codemirror.refresh();
                }
            } else {
                characterNotesEditorContainer.style.display = 'none';
                characterSheetContent.style.display = 'block';
            }
        });
    }

    if (addCharacterButton) {
        addCharacterButton.addEventListener('click', handleCreateCharacter);
    }

    if (saveCharacterButton) {
        saveCharacterButton.addEventListener('click', handleSaveCharacter);
    }

    if (clearFieldsButton) {
        clearFieldsButton.addEventListener('click', () => {
            if (characterSheetIframe && characterSheetIframe.contentWindow) {
                characterSheetIframe.contentWindow.postMessage({ type: 'clearCharacterSheet' }, '*');
            }
        });
    }

    if (fillFromButton) {
        fillFromButton.addEventListener('click', () => {
            fillFromDropdown.style.display = fillFromDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    if (fillFromPdfOption) {
        fillFromPdfOption.addEventListener('click', (e) => {
            e.preventDefault();
            pdfUploadInput.click();
            fillFromDropdown.style.display = 'none';
        });
    }

    const defaultCharacterJson = {
        "character_name": "", "class_and_level": "", "background": "", "player_name": "", "race_or_species": "", "alignment": "", "experience_points": "",
        "strength": { "score": "", "modifier": "+0" }, "dexterity": { "score": "", "modifier": "+0" }, "constitution": { "score": "", "modifier": "+0" },
        "intelligence": { "score": "", "modifier": "+0" }, "wisdom": { "score": "", "modifier": "+0" }, "charisma": { "score": "", "modifier": "+0" },
        "saving_throws": { "strength": "", "dexterity": "", "constitution": "", "intelligence": "", "wisdom": "", "charisma": "" },
        "skills": {
            "acrobatics_dex": "", "animal_handling_wis": "", "arcana_int": "", "athletics_str": "", "deception_cha": "", "history_int": "", "insight_wis": "", "intimidation_cha": "",
            "investigation_int": "", "medicine_wis": "", "nature_int": "", "perception_wis": "", "performance_cha": "", "persuasion_cha": "", "religion_int": "",
            "sleight_of_hand_dex": "", "stealth_dex": "", "survival_wis": ""
        },
        "armor_class": "", "initiative": "", "speed": "",
        "hit_points": { "maximum": "", "current": "", "temporary": "" },
        "hit_dice": "",
        "death_saves": { "successes": "", "failures": "" },
        "proficiency_bonus": "", "passive_perception": "", "passive_insight": "", "passive_investigation": "",
        "proficiencies": { "armor": "", "weapons": "", "tools": "" },
        "languages": "", "attacks_and_spellcasting": "", "features_and_traits": "", "equipment": "", "character_appearance": "", "character_backstory": "",
        "personality_traits": "", "ideals": "", "bonds": "", "flaws": ""
    };

    function flattenCharacterJson(data) {
        const flattened = {};
        for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                for (const subKey in data[key]) {
                    flattened[`${key}_${subKey}`] = data[key][subKey];
                }
            } else {
                flattened[key] = data[key];
            }
        }
        return flattened;
    }

    if (fillFromJsonOption) {
        fillFromJsonOption.addEventListener('click', (e) => {
            e.preventDefault();
            jsonInputTextarea.value = JSON.stringify(defaultCharacterJson, null, 2);
            jsonModal.style.display = 'block';
            fillFromDropdown.style.display = 'none';
        });
    }

    if (jsonModalCloseButton) {
        jsonModalCloseButton.addEventListener('click', () => {
            jsonModal.style.display = 'none';
        });
    }

    if (cancelJsonButton) {
        cancelJsonButton.addEventListener('click', () => {
            jsonModal.style.display = 'none';
        });
    }

    if (fillFromJsonButton) {
        fillFromJsonButton.addEventListener('click', () => {
            try {
                const jsonData = JSON.parse(jsonInputTextarea.value);
                const flattenedData = flattenCharacterJson(jsonData);

                // Rename keys to match form field names
                const finalData = {};
                for (const key in flattenedData) {
                    let newKey = key;
                    if (key === 'race_or_species') newKey = 'race';
                    else if (key === 'experience_points') newKey = 'xp';
                    else if (key === 'hit_points_maximum') newKey = 'hp_max';
                    else if (key === 'hit_points_current') newKey = 'hp_current';
                    else if (key === 'hit_points_temporary') newKey = 'hp_temp';
                    else if (key === 'hit_dice') newKey = 'hit_dice_total';
                    else if (key === 'proficiencies_armor') newKey = 'armor_proficiencies';
                    else if (key === 'proficiencies_weapons') newKey = 'weapon_proficiencies';
                    else if (key === 'proficiencies_tools') newKey = 'tool_proficiencies';
                    else if (key === 'character_name') newKey = 'char_name';
                    else if (key === 'class_and_level') newKey = 'class_level';

                    finalData[newKey] = flattenedData[key];
                }

                characterSheetIframe.contentWindow.postMessage({ type: 'loadCharacterSheet', data: finalData }, '*');
                jsonModal.style.display = 'none';
            } catch (error) {
                alert('Invalid JSON format. Please check your input.');
                console.error('Error parsing character JSON:', error);
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (!e.target.matches('.dropdown-toggle')) {
            if (fillFromDropdown.style.display === 'block') {
                fillFromDropdown.style.display = 'none';
            }
        }
    });

    if (pdfUploadInput) {
        pdfUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (!character) {
                    alert("Please select a character before uploading a PDF.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    const pdfData = new Uint8Array(e.target.result);
                    character.pdfData = pdfData; // Store PDF data on the character object
                    character.pdfFileName = file.name; // Store filename

                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    const numPages = pdf.numPages;
                    let textContent = '';

                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const strings = content.items.map(item => item.str);
                        textContent += strings.join(' ');
                    }

                    console.log(textContent); // For debugging
                    const sheetData = parsePdfText(textContent);
                    characterSheetIframe.contentWindow.postMessage({ type: 'loadCharacterSheet', data: sheetData }, '*');

                    // Update UI
                    viewPdfButton.style.display = 'inline-block';
                    deletePdfButton.style.display = 'inline-block'; // Show delete button as well
                };
                reader.readAsArrayBuffer(file);
            } else if (!selectedCharacterId) {
                alert("No character selected. Please select a character before uploading a PDF.");
            }
        });
    }

    if (viewPdfButton) {
        viewPdfButton.addEventListener('click', () => {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (!character || !character.pdfData) {
                alert("No PDF found for this character.");
                return;
            }

            if (pdfViewerContainer.style.display === 'none') {
                const pdfUrl = URL.createObjectURL(new Blob([character.pdfData], { type: 'application/pdf' }));
                pdfViewerIframe.src = pdfUrl;
                characterSheetContent.style.display = 'none';
                pdfViewerContainer.style.display = 'block';
                viewPdfButton.textContent = 'Local Character Editor';
            } else {
                // Revoke the object URL to free up memory when not in use
                if (pdfViewerIframe.src) {
                    URL.revokeObjectURL(pdfViewerIframe.src);
                }
                pdfViewerIframe.src = '';
                characterSheetContent.style.display = 'block';
                pdfViewerContainer.style.display = 'none';
                viewPdfButton.textContent = 'View PDF';
            }
        });
    }

    if (deletePdfButton) {
        deletePdfButton.addEventListener('click', () => {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (character) {
                character.pdfData = null;
                character.pdfFileName = null;
            }

            // Revoke URL if it's currently being viewed
            if (pdfViewerIframe.src) {
                URL.revokeObjectURL(pdfViewerIframe.src);
            }
            pdfViewerIframe.src = '';

            characterSheetContent.style.display = 'block';
            pdfViewerContainer.style.display = 'none';
            viewPdfButton.textContent = 'View PDF';
            viewPdfButton.style.display = 'none';
            deletePdfButton.style.display = 'none';
            // Optionally clear the sheet if desired
            // characterSheetIframe.contentWindow.postMessage({ type: 'clearCharacterSheet' }, '*');
            alert("PDF has been removed from this character.");
        });
    }

    function parsePdfText(text) {
        const sheetData = {};
        const upperText = text.toUpperCase();

        // Helper function to extract a value based on a regex pattern
        const extract = (regex) => {
            const match = upperText.match(regex);
            return match ? match[1].trim() : null;
        };

        // Character Info
        sheetData.char_name = extract(/CHARACTER NAME\s*([A-Z\s]+)\s*EXPERIENCE POINTS/);
        console.log("Extracted char_name:", sheetData.char_name);
        sheetData.class_level = extract(/CLASS & LEVEL\s*([^\n]+)/);
        sheetData.background = extract(/BACKGROUND\s*([^\n]+)/);
        sheetData.player_name = extract(/PLAYER NAME\s*([^\n]+)/);
        sheetData.race = extract(/RACE\s*([^\n]+)/);
        sheetData.alignment = extract(/ALIGNMENT\s*([^\n]+)/);
        sheetData.xp = extract(/EXPERIENCE POINTS\s*([^\n]+)/);

        // Ability Scores
        sheetData.strength_score = extract(/STRENGTH\s*(\d+)/);
        sheetData.dexterity_score = extract(/DEXTERITY\s*(\d+)/);
        sheetData.constitution_score = extract(/CONSTITUTION\s*(\d+)/);
        sheetData.intelligence_score = extract(/INTELLIGENCE\s*(\d+)/);
        sheetData.wisdom_score = extract(/WISDOM\s*(\d+)/);
        sheetData.charisma_score = extract(/CHARISMA\s*(\d+)/);

        // Combat Stats
        sheetData.ac = extract(/ARMOR CLASS\s*(\d+)/);
        sheetData.initiative = extract(/INITIATIVE\s*([+-]?\d+)/);
        sheetData.speed = extract(/SPEED\s*([^\n]+)/);
        sheetData.hp_max = extract(/HIT POINT MAXIMUM\s*(\d+)/);
        sheetData.hp_current = extract(/CURRENT HIT POINTS\s*(\d*)/);
        sheetData.hp_temp = extract(/TEMPORARY HIT POINTS\s*(\d*)/);
        sheetData.hit_dice_total = extract(/TOTAL\s*([^\n]+)\s*HIT DICE/);
        sheetData.hit_dice_current = extract(/HIT DICE\s*([^\n]+)/);
        sheetData.proficiency_bonus = extract(/PROFICIENCY BONUS\s*([+-]?\d+)/);
        sheetData.passive_perception = extract(/PASSIVE PERCEPTION\s*(\d+)/);
        sheetData.passive_insight = extract(/PASSIVE INSIGHT\s*(\d+)/);
        sheetData.passive_investigation = extract(/PASSIVE INVESTIGATION\s*(\d+)/);

        // Text Areas
        const extractTextArea = (start, end) => {
            const regex = new RegExp(`${start}\\s*([\\s\\S]*?)\\s*${end}`);
            const match = upperText.match(regex);
            return match ? match[1].trim() : null;
        };
        
        sheetData.attacks_spellcasting = extractTextArea('Attacks & Spellcasting', 'Equipment');
        sheetData.equipment = extractTextArea('Equipment', 'Features & Traits');
        sheetData.features_traits = extractTextArea('Features & Traits', 'Personality Traits');
        sheetData.personality_traits = extractTextArea('Personality Traits', 'Ideals');
        sheetData.ideals = extractTextArea('Ideals', 'Bonds');
        sheetData.bonds = extractTextArea('Bonds', 'Flaws');
        sheetData.flaws = extractTextArea('Flaws', 'Character Appearance');

        return sheetData;
    }

    if (characterNameInput) {
        characterNameInput.addEventListener('blur', handleSaveCharacter);
        characterNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveCharacter();
            }
        });
    }

    if (editCharactersIcon) {
        editCharactersIcon.addEventListener('click', () => {
            isCharactersEditMode = !isCharactersEditMode;
            editCharactersIcon.textContent = isCharactersEditMode ? '✅' : '✏️';
            renderCharactersList();
        });
    }

    if (charactersList) {
        charactersList.addEventListener('click', (event) => {
            const listItem = event.target.closest('li.character-list-item');
            if (!listItem) return;

            const characterId = parseInt(listItem.dataset.characterId, 10);
            if (isNaN(characterId)) return;

            const actionIcon = event.target.closest('.character-action-icon');

            if (isCharactersEditMode && actionIcon) {
                const action = actionIcon.dataset.action;
                if (action === 'rename') {
                    handleRenameCharacter(characterId);
                } else if (action === 'delete') {
                    handleDeleteCharacter(characterId);
                } else if (action === 'move-up') {
                    handleMoveCharacter(characterId, 'up');
                } else if (action === 'move-down') {
                    handleMoveCharacter(characterId, 'down');
                }
            } else if (!actionIcon) {
                if (selectedCharacterForContextMenu) {
                    const { overlay, parentMapName, source } = selectedCharacterForContextMenu;
                    overlay.linkedCharacterId = characterId;
                    alert(`Character linked successfully.`);
                    selectedCharacterForContextMenu = null;
                    switchTab('tab-dm-controls');
                    displayMapOnCanvas(parentMapName);
                } else {
                    if (selectedCharacterId !== characterId) {
                        loadCharacterIntoEditor(characterId);
                    }
                }
            }
        });
    }

    if (characterContextMenu) {
        characterContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;

            if (action && selectedCharacterForContextMenu) {
                const { overlay, index, parentMapName, source } = selectedCharacterForContextMenu;

                const parentMapData = detailedMapData.get(parentMapName);
                
                if (!parentMapData) {
                    console.error(`Parent map data not found for character context menu action. Name: ${parentMapName}, Source: ${source}`);
                    characterContextMenu.style.display = 'none';
                    selectedCharacterForContextMenu = null;
                    return;
                }

                switch (action) {
                    case 'link-to-character':
                        if (source === 'edit') {
                            if (charactersData.length === 0) {
                                alert("No characters available. Please create a new character first in the Characters tab.");
                                selectedCharacterForContextMenu = null;
                            } else {
                                alert("Please select a character from the list in the Characters tab to link it.");
                                switchTab('tab-characters');
                            }
                        }
                        break;
                    case 'move-character':
                         if (source === 'edit') {
                            isMovingCharacter = true;
                            characterBeingMoved = {
                                overlayRef: overlay,
                                originalPosition: { ...overlay.position },
                                parentMapName: parentMapName,
                                originalIndex: index
                            };
                            moveStartPoint = null;
                            currentDragOffsets = { x: 0, y: 0 };
                            dmCanvas.style.cursor = 'move';
                            alert(`Move mode activated for character. Click and drag the character icon. Click again to place, or right-click to cancel.`);
                            console.log('Move Character initiated for:', characterBeingMoved);
                        }
                        break;
                    case 'delete-link':
                        if (source === 'edit' && confirm(`Are you sure you want to delete this character link?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Character link deleted from map "${parentMapName}".`);
                            alert(`Character link has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                        break;
                    case 'toggle-player-visibility':
                        if (source === 'view') {
                            if (typeof overlay.playerVisible !== 'boolean') {
                                overlay.playerVisible = true;
                            }
                            overlay.playerVisible = !overlay.playerVisible;
                            console.log(`Character visibility for character link on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                            alert(`Player visibility for this character is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                        break;
                }
            }
            characterContextMenu.style.display = 'none';
        });
    }

    window.addEventListener('message', (event) => {
        if (event.source !== characterSheetIframe.contentWindow) {
            return;
        }

        if (event.data.type === 'saveCharacterSheet') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.sheetData = event.data.data;
                }
            }
        } else if (event.data.type === 'characterSheetReady') {
            if (selectedCharacterId) {
                loadCharacterIntoEditor(selectedCharacterId);
            }
        } else if (event.data.type === 'characterDetailsVisibilityChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.isDetailsVisible = event.data.isDetailsVisible;
                }
            }
        } else if (event.data.type === 'sheetDataForView') {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (character) {
                const markdown = generateCharacterMarkdown(event.data.data, character.notes, false, character.isDetailsVisible);
                const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                const characterPreviewBody = document.getElementById('character-preview-body');
                if (characterPreviewOverlay && characterPreviewBody) {
                    characterPreviewBody.innerHTML = markdown;
                    characterPreviewOverlay.style.display = 'flex';
                }
            }
        } else if (event.data.type === 'characterDetailsVisibilityChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.isDetailsVisible = event.data.isDetailsVisible;
                }
            }
        }
    });

function generateCharacterMarkdown(sheetData, notes, forPlayerView = false, isDetailsVisible = true) {
    const playerNotes = forPlayerView ? filterPlayerContent(notes) : notes;

    let md = `${playerNotes || ''}\n\n${sheetData.character_portrait ? `![Character Portrait](${sheetData.character_portrait})` : ''}`;

    if (!forPlayerView || (forPlayerView && isDetailsVisible)) {
        md += `

## **Character Information**
| Field | Value |
| :--- | :--- |
| **Character Name** | ${sheetData.char_name || ''} |
| **Class & Level** | ${sheetData.class_level || ''} |
| **Background** | ${sheetData.background || ''} |
| **Player Name** | ${sheetData.player_name || ''} |
| **Race or Species** | ${sheetData.race || ''} |
| **Alignment** | ${sheetData.alignment || ''} |
| **Experience Points** | ${sheetData.xp || ''} |

***

## **Attributes**
| Ability | Score | Modifier |
| :--- | :---: | :---: |
| **Strength** | ${sheetData['strength_score'] || ''} | ${sheetData['strength_modifier'] || '+0'} |
| **Dexterity** | ${sheetData['dexterity_score'] || ''} | ${sheetData['dexterity_modifier'] || '+0'} |
| **Constitution** | ${sheetData['constitution_score'] || ''} | ${sheetData['constitution_modifier'] || '+0'} |
| **Intelligence**| ${sheetData['intelligence_score'] || ''} | ${sheetData['intelligence_modifier'] || '+0'} |
| **Wisdom** | ${sheetData['wisdom_score'] || ''} | ${sheetData['wisdom_modifier'] || '+0'} |
| **Charisma** | ${sheetData['charisma_score'] || ''} | ${sheetData['charisma_modifier'] || '+0'} |

---

## **Combat**
| Field | Value |
| :--- | :---: |
| **Armor Class** | ${sheetData.ac || ''} |
| **Initiative** | ${sheetData.initiative || ''} |
| **Speed** | ${sheetData.speed || ''} |

### **Hit Points**
| Type | Value |
| :--- | :---: |
| **Maximum** | ${sheetData.hp_max || ''} |
| **Current** | ${sheetData.hp_current || ''} |
| **Temporary** | ${sheetData.hp_temp || ''} |

### **Hit Dice**
| Type | Value |
| :--- | :---: |
| **Hit Dice** | ${sheetData.hit_dice_total || ''} |
| **Death Saves (Successes)** | ${sheetData.death_saves_successes || ''} |
| **Death Saves (Failures)** | ${sheetData.death_saves_failures || ''} |

---

## **Saving Throws**
| Saving Throw | Value |
| :--- | :---: |
| **Strength** | ${sheetData.save_strength_mod || ''} |
| **Dexterity** | ${sheetData.save_dexterity_mod || ''} |
| **Constitution** | ${sheetData.save_constitution_mod || ''} |
| **Intelligence** | ${sheetData.save_intelligence_mod || ''} |
| **Wisdom** | ${sheetData.save_wisdom_mod || ''} |
| **Charisma** | ${sheetData.save_charisma_mod || ''} |

---

## **Skills**
| Skill | Value |
| :--- | :---: |
| Acrobatics (Dex) | ${sheetData.skill_acrobatics_mod || ''} |
| Animal Handling (Wis) | ${sheetData.skill_animal_handling_mod || ''} |
| Arcana (Int) | ${sheetData.skill_arcana_mod || ''} |
| Athletics (Str) | ${sheetData.skill_athletics_mod || ''} |
| Deception (Cha) | ${sheetData.skill_deception_mod || ''} |
| History (Int) | ${sheetData.skill_history_mod || ''} |
| Insight (Wis) | ${sheetData.skill_insight_mod || ''} |
| Intimidation (Cha) | ${sheetData.skill_intimidation_mod || ''} |
| Investigation (Int) | ${sheetData.skill_investigation_mod || ''} |
| Medicine (Wis) | ${sheetData.skill_medicine_mod || ''} |
| Nature (Int) | ${sheetData.skill_nature_mod || ''} |
| Perception (Wis) | ${sheetData.skill_perception_mod || ''} |
| Performance (Cha) | ${sheetData.skill_performance_mod || ''} |
| Persuasion (Cha) | ${sheetData.skill_persuasion_mod || ''} |
| Religion (Int) | ${sheetData.skill_religion_mod || ''} |
| Sleight of Hand (Dex) | ${sheetData.skill_sleight_of_hand_mod || ''} |
| Stealth (Dex) | ${sheetData.skill_stealth_mod || ''} |
| Survival (Wis) | ${sheetData.skill_survival_mod || ''} |

---

## **Character Proficiencies**
| Field | Value |
| :--- | :---: |
| **Proficiency Bonus** | ${sheetData.proficiency_bonus || ''} |
| **Passive Perception** | ${sheetData.passive_perception || ''} |
| **Passive Insight** | ${sheetData.passive_insight || ''} |
| **Passive Investigation** | ${sheetData.passive_investigation || ''} |
| **Armor Proficiencies** | ${sheetData.armor_proficiencies || ''} |
| **Weapon Proficiencies**| ${sheetData.weapon_proficiencies || ''} |
| **Tool Proficiencies** | ${sheetData.tool_proficiencies || ''} |
| **Languages** | ${sheetData.languages || ''} |

---

## **Equipment & Features**
| Field | Value |
| :--- | :--- |
| **Attacks & Spellcasting** | ${sheetData.attacks_spellcasting || ''} |
| **Features & Traits** | ${sheetData.features_traits || ''} |
| **Equipment** | ${sheetData.equipment || ''} |

---

## **Character Background**
| Field | Value |
| :--- | :--- |
| **Character Appearance** | ${sheetData.char_appearance || ''} |
| **Character Backstory** | ${sheetData.backstory || ''} |
| **Personality Traits** | ${sheetData.personality_traits || ''} |
| **Ideals** | ${sheetData.ideals || ''} |
| **Bonds** | ${sheetData.bonds || ''} |
| **Flaws** | ${sheetData.flaws || ''} |
`;
    }
    return easyMDE.options.previewRender(md);
}


});
