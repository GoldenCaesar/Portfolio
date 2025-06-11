// Global variables for UI, now explicitly attached to window
window.userUploadedFolders = {}; // To store user-uploaded folder structures
window.demoFilesData = { // Moved from DOMContentLoaded
    "demo_files": {
        "path": "demo_files",
        "type": "folder",
        "children": {
            "Jokes Folder 1": {
                "path": "demo_files/Jokes Folder 1",
                "type": "folder",
                "children": {
                    "joke1.txt": {
                        "path": "demo_files/Jokes Folder 1/joke1.txt",
                        "type": "file",
                        "content": "Why don't scientists trust atoms? Because they make up everything!"
                    }
                }
            },
            "Jokes Folder 2": {
                "path": "demo_files/Jokes Folder 2",
                "type": "folder",
                "children": {
                    "joke2.txt": {
                        "path": "demo_files/Jokes Folder 2/joke2.txt",
                        "type": "file",
                        "content": "Why did the scarecrow win an award? Because he was outstanding in his field!"
                    }
                }
            },
            "Jokes Folder 3": {
                "path": "demo_files/Jokes Folder 3",
                "type": "folder",
                "children": {
                    "joke3.txt": {
                        "path": "demo_files/Jokes Folder 3/joke3.txt",
                        "type": "file",
                        "content": "Why don't skeletons fight each other? They don't have the guts."
                    }
                }
            }
        }
    }
};
// fileLog is now globally managed by logging.js as window.fileLog
// UI functions will use window.fileLog directly.

// --- UI Display and Update Functions ---

function updateFileMonitoredCount() {
    const filesMonitoredElement = document.getElementById('files-monitored-count');
    if (filesMonitoredElement && window.fileLog) {
        // Count only unique files based on appID, if relevant, or just length for now
        filesMonitoredElement.textContent = window.fileLog.length.toLocaleString();
    }
}

function updateLogSizeDisplayOnLoad() {
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement && window.fileLog && window.fileLog.length > 0) {
        // Simulate log size based on the number of entries or string length
        const approximateSize = JSON.stringify(window.fileLog).length / 1024; // Very rough KB
        updateLogSizeDisplay(parseFloat(approximateSize.toFixed(2)));
    } else if (logSizeElement) {
        // If fileLog is empty or not yet loaded, set to a default small value like 0 or 1
        updateLogSizeDisplay(0); // Default to 0KB if no logs
    }
}

function updateLastScanTime() {
    const lastScanElement = document.querySelector('.mt-auto.space-y-2.border-t p.text-xs'); // Selector for "Last scan: ..."
    if (lastScanElement) {
        lastScanElement.textContent = 'Last scan: ' + new Date().toLocaleString();
    }
}

// Function to update log size display
function updateLogSizeDisplay(sizeInKB) {
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement) {
        logSizeElement.textContent = sizeInKB + " KB";
    }
}

// Function to display activity log
function displayActivityLog() {
    const activityTbody = document.getElementById('activity-tbody');
    if (!activityTbody) {
        console.error("activity-tbody element not found!");
        return;
    }
    activityTbody.innerHTML = ''; // Clear existing rows

    if (!window.fileLog || window.fileLog.length === 0) {
        const tr = activityTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5; // Adjusted to 5 columns: File Name, Status, Hash, Last Checked, Path
        cell.textContent = 'No activity logged yet.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    window.fileLog.forEach(entry => {
        const tr = activityTbody.insertRow();
        tr.className = 'hover:bg-[#1A2B3A]'; // Consistent hover effect

        // File Name
        const nameTd = tr.insertCell();
        nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
        nameTd.textContent = entry.currentPath.substring(entry.currentPath.lastIndexOf('/') + 1);

        // Status
        const statusTd = tr.insertCell();
        statusTd.className = 'whitespace-nowrap px-6 py-4 text-sm';
        statusTd.textContent = entry.status;
        switch (entry.status) {
            case 'modified':
                statusTd.classList.add('text-yellow-400');
                break;
            case 'newly_added':
                statusTd.classList.add('text-blue-400');
                break;
            case 'verified':
                statusTd.classList.add('text-green-400');
                break;
            // No 'Not Scanned' case needed here as fileLog only contains scanned files
            default:
                statusTd.classList.add('text-slate-300');
        }

        // Current Hash
        const hashTd = tr.insertCell();
        hashTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 font-mono';
        hashTd.textContent = entry.currentHash ? entry.currentHash.substring(0, 12) + '...' : 'N/A';
        hashTd.title = entry.currentHash || "";

        // Last Checked Time
        const lastCheckedTd = tr.insertCell();
        lastCheckedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
        lastCheckedTd.textContent = entry.lastHashCheckTime ? new Date(entry.lastHashCheckTime).toLocaleString() : 'N/A';

        // Full Path
        const pathTd = tr.insertCell();
        pathTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 overflow-hidden text-ellipsis';
        pathTd.textContent = entry.currentPath;
        pathTd.title = entry.currentPath;
    });
}

