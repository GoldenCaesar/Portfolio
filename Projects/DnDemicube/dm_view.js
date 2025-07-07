document.addEventListener('DOMContentLoaded', () => {
    const uploadMapsInput = document.getElementById('upload-maps-input');
    const uploadedMapsList = document.getElementById('uploaded-maps-list');
    const displayedFileNames = new Set();

    if (uploadMapsInput && uploadedMapsList) {
        uploadMapsInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (!files) {
                return;
            }

            for (const file of files) {
                if (!displayedFileNames.has(file.name)) {
                    const listItem = document.createElement('li');
                    listItem.textContent = file.name;
                    uploadedMapsList.appendChild(listItem);
                    displayedFileNames.add(file.name);
                }
            }

            // Optional: Clear the file input's value to allow selecting the same file again if it was removed by some other means
            // However, for accumulation and avoiding duplicates with the Set, this is not strictly necessary
            // event.target.value = null;
        });
    } else {
        console.error('Could not find the upload input or the list element. Check IDs.');
    }
});
