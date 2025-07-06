document.addEventListener('DOMContentLoaded', () => {
    const uploadMapInput = document.getElementById('uploadMapInput');
    const uploadMapBtn = document.getElementById('uploadMapBtn');
    const dmCanvas = document.getElementById('dmCanvas');
    const ctx = dmCanvas.getContext('2d');

    const openPlayerViewBtn = document.getElementById('openPlayerViewBtn');
    const linkSubMapBtn = document.getElementById('linkSubMapBtn');
    const uploadSubMapInput = document.getElementById('uploadSubMapInput');
    const saveCampaignBtn = document.getElementById('saveCampaignBtn');
    const loadCampaignBtn = document.getElementById('loadCampaignBtn');
    const loadCampaignInput = document.getElementById('loadCampaignInput');

    let playerWindow = null;
    let mainMapImage = null;
    let isSelectingArea = false;
    let selectionRect = { startX: 0, startY: 0, endX: 0, endY: 0 };
    let currentSelection = null; // Stores the relative coordinates {x,y,w,h} of the most recent selection

    let campaignData = {
        mainMap: null, // dataURL
        linkedAreas: [] // Array of objects: { id: uniqueId, selection: {x,y,w,h}, subMapDataUrl: dataURL, subMapName: string }
    };


    // Function to resize canvas to fit image and container
    function resizeCanvas(image) {
        const mainContent = document.querySelector('.main-content');
        const maxWidth = mainContent.clientWidth;
        const maxHeight = mainContent.clientHeight;

        let newWidth = image.width;
        let newHeight = image.height;

        // Adjust size if image is larger than container
        if (newWidth > maxWidth) {
            newHeight = (maxWidth / newWidth) * newHeight;
            newWidth = maxWidth;
        }
        if (newHeight > maxHeight) {
            newWidth = (maxHeight / newHeight) * newWidth;
            newHeight = maxHeight;
        }

        dmCanvas.width = newWidth;
        dmCanvas.height = newHeight;

        // Center the canvas if it's smaller than the container
        dmCanvas.style.marginLeft = `${(mainContent.clientWidth - newWidth) / 2}px`;
        dmCanvas.style.marginTop = `${(mainContent.clientHeight - newHeight) / 2}px`;

        drawDmMap(); // Use a dedicated function to draw map and selection
    }

    function drawDmMap() {
        if (!mainMapImage) return;
        ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
        ctx.drawImage(mainMapImage, 0, 0, dmCanvas.width, dmCanvas.height);

        // Draw all linked areas
        campaignData.linkedAreas.forEach(area => {
            ctx.strokeStyle = 'green'; // Color for existing linked areas
            ctx.lineWidth = 2;
            ctx.strokeRect(
                area.selection.x * dmCanvas.width,
                area.selection.y * dmCanvas.height,
                area.selection.w * dmCanvas.width,
                area.selection.h * dmCanvas.height
            );
        });

        // Draw current selection if it's different from already linked areas (or being newly drawn)
        if (currentSelection && !campaignData.linkedAreas.find(la => la.selection === currentSelection)) {
            ctx.strokeStyle = 'blue'; // Blue for a new, unlinked selection
            ctx.lineWidth = 2;
            ctx.strokeRect(
                currentSelection.x * dmCanvas.width,
                currentSelection.y * dmCanvas.height,
                currentSelection.w * dmCanvas.width,
                currentSelection.h * dmCanvas.height
            );
        }

        // Draw ongoing selection (the red rectangle while dragging)
        if (isSelectingArea) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(
                selectionRect.startX,
                selectionRect.startY,
                selectionRect.endX - selectionRect.startX,
                selectionRect.endY - selectionRect.startY
            );
            ctx.stroke();
        }
    }

    // Handle main map upload
    uploadMapBtn.addEventListener('click', () => {
        uploadMapInput.click();
    });

    uploadMapInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                mainMapImage = new Image();
                mainMapImage.onload = () => {
                    resizeCanvas(mainMapImage);
                    // If player window is open and ready, send the map
                    if (playerWindow && !playerWindow.closed && campaignData.mainMap) { // campaignData.mainMap set here
                         // Check if player is ready or send on 'playerViewReady'
                        playerWindow.postMessage({ type: 'loadMap', imageDataUrl: campaignData.mainMap, mapId: 'main' }, '*');
                    }
                    campaignData.mainMap = mainMapImage.src; // Store in campaign data
                    currentSelection = null;
                    campaignData.linkedAreas = []; // Clear linked areas for new main map
                    linkSubMapBtn.disabled = true;
                    drawDmMap(); // Redraw to clear old selections
                };
                mainMapImage.onerror = () => {
                    alert("Error: Could not load the main map image. Please try a different file.");
                    mainMapImage = null;
                    campaignData.mainMap = null;
                    uploadMapInput.value = ''; // Reset file input
                    drawDmMap(); // Clear canvas or show placeholder
                };
                mainMapImage.src = e.target.result; // This also becomes campaignData.mainMap via onload
            };
            reader.readAsDataURL(file);
        }
    });

    // Campaign Save and Load
    saveCampaignBtn.addEventListener('click', () => {
        if (!campaignData.mainMap) {
            alert("Please upload a main map before saving.");
            return;
        }
        const campaignJson = JSON.stringify(campaignData, null, 2);
        const blob = new Blob([campaignJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dndemicube-campaign-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Campaign saved.");
    });

    loadCampaignBtn.addEventListener('click', () => {
        loadCampaignInput.click();
    });

    loadCampaignInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedData = JSON.parse(e.target.result);
                    if (loadedData && loadedData.mainMap && Array.isArray(loadedData.linkedAreas)) {
                        campaignData = loadedData;

                        // Restore main map
                        mainMapImage = new Image();
                        mainMapImage.onload = () => {
                            resizeCanvas(mainMapImage); // This will also call drawDmMap
                            // If player window is open and ready, send the newly loaded main map
                            if (playerWindow && !playerWindow.closed) {
                                playerWindow.postMessage({ type: 'loadMap', imageDataUrl: campaignData.mainMap, mapId: 'main' }, '*');
                            }
                        };
                        mainMapImage.onerror = () => {
                            alert("Error: Could not load the main map image from the campaign file. The campaign data might be corrupted or the image source invalid.");
                            // Reset to a clean state
                            mainMapImage = null;
                            campaignData.mainMap = null;
                            campaignData.linkedAreas = [];
                            drawDmMap();
                        };
                        mainMapImage.src = campaignData.mainMap;

                        currentSelection = null;
                        linkSubMapBtn.disabled = true;

                        console.log("Campaign loaded:", campaignData);
                        // drawDmMap() is called within resizeCanvas -> mainMapImage.onload
                    } else {
                        alert("Invalid campaign file format.");
                    }
                } catch (error) {
                    console.error("Error loading campaign:", error);
                    alert("Failed to load campaign file. It might be corrupted or not a valid JSON.");
                } finally {
                    loadCampaignInput.value = ''; // Reset file input
                }
            };
            reader.readAsText(file);
        }
    });
    // Area Selection Logic
    dmCanvas.addEventListener('mousedown', (e) => {
        if (!mainMapImage) return; // Only allow selection if a map is loaded
        isSelectingArea = true;
        const rect = dmCanvas.getBoundingClientRect();
        selectionRect.startX = e.clientX - rect.left;
        selectionRect.startY = e.clientY - rect.top;
        selectionRect.endX = e.clientX - rect.left;
        selectionRect.endY = e.clientY - rect.top;
        // console.log('Mouse down:', selectionRect);

        // Check if click is on a linked area
        if (!isSelectingArea && mainMapImage) { // Only check for clicks if not currently drawing a new selection
            const clickX = selectionRect.startX; // mousedown already recorded these
            const clickY = selectionRect.startY;

            for (const area of campaignData.linkedAreas) {
                const areaRect = {
                    x: area.selection.x * dmCanvas.width,
                    y: area.selection.y * dmCanvas.height,
                    w: area.selection.w * dmCanvas.width,
                    h: area.selection.h * dmCanvas.height
                };

                if (clickX >= areaRect.x && clickX <= areaRect.x + areaRect.w &&
                    clickY >= areaRect.y && clickY <= areaRect.y + areaRect.h) {

                    console.log(`Clicked linked area: ${area.id}, sending to player view.`);
                    if (playerWindow && !playerWindow.closed) {
                        playerWindow.postMessage({
                            type: 'loadSubMap',
                            imageDataUrl: area.subMapDataUrl,
                            mapId: area.id, // Unique ID for this sub-map view
                            mapName: area.subMapName
                        }, '*');
                    }
                    // Potentially highlight the clicked area on DM map or provide other feedback
                    return; // Stop further processing if a linked area was clicked
                }
            }
        }
    });

    dmCanvas.addEventListener('mousemove', (e) => {
        if (!isSelectingArea || !mainMapImage) return;
        const rect = dmCanvas.getBoundingClientRect();
        selectionRect.endX = e.clientX - rect.left;
        selectionRect.endY = e.clientY - rect.top;
        drawDmMap(); // Redraw map and current selection rectangle
        // console.log('Mouse move:', selectionRect);
    });

    dmCanvas.addEventListener('mouseup', (e) => {
        if (!isSelectingArea || !mainMapImage) return;
        isSelectingArea = false;
        const rect = dmCanvas.getBoundingClientRect();
        selectionRect.endX = e.clientX - rect.left;
        selectionRect.endY = e.clientY - rect.top;

        // Normalize coordinates (ensure start is top-left)
        const x = Math.min(selectionRect.startX, selectionRect.endX);
        const y = Math.min(selectionRect.startY, selectionRect.endY);
        const width = Math.abs(selectionRect.endX - selectionRect.startX);
        const height = Math.abs(selectionRect.endY - selectionRect.startY);

        if (width > 5 && height > 5) { // Minimum selection size
            // Store selection as relative coordinates (percentages)
            currentSelection = {
                x: x / dmCanvas.width,
                y: y / dmCanvas.height,
                w: width / dmCanvas.width,
                h: height / dmCanvas.height
            };
            linkSubMapBtn.disabled = false; // Enable button to link a sub-map
            console.log('Area selected (relative):', currentSelection);
        } else {
            currentSelection = null;
            linkSubMapBtn.disabled = true;
            console.log('Selection too small.');
        }
        drawDmMap(); // Redraw to show final selection in blue or clear it
    });

    dmCanvas.addEventListener('mouseleave', () => {
        // Optional: Cancel selection if mouse leaves canvas while selecting
        // if (isSelectingArea) {
        //     isSelectingArea = false;
        //     currentSelection = null;
        //     linkSubMapBtn.disabled = true;
        //     drawDmMap();
        //     console.log('Selection cancelled (mouse left canvas)');
        // }
    });


    // Open Player View
    openPlayerViewBtn.addEventListener('click', () => {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.focus();
        } else {
            playerWindow = window.open('player.html', 'PlayerView', 'width=800,height=600');
            // Map will be sent once player window signals readiness (see message listener below)
        }
    });

    window.addEventListener('message', (event) => {
        // Potentially check event.origin for security here
        if (event.source === playerWindow && event.data && event.data.type === 'playerViewReady') {
            console.log("Player view is ready. Sending main map if available.");
            if (mainMapImage && playerWindow && !playerWindow.closed) {
                playerWindow.postMessage({ type: 'loadMap', imageDataUrl: campaignData.mainMap, mapId: 'main' }, '*');
            }
        }
    });

    // Ensure canvas resizes with window and redraws map and selection
    window.addEventListener('resize', () => {
        if (mainMapImage) {
            resizeCanvas(mainMapImage); // This will call drawDmMap
        } else {
            // If no image, clear canvas and keep it centered (or at default size)
            const mainContent = document.querySelector('.main-content');
            dmCanvas.width = mainContent.clientWidth * 0.9; // Example: 90% of container
            dmCanvas.height = mainContent.clientHeight * 0.9;
            dmCanvas.style.marginLeft = `${(mainContent.clientWidth - dmCanvas.width) / 2}px`;
            dmCanvas.style.marginTop = `${(mainContent.clientHeight - dmCanvas.height) / 2}px`;
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height); // Clear canvas
            currentSelection = null; // Clear selection if no map
            linkSubMapBtn.disabled = true;
        }
    });

    // Initial canvas setup (e.g., placeholder or empty state)
    // Call resize on load to set initial canvas size
    window.dispatchEvent(new Event('resize'));

    // Handle Sub-map upload
    linkSubMapBtn.addEventListener('click', () => {
        if (!currentSelection) {
            alert("Please select an area on the main map first.");
            return;
        }
        uploadSubMapInput.click();
    });

    uploadSubMapInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && currentSelection) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const subMapImage = new Image();
                subMapImage.onload = () => {
                    const subMapDataUrl = subMapImage.src; // Use the image src after successful load
                    const newLinkedArea = {
                        id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
                        selection: currentSelection, // This is the relative one
                        subMapDataUrl: subMapDataUrl,
                        subMapName: file.name
                    };
                    campaignData.linkedAreas.push(newLinkedArea);

                    console.log('Sub-map linked:', newLinkedArea);
                    console.log('All linked areas:', campaignData.linkedAreas);

                    // Reset currentSelection and disable button to prevent accidental relink of same area
                    currentSelection = null;
                    linkSubMapBtn.disabled = true;
                    uploadSubMapInput.value = ''; // Reset file input

                    drawDmMap(); // Redraw to show new linked area (e.g., in green)
                };
                subMapImage.onerror = () => {
                    alert(`Error: Could not load the sub-map image "${file.name}". Please try a different file.`);
                    uploadSubMapInput.value = ''; // Reset file input
                    // currentSelection remains, so DM can try uploading another file for the same selection
                };
                subMapImage.src = e.target.result; // Initial assignment to trigger load
            };
            reader.readAsDataURL(file);
        }
    });

});
