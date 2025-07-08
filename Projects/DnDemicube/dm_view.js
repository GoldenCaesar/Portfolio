document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const activeMapsList = document.getElementById('active-maps-list'); // Added
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container'); // Get the container
    const hoverLabel = document.getElementById('hover-label'); // Added for hover label
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


    // Function to resize the canvas to fit its container
    function resizeCanvas() {
        if (dmCanvas && mapContainer) {
            dmCanvas.width = mapContainer.clientWidth;
            dmCanvas.height = mapContainer.clientHeight;
            console.log(`Canvas resized to: ${dmCanvas.width}x${dmCanvas.height}`);
            // If a map is currently displayed, redraw it
            if (currentMapDisplayData.img && currentMapDisplayData.img.complete) { // Check if an image was loaded
                 // Find the filename of the map that was displayed.
                 // This logic assumes either selectedMapInManager or selectedMapInActiveView holds the current map.
                 let currentFileName = null;
                 if (selectedMapInManager) currentFileName = selectedMapInManager;
                 else if (selectedMapInActiveView) currentFileName = selectedMapInActiveView;

                 if (currentFileName) {
                    displayMapOnCanvas(currentFileName); // Redraw the map
                 }
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
        if (!currentMapDisplayData.img) return null; // No image loaded

        // Check if click is within the bounds of the displayed image
        if (canvasX < currentMapDisplayData.offsetX || canvasX > currentMapDisplayData.offsetX + currentMapDisplayData.scaledWidth ||
            canvasY < currentMapDisplayData.offsetY || canvasY > currentMapDisplayData.offsetY + currentMapDisplayData.scaledHeight) {
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
        const rect = dmCanvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
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

    dmCanvas.addEventListener('mousemove', (event) => {
        if (!hoverLabel) return;

        const rect = dmCanvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords || (isLinkingChildMap && !polygonDrawingComplete)) { // Don't show label if outside image or actively drawing new polygon points
            hoverLabel.style.display = 'none';
            return;
        }

        let currentOverlays = null;
        let currentMapName = null;

        if (selectedMapInManager) {
            currentMapName = selectedMapInManager;
            const mapData = detailedMapData.get(currentMapName);
            if (mapData) currentOverlays = mapData.overlays;
        } else if (selectedMapInActiveView) {
            currentMapName = selectedMapInActiveView;
            const activeMapInstance = activeMapsData.find(am => am.fileName === currentMapName);
            if (activeMapInstance) currentOverlays = activeMapInstance.overlays;
        }

        if (currentOverlays) {
            let foundLink = null;
            for (let i = currentOverlays.length - 1; i >= 0; i--) {
                const overlay = currentOverlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    foundLink = overlay;
                    break;
                }
            }

            if (foundLink && foundLink.linkedMapName) {
                hoverLabel.textContent = foundLink.linkedMapName;
                hoverLabel.style.left = `${event.clientX + 15}px`; // Position slightly offset from cursor
                hoverLabel.style.top = `${event.clientY + 15}px`;
                hoverLabel.style.display = 'block';
            } else {
                hoverLabel.style.display = 'none';
            }
        } else {
            hoverLabel.style.display = 'none';
        }
    });

    dmCanvas.addEventListener('mouseout', () => {
        if (hoverLabel) {
            hoverLabel.style.display = 'none';
        }
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
                textNode.textContent = originalName; // Revert to original
                listItem.replaceChild(textNode, input);
            } else {
                textNode.textContent = newName;
                listItem.dataset.fileName = newName; // Update data attribute
                displayedFileNames.delete(originalName);
                displayedFileNames.add(newName);

                    // Update detailedMapData map
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
                        let activeListNeedsRerender = false;
                        activeMapsData.forEach(activeMap => {
                            if (activeMap.fileName === originalName) {
                                activeMap.fileName = newName;
                                activeListNeedsRerender = true; // Name in the list itself changed
                                console.log(`Updated fileName in activeMapsData for: ${originalName} to ${newName}`);
                            }
                            if (activeMap.overlays && activeMap.overlays.length > 0) {
                                activeMap.overlays.forEach(overlay => {
                                    if (overlay.type === 'childMapLink' && overlay.linkedMapName === originalName) {
                                        overlay.linkedMapName = newName;
                                        console.log(`Updated linkedMapName in activeMapsData overlays for active map: ${activeMap.fileName}`);
                                        // If this active map is currently displayed and its overlay changed, it will need a redraw.
                                        if (selectedMapInActiveView === activeMap.fileName) {
                                            activeListNeedsRerender = true; // Mark for redraw
                                        }
                                    }
                                });
                            }
                        });

                        if (activeListNeedsRerender) {
                            renderActiveMapsList(); // Re-render if any active map fileName or its relevant overlays changed
                        }

                        // If the renamed map was selected (either in manager or active view), update the selection variable
                        // and redraw the canvas to reflect the name change or updated overlay link names.
                        let needsRedraw = false;
                        if (selectedMapInManager === originalName) {
                            selectedMapInManager = newName;
                            needsRedraw = true;
                        }
                        // If an active map that was selected had its *own* name changed.
                        // The selectedMapInActiveView would still be originalName before this block,
                        // so we check if the originalName matches any of the now-updated activeMap.fileName
                        if (selectedMapInActiveView === originalName) {
                           selectedMapInActiveView = newName; // Update selection to new name
                           needsRedraw = true;
                        }


                        // If the currently displayed map (manager or active) had its overlays updated
                        // because it links TO the renamed map, it also needs a redraw.
                        // This is trickier to check directly without iterating again, but finishRename
                        // is only called for maps in uploadedMapsList.
                        // A simpler approach: if the displayed map *is not* the one being renamed,
                        // but it *might* link to it, we might need to redraw it.
                        // The most straightforward is to redraw if any detailedMapData overlay was changed and that map is active.
                        // Or if the selectedMapInManager is displayed, and its overlays were modified.

                        const currentDisplayedMapData = selectedMapInManager ? detailedMapData.get(selectedMapInManager) : (selectedMapInActiveView ? activeMapsData.find(am => am.fileName === selectedMapInActiveView) : null);
                        if (currentDisplayedMapData && currentDisplayedMapData.overlays) {
                            currentDisplayedMapData.overlays.forEach(overlay => {
                                if (overlay.type === 'childMapLink' && overlay.linkedMapName === newName && needsRedraw === false) {
                                    // This means the *displayed* map links to the *renamed* map.
                                    // The link text itself might need to update if the hover logic relies on a fresh draw,
                                    // but the visual polygon won't change. The hover logic reads directly.
                                    // However, if we want to be absolutely sure, or if other things might change,
                                    // a redraw here is safe.
                                    // For now, the primary redraw condition is if the selected map *itself* was renamed.
                                }
                            });
                        }


                        if (needsRedraw) {
                            displayMapOnCanvas(newName); // Display with the new name if it was the one selected
                        } else {
                            // If the selected map *wasn't* the one renamed, but it *links* to the renamed map,
                            // and it's currently displayed, its overlays might have changed.
                            // We need to redraw it to ensure link integrity if any of its own overlays were updated.
                            // This is implicitly handled if activeListNeedsRerender was true and the map was active.
                            // Let's ensure a redraw if the current map's overlays were modified.
                            let currentlyDisplayedMapRequiresRedrawForOverlayUpdate = false;
                            if (selectedMapInManager && selectedMapInManager !== newName) { // if a different map is shown in manager
                                const managerMap = detailedMapData.get(selectedMapInManager);
                                if (managerMap && managerMap.overlays) {
                                   if (managerMap.overlays.some(o => o.type === 'childMapLink' && o.linkedMapName === newName && o.originalLinkedMapName === originalName)) {
                                       // This condition is a bit complex, means we'd have to track originalLinkedMapName temporarily
                                       // A simpler approach: if any overlay in the currently displayed map now points to newName,
                                       // and it previously pointed to originalName.
                                       // The previous loop already updated these. So just check if current map has links to newName.
                                   }
                                   // More simply: if the displayed map's overlays were touched by the global update of linkedMapName
                                   if (detailedMapData.get(selectedMapInManager).overlays.some(ov => ov.linkedMapName === newName && mapDataEntry.overlays.includes(ov))) {
                                       // This logic is getting complicated. A broader redraw condition might be safer.
                                       // The change to linkedMapName on *other* maps should trigger their redraw if they are visible.
                                   }
                                }
                            }
                            // If the current map (manager or active) is on display, and its overlays were updated, redraw it.
                            // This covers the case where the displayed map links TO the renamed map.
                            const currentMapKey = selectedMapInManager || selectedMapInActiveView;
                            if (currentMapKey) {
                                const mapToPotentiallyRedraw = selectedMapInManager ? detailedMapData.get(currentMapKey) : activeMapsData.find(am => am.fileName === currentMapKey);
                                if (mapToPotentiallyRedraw && mapToPotentiallyRedraw.overlays) {
                                    const wasModified = mapToPotentiallyRedraw.overlays.some(o => o.type === 'childMapLink' && o.linkedMapName === newName &&
                                                                                  mapDataEntry.overlays.some(originalOverlay => originalOverlay.linkedMapName === newName)); // check if any overlay points to the newName

                                    // A simpler check: Did *any* of the currently displayed map's overlays change?
                                    // The previous loops updated `linkedMapName` globally. If the current map was affected, redraw.
                                    let currentMapOverlaysAffected = false;
                                    if (selectedMapInManager) {
                                        const currentManagerMap = detailedMapData.get(selectedMapInManager);
                                        if (currentManagerMap.overlays.some(o => o.type === 'childMapLink' && o.linkedMapName === newName && originalName !== newName)) {
                                           // Check if any overlay *now* points to newName, that previously would have pointed to originalName
                                           // This is true if originalName was updated to newName.
                                           // The check `o.linkedMapName === newName` is sufficient if we assume updates happened.
                                           if (currentManagerMap.overlays.some(o => o.type === 'childMapLink' && o.linkedMapName === newName)) {
                                                // This map links to the (potentially) renamed map.
                                                // If originalName was indeed linked, and now it's newName, redraw.
                                                // This relies on the fact that linkedMapName was updated in previous loops.
                                                // A robust way: check if any of its overlays *used* to be originalName.
                                                // This is already done by the loops.
                                                // So, if displayMapOnCanvas(selectedMapInManager) is called, it will use updated overlays.
                                                // Let's redraw if the selected map in manager is not the one renamed but its overlays might have changed.
                                                if (selectedMapInManager !== newName) { // if it's not the map that was just renamed itself
                                                    // Check if this map had links to the originalName
                                                    const smData = detailedMapData.get(selectedMapInManager);
                                                    if (smData.overlays.some(ov => ov.type === 'childMapLink' && ov.linkedMapName === newName /* and it was originalName before */)) {
                                                         // This check is true if this map links to the one that was renamed.
                                                         // Its overlays were updated in the loop above. So, it needs a redraw.
                                                         displayMapOnCanvas(selectedMapInManager);
                                                    }
                                                }
                                           }
                                        }
                                    } else if (selectedMapInActiveView) {
                                        const currentActiveMap = activeMapsData.find(am => am.fileName === selectedMapInActiveView);
                                        if (currentActiveMap && currentActiveMap.overlays.some(o => o.type === 'childMapLink' && o.linkedMapName === newName)) {
                                            if (selectedMapInActiveView !== newName) { // if it's not the map that was just renamed itself
                                                displayMapOnCanvas(selectedMapInActiveView);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                listItem.replaceChild(textNode, input);
            }
        } else {
            // If name is empty or unchanged, revert to original
            textNode.textContent = originalName;
            listItem.replaceChild(textNode, input);
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
                    // deleteIcon.onclick = () => handleDelete(item); // Placeholder for delete

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
        resizeCanvas(); // Size canvas on load
        window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize
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
