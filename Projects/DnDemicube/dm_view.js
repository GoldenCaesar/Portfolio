document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const activeMapsList = document.getElementById('active-maps-list'); // Added
    const openPlayerViewButton = document.getElementById('open-player-view-button'); // Added for player view
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container'); // Get the container
    const hoverLabel = document.getElementById('hover-label');
    const polygonContextMenu = document.getElementById('polygon-context-menu'); // Added
    const displayedFileNames = new Set();

    // Notes Tab Elements
    const createNewNoteButton = document.getElementById('create-new-note-button');
    const editNotesIcon = document.getElementById('edit-notes-icon');
    const notesList = document.getElementById('notes-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const saveNoteButton = document.getElementById('save-note-button');
    const markdownEditorTextarea = document.getElementById('markdown-editor');
    const tabNotes = document.getElementById('tab-notes');


    // Map Tools Elements
    const mapToolsSection = document.getElementById('map-tools-section');
    // const mapToolButtons = mapToolsSection ? mapToolsSection.querySelectorAll('.map-tools-buttons button') : []; // Will re-evaluate usage of this

    // Button References for Map Tools
    const btnAddToActive = document.getElementById('btn-add-to-active');
    const btnRemoveFromActive = document.getElementById('btn-remove-from-active');
    const btnLinkChildMap = document.getElementById('btn-link-child-map');
    // Add other tool buttons here as needed, e.g.:
    // const btnLinkNote = document.getElementById('btn-link-note');
    // const btnLinkCharacter = document.getElementById('btn-link-character');
    // const btnLinkTrigger = document.getElementById('btn-link-trigger');
    // const btnRemoveLinks = document.getElementById('btn-remove-links');


    // const mapObjectURLs = new Map(); // Old: To store filename -> objectURL mapping for Manage Maps
    // New structure: fileName -> { url: objectURL, name: fileName, overlays: [] }
    const detailedMapData = new Map();
    let isEditMode = false;

    // Core state variables
    let selectedMapInManager = null;
    let selectedMapInActiveView = null;
    let activeMapsData = []; // Stores { fileName: "map.png", overlays: [], ...other unique instance data }

    // Notes State Variables
    let notesData = []; // Array of note objects: { id: uniqueId, title: "Note 1", content: "# Markdown" }
    let selectedNoteId = null;
    let isNotesEditMode = false;
    let easyMDE = null;


    // State for 'Link to Child Map' tool
    let isLinkingChildMap = false;
    let currentPolygonPoints = [];
    let polygonDrawingComplete = false; // Will be used in Phase 2
    let selectedPolygonForContextMenu = null; // Added: To store right-clicked polygon info
    let isChangingChildMapForPolygon = false; // Added: State for "Change Child Map" action
    let isRedrawingPolygon = false; // Added: State for "Redraw Polygon" action
    let preservedLinkedMapNameForRedraw = null; // Added: To store linked map name during redraw

    // Player View window reference
    let playerWindow = null;

    let isMovingPolygon = false; // Added: State for "Move Polygon" action
    let polygonBeingMoved = null; // Added: { overlay: reference, originalPoints: copy, parentMapName: string }
    let moveStartPoint = null; // Added: {x, y} image-relative coords for drag start
    let currentPolygonDragOffsets = {x: 0, y: 0}; // Added: visual offset during drag

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
            let currentFileNameToRedraw = null;

            if (mapWasDisplayed) {
                if (selectedMapInManager) currentFileNameToRedraw = selectedMapInManager;
                else if (selectedMapInActiveView) currentFileNameToRedraw = selectedMapInActiveView;
                // Note: isLinkingChildMap implies selectedMapInManager is the map being drawn on.
                
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
                let fileToDisplay = null;
                if (selectedMapInManager) fileToDisplay = selectedMapInManager;
                else if (selectedMapInActiveView) fileToDisplay = selectedMapInActiveView;

                if (fileToDisplay) {
                    displayMapOnCanvas(fileToDisplay);
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

            updateButtonStates();

            // Draw existing overlays for this map (manager view) or active map instance
            if (selectedMapInManager === fileName && mapData.overlays) {
                drawOverlays(mapData.overlays);
            } else if (selectedMapInActiveView === fileName) {
                const activeMapInstance = activeMapsData.find(am => am.fileName === fileName);
                if (activeMapInstance && activeMapInstance.overlays) {
                    drawOverlays(activeMapInstance.overlays);
                }
            }

            // If actively drawing a new polygon, draw it on top
            if (isLinkingChildMap && currentPolygonPoints.length > 0 && selectedMapInManager === fileName) {
                drawCurrentPolygon(true); // Pass true to indicate it's a new, temporary polygon
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
                let strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Default: Blue for existing links

                if (selectedMapInActiveView) { // Special styling for Active View context on DM screen
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red and more transparent if hidden from player
                    } else {
                        strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Green if visible to player in Active View
                    }
                }
                // Moving polygon overrides visibility-based styling for immediate feedback
                if (isMovingPolygon && polygonBeingMoved && overlay === polygonBeingMoved.overlayRef) {
                    strokeStyle = 'rgba(255, 255, 0, 0.9)'; // Bright yellow while moving (changed from green for better contrast)
                    currentPointsToDraw = polygonBeingMoved.originalPoints.map(p => ({
                        x: p.x + currentPolygonDragOffsets.x,
                        y: p.y + currentPolygonDragOffsets.y
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

        // Priority 1: Polygon Drawing (New Link or Redraw)
        if ((isLinkingChildMap || isRedrawingPolygon) && !polygonDrawingComplete && selectedMapInManager) {
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
                        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Select Child Map from Manager';
                        alert('Polygon complete for new link. Now select a map from "Manage Maps" to link as its child.');
                        console.log("New link polygon complete:", currentPolygonPoints);
                        // isLinkingChildMap remains true until a child map is selected or action is cancelled.
                    } else if (isRedrawingPolygon) {
                        const parentMapData = detailedMapData.get(selectedMapInManager);
                        if (parentMapData && preservedLinkedMapNameForRedraw) {
                            const newOverlay = {
                                type: 'childMapLink',
                                polygon: [...currentPolygonPoints],
                                linkedMapName: preservedLinkedMapNameForRedraw
                            };
                            parentMapData.overlays.push(newOverlay);
                            alert(`Polygon redrawn successfully, still linked to "${preservedLinkedMapNameForRedraw}".`);
                            console.log("Polygon redraw complete. New overlay:", newOverlay);

                            // Refresh the display of the parent map to show the new polygon
                            if (selectedMapInManager === parentMapData.name) { // Ensure it's the correct map
                                displayMapOnCanvas(selectedMapInManager);
                            }
                        } else {
                            console.error("Failed to save redrawn polygon: Missing parent map data or preserved link name.");
                            alert("Error: Could not save the redrawn polygon.");
                        }
                        // Reset redraw state
                        isRedrawingPolygon = false;
                        preservedLinkedMapNameForRedraw = null;
                        currentPolygonPoints = []; // Explicitly clear points for next operation
                        polygonDrawingComplete = false; // Reset completion state
                        selectedPolygonForContextMenu = null; // Clear context menu selection
                    }
                    // polygonDrawingComplete is true here, will be reset if a new drawing starts
                    // currentPolygonPoints are now final for this polygon.
                } else {
                    currentPolygonPoints.push(imageCoords);
                }
            } else {
                currentPolygonPoints.push(imageCoords);
            }
            drawCurrentPolygon(false); // Redraw map, existing overlays, and current new polygon
            return; // Prevent other interactions if drawing
        }

        // Priority 2: Interaction with Overlays in "Active View"
        if (selectedMapInActiveView) {
            const activeMapInstance = activeMapsData.find(am => am.fileName === selectedMapInActiveView);
            if (activeMapInstance && activeMapInstance.overlays) {
                // Iterate overlays in reverse order so top ones are checked first if overlapping
                for (let i = activeMapInstance.overlays.length - 1; i >= 0; i--) {
                    const overlay = activeMapInstance.overlays[i];
                    if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                        console.log("Clicked on child map link:", overlay);
                        const childMapName = overlay.linkedMapName;
                        const childMapInActiveList = activeMapsData.some(am => am.fileName === childMapName);
                        if (childMapInActiveList) {
                            // Select and display the child map
                            selectedMapInActiveView = childMapName; // Update selection
                            selectedMapInManager = null;
                            clearAllSelections();
                            // Find and highlight the corresponding LI in active-maps-list
                            const activeMapItems = activeMapsList.querySelectorAll('li');
                            activeMapItems.forEach(li => {
                                if (li.dataset.fileName === childMapName) {
                                    li.classList.add('selected-map-item');
                                }
                            });
                            displayMapOnCanvas(childMapName);
                            updateButtonStates();
                            sendMapToPlayerView(childMapName); // Send to player view
                            console.log(`Switched to child map: ${childMapName}`);
                        } else {
                            alert(`Map "${childMapName}" needs to be added to the Active View list to navigate to it.`);
                        }
                        return; // Interaction handled
                    }
                    // Add other overlay type interactions here (e.g., notes, characters)
                }
            }
        }

        // Priority 3: Interaction with Overlays in "Manage Maps" view (e.g., for selection, deletion)
        // This part is for future development (e.g., selecting an overlay to delete it)
        if (selectedMapInManager) {
            const managerMapData = detailedMapData.get(selectedMapInManager);
            if (managerMapData && managerMapData.overlays) {
                for (let i = managerMapData.overlays.length - 1; i >= 0; i--) {
                    const overlay = managerMapData.overlays[i];
                    if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                        // TODO: Implement selection of overlay for editing/deletion
                        console.log("Clicked on an overlay in Manage Maps view (for future editing):", overlay);
                        // Example: highlight a "Remove Links" button if it's for selected overlays
                        // Or set a `selectedOverlayForEditing = overlay;`
                        return; // Interaction (even if just logging) handled
                    }
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

    function handleMouseMoveOnCanvas(event) {
        if (!currentMapDisplayData.img || !hoverLabel) return; // No map or label element

        const rect = dmCanvas.getBoundingClientRect();
        const canvasX = Math.round(event.clientX - rect.left);
        const canvasY = Math.round(event.clientY - rect.top);
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        let overlaysToCheck = null;
        let currentMapName = null;

        if (selectedMapInActiveView) {
            currentMapName = selectedMapInActiveView;
            const activeMapInstance = activeMapsData.find(am => am.fileName === currentMapName);
            if (activeMapInstance) {
                overlaysToCheck = activeMapInstance.overlays;
            }
        } else if (selectedMapInManager) {
            currentMapName = selectedMapInManager;
            const managerMapData = detailedMapData.get(currentMapName);
            if (managerMapData) {
                overlaysToCheck = managerMapData.overlays;
            }
        }

        if (imageCoords && overlaysToCheck && overlaysToCheck.length > 0) {
            for (let i = overlaysToCheck.length - 1; i >= 0; i--) { // Iterate in reverse for top-most
                const overlay = overlaysToCheck[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    hoverLabel.textContent = overlay.linkedMapName;
                    // Use pageX/pageY for positioning relative to the entire document
                    hoverLabel.style.left = `${event.pageX + 10}px`;
                    hoverLabel.style.top = `${event.pageY + 10}px`;
                    hoverLabel.style.display = 'block';
                    return; // Found an overlay, show label and exit
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

    function resetAllInteractiveStates() {
        isLinkingChildMap = false;
        isRedrawingPolygon = false;
        isMovingPolygon = false; // Added

        preservedLinkedMapNameForRedraw = null;
        currentPolygonPoints = [];
        polygonDrawingComplete = false;

        polygonBeingMoved = null; // Added
        moveStartPoint = null; // Added
        currentPolygonDragOffsets = {x: 0, y: 0}; // Added

        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Link to Child Map';
        dmCanvas.style.cursor = 'auto';
        selectedPolygonForContextMenu = null;

        // Redraw current map to clear any temporary states (like a polygon being dragged)
        let mapToRedraw = selectedMapInManager || selectedMapInActiveView;
        if (mapToRedraw) {
            displayMapOnCanvas(mapToRedraw);
        }
        updateButtonStates();
        console.log("All interactive states reset.");
    }


    if (btnLinkChildMap) {
        btnLinkChildMap.addEventListener('click', () => {
            if (!selectedMapInManager) {
                alert("Please select a map from 'Manage Maps' first to add a link to it.");
                return;
            }

            if (isLinkingChildMap || isRedrawingPolygon || isMovingPolygon) {
                // If any interactive mode is active, this button acts as a global cancel.
                resetAllInteractiveStates();
                console.log("Interactive operation cancelled via Link/Cancel button.");
            } else {
                // Start linking process
                resetAllInteractiveStates(); // Clear other states before starting a new one
                isLinkingChildMap = true;
                // currentPolygonPoints = []; // Handled by resetAllInteractiveStates
                // polygonDrawingComplete = false; // Handled by resetAllInteractiveStates
                btnLinkChildMap.textContent = 'Cancel Drawing Link';
                dmCanvas.style.cursor = 'crosshair';
                alert("Click on the map to start drawing a polygon for the link. Click the first point to close the shape.");
                updateButtonStates(); // Reflect that linking has started
            }
        });
    }

    // Modify existing dmCanvas click listener to NOT interfere if moving polygon (mouseup will handle finalization)
    // The dmCanvas click listener is complex; we need to ensure that if isMovingPolygon is true,
    // its default behavior (like trying to draw a new polygon or navigate) is suppressed
    // until the move is completed or cancelled.

    // New event listeners for polygon move:
    dmCanvas.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return; // Only main (left) click

        if (isMovingPolygon && polygonBeingMoved) {
            const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
            if (imageCoords && isPointInPolygon(imageCoords, polygonBeingMoved.overlayRef.polygon.map(p => ({ // Check against current visual position
                x: p.x + currentPolygonDragOffsets.x, // This logic is tricky for mousedown, originalPoints is better
                y: p.y + currentPolygonDragOffsets.y
            }))) || isPointInPolygon(imageCoords, polygonBeingMoved.originalPoints)) { // Check original points too
            // A simpler check: if mousedown is on the polygon to be moved (using its original points for start)
            // For simplicity, let's assume the user clicks on the polygon as it was when "Move" was selected.
            // A more robust check would be against its *current* visual position if it had already been dragged a bit and mouse released then pressed again (not supported here)

                if (isPointInPolygon(imageCoords, polygonBeingMoved.originalPoints.map(p => ({
                    x: p.x + currentPolygonDragOffsets.x, // If re-clicking after a drag before finalizing
                    y: p.y + currentPolygonDragOffsets.y
                })))) {
                    moveStartPoint = imageCoords; // Start drag
                    // The currentPolygonDragOffsets are relative to originalPoints.
                    // When starting a new drag, we want to preserve existing offsets if this is a re-drag.
                    // For this implementation, first mousedown sets moveStartPoint relative to original points + current offset.
                    // Subsequent mousemoves adjust from there.
                    // Let's adjust moveStartPoint to be relative to the true original polygon.
                    moveStartPoint.x -= currentPolygonDragOffsets.x;
                    moveStartPoint.y -= currentPolygonDragOffsets.y;

                    console.log("Dragging polygon started at (image coords):", imageCoords, "Effective start for offset calc:", moveStartPoint);
                    event.preventDefault(); // Prevent text selection or other default drag behaviors
                }
            }
        }
    });

    dmCanvas.addEventListener('mousemove', (event) => {
        // This is the general mousemove for hover labels.
        // We need to add drag logic here too, or ensure handleMouseMoveOnCanvas co-exists.
        // Let's keep hover logic and add drag logic.

        if (isMovingPolygon && polygonBeingMoved && moveStartPoint) {
            const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
            if (imageCoords) {
                currentPolygonDragOffsets.x = imageCoords.x - moveStartPoint.x;
                currentPolygonDragOffsets.y = imageCoords.y - moveStartPoint.y;

                currentPolygonDragOffsets.x = imageCoords.x - moveStartPoint.x;
                currentPolygonDragOffsets.y = imageCoords.y - moveStartPoint.y;

                // Optimized redraw for dragging
                if (selectedMapInManager === polygonBeingMoved.parentMapName && currentMapDisplayData.img && currentMapDisplayData.img.complete) {
                    const ctx = dmCanvas.getContext('2d');
                    ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                    // Redraw base image
                    ctx.drawImage(
                        currentMapDisplayData.img, 0, 0,
                        currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight,
                        currentMapDisplayData.offsetX, currentMapDisplayData.offsetY,
                        currentMapDisplayData.scaledWidth, currentMapDisplayData.scaledHeight
                    );
                    // Redraw overlays
                    const managerMapData = detailedMapData.get(selectedMapInManager);
                    if (managerMapData && managerMapData.overlays) {
                        drawOverlays(managerMapData.overlays);
                    }
                } else if (selectedMapInManager === polygonBeingMoved.parentMapName) {
                    // Fallback to full displayMapOnCanvas if image somehow not ready (shouldn't happen in normal flow)
                    displayMapOnCanvas(selectedMapInManager);
                }
            }
        } else {
            // Existing hover label logic (if not dragging)
            handleMouseMoveOnCanvas(event);
        }
    });

    dmCanvas.addEventListener('mouseup', (event) => {
        if (event.button !== 0) return; // Only main (left) click

        if (isMovingPolygon && polygonBeingMoved && moveStartPoint) { // If a drag was in progress
            // Finalize the move
            const finalDeltaX = currentPolygonDragOffsets.x;
            const finalDeltaY = currentPolygonDragOffsets.y;

            polygonBeingMoved.overlayRef.polygon = polygonBeingMoved.originalPoints.map(p => ({
                x: p.x + finalDeltaX,
                y: p.y + finalDeltaY
            }));

            console.log(`Polygon moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}. New points:`, polygonBeingMoved.overlayRef.polygon);
            alert(`Polygon moved to new position.`);

            resetAllInteractiveStates(); // This will also redraw the map
        } else if (isMovingPolygon && polygonBeingMoved && !moveStartPoint) {
            // If in move mode, but not actively dragging (i.e., mousedown didn't occur on polygon),
            // a click might finalize the position if it was a "click-move-click" paradigm.
            // For drag-and-drop, this click (if not on polygon) could cancel or do nothing.
            // Current alert for move says "Click again to place". This implies a click finalizes.
            // Let's assume any click while isMovingPolygon=true and not dragging (moveStartPoint=null) finalizes at current offset.

            // This case means the user clicked "Move", then clicked somewhere on the map (not dragging).
            // If they clicked on the polygon itself, mousedown would have set moveStartPoint.
            // If they clicked elsewhere, we could interpret this as "place here" with current offsets (which would be 0,0 if no drag occurred).
            // Or, it could be a "cancel". The alert "Click again to place" is a bit ambiguous.
            // Let's make it so: if you are in move mode, and you click (mouseup) and you weren't dragging the polygon,
            // it finalizes the move with the current (potentially zero) offset.
            // This means simply selecting "Move Polygon" and then clicking anywhere will "confirm" it at its current spot.

            // To prevent accidental finalization if user just clicks outside after selecting "Move":
            // We need a more robust check or change the instruction.
            // For now, let's stick to: drag must occur (moveStartPoint must have been set).
            // A simple click without drag having started does nothing to the polygon position.
            // User would need to right-click or select another tool to cancel "isMovingPolygon" mode.
            // This part of the logic might need further refinement based on desired UX.
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

    // Event listener for 'Add to Active List' / 'Update Changes to Active List' button
    if (btnAddToActive) {
        btnAddToActive.addEventListener('click', () => {
            if (selectedMapInManager) {
                const isAlreadyInActiveList = activeMapsData.some(map => map.fileName === selectedMapInManager);
                const sourceMapData = detailedMapData.get(selectedMapInManager);

                if (!sourceMapData) {
                    console.error('Error: Source map data not found in detailedMapData for:', selectedMapInManager);
                    return;
                }

                if (isAlreadyInActiveList) {
                    // Update Mode
                    const activeMapInstance = activeMapsData.find(map => map.fileName === selectedMapInManager);
                    if (activeMapInstance) {
                        const sourceOverlaysFromManager = JSON.parse(JSON.stringify(sourceMapData.overlays)); // Full list from Manage Maps (for uniqueness checks)
                        let modifiableExistingActiveOverlays = JSON.parse(JSON.stringify(activeMapInstance.overlays)); // Current active overlays, will be consumed
                        const newActiveOverlays = [];

                        sourceOverlaysFromManager.forEach(sourceOverlay => {
                            let matched = false;
                            let visibilityStateToCarryOver = false; // Default to false

                            // Attempt 1: Match by exact polygon geometry
                            const geomMatchIndex = modifiableExistingActiveOverlays.findIndex(
                                activeOv => JSON.stringify(activeOv.polygon) === JSON.stringify(sourceOverlay.polygon)
                            );

                            if (geomMatchIndex > -1) {
                                const existingMatchByGeom = modifiableExistingActiveOverlays[geomMatchIndex];
                                visibilityStateToCarryOver = typeof existingMatchByGeom.playerVisible === 'boolean' ? existingMatchByGeom.playerVisible : false;
                                newActiveOverlays.push({
                                    ...sourceOverlay, // Use new geometry/data from source
                                    playerVisible: visibilityStateToCarryOver
                                });
                                matched = true;
                                modifiableExistingActiveOverlays.splice(geomMatchIndex, 1); // Remove consumed overlay
                            } else if (sourceOverlay.linkedMapName) {
                                // Attempt 2: Match by unique linkedMapName if geometry differs
                                // Count occurrences of this link name in the original source (Manage Maps)
                                const countInSource = sourceOverlaysFromManager.filter(
                                    srcOv => srcOv.linkedMapName === sourceOverlay.linkedMapName
                                ).length;
                                // Count occurrences in the *remaining* active overlays
                                const existingActiveWithSameLinkName = modifiableExistingActiveOverlays.filter(
                                    activeOv => activeOv.linkedMapName === sourceOverlay.linkedMapName
                                );

                                if (countInSource === 1 && existingActiveWithSameLinkName.length === 1) {
                                    // This link name is unique in both current source and remaining active sets for this specific link
                                    const uniqueExistingMatchByLinkName = existingActiveWithSameLinkName[0];
                                    visibilityStateToCarryOver = typeof uniqueExistingMatchByLinkName.playerVisible === 'boolean' ? uniqueExistingMatchByLinkName.playerVisible : false;
                                    newActiveOverlays.push({
                                        ...sourceOverlay, // Use new geometry/data from source
                                        playerVisible: visibilityStateToCarryOver
                                    });
                                    matched = true;
                                    // Remove consumed overlay from modifiableExistingActiveOverlays
                                    const idxToRemove = modifiableExistingActiveOverlays.indexOf(uniqueExistingMatchByLinkName);
                                    if (idxToRemove > -1) modifiableExistingActiveOverlays.splice(idxToRemove, 1);
                                }
                            }

                            if (!matched) {
                                // No match found by geometry or unique link name, treat as new
                                newActiveOverlays.push({
                                    ...sourceOverlay,
                                    playerVisible: false // Default for truly new or unmatchable
                                });
                            }
                        });

                        activeMapInstance.overlays = newActiveOverlays;
                        console.log(`Overlays for "${selectedMapInManager}" updated in Active View. Visibility logic applied.`);

                        if (selectedMapInActiveView === selectedMapInManager) {
                            displayMapOnCanvas(selectedMapInActiveView);
                            sendMapToPlayerView(selectedMapInManager);
                        }
                        updateButtonStates();
                    } else {
                        console.error('Error updating map in active list: instance not found for', selectedMapInManager);
                    }
                } else {
                // Add Mode: Ensure playerVisible defaults to false for all new overlays
                const newOverlays = JSON.parse(JSON.stringify(sourceMapData.overlays)).map(overlay => ({
                    ...overlay,
                    playerVisible: false // Default to hidden for new additions
                }));
                    activeMapsData.push({
                        fileName: sourceMapData.name,
                    overlays: newOverlays
                    });
                console.log(`Map "${sourceMapData.name}" added to Active View. Player visibility defaulted to false for overlays.`);
                    renderActiveMapsList();
                    updateButtonStates();
                }
            } else {
                console.warn('Add/Update button clicked without a map selected in manager.');
            }
        });
    }

    // Event listener for 'Remove from Active List' button
    if (btnRemoveFromActive) {
        btnRemoveFromActive.addEventListener('click', () => {
            if (selectedMapInActiveView) {
                const mapToRemoveName = selectedMapInActiveView;
                activeMapsData = activeMapsData.filter(map => map.fileName !== selectedMapInActiveView);
                selectedMapInActiveView = null; // Clear selection

                // If the removed map was displayed on canvas, clear it
                // This check assumes displayMapOnCanvas updates some global state or canvas content directly related to the map name
                // A more robust way might be to track `currentMapOnCanvasName`
                const ctx = dmCanvas.getContext('2d');
                // Simple check: if canvas has content and the removed map *might* be it.
                // For now, let's assume if a map was selected in active view and then removed,
                // and it was the one on canvas, we should clear.
                // A potentially better way is to check if the current displayed map's name matches mapToRemoveName.
                // This needs `currentMapOnCanvasName` to be set by `displayMapOnCanvas`.
                // Let's assume for now, if we remove a selected active map, we clear the canvas.
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                // Consider if disableMapTools() or a similar function to reset canvas-related tools is needed here.
                // For now, updateButtonStates will handle general tool states. If specific tools depend on a map being on canvas,
                // they might need individual attention or a refined disableMapTools().
                // The original disableMapTools() disables all buttons; updateButtonStates() is more nuanced.

                renderActiveMapsList(); // Re-render the active maps list
                updateButtonStates(); // Update button states
                sendClearMessageToPlayerView(); // Clear the player view
            } else {
                console.warn("No map selected in Active View to remove.");
            }
        });
    }

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

                    let currentlyDisplayedMapKey = selectedMapInManager || selectedMapInActiveView;
                    let displayedMapLinksUpdated = false;

                    // Update linkedMapName in all map overlays in detailedMapData
                    detailedMapData.forEach(dmEntry => {
                        if (dmEntry.overlays && dmEntry.overlays.length > 0) {
                            dmEntry.overlays.forEach(overlay => {
                                if (overlay.type === 'childMapLink' && overlay.linkedMapName === originalName) {
                                    overlay.linkedMapName = newName;
                                    console.log(`DM Overlay: Map '${dmEntry.name}' link to '${originalName}' changed to '${newName}'.`);
                                    if (dmEntry.name === currentlyDisplayedMapKey && currentlyDisplayedMapKey !== newName) {
                                        displayedMapLinksUpdated = true;
                                    }
                                }
                            });
                        }
                    });

                    // Update fileName and linkedMapName in activeMapsData
                    let activeListNeedsRefresh = false;
                    activeMapsData.forEach(activeMap => {
                        let activeMapFileNameChanged = false;
                        if (activeMap.fileName === originalName) {
                            activeMap.fileName = newName;
                            activeListNeedsRefresh = true;
                            activeMapFileNameChanged = true;
                            console.log(`Active Map: File name '${originalName}' changed to '${newName}'.`);
                        }

                        if (activeMap.overlays && activeMap.overlays.length > 0) {
                            activeMap.overlays.forEach(overlay => {
                                if (overlay.type === 'childMapLink' && overlay.linkedMapName === originalName) {
                                    overlay.linkedMapName = newName;
                                    console.log(`Active Overlay: Map '${activeMap.fileName}' link to '${originalName}' changed to '${newName}'.`);
                                    if (activeMap.fileName === currentlyDisplayedMapKey && !activeMapFileNameChanged) {
                                        displayedMapLinksUpdated = true;
                                    }
                                    activeListNeedsRefresh = true;
                                }
                            });
                        }
                    });

                    if (activeListNeedsRefresh) {
                        renderActiveMapsList();
                    }

                    let selectionUpdated = false;
                    if (selectedMapInManager === originalName) {
                        selectedMapInManager = newName;
                        currentlyDisplayedMapKey = newName;
                        selectionUpdated = true;
                    }
                    if (selectedMapInActiveView === originalName) {
                        selectedMapInActiveView = newName;
                        currentlyDisplayedMapKey = newName;
                        selectionUpdated = true;
                    }

                    if (selectionUpdated || displayedMapLinksUpdated) {
                        if (currentlyDisplayedMapKey) {
                            console.log(`Redrawing canvas for: ${currentlyDisplayedMapKey} (Selection updated: ${selectionUpdated}, Links updated: ${displayedMapLinksUpdated})`);
                            displayMapOnCanvas(currentlyDisplayedMapKey);
                        }
                    }
                    updateButtonStates();
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
            uploadedMapsList.classList.toggle('edit-mode-active', isEditMode);
            const mapItems = uploadedMapsList.querySelectorAll('li');
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
                updateMoveIconVisibility(uploadedMapsList); // Update visibility on mode toggle
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

    if (uploadMapsInput && uploadedMapsList) {
        uploadMapsInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (!files) {
                return;
            }

            for (const file of files) {
                if (!displayedFileNames.has(file.name)) {
                    const listItem = document.createElement('li');

                    // Store filename in a data attribute for later use (e.g. rename, delete)
                    listItem.dataset.fileName = file.name;
                    listItem.classList.add('map-list-item'); // Add class for styling and event delegation

                    const textNode = document.createTextNode(file.name);
                    listItem.appendChild(textNode);

                    uploadedMapsList.appendChild(listItem);
                    displayedFileNames.add(file.name);

                    // Create and store detailed map data
                    const objectURL = URL.createObjectURL(file);
                    detailedMapData.set(file.name, {
                        url: objectURL,
                        name: file.name,
                        overlays: [] // Initialize with an empty array for overlays
                    });

                    // Add clickable class if not in edit mode
                    if (!isEditMode) {
                        listItem.classList.add('clickable-map');
                    }

                    // If edit mode is already active, add icons to the new item
                    if (isEditMode) {
                        const actionsSpan = document.createElement('span');
                        actionsSpan.classList.add('file-actions');
                        actionsSpan.style.marginLeft = '10px';
                        actionsSpan.style.display = 'inline'; // Should be visible if created during edit mode

                        const renameIcon = document.createElement('span');
                        renameIcon.textContent = '✏️';
                        renameIcon.classList.add('file-action-icon', 'rename-map');
                        renameIcon.title = 'Rename map';
                        renameIcon.style.cursor = 'pointer';
                        renameIcon.style.marginRight = '5px';
                        renameIcon.onclick = () => {
                            // listItem and textNode are in the closure of this function
                            enableRename(listItem, textNode);
                        };

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
                        downIcon.style.marginRight = '5px'; // Added margin for consistency
                        downIcon.onclick = () => moveItemDown(listItem);

                        const deleteIcon = document.createElement('span');
                        deleteIcon.textContent = '🗑️';
                        deleteIcon.classList.add('file-action-icon', 'delete-map');
                        deleteIcon.title = 'Delete map';
                        deleteIcon.style.cursor = 'pointer';
                        deleteIcon.onclick = () => handleDelete(listItem);

                        actionsSpan.appendChild(renameIcon);
                        actionsSpan.appendChild(upIcon);
                        actionsSpan.appendChild(downIcon);
                        actionsSpan.appendChild(deleteIcon);
                        listItem.appendChild(actionsSpan);
                        updateMoveIconVisibility(uploadedMapsList); // Update after adding new item
                    }
                }
            }
            event.target.value = null; // Clear the input value to allow re-uploading the same file if needed
            updateMoveIconVisibility(uploadedMapsList); // Update after bulk upload
        });
    } else {
        console.error('Could not find the upload input or the list element. Check IDs.');
    }

    // Event listener for clicking on map names to display them
    uploadedMapsList.addEventListener('click', (event) => {
        if (isEditMode) {
            // If in edit mode, clicks on items might be for renaming, so don't treat as selection for display
            // Action icons (delete, move, rename) have their own handlers.
            // We only prevent map display and selection state change here.
            return;
        }

        let targetItem = event.target;
        while (targetItem && targetItem.tagName !== 'LI' && targetItem !== uploadedMapsList) {
            targetItem = targetItem.parentNode;
        }

        if (targetItem && targetItem.tagName === 'LI' && targetItem.classList.contains('map-list-item')) {
            const clickedFileName = targetItem.dataset.fileName;
            if (clickedFileName) {
                if (isChangingChildMapForPolygon && selectedPolygonForContextMenu && selectedMapInManager) {
                    // Handling "Change Child Map" action
                    const { overlay, index, parentMapName } = selectedPolygonForContextMenu;
                    if (parentMapName === clickedFileName) {
                        alert("Cannot link a map to itself as a child. Please select a different map.");
                        // Don't reset isChangingChildMapForPolygon yet, let them pick another.
                        return;
                    }
                    const parentMapData = detailedMapData.get(parentMapName);
                    if (parentMapData && parentMapData.overlays[index] === overlay) {
                        const oldLinkedMapName = overlay.linkedMapName;
                        parentMapData.overlays[index].linkedMapName = clickedFileName;

                        alert(`Child map for the selected polygon on "${parentMapName}" changed from "${oldLinkedMapName}" to "${clickedFileName}".`);
                        console.log(`Child map for polygon on "${parentMapName}" (index ${index}) changed to "${clickedFileName}".`);

                        // If the currently displayed map is the one that was modified, refresh its display
                        if (selectedMapInManager === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                    } else {
                        console.error("Error changing child map: Parent map data or specific overlay not found or mismatched.");
                        alert("An error occurred while trying to change the child map. Please try again.");
                    }
                    isChangingChildMapForPolygon = false;
                    selectedPolygonForContextMenu = null; // Clear the selection
                    // No need to hide context menu, it's already hidden.
                } else if (isLinkingChildMap && polygonDrawingComplete && selectedMapInManager) {
                    // Phase 3: Linking a NEW child map (original polygon drawing flow)
                    if (selectedMapInManager === clickedFileName) {
                        alert("Cannot link a map to itself. Please select a different map from 'Manage Maps' to be the child.");
                        return;
                    }

                    const parentMapData = detailedMapData.get(selectedMapInManager);
                    if (parentMapData) {
                        const newOverlay = {
                            type: 'childMapLink',
                            polygon: [...currentPolygonPoints], // Store a copy of the points
                            linkedMapName: clickedFileName
                        };
                        parentMapData.overlays.push(newOverlay);
                        console.log(`Map "${clickedFileName}" linked as child to "${selectedMapInManager}". Overlay data:`, newOverlay);
                        alert(`Map "${clickedFileName}" successfully linked as a new child to "${parentMapData.name}".`);

                        resetAllInteractiveStates(); // This will also call updateButtonStates and redraw the parent map
                        displayMapOnCanvas(selectedMapInManager); // Ensure parent map shows new link
                    } else {
                        console.error("Parent map data not found for new link:", selectedMapInManager);
                        alert("Error: Could not find data for the parent map. Linking failed.");
                        resetAllInteractiveStates();
                    }
                } else {
                    // Normal selection behavior (displaying a map from Manage Maps)
                    if (selectedMapInManager !== null && selectedMapInManager !== clickedFileName) {
                        // If switching from one selected manager map to another, cancel ongoing interactions
                        resetAllInteractiveStates();
                    }
                    selectedMapInManager = clickedFileName;
                    selectedMapInActiveView = null;

                    clearAllSelections();
                    targetItem.classList.add('selected-map-item');

                    displayMapOnCanvas(clickedFileName);
                    updateButtonStates();
                }
            }
        }
    });

    function clearAllSelections() {
        const allMapItems = document.querySelectorAll('#uploaded-maps-list li, #active-maps-list li');
        allMapItems.forEach(item => item.classList.remove('selected-map-item'));
    }

    function renderActiveMapsList() {
        const previouslySelectedActiveMap = selectedMapInActiveView; // Preserve selection if possible
        activeMapsList.innerHTML = ''; // Clear current list

        activeMapsData.forEach(mapData => {
            const listItem = document.createElement('li');
            listItem.textContent = mapData.fileName;
            listItem.dataset.fileName = mapData.fileName;
            listItem.classList.add('map-list-item', 'clickable-map'); // Standard classes

            if (mapData.fileName === previouslySelectedActiveMap) {
                listItem.classList.add('selected-map-item'); // Restore selection
            }

            listItem.addEventListener('click', () => {
                selectedMapInActiveView = mapData.fileName;
                selectedMapInManager = null;

                clearAllSelections();
                listItem.classList.add('selected-map-item');

                displayMapOnCanvas(mapData.fileName);
                updateButtonStates();
                sendMapToPlayerView(mapData.fileName); // Send to player view
            });
            activeMapsList.appendChild(listItem);
        });
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

    function updateButtonStates() {
        const inLinkingProcess = isLinkingChildMap || polygonDrawingComplete;

        // Add to Active List / Update Changes to Active List button
        if (btnAddToActive) {
            if (selectedMapInManager) {
                const isAlreadyInActiveList = activeMapsData.some(map => map.fileName === selectedMapInManager);
                if (isAlreadyInActiveList) {
                    btnAddToActive.textContent = 'Update Changes to Active List';
                    btnAddToActive.disabled = inLinkingProcess; // Can update unless linking
                } else {
                    btnAddToActive.textContent = 'Add to Active List';
                    btnAddToActive.disabled = inLinkingProcess; // Can add unless linking
                }
            } else {
                btnAddToActive.textContent = 'Add to Active List';
                btnAddToActive.disabled = true; // No manager map selected
            }
        }

        // Remove from Active List button
        if (btnRemoveFromActive) btnRemoveFromActive.disabled = inLinkingProcess || !selectedMapInActiveView;

        // Link to Child Map button
        if (btnLinkChildMap) {
            if (isLinkingChildMap && !polygonDrawingComplete) { // Actively drawing polygon
                btnLinkChildMap.textContent = 'Cancel Drawing Link';
                btnLinkChildMap.disabled = false;
            } else if (isLinkingChildMap && polygonDrawingComplete) { // Polygon drawn, waiting for child map selection
                btnLinkChildMap.textContent = 'Cancel Link - Select Child'; // Or similar
                btnLinkChildMap.disabled = false; // Still acts as a cancel
            } else { // Initial state or after successful link/cancellation
                btnLinkChildMap.textContent = 'Link to Child Map';
                btnLinkChildMap.disabled = !selectedMapInManager;
            }
        }


        // Future buttons: Consider disabling them during the linking process as well.
        // e.g. if (btnLinkNote) btnLinkNote.disabled = inLinkingProcess || !selectedMapInManager;
        // if (btnLinkNote) btnLinkNote.disabled = !selectedMapInManager; // Example
        // if (btnLinkCharacter) btnLinkCharacter.disabled = !selectedMapInManager; // Example
        // if (btnLinkTrigger) btnLinkTrigger.disabled = !selectedMapInManager; // Example
        // if (btnRemoveLinks) btnRemoveLinks.disabled = !(selectedMapInManager || selectedMapInActiveView); // Example: if something is selected
    }

    // Initial setup calls
    resizeCanvas(); // Size canvas on load
    window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize
    renderActiveMapsList(); // Initial render for active maps list (will be empty)
    updateButtonStates(); // Set initial button states

    // Notes Tab Initialisation
    renderNotesList();
    // Add other notes event listeners here if needed immediately, or within DOMContentLoaded


    // --- Campaign Save/Load ---
    const saveCampaignButton = document.getElementById('save-campaign-button');
    const loadCampaignInput = document.getElementById('load-campaign-input');

    function saveCampaign() {
        // Prepare detailedMapData for saving: extract relevant info, discard non-serializable parts like live ObjectURLs.
        // We save the map names and their overlays. The actual map image files are expected to be managed
        // by the user (e.g., re-uploaded based on saved names if not embedding actual image data).
        const serializableDetailedMapData = {};
        for (const [name, data] of detailedMapData) {
            serializableDetailedMapData[name] = {
                name: data.name,
                overlays: data.overlays // Assuming overlays are already serializable (points, linked names)
            };
        }

        const campaignData = {
            mapDefinitions: serializableDetailedMapData, // Holds map names and their overlay configurations
            activeMaps: activeMapsData, // Holds the state of the active view (filenames and their instance-specific overlays)
            notes: notesData, // Save notes
            selectedNoteId: selectedNoteId, // Save selected note ID
            // Add other campaign elements to save here (characters, etc.)
            // currentSelectedMapInManager: selectedMapInManager, // Optional: save UI state
            // currentSelectedMapInActiveView: selectedMapInActiveView // Optional: save UI state
        };

        const campaignJSON = JSON.stringify(campaignData, null, 2);
        const blob = new Blob([campaignJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dndemicube-campaign.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Campaign saved.", campaignData);
    }

    function loadCampaign(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const campaignData = JSON.parse(e.target.result);
                console.log("Campaign data loaded:", campaignData);

                // Restore detailedMapData (overlays for managed maps)
                // This part assumes that the user will re-upload the actual map image files.
                // The loaded data only restores the *names* and *overlay configurations*.
                // When a map file is uploaded, if its name matches one in campaignData.mapDefinitions,
                // its overlays should be applied.

                // For simplicity in this step, we'll clear current detailedMapData and repopulate
                // based on names. A more robust system would merge or prompt.
                // Also, ObjectURLs need to be recreated when files are re-uploaded.

                detailedMapData.clear(); // Clear existing
                displayedFileNames.clear(); // Clear existing
                uploadedMapsList.innerHTML = ''; // Clear UI list

                if (campaignData.mapDefinitions) {
                    for (const mapName in campaignData.mapDefinitions) {
                        const definition = campaignData.mapDefinitions[mapName];
                        // We can't recreate the ObjectURL here without the actual file.
                        // We store the definition; when a file of this name is uploaded,
                        // its overlays can be applied from this stored definition.
                        // Or, if map files are part of the save (e.g. base64 data), recreate them.
                        // For now, just note that overlays are loaded for known map names.
                        detailedMapData.set(mapName, {
                            name: definition.name,
                            url: null, // To be repopulated upon file upload if not embedding image data
                            overlays: definition.overlays || []
                        });
                        // We don't add to displayedFileNames or uploadedMapsList here,
                        // as the actual files aren't loaded yet by this JSON.
                        // This would require a more integrated file management within the save/load.
                        // A simpler approach for now: user re-uploads maps, and if names match, overlays get applied.
                        // To make this work, the map upload logic would need to check detailedMapData.
                        console.log(`Overlay definition for map "${mapName}" loaded. User needs to re-upload the map file.`);
                    }
                }
                 // For a fully functional load without re-upload, map image data (e.g., base64) would need to be in the save file.
                // This example focuses on overlay and active view state persistence.

                // Restore activeMapsData
                activeMapsData = campaignData.activeMaps || [];
                renderActiveMapsList(); // Update UI for active maps

                // Restore Notes
                notesData = campaignData.notes || [];
                selectedNoteId = campaignData.selectedNoteId || null;
                renderNotesList();
                if (selectedNoteId) {
                    const noteToLoad = notesData.find(n => n.id === selectedNoteId);
                    if (noteToLoad) {
                        loadNoteIntoEditor(selectedNoteId);
                    } else {
                        selectedNoteId = null; // ID from save file doesn't exist in notesData
                        clearNoteEditor();
                    }
                } else {
                    clearNoteEditor();
                }


                // Optional: Restore UI selections
                // selectedMapInManager = campaignData.currentSelectedMapInManager || null;
                // selectedMapInActiveView = campaignData.currentSelectedMapInActiveView || null;
                // if (selectedMapInManager) { /* find and highlight in uploadedMapsList */ }
                // if (selectedMapInActiveView) { /* find and highlight in activeMapsList */ }

                // Clear canvas and update buttons
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                if (selectedMapInActiveView) displayMapOnCanvas(selectedMapInActiveView);
                else if (selectedMapInManager) displayMapOnCanvas(selectedMapInManager);

                updateButtonStates();
                alert("Campaign loaded. Please re-upload map files if they are not displaying.");

            } catch (error) {
                console.error("Error loading or parsing campaign file:", error);
                alert("Failed to load campaign data. The file might be corrupted or not a valid campaign file.");
            } finally {
                loadCampaignInput.value = null; // Reset input
            }
        };
        reader.readAsText(file);
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
            const dmMapData = detailedMapData.get(mapFileName); // Used for the base image URL
            const activeMapInstance = activeMapsData.find(am => am.fileName === mapFileName); // Used for overlays

            if (dmMapData && dmMapData.url && activeMapInstance) {
                fetch(dmMapData.url)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64dataUrl = reader.result;
                            // Filter overlays: only send those with playerVisible !== false (or true/undefined)
                            const visibleOverlays = activeMapInstance.overlays.filter(overlay => {
                                return typeof overlay.playerVisible === 'boolean' ? overlay.playerVisible : true;
                            });
                            playerWindow.postMessage({
                                type: 'loadMap',
                                mapDataUrl: base64dataUrl,
                                overlays: JSON.parse(JSON.stringify(visibleOverlays)) // Send a deep copy of filtered overlays
                            }, '*');
                            console.log(`Sent map "${mapFileName}" (as data URL) and ${visibleOverlays.length} visible overlays to player view.`);
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
                console.warn(`Could not send map to player view: DM Map data, URL for "${mapFileName}", or active instance not found.`);
            }
        } else {
            if (!mapFileName) {
                console.warn("sendMapToPlayerView called without a mapFileName.");
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
            playerWindow.postMessage({ type: 'clearMap' }, '*');
            console.log("Sent clearMap message to player view.");
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
                        if (selectedMapInActiveView) { // Check selectedMapInActiveView directly
                            sendMapToPlayerView(selectedMapInActiveView);
                        }
                    }, 500);
                }
            } else {
                playerWindow.focus();
                // If focused and a map is active, ensure it has the latest.
                if (selectedMapInActiveView) { // Check selectedMapInActiveView directly
                     sendMapToPlayerView(selectedMapInActiveView);
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
        selectedPolygonForContextMenu = null;

        // Context menu is available if a map is selected in EITHER Manage Maps OR Active View
        if (!selectedMapInManager && !selectedMapInActiveView) {
            return;
        }

        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) return; // Click was outside the image

        let mapToSearchForOverlays = null;
        let overlaySource = null; // To distinguish between 'manager' and 'active'

        if (selectedMapInActiveView) {
            mapToSearchForOverlays = activeMapsData.find(am => am.fileName === selectedMapInActiveView);
            overlaySource = 'active';
        } else if (selectedMapInManager) {
            mapToSearchForOverlays = detailedMapData.get(selectedMapInManager);
            overlaySource = 'manager';
        }

        if (mapToSearchForOverlays && mapToSearchForOverlays.overlays) {
            for (let i = mapToSearchForOverlays.overlays.length - 1; i >= 0; i--) {
                const overlay = mapToSearchForOverlays.overlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    selectedPolygonForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: mapToSearchForOverlays.name || mapToSearchForOverlays.fileName, // .name for detailedMapData, .fileName for activeMapsData
                        source: overlaySource // 'manager' or 'active'
                    };

                    // Show/hide context menu items based on source
                    const toggleVisibilityItem = polygonContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const changeChildMapItem = polygonContextMenu.querySelector('[data-action="change-child-map"]');
                    const redrawPolygonItem = polygonContextMenu.querySelector('[data-action="redraw-polygon"]');
                    const movePolygonItem = polygonContextMenu.querySelector('[data-action="move-polygon"]');
                    const deleteLinkItem = polygonContextMenu.querySelector('[data-action="delete-link"]');

                    if (overlaySource === 'active') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'none';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'none';
                        if (movePolygonItem) movePolygonItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // manager source
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'list-item';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'list-item';
                        if (movePolygonItem) movePolygonItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }

                    // Use pageX/pageY for positioning relative to the entire document
                    polygonContextMenu.style.left = `${event.pageX}px`;
                    polygonContextMenu.style.top = `${event.pageY}px`;
                    polygonContextMenu.style.display = 'block';
                    console.log('Right-clicked on polygon:', selectedPolygonForContextMenu);
                    return;
                }
            }
        }
    });

    // Global click listener to hide context menu
    document.addEventListener('click', (event) => {
        if (polygonContextMenu.style.display === 'block') {
            // Check if the click was outside the context menu
            if (!polygonContextMenu.contains(event.target)) {
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
            }
        }
    });

    // Prevent context menu click from propagating to the document listener and closing itself
    polygonContextMenu.addEventListener('click', (event) => {
        event.stopPropagation(); // Stop click from closing menu immediately
        const action = event.target.dataset.action;

        if (action && selectedPolygonForContextMenu) {
            const { overlay, index, parentMapName, source } = selectedPolygonForContextMenu;

            // Determine the correct data source (manager vs active)
            let parentMapData;
            if (source === 'manager') {
                parentMapData = detailedMapData.get(parentMapName);
            } else if (source === 'active') {
                parentMapData = activeMapsData.find(am => am.fileName === parentMapName);
            }

            if (!parentMapData) {
                console.error(`Parent map data not found for context menu action. Name: ${parentMapName}, Source: ${source}`);
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
                return;
            }

            switch (action) {
                case 'toggle-player-visibility':
                    if (source === 'active') {
                        // Ensure playerVisible property exists, default to true if not
                        if (typeof overlay.playerVisible !== 'boolean') {
                            overlay.playerVisible = true;
                        }
                        overlay.playerVisible = !overlay.playerVisible; // Toggle
                        console.log(`Polygon visibility for "${overlay.linkedMapName}" on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                        alert(`Player visibility for this area is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);

                        // If the currently displayed map is the one that was modified, refresh its display on DM canvas
                        if (selectedMapInActiveView === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                            // Also, resend the entire map and visible overlays to player view for consistency
                            sendMapToPlayerView(parentMapName);
                        } else {
                            // If the modified map is not currently displayed on DM canvas,
                            // still need to inform player view if it's the one they are seeing.
                            // This requires checking what map player view has.
                            // For simplicity, if playerWindow is open, always send.
                            // A more targeted approach would involve player view reporting its current map.
                            if (playerWindow && !playerWindow.closed) {
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                        // The specific sendPolygonVisibilityUpdateToPlayerView might become redundant
                        // if sendMapToPlayerView is called, as it sends the whole state.
                        // const polygonIdentifier = JSON.stringify(overlay.polygon);
                        // sendPolygonVisibilityUpdateToPlayerView(parentMapName, polygonIdentifier, overlay.playerVisible);
                    } else {
                        console.warn("Toggle Player Visibility action called on a non-active map overlay.");
                        alert("This action is only available for maps in the Active View.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                // --- Cases for 'manager' source ---
                case 'change-child-map':
                    if (source === 'manager') {
                        isChangingChildMapForPolygon = true;
                        alert(`"Change Child Map" selected for polygon linking to "${overlay.linkedMapName}". Please click a new map from the "Manage Maps" list to be its new child.`);
                        // selectedPolygonForContextMenu remains for the next step
                    }
                    polygonContextMenu.style.display = 'none';
                    break;
                case 'redraw-polygon':
                    if (source === 'manager' && parentMapData.overlays && parentMapData.overlays[index]) {
                        isRedrawingPolygon = true;
                        preservedLinkedMapNameForRedraw = overlay.linkedMapName;
                        currentPolygonPoints = [];
                        polygonDrawingComplete = false;
                        parentMapData.overlays.splice(index, 1);
                        dmCanvas.style.cursor = 'crosshair';
                        alert(`Redrawing polygon for link to "${preservedLinkedMapNameForRedraw}". Click on the map to start drawing. Click the first point to close it.`);
                        if (selectedMapInManager === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                        console.log('Redraw Polygon initiated. Old polygon removed. Preserved link:', preservedLinkedMapNameForRedraw);
                    } else if (source === 'manager') {
                        console.error("Error initiating redraw: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to redraw.");
                    }
                    polygonContextMenu.style.display = 'none';
                    if (!isRedrawingPolygon) selectedPolygonForContextMenu = null;
                    break;
                case 'move-polygon':
                    if (source === 'manager' && parentMapData.overlays && parentMapData.overlays[index]) {
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
                    } else if (source === 'manager') {
                        console.error("Error initiating move: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to move.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                case 'delete-link':
                    if (source === 'manager' && parentMapData.overlays && parentMapData.overlays[index]) {
                        if (confirm(`Are you sure you want to delete the link to "${overlay.linkedMapName}"?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Link to "${overlay.linkedMapName}" deleted from map "${parentMapName}".`);
                            alert(`Link to "${overlay.linkedMapName}" has been deleted.`);
                            if (selectedMapInManager === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                    } else if (source === 'manager') {
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
                    "guide"
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
                if (selectedNoteId !== noteId) {
                    // Before loading new note, ensure current one is "saved" by EasyMDE's autosave
                    // This happens implicitly if content changed and delay passed.
                    // Or, explicitly trigger save if needed, though our current handleSaveNote is more manual.
                    // For now, rely on autosave or manual save button.
                    loadNoteIntoEditor(noteId);
                }
            }
        });
    }

    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetTab = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');

                    // Specific logic for Notes Tab activation
                    if (targetTab === 'tab-notes') {
                        if (!easyMDE && markdownEditorTextarea) { // If not initialized, try to init
                           initEasyMDE();
                        }

                        if (easyMDE && easyMDE.codemirror) { // If initialized, refresh
                           setTimeout(() => {
                                easyMDE.codemirror.refresh();
                                // console.log("EasyMDE refreshed on tab activation.");
                            }, 10);
                        }

                        // If no note is selected, or selected note is no longer valid, try to select one
                        if (!selectedNoteId || !notesData.some(n => n.id === selectedNoteId)) {
                            if (notesData.length > 0) {
                                loadNoteIntoEditor(notesData[0].id);
                            } else {
                                // No notes exist, clear editor, ensure EasyMDE has generic autosave ID
                                clearNoteEditor();
                                if (easyMDE && easyMDE.options.autosave) {
                                    easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                                }
                            }
                        } else {
                            // A valid note is selected, ensure its content is loaded (might be redundant if already loaded)
                            // loadNoteIntoEditor(selectedNoteId); // This could cause loop if not careful
                            // Just ensure editor is refreshed
                             if (easyMDE && easyMDE.codemirror) {
                                setTimeout(() => easyMDE.codemirror.refresh(), 10);
                            }
                        }
                    }
                }
            });
        });
    });


});
