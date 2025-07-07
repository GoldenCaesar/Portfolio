document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const displayedFileNames = new Set();
    let isEditMode = false;

    function handleDelete(item) {
        const fileName = item.dataset.fileName;
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            const list = item.parentNode;
            item.remove();
            displayedFileNames.delete(fileName);
            updateMoveIconVisibility(list); // Update move icons in case first/last item changed
            // Potentially, you might want to do more here, like removing associated map data
            // if it's stored elsewhere.
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
                listItem.replaceChild(textNode, input);
                 // Potentially, you might want to update other parts of your application
                // that rely on this filename.
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

                    const textNode = document.createTextNode(file.name);
                    listItem.appendChild(textNode);

                    uploadedMapsList.appendChild(listItem);
                    displayedFileNames.add(file.name);

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
});