function displayLoggedFiles(logEntriesToDisplay) {
    const documentsTbody = document.getElementById('documents-tbody');
    if (!documentsTbody) return;
    documentsTbody.innerHTML = ''; // Clear existing rows

    if (!logEntriesToDisplay || logEntriesToDisplay.length === 0) {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5; // Number of columns
        cell.textContent = 'No files to display for this selection.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    logEntriesToDisplay.forEach(entry => {
        const tr = documentsTbody.insertRow();
        tr.className = 'hover:bg-[#1A2B3A]';

        const nameTd = tr.insertCell();
        nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
        nameTd.textContent = entry.currentPath.substring(entry.currentPath.lastIndexOf('/') + 1);

        const statusTd = tr.insertCell();
        statusTd.className = 'whitespace-nowrap px-6 py-4 text-sm';
        statusTd.textContent = entry.status;
        switch (entry.status) {
            case 'modified':
                statusTd.classList.add('text-yellow-400');
                break;
            case 'newly_added':
                statusTd.classList.add('text-blue-400');
                break;
            case 'verified':
                statusTd.classList.add('text-green-400');
                break;
            case 'Not Scanned': // Handle "Not Scanned" status
                statusTd.classList.add('text-gray-500'); // Or any other appropriate color
                break;
            default:
                statusTd.classList.add('text-slate-300');
        }

        const hashTd = tr.insertCell();
        hashTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 font-mono';
        hashTd.textContent = entry.currentHash ? entry.currentHash.substring(0, 12) + '...' : 'N/A';
        hashTd.title = entry.currentHash || "";

        const lastCheckedTd = tr.insertCell();
        lastCheckedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
        lastCheckedTd.textContent = entry.lastHashCheckTime ? new Date(entry.lastHashCheckTime).toLocaleString() : 'N/A';

        const pathTd = tr.insertCell();
        pathTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 overflow-hidden text-ellipsis';
        pathTd.textContent = entry.currentPath;
        pathTd.title = entry.currentPath; // Show full path on hover
    });
}

// This function might become redundant if file counts are solely derived from fileLog length.
// For now, it's kept if other parts of the demo still use it for raw demoFilesData counting.
function countFiles(data) {
    let count = 0;
    for (const key in data) {
        if (data[key].type === 'file') {
            count++;
        } else if (data[key].type === 'folder' && data[key].children) {
            count += countFiles(data[key].children);
        }
    }
    return count;
}

// Helper function to find an item in demoFilesData by its path
function findItemInData(targetPath, dataRoot) {
    if (!targetPath || !dataRoot) return null; // Basic validation
    const parts = targetPath.split('/');
    if (parts.length === 0) return null;

    let currentItem = dataRoot[parts[0]];
    if (!currentItem && dataRoot.children && dataRoot.children[parts[0]]) { // Check if root is a container like demoFilesData
        currentItem = dataRoot.children[parts[0]];
    } else if (!currentItem && parts.length ===1 && dataRoot.path === targetPath) { // Root itself is the target
        currentItem = dataRoot;
    }


    if (!currentItem) return null;

    for (let i = 1; i < parts.length; i++) {
        if (currentItem.children && currentItem.children[parts[i]]) {
            currentItem = currentItem.children[parts[i]];
        } else {
            return null; // Path component not found
        }
    }
    return currentItem;
}

// Helper function to get a folder item by its path from demoFilesData or userUploadedFolders
function getFolderItemByPath(path) {
    if (!path || typeof path !== 'string') {
        console.warn("getFolderItemByPath: Invalid path provided.");
        return null;
    }

    // 1. Attempt to find in demoFilesData
    const demoItem = findItemInData(path, window.demoFilesData);
    if (demoItem && demoItem.type === 'folder') {
        return demoItem;
    }

    // 2. Attempt to find in userUploadedFolders
    const userItem = findItemInData(path, window.userUploadedFolders);
     if (userItem && userItem.type === 'folder') {
        return userItem;
    }

    return null; // Not found or not a folder
}

