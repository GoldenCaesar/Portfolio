document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const activeMapsList = document.getElementById('active-maps-list'); // Added
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container'); // Get the container
    const hoverLabel = document.getElementById('hover-label');
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
        if (!dmCanvas) {
            console.error("DM Canvas not found!");
            return;
        }
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
                ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Blue for existing links
                ctx.lineWidth = 2;
                overlay.polygon.forEach((point, index) => {
                    const canvasX = (point.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                    const canvasY = (point.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                    if (index === 0) {
                        ctx.moveTo(canvasX, canvasY);
                    } else {
                        ctx.lineTo(canvasX, canvasY);
                    }
                });
                // No need to close path explicitly if polygon array already has first point at end
                if (overlay.polygon.length > 2 &&
                    (overlay.polygon[0].x !== overlay.polygon[overlay.polygon.length-1].x ||
                     overlay.polygon[0].y !== overlay.polygon[overlay.polygon.length-1].y)) {
                   // If not explicitly closed in data, draw line to first point (though it should be)
                    const firstPointCanvasX = (overlay.polygon[0].x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                    const firstPointCanvasY = (overlay.polygon[0].y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                    ctx.lineTo(firstPointCanvasX, firstPointCanvasY);
                }
                ctx.stroke();
                // Optionally, fill or add text label here
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
        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) {
            // console.log("Clicked outside map image area.");
            return;
        }

        // Priority 1: Polygon Drawing for "Link to Child Map"
        if (isLinkingChildMap && !polygonDrawingComplete && selectedMapInManager) {
            const clickThreshold = 10 / currentMapDisplayData.ratio; // 10px radius on canvas, converted to image scale
            if (currentPolygonPoints.length > 0) {
                const firstPoint = currentPolygonPoints[0];
                const dx = Math.abs(imageCoords.x - firstPoint.x);
                const dy = Math.abs(imageCoords.y - firstPoint.y);

                if (currentPolygonPoints.length >= 2 && dx < clickThreshold && dy < clickThreshold) {
                    currentPolygonPoints.push({ x: firstPoint.x, y: firstPoint.y });
                    polygonDrawingComplete = true;
                    dmCanvas.style.cursor = 'auto';
                    if (btnLinkChildMap) btnLinkChildMap.textContent = 'Select Child Map from Manager';
                    alert('Polygon complete. Now select a map from "Manage Maps" to link as its child.');
                    console.log("Polygon complete:", currentPolygonPoints);
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

    function resetLinkingState() {
        isLinkingChildMap = false;
        currentPolygonPoints = [];
        polygonDrawingComplete = false; // Reset this state as well
        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Link to Child Map';
        dmCanvas.style.cursor = 'auto'; // Reset cursor
        // Redraw current map to clear any temporary polygon lines if needed
        if (selectedMapInManager) {
            displayMapOnCanvas(selectedMapInManager);
        } else if (selectedMapInActiveView) {
            // This case should ideally not happen if linking is only from manager view
            displayMapOnCanvas(selectedMapInActiveView);
        }
        updateButtonStates(); // Re-evaluates all button states
    }

    if (btnLinkChildMap) {
        btnLinkChildMap.addEventListener('click', () => {
            if (!selectedMapInManager) {
                alert("Please select a map from 'Manage Maps' first to add a link to it.");
                return;
            }

            if (isLinkingChildMap) {
                // If already linking, this button click means "Cancel"
                resetLinkingState();
                console.log("Child map linking cancelled.");
            } else {
                // Start linking process
                isLinkingChildMap = true;
                currentPolygonPoints = [];
                polygonDrawingComplete = false; // Ensure this is reset when starting a new link
                btnLinkChildMap.textContent = 'Cancel Drawing Link';
                dmCanvas.style.cursor = 'crosshair'; // Indicate drawing mode
                alert("Click on the map to start drawing a polygon for the link. Click the first point to close the shape.");
                // Disable other tool buttons temporarily, except for "Cancel Drawing Link"
                // updateButtonStates() will be called by resetLinkingState or when linking is complete.
                // For now, let's rely on updateButtonStates to correctly set states based on isLinkingChildMap.
                // We might need a more specific disabling here if updateButtonStates isn't enough.
                if (btnAddToActive) btnAddToActive.disabled = true;
                if (btnRemoveFromActive) btnRemoveFromActive.disabled = true;
                // Other map tool buttons should also be disabled here.
            }
        });
    }

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
                if (isLinkingChildMap && polygonDrawingComplete && selectedMapInManager) {
                    // Phase 3: Linking the child map
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
                        alert(`Map "${clickedFileName}" successfully linked as a child to "${parentMapData.name}".`);

                        resetLinkingState(); // This will also call updateButtonStates and redraw the parent map
                        // Ensure the parent map (selectedMapInManager) is displayed to show the new link
                        displayMapOnCanvas(selectedMapInManager);
                    } else {
                        console.error("Parent map data not found for:", selectedMapInManager);
                        alert("Error: Could not find data for the parent map. Linking failed.");
                        resetLinkingState();
                    }
                } else {
                    // Normal selection behavior
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

});
