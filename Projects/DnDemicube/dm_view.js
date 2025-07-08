document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const activeMapsList = document.getElementById('active-maps-list'); // Added
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container'); // Get the container
    const hoverLabel = document.getElementById('hover-label');
    const polygonContextMenu = document.getElementById('polygon-context-menu'); // Added
    const displayedFileNames = new Set();

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

    // State for 'Link to Child Map' tool
    let isLinkingChildMap = false;
    let currentPolygonPoints = [];
    let polygonDrawingComplete = false; // Will be used in Phase 2
    let selectedPolygonForContextMenu = null; // Added: To store right-clicked polygon info
    let isChangingChildMapForPolygon = false; // Added: State for "Change Child Map" action
    let isRedrawingPolygon = false; // Added: State for "Redraw Polygon" action
    let preservedLinkedMapNameForRedraw = null; // Added: To store linked map name during redraw

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

    function drawOverlays(overlays) {
        if (!overlays || overlays.length === 0 || !currentMapDisplayData.img) return;
        const ctx = dmCanvas.getContext('2d');

        overlays.forEach(overlay => {
            if (overlay.type === 'childMapLink' && overlay.polygon) {
                ctx.beginPath();
                let currentPointsToDraw = overlay.polygon;
                let strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Default: Blue for existing links

                if (isMovingPolygon && polygonBeingMoved && overlay === polygonBeingMoved.overlayRef) {
                    strokeStyle = 'rgba(0, 255, 0, 0.9)'; // Bright green while moving
                    // Draw based on original points plus current drag offset
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
                    hoverLabel.style.left = `${event.clientX + 10}px`; // Position relative to viewport
                    hoverLabel.style.top = `${event.clientY + 10}px`;
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

                // Request redraw of the map to show polygon at new position
                // displayMapOnCanvas will use currentPolygonDragOffsets via drawOverlays
                if (selectedMapInManager === polygonBeingMoved.parentMapName) {
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
                        activeMapInstance.overlays = JSON.parse(JSON.stringify(sourceMapData.overlays));
                        console.log(`Overlays for "${selectedMapInManager}" updated in Active View.`);

                        // If this specific active map instance is currently displayed, refresh its view
                        if (selectedMapInActiveView === selectedMapInManager) {
                            displayMapOnCanvas(selectedMapInActiveView);
                        }
                        // No need to call renderActiveMapsList() as the list item text doesn't change.
                        updateButtonStates(); // To ensure button text/state is correct if something else changed
                    } else {
                        // Should not happen if isAlreadyInActiveList is true, but good to guard.
                        console.error('Error updating map in active list: instance not found in activeMapsData despite check.');
                    }
                } else {
                    // Add Mode
                    activeMapsData.push({
                        fileName: sourceMapData.name,
                        overlays: JSON.parse(JSON.stringify(sourceMapData.overlays))
                    });
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
            // Add other campaign elements to save here (notes, characters, etc.)
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

        if (!selectedMapInManager) { // Only active if a map is selected in Manage Maps
            return;
        }

        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) return; // Click was outside the image

        const managerMapData = detailedMapData.get(selectedMapInManager);
        if (managerMapData && managerMapData.overlays) {
            // Iterate in reverse to catch topmost polygon if overlapping
            for (let i = managerMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = managerMapData.overlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    selectedPolygonForContextMenu = { overlay: overlay, index: i, parentMapName: selectedMapInManager };
                    polygonContextMenu.style.left = `${event.clientX}px`; // Use clientX/Y for viewport positioning
                    polygonContextMenu.style.top = `${event.clientY}px`;
                    polygonContextMenu.style.display = 'block';
                    console.log('Right-clicked on polygon:', selectedPolygonForContextMenu);
                    return; // Found a polygon, show menu and stop
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
            const { overlay, index, parentMapName } = selectedPolygonForContextMenu;
            const parentMapData = detailedMapData.get(parentMapName);

            if (!parentMapData) {
                console.error("Parent map data not found for context menu action:", parentMapName);
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
                return;
            }

            switch (action) {
                case 'change-child-map':
                    isChangingChildMapForPolygon = true;
                    // selectedPolygonForContextMenu is already set and will be used by uploadedMapsList click handler
                    alert(`"Change Child Map" selected for polygon linking to "${overlay.linkedMapName}". Please click a new map from the "Manage Maps" list to be its new child.`);
                    polygonContextMenu.style.display = 'none'; // Hide menu, selection process starts
                    // No need to clear selectedPolygonForContextMenu here, it's needed for the next step
                    break;
                case 'redraw-polygon':
                    if (parentMapData && parentMapData.overlays && parentMapData.overlays[index]) {
                        isRedrawingPolygon = true;
                        preservedLinkedMapNameForRedraw = overlay.linkedMapName; // Preserve the link
                        currentPolygonPoints = []; // Reset for new drawing
                        polygonDrawingComplete = false;

                        // Remove the old polygon overlay
                        parentMapData.overlays.splice(index, 1);

                        dmCanvas.style.cursor = 'crosshair';
                        alert(`Redrawing polygon for link to "${preservedLinkedMapNameForRedraw}". Click on the map to start drawing the new polygon. Click the first point to close it.`);

                        // Redraw the map to remove the old polygon before starting to draw the new one
                        if (selectedMapInManager === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                        console.log('Redraw Polygon initiated. Old polygon removed. Preserved link:', preservedLinkedMapNameForRedraw);
                    } else {
                        console.error("Error initiating redraw: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to redraw.");
                    }
                    polygonContextMenu.style.display = 'none';
                    // selectedPolygonForContextMenu is implicitly cleared by starting redraw or should be nulled if error
                    if (!isRedrawingPolygon) selectedPolygonForContextMenu = null;
                    break;
                case 'move-polygon':
                    if (parentMapData && parentMapData.overlays && parentMapData.overlays[index]) {
                        isMovingPolygon = true;
                        polygonBeingMoved = {
                            overlayRef: overlay, // Direct reference to the overlay in detailedMapData
                            originalPoints: JSON.parse(JSON.stringify(overlay.polygon)), // Deep copy for reference
                            parentMapName: parentMapName,
                            originalIndex: index // Keep original index if needed, though ref is better
                        };
                        moveStartPoint = null; // Reset, wait for mousedown on polygon
                        currentPolygonDragOffsets = {x: 0, y: 0};
                        dmCanvas.style.cursor = 'move';
                        alert(`Move mode activated for polygon linking to "${overlay.linkedMapName}". Click and drag the polygon to move it. Click again to place, or right-click to cancel.`);
                        console.log('Move Polygon initiated for:', polygonBeingMoved);
                    } else {
                        console.error("Error initiating move: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to move.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null; // Context selection is handled
                    break;
                case 'delete-link':
                    if (parentMapData && parentMapData.overlays && parentMapData.overlays[index]) {
                        if (confirm(`Are you sure you want to delete the link to "${overlay.linkedMapName}"?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Link to "${overlay.linkedMapName}" deleted from map "${parentMapName}".`);
                            alert(`Link to "${overlay.linkedMapName}" has been deleted.`);

                            // If the currently displayed map is the one that was modified, refresh its display
                            if (selectedMapInManager === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                    } else {
                        console.error("Error deleting link: Parent map data or overlay not found.");
                        alert("Error: Could not find the link to delete.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null; // Clear selection
                    break;
            }
        } else if (action) {
            // Action clicked but no polygon was selected (should not happen if menu is shown correctly)
            console.warn("Context menu action clicked, but no polygon was selected.");
            polygonContextMenu.style.display = 'none';
            selectedPolygonForContextMenu = null;
        }
        // If click was on UL or non-action LI, it just closes due to the global listener (if not stopped)
        // or does nothing if propagation is stopped and it's not an action.
    });


});