function clearActiveStates() {
    document.querySelectorAll('#sidebar-nav a, #sidebar-nav div[data-folder-path]').forEach(link => {
        link.classList.remove('bg-[#1A2B3A]', 'text-white');
        if (link.tagName === 'A' || link.dataset.folderPath) {
             link.classList.add('text-slate-300');
        }
    });
}

function setActiveState(element) {
    element.classList.add('bg-[#1A2B3A]', 'text-white');
    element.classList.remove('text-slate-300');
}

function displayFileContent(filePath) {
    const mainContent = document.querySelector('main.ml-80');
    let fileItem = findItemInData(filePath, window.demoFilesData);
    let content = fileItem?.content;
    let isUserFile = false;

    if (!fileItem) { // Try userUploadedFolders
        fileItem = findItemInData(filePath, window.userUploadedFolders);
        if (fileItem && fileItem.type === 'file' && fileItem.fileObject) {
            isUserFile = true;
            // Content for user files will be read asynchronously
        } else {
            console.error('File item not found in demo or user data for path:', filePath);
            alert('File content not found.');
            return;
        }
    }


    const parentFolderPath = filePath.substring(0, filePath.lastIndexOf('/'));

    const displayTheContent = (textContent) => {
        if (mainContent) {
            const sectionsToHide = mainContent.querySelectorAll('section');
            sectionsToHide.forEach(section => section.style.display = 'none');

            let fileContentDiv = document.getElementById('file-content-display');
            if (!fileContentDiv) {
                fileContentDiv = document.createElement('div');
                fileContentDiv.id = 'file-content-display';
                fileContentDiv.className = 'p-8 text-slate-100';
                mainContent.appendChild(fileContentDiv);
            }
            fileContentDiv.style.display = 'block';

            const pre = document.createElement('pre');
            pre.textContent = textContent;

            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Files';
            backButton.className = 'mb-4 px-4 py-2 bg-[#0c7ff2] text-white rounded hover:bg-blue-600 transition-colors';
            backButton.onclick = () => {
                sectionsToHide.forEach(section => section.style.display = 'block');
                if(fileContentDiv) fileContentDiv.style.display = 'none';
                displayFolderContents(parentFolderPath);
            };

            fileContentDiv.innerHTML = '';
            fileContentDiv.appendChild(backButton);
            fileContentDiv.appendChild(pre);
        }
    };

    if (isUserFile && fileItem && fileItem.fileObject) {
        if (typeof readFileAsText === 'function') {
            readFileAsText(fileItem.fileObject)
                .then(fileText => displayTheContent(fileText))
                .catch(err => {
                    console.error("Error reading user file for display:", err);
                    alert('Error reading file content.');
                });
        } else {
            console.error("readFileAsText function is not available. Cannot display user file content.");
            alert("Cannot display content for this file as a required function (readFileAsText) is missing.");
        }
    } else if (content) {
        displayTheContent(content);
    } else {
        console.error('File content not available for path:', filePath);
        alert('File content not available.');
    }
}

