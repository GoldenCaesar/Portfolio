document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const mapContainer = document.getElementById('map-container'); // Get the container
    const displayedFileNames = new Set();

    // Map Tools Elements
    const mapToolsSection = document.getElementById('map-tools-section');
    const mapToolButtons = mapToolsSection ? mapToolsSection.querySelectorAll('.map-tools-buttons button') : [];

    const mapObjectURLs = new Map(); // To store filename -> objectURL mapping
    let isEditMode = false;

    // Function to resize the canvas to fit its container
    function resizeCanvas() {
        if (dmCanvas && mapContainer) {
            dmCanvas.width = mapContainer.clientWidth;
            dmCanvas.height = mapContainer.clientHeight;
            console.log(`Canvas resized to: ${dmCanvas.width}x${dmCanvas.height}`);
            // If a map is currently displayed, redraw it
            // This requires knowing which map is active. For now, let's assume
            // we might need to add a variable to track the currently displayed map.
            // For simplicity in this step, we won't redraw here, but this is a good spot for it.
        }
    }

    function enableMapTools() {
        if (mapToolsSection) {
            // mapToolsSection.classList.remove('disabled'); // Or however you manage overall section appearance
        }
        mapToolButtons.forEach(button => button.disabled = false);
        console.log("Map tools enabled");
    }

    function disableMapTools() {
        if (mapToolsSection) {
            // mapToolsSection.classList.add('disabled'); // Or however you manage overall section appearance
        }
        mapToolButtons.forEach(button => button.disabled = true);
        console.log("Map tools disabled");
    }

    function displayMapOnCanvas(fileName) {
        if (!dmCanvas) {
            console.error("DM Canvas not found!");
            return;
        }
        const objectURL = mapObjectURLs.get(fileName);
        if (!objectURL) {
            console.error(`ObjectURL not found for ${fileName}`);
            return;
        }

        const ctx = dmCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            // Clear canvas
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);

            // Calculate scaling to fit image within canvas while maintaining aspect ratio
            const hRatio = dmCanvas.width / img.width;
            const vRatio = dmCanvas.height / img.height;
            const ratio = Math.min(hRatio, vRatio);

            const centerShift_x = (dmCanvas.width - img.width * ratio) / 2;
            const centerShift_y = (dmCanvas.height - img.height * ratio) / 2;

            // Draw image centered and scaled
            ctx.drawImage(img, 0, 0, img.width, img.height,
                          centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

            enableMapTools(); // Enable tools once map is displayed
        };
        img.onerror = () => {
            console.error(`Error loading image for ${fileName} from ${objectURL}`);
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height); // Clear canvas on error too
            ctx.fillText(`Error loading: ${fileName}`, 10, 50); // Basic error message
        };
        img.src = objectURL;
    }

    function handleDelete(item) {
        const fileName = item.dataset.fileName;
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            const list = item.parentNode;
            item.remove();
            displayedFileNames.delete(fileName);

            // Revoke ObjectURL
            const objectURL = mapObjectURLs.get(fileName);
            if (objectURL) {
                URL.revokeObjectURL(objectURL);
                mapObjectURLs.delete(fileName);
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

                // Update ObjectURL map
                const objectURL = mapObjectURLs.get(originalName);
                if (objectURL) {
                    mapObjectURLs.delete(originalName);
                    mapObjectURLs.set(newName, objectURL);
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

                    // Create and store ObjectURL
                    const objectURL = URL.createObjectURL(file);
                    mapObjectURLs.set(file.name, objectURL);

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
            return; // Do nothing if in edit mode, actions are handled by icons
        }

        // Traverse up from the click target to find the parent LI (the map item)
        let targetItem = event.target;
        while (targetItem && targetItem.tagName !== 'LI' && targetItem !== uploadedMapsList) {
            targetItem = targetItem.parentNode;
        }

        if (targetItem && targetItem.tagName === 'LI' && targetItem.classList.contains('map-list-item')) {
            const fileName = targetItem.dataset.fileName;
            if (fileName) {
                displayMapOnCanvas(fileName);
            }
        }
    });

    // Initial canvas setup
    if (dmCanvas && mapContainer) {
        resizeCanvas(); // Size canvas on load
        window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize
    } else {
        console.error("Could not find DM canvas or map container for initial sizing.");
    }

    // Initially disable map tools on load
    disableMapTools();
});