function displayFolderContents(folderPath) {
    const documentsTbody = document.getElementById('documents-tbody');
    if (!documentsTbody) {
        console.error("documentsTbody is not defined in displayFolderContents");
        return;
    }

    const fileContentDiv = document.getElementById('file-content-display');
    if (fileContentDiv) {
        fileContentDiv.style.display = 'none';
    }
    const sectionsToUnhide = document.querySelectorAll('main.ml-80 section');
    sectionsToUnhide.forEach(section => section.style.display = 'block');

    const filesForDisplay = [];
    let currentFolderChildren = {};
    let sourceDataName = "";

    let folderItem = findItemInData(folderPath, window.demoFilesData);
    if (folderItem && folderItem.type === 'folder' && folderItem.children) {
        currentFolderChildren = folderItem.children;
        sourceDataName = "demo";
    } else {
        folderItem = findItemInData(folderPath, window.userUploadedFolders);
        if (folderItem && folderItem.type === 'folder' && folderItem.children) {
            currentFolderChildren = folderItem.children;
            sourceDataName = "user";
        } else if (folderItem && folderItem.type === 'folder' && !folderItem.children) {
            currentFolderChildren = {}; // Empty user folder
            sourceDataName = "user_empty";
        } else {
            console.warn(`Could not find children for folderPath: "${folderPath}" in window.demoFilesData or window.userUploadedFolders.`);
            currentFolderChildren = {};
        }
    }

    console.log(`Displaying contents for path: ${folderPath} (from ${sourceDataName || 'unknown source'}), found children:`, Object.keys(currentFolderChildren));

    for (const itemName in currentFolderChildren) {
        const item = currentFolderChildren[itemName];
        if (item.type === 'file') {
            const fileDisplayData = {
                name: itemName,
                currentPath: item.path,
                status: "Not Scanned Yet",
                currentHash: "N/A",
                lastHashCheckTime: "N/A"
            };

            const loggedFile = window.fileLog.find(logEntry => logEntry.currentPath === item.path);
            if (loggedFile) {
                fileDisplayData.status = loggedFile.status;
                fileDisplayData.currentHash = loggedFile.currentHash;
                fileDisplayData.lastHashCheckTime = loggedFile.lastHashCheckTime;
            }
            filesForDisplay.push(fileDisplayData);
        }
    }
    displayLoggedFiles(filesForDisplay);
}

function createSidebarEntry(name, path, type, indentLevel = 0, parentContainer, isTopLevel = false, children = null) {
    if (type === 'file') {
        return; // Files are not added to the sidebar directly
    }
    // console.log("createSidebarEntry called for name:", name, "path:", path, "type:", type, "indentLevel:", indentLevel, "isTopLevel:", isTopLevel);
    const entryDiv = document.createElement('div');
    entryDiv.style.marginLeft = `${indentLevel * 20}px`;

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1A2B3A]';
    link.dataset.folderPath = path;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-icons-outlined text-slate-400';
    iconSpan.style.fontSize = '20px';
    iconSpan.textContent = 'folder';

    link.appendChild(iconSpan);
    link.appendChild(document.createTextNode(` ${name}`));

    entryDiv.appendChild(link);
    parentContainer.appendChild(entryDiv);

    const subfoldersContainer = document.createElement('div');
    subfoldersContainer.className = 'subfolder-container';
    // Initial state: hide children unless it's a top-level user folder (not "demo_files")
    if (path === "demo_files" || !isTopLevel) {
        subfoldersContainer.style.display = 'none';
    } else {
         subfoldersContainer.style.display = 'block'; // Expand top-level user folders by default
    }


    if (isTopLevel && path === "demo_files" && type === 'folder') { // Default active state for demo_files
        link.classList.add('bg-[#1A2B3A]', 'text-white');
        link.classList.remove('text-slate-300');
    }
    entryDiv.appendChild(subfoldersContainer);

    if (type === 'folder' && children) {
        Object.keys(children).forEach(childName => {
            const childItem = children[childName];
            createSidebarEntry(childName, childItem.path, childItem.type, indentLevel + 1, subfoldersContainer, false, childItem.children);
        });
    }

    if (type === 'folder') {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedPath = path;
            const folderItem = getFolderItemByPath(clickedPath);
            if (!folderItem) {
                console.warn(`Sidebar click: Folder item not found for path: "${clickedPath}"`);
                return;
            }

            const currentSubfoldersContainer = link.closest('div').querySelector('.subfolder-container');
            const iconElement = link.querySelector('.material-icons-outlined');

            let isNowExpanded = false;
            if (currentSubfoldersContainer) {
                if (currentSubfoldersContainer.style.display === 'none') {
                    currentSubfoldersContainer.style.display = 'block';
                    if (iconElement) iconElement.textContent = 'folder_open';
                    isNowExpanded = true;
                } else {
                    currentSubfoldersContainer.style.display = 'none';
                    if (iconElement) iconElement.textContent = 'folder';
                    isNowExpanded = false;
                }
            } else {
                isNowExpanded = true; // No subfolder container, treat as "expanded" for content display
            }

            clearActiveStates();
            setActiveState(link); // Activate the clicked link

            // If expanding "demo_files" or a subfolder of "demo_files", ensure "demo_files" itself is also active and open
            if (clickedPath.startsWith("demo_files")) {
                const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                if (demoFilesEntryLink && clickedPath !== "demo_files") {
                    setActiveState(demoFilesEntryLink);
                    const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                    if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open';
                     // Also ensure its subfolder container is open if it wasn't the direct click target
                    const demoFilesMainDiv = demoFilesEntryLink.closest('div');
                    if(demoFilesMainDiv){
                        const demoSubContainer = demoFilesMainDiv.querySelector('.subfolder-container');
                        if(demoSubContainer) demoSubContainer.style.display = 'block';
                    }
                }
            }
            // activeSubFolderLink = link; // This global is not directly used here anymore.
            displayFolderContents(clickedPath); // Display content of the clicked folder
        });
    }
    return subfoldersContainer;
}

function updateSidebarView() {
    console.log("updateSidebarView called from ui.js");
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) {
        console.error("sidebarNav element not found in updateSidebarView (ui.js)");
        return;
    }
    sidebarNav.innerHTML = '';

    // Process demoFilesData
    Object.keys(window.demoFilesData).forEach(itemName => {
        const item = window.demoFilesData[itemName];
        createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true, item.children);
    });

    // Process userUploadedFolders
    Object.keys(window.userUploadedFolders).forEach(itemName => {
        const item = window.userUploadedFolders[itemName];
        createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true, item.children);
    });

    // Default view: display contents of the "demo_files" main folder itself initially
    // and ensure "demo_files" is marked active.
    const demoFilesPath = "demo_files";
    displayFolderContents(demoFilesPath); // Display contents of "demo_files" itself

    setTimeout(() => { // Ensure elements are rendered
        const demoFilesLinkElement = document.querySelector(`#sidebar-nav a[data-folder-path="${demoFilesPath}"]`);
        if (demoFilesLinkElement) {
            clearActiveStates(); // Clear any previous active states
            setActiveState(demoFilesLinkElement); // Set "demo_files" as active
            // Icon and expansion state are handled by createSidebarEntry and click events
        } else {
            console.warn("Failed to find 'demo_files' link for default active state in ui.js");
        }
    }, 0);

    if (sidebarNav) console.log("sidebarNav innerHTML after changes (ui.js):", sidebarNav.innerHTML.length > 100 ? sidebarNav.innerHTML.substring(0,100) + "..." : sidebarNav.innerHTML);
}


// --- DOMContentLoaded Listener and UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired from ui.js");
    const sidebarNav = document.getElementById('sidebar-nav');
    const documentsTbody = document.getElementById('documents-tbody'); // Keep for displayFolderContents

    // Global `window.demoFilesData` is initialized at the top of ui.js
    // `fileLog` is now globally available as `window.fileLog` from `logging.js`.

    // Attempt to load logs. `loadLogsFromStorage` is from `logging.js`
    // logging.js should be loaded before ui.js.
    if (typeof loadLogsFromStorage === 'function') {
        loadLogsFromStorage(); // This will populate window.fileLog and then update UI elements that use it.
    } else {
        console.error("loadLogsFromStorage function not found. Ensure logging.js is loaded before ui.js.");
        // Manually update UI based on the (potentially uninitialized) window.fileLog
        updateFileMonitoredCount();
        updateLogSizeDisplayOnLoad();
        displayActivityLog();
    }

    const addFolderButton = document.getElementById('add-folder-button');
    const folderUploadInput = document.getElementById('folder-upload-input');

    if (addFolderButton && folderUploadInput) {
        addFolderButton.addEventListener('click', () => {
            folderUploadInput.click();
        });
    }

    if (folderUploadInput) {
        folderUploadInput.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files.length) {
                console.log("No folder selected or folder is empty.");
                return;
            }
            console.log(`Processing ${files.length} files from selected folder (ui.js)...`);

            let newFilesProcessedCount = 0;

            for (const file of files) {
                const fullPath = file.webkitRelativePath;
                if (!fullPath) {
                    console.warn("File with no webkitRelativePath (ui.js). Skipping.", file.name);
                    continue;
                }

                const pathParts = fullPath.split('/');
                let currentLevel = window.userUploadedFolders; // Use global userUploadedFolders
                let currentBuiltPath = "";
                let baseFolderName = pathParts[0]; // The root folder name from the upload

                // Ensure base folder exists in userUploadedFolders
                if (!currentLevel[baseFolderName]) {
                    currentLevel[baseFolderName] = {
                        path: baseFolderName,
                        type: 'folder',
                        children: {}
                    };
                }

                // Navigate to the correct base folder for processing paths
                currentLevel = currentLevel[baseFolderName].children;
                currentBuiltPath = baseFolderName;


                for (let i = 1; i < pathParts.length; i++) { // Start from 1 since base folder is handled
                    const part = pathParts[i];
                    currentBuiltPath += '/' + part;

                    if (i === pathParts.length - 1) { // It's a file
                        if (!currentLevel[part]) {
                             currentLevel[part] = {
                                path: currentBuiltPath, // Full path from root of userUploadedFolders
                                type: 'file',
                                fileObject: file
                            };
                            newFilesProcessedCount++;
                        }
                    } else { // It's a directory
                        if (!currentLevel[part]) {
                            currentLevel[part] = {
                                path: currentBuiltPath,
                                type: 'folder',
                                children: {}
                            };
                        } else if (currentLevel[part].type !== 'folder') {
                            console.error(`Conflict: Expected folder, found file at ${currentBuiltPath} (ui.js)`);
                            break;
                        }
                        currentLevel = currentLevel[part].children;
                    }
                }
                 if (pathParts.length === 1 && file.name) { // Single file uploaded into a "folder" named after the file
                     const part = file.name;
                     currentBuiltPath += '/' + part;
                     if (!currentLevel[part]) {
                         currentLevel[part] = {
                             path: currentBuiltPath,
                             type: 'file',
                             fileObject: file
                         };
                         newFilesProcessedCount++;
                     }
                 }
            }

            if (newFilesProcessedCount > 0) {
                console.log("User uploaded folders data (ui.js):", window.userUploadedFolders);
                updateSidebarView();
                alert(`Folder structure added/updated. ${newFilesProcessedCount} new file references captured. Scan files to process.`);
            } else if (files.length > 0) {
                 alert("Selected files/folder might have already been added or no new files were found.");
            } else {
                alert("No folder selected or the folder was empty.");
            }
            folderUploadInput.value = ''; // Clear input
        });
    }

    updateSidebarView(); // Initial sidebar render based on demoFilesData and any userUploadedFolders

    // Settings Menu (gear icon)
    const settingsIconContainer = document.querySelector('div[data-icon="Gear"]');
    const settingsContextMenu = document.getElementById('settings-context-menu');

    if (settingsIconContainer && settingsContextMenu) {
        settingsIconContainer.addEventListener('click', (event) => {
            event.stopPropagation();
            settingsContextMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (event) => {
            if (!settingsContextMenu.contains(event.target) && !settingsIconContainer.contains(event.target)) {
                settingsContextMenu.classList.add('hidden');
            }
        });
    }

    // Clear Logs button in settings menu
    const clearLogsButton = document.getElementById('clear-logs-button');
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof clearLogs === 'function') { // Expected from logging.js
                clearLogs(); // This will update window.fileLog and UI
            } else {
                console.error("clearLogs function not found (ui.js). Ensure logging.js is loaded.");
                // Avoid direct manipulation of fileLog here if it's managed by logging.js
                alert("Error: Clear logs functionality is unavailable.");
            }
            if (settingsContextMenu) settingsContextMenu.classList.add('hidden');
        });
    }

    // Scan Files button - This button's core logic (scanFiles function) is expected in script.js
    const scanButton = document.getElementById('scan-files-button');
    if (scanButton) {
        scanButton.addEventListener('click', async () => {
            if (typeof scanFiles === 'function') {
                await scanFiles(); // scanFiles should handle UI updates after scanning
            } else {
                console.error("scanFiles function not found (ui.js). Scan cannot be performed.");
                alert("Scan functionality is not available.");
            }
        });
    }
});
console.log("ui.js loaded and DOMContentLoaded setup complete.");

// Make sure readFileAsText is globally available if displayFileContent needs it for user files.
// It is expected to be defined in script.js and loaded before ui.js
// Example: async function readFileAsText(file) { /* ... */ } defined in script.js
// If not, displayFileContent for user files will fail.
// The same applies to `generateSHA256`, `generateAppUniqueID`, `getOSFileID` if any UI function were to call them directly.
// `loadLogsFromStorage`, `clearLogs`, `scanFiles` are also expected to be globally available from other scripts (logging.js)
// and ui.js will call them.
// Global `window.userUploadedFolders` and `window.demoFilesData` are initialized and managed within ui.js for sidebar and content display.
// All references to `fileLog` in this script now implicitly point to `window.fileLog`.
