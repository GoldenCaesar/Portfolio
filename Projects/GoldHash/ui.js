// Global variables for UI, now explicitly attached to window
window.userUploadedFolders = {}; // To store user-uploaded folder structures
window.isEditModeActive = false; // To track if edit mode is active
// window.removeFolderEntriesFromLog = function(folderPath) { console.log('UI Placeholder: removeFolderEntriesFromLog called for:', folderPath); }; // Placeholder // This line is removed
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

// --- Toast Notification Function ---
function showToast(message, type = 'info') {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = 'linear-gradient(to right, #00b09b, #96c93d)';
            break;
        case 'error':
            backgroundColor = 'linear-gradient(to right, #ff5f6d, #ffc371)';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(to right, #f7971e, #ffd200)';
            break;
        case 'info':
        default:
            backgroundColor = 'linear-gradient(to right, #007bff, #00a1ff)';
            break;
    }

    Toastify({
        text: message,
        duration: 5000, // 5 seconds
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        backgroundColor: backgroundColor,
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
}

// --- UI Display and Update Functions ---

function updateFilesChangedCount(count) {
    const filesChangedElement = document.getElementById('files-changed-count');
    if (filesChangedElement) {
        filesChangedElement.textContent = count.toLocaleString();
    } else {
        console.warn("Element with ID 'files-changed-count' not found.");
    }
}

function updateTotalChangesCount(count) {
    const totalChangesElement = document.getElementById('total-changes-count');
    if (totalChangesElement) {
        totalChangesElement.textContent = count.toLocaleString();
    } else {
        console.warn("Element with ID 'total-changes-count' not found.");
    }
}

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
        cell.colSpan = 6; // Adjusted to 6 columns
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
            case 'path_updated': // New status
                statusTd.classList.add('text-purple-400'); // Example color
                break;
            case 'duplicate': // New status
                statusTd.classList.add('text-cyan-400'); // Example color
                break;
            case 'reactivated':
                statusTd.classList.add('text-teal-400');
                break;
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

        // Last Modified
        const lastModifiedTd = tr.insertCell();
        lastModifiedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
        lastModifiedTd.textContent = entry.lastModifiedSystem ? new Date(entry.lastModifiedSystem).toLocaleString() : 'N/A';

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
        cell.colSpan = 6; // Number of columns
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
            // ADD NEW CASES HERE:
            case 'path_updated': // New status
                statusTd.classList.add('text-purple-400'); // Example color
                break;
            case 'duplicate': // New status
                statusTd.classList.add('text-cyan-400'); // Example color
                break;
            case 'reactivated':
                statusTd.classList.add('text-teal-400'); // Use the same color for consistency
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

        // Last Modified
        const lastModifiedTd = tr.insertCell();
        lastModifiedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
        if (entry.status === 'Not Scanned Yet' || !entry.lastModifiedSystem) {
            lastModifiedTd.textContent = 'N/A';
        } else {
            lastModifiedTd.textContent = new Date(entry.lastModifiedSystem).toLocaleString();
        }

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

// Helper function to check if a path is actively managed (exists in demo or user data)
function isPathActivelyManaged(filePath) {
    console.log('isPathActivelyManaged called for:', filePath);
    let found = false;

    // Check in demoFilesData
    if (findItemInData(filePath, window.demoFilesData)) {
        found = true;
    }

    // If not found in demo, check in userUploadedFolders
    if (!found && findItemInData(filePath, window.userUploadedFolders)) {
        found = true;
    }

    console.log('isPathActivelyManaged Result:', found);
    return found;
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
            showToast('File content not found.', 'error');
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
                    showToast('Error reading file content.', 'error');
                });
        } else {
            console.error("readFileAsText function is not available. Cannot display user file content.");
            showToast("Cannot display content for this file as a required function (readFileAsText) is missing.", 'error');
        }
    } else if (content) {
        displayTheContent(content);
    } else {
        console.error('File content not available for path:', filePath);
        showToast('File content not available.', 'error');
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
                fileDisplayData.lastModifiedSystem = loggedFile.lastModifiedSystem;
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

    if (window.isEditModeActive) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mr-2 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800'; // Tailwind styled checkbox
        checkbox.dataset.folderPath = path;
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent sidebar navigation when clicking checkbox
        });
        link.appendChild(checkbox); // Prepend checkbox
    }

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

function renderSidebarForEditMode() {
    console.log('renderSidebarForEditMode called, refreshing sidebar view.');
    updateSidebarView(); // This will rebuild the sidebar using createSidebarEntry, which now includes checkbox logic.
}

// Helper function to delete a user-uploaded folder or subfolder by its path
function deleteUserUploadedFolderPath(path) {
    if (!path || typeof path !== 'string' || path.startsWith("demo_files")) {
        // Do not attempt to delete demo files or if path is invalid
        return false;
    }

    const parts = path.split('/');
    if (parts.length === 0) {
        return false;
    }

    let currentLevel = window.userUploadedFolders;
    let parentLevel = null;
    let partToDelete = null;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!currentLevel[part]) {
            // Path does not exist
            return false;
        }
        if (i === parts.length - 1) {
            // This is the target folder/file to delete
            parentLevel = (i === 0) ? window.userUploadedFolders : currentLevel; // if top-level, parent is window.userUploadedFolders itself
            // For subfolders, currentLevel is actually the parent of the item to be deleted,
            // and 'part' is the key in currentLevel.children.
            // Correction: currentLevel is the item itself if we iterate fully.
            // We need parent of currentLevel.
            if (i > 0) { // Subfolder
                let obj = window.userUploadedFolders;
                for(let k=0; k < parts.length -1; k++){
                    obj = obj[parts[k]]?.children;
                    if(!obj) return false; // parent path invalid
                }
                parentLevel = obj;
                partToDelete = part;
            } else { // Top-level folder
                 parentLevel = window.userUploadedFolders;
                 partToDelete = part;
            }

        } else {
            // Navigate deeper
            if (!currentLevel[part].children) {
                // Path component is not a folder or does not have children
                return false;
            }
            currentLevel = currentLevel[part].children;
        }
    }

    if (parentLevel && partToDelete && parentLevel[partToDelete]) {
        // Ensure the item to delete is a folder (as this function targets folders)
        if (parentLevel[partToDelete].type === 'folder') {
            delete parentLevel[partToDelete];
            return true;
        }
    }
    return false;
}


// --- DOMContentLoaded Listener and UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired from ui.js");
    const sidebarNav = document.getElementById('sidebar-nav');
    const documentsTbody = document.getElementById('documents-tbody'); // Keep for displayFolderContents
    const editFoldersButton = document.getElementById('edit-folders-button');
    const deleteSelectedFoldersButton = document.getElementById('delete-selected-folders-button');

    // Global `window.demoFilesData` is initialized at the top of ui.js
    // `fileLog` is now globally available as `window.fileLog` from `logging.js`.

    if (editFoldersButton && deleteSelectedFoldersButton) {
        editFoldersButton.addEventListener('click', () => {
            window.isEditModeActive = !window.isEditModeActive;
            const iconSpan = editFoldersButton.querySelector('.material-icons-outlined');

            if (window.isEditModeActive) {
                // Enter edit mode
                editFoldersButton.childNodes[editFoldersButton.childNodes.length - 1].nodeValue = " Cancel"; // Text node is usually the last child
                if (iconSpan) iconSpan.textContent = 'cancel';
                deleteSelectedFoldersButton.style.display = 'flex';
                renderSidebarForEditMode();
            } else {
                // Exit edit mode
                editFoldersButton.childNodes[editFoldersButton.childNodes.length - 1].nodeValue = " Edit"; // Text node is usually the last child
                if (iconSpan) iconSpan.textContent = 'edit';
                deleteSelectedFoldersButton.style.display = 'none';
                updateSidebarView(); // Redraw sidebar to remove edit mode UI
            }
        });
    }

    if (deleteSelectedFoldersButton && editFoldersButton) { // Ensure editFoldersButton is also available for UI reset
        deleteSelectedFoldersButton.addEventListener('click', () => {
            const foldersToDelete = [];
            const checkedCheckboxes = document.querySelectorAll('#sidebar-nav input[type="checkbox"]:checked');

            checkedCheckboxes.forEach(checkbox => {
                foldersToDelete.push(checkbox.dataset.folderPath);
            });

            if (foldersToDelete.length === 0) {
                showToast('No folders selected for deletion.', 'warning');
                return;
            }

            // Confirmation dialog for log entries
            const confirmLogDeletion = window.confirm("Do you also want to remove the log entries for the selected folder(s)? Clicking 'Cancel' will keep the logs.");
            // The variable 'confirmLogDeletion' will be used in the next step to conditionally call removeFolderEntriesFromLog.

            let deletedUserFolder = false;
            foldersToDelete.forEach(folderPath => {
                // Use the new helper function to delete user uploaded folders/subfolders
                if (deleteUserUploadedFolderPath(folderPath)) {
                    console.log(`User folder "${folderPath}" marked for deletion from UI data.`);
                    if (confirmLogDeletion) {
                        window.removeFolderEntriesFromLog(folderPath); // Call placeholder
                    }
                    deletedUserFolder = true;
                } else {
                    console.log(`Folder "${folderPath}" is not a user-uploaded folder, already deleted, or is a demo folder. Skipping deletion from UI data.`);
                    // Optionally alert user for demo/non-user folders if they were selectable (which they shouldn't be if logic is correct)
                    // if (folderPath.startsWith("demo_files")) {
                    //     alert(`The folder "${folderPath}" is a demo folder and cannot be deleted.`);
                    // }
                }
            });

            // Exit edit mode and update UI
            window.isEditModeActive = false;
            const editIconSpan = editFoldersButton.querySelector('.material-icons-outlined');
            editFoldersButton.childNodes[editFoldersButton.childNodes.length - 1].nodeValue = " Edit";
            if (editIconSpan) editIconSpan.textContent = 'edit';
            deleteSelectedFoldersButton.style.display = 'none';

            updateSidebarView();
            if (deletedUserFolder) { // Only update logs if a user folder was actually deleted
                displayActivityLog(); // Reflect that logs for the folder are (notionally) gone
                updateFileMonitoredCount(); // Reflect change in monitored files
            }
            displayFolderContents("demo_files"); // Default to demo_files view
            let alertMessage = "";
            if (confirmLogDeletion) {
                alertMessage = "Selected user folders and their log entries have been removed.";
            } else {
                alertMessage = "Selected user folders have been removed. Their log entries have been kept.";
            }
            showToast(alertMessage, 'success');
        });
    }

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
                showToast("No files selected or folder was empty.", 'warning');
                folderUploadInput.value = ''; // Clear input
                return;
            }
            console.log(`Starting pre-scan for ${files.length} files from selected folder (ui.js)...`);

            let filesToProcessForUpload = [];
            let detailedFiles = []; // To store { file, fullPath, currentHash, isDuplicate }

            for (const file of files) {
                const fullPath = file.webkitRelativePath;
                if (!fullPath) {
                    console.warn("File with no webkitRelativePath (ui.js). Skipping.", file.name);
                    continue;
                }
                filesToProcessForUpload.push({ file, fullPath });
            }

            if (filesToProcessForUpload.length === 0) {
                showToast("No processable files found in the selection.", 'warning');
                folderUploadInput.value = ''; // Clear input
                return;
            }

            console.log(`Processing ${filesToProcessForUpload.length} files for hashing...`);

            // --- BEGIN ENHANCED DUPLICATE DETECTION ---
            const existingUserFileHashes = new Set();
            const recursivelyCollectHashes = async (folderData) => {
                for (const key in folderData) {
                    const entry = folderData[key];
                    if (entry.type === 'file' && entry.fileObject) {
                        try {
                            const fileContent = await window.readFileAsText(entry.fileObject);
                            const hash = await window.generateSHA256(fileContent);
                            existingUserFileHashes.add(hash);
                        } catch (err) {
                            console.error(`Error reading or hashing existing user file ${entry.path} for duplicate check:`, err);
                        }
                    } else if (entry.type === 'folder' && entry.children) {
                        await recursivelyCollectHashes(entry.children);
                    }
                }
            };

            if (window.userUploadedFolders) {
                console.log("Pre-calculating hashes for existing user-uploaded files...");
                await recursivelyCollectHashes(window.userUploadedFolders);
                console.log(`Found ${existingUserFileHashes.size} unique hashes in userUploadedFolders.`);
            }
            // --- END ENHANCED DUPLICATE DETECTION ---

            for (const item of filesToProcessForUpload) {
                const { file, fullPath } = item;
                try {
                    const fileContent = await window.readFileAsText(file);
                    const currentHash = await window.generateSHA256(fileContent);
                    let isDuplicate = false;
                    let isReactivatingLog = false;

                    const logMatchEntry = window.fileLog ? window.fileLog.find(entry => entry.currentHash === currentHash) : null;

                    if (existingUserFileHashes.has(currentHash)) {
                        isDuplicate = true; // Duplicate within current user-managed files or simultaneous upload
                    } else if (logMatchEntry) {
                        if (window.isPathActivelyManaged(logMatchEntry.currentPath)) {
                            isDuplicate = true; // Log entry exists and is actively managed
                        } else {
                            isReactivatingLog = true; // Log entry exists but is not actively managed
                            // isDuplicate remains false for this specific condition, allowing re-addition
                        }
                    }
                    detailedFiles.push({ file, fullPath, currentHash, isDuplicate, isReactivatingLog, error: false });
                } catch (error) {
                    console.error(`Error processing file ${fullPath}:`, error);
                    // Optionally add to a list of errors to show to the user
                    detailedFiles.push({ file, fullPath, currentHash: null, isDuplicate: false, isReactivatingLog: false, error: true });
                }
            }

            let newFileEntries = detailedFiles.filter(f => !f.isDuplicate && !f.error); // Includes isReactivatingLog cases
            let duplicateFileEntries = detailedFiles.filter(f => f.isDuplicate && !f.error);
            let erroredFilesCount = detailedFiles.filter(f => f.error).length;
            let reactivatedLogsCount = newFileEntries.filter(f => f.isReactivatingLog).length; // Count reactivated files among those to be added

            let newFilesProcessedCount = 0; // Actual count of files added to userUploadedFolders structure
            let filesActuallyAddedToUserFolders = false; // Flag if any file (new or reactivated) is added

            // Adjust alert messages based on counts
            if (erroredFilesCount > 0) {
                showToast(`Encountered errors while processing ${erroredFilesCount} file(s). These will not be added.`, 'error');
            }

            // Determine main message based on what's being added or if all are duplicates
            if (newFileEntries.length > 0) { // Files to add (can be new or reactivating)
                // This block will be entered if there are files to add.
                // Specific messages about what was added will be constructed later.
            } else if (duplicateFileEntries.length > 0 && erroredFilesCount === 0) { // All valid files are duplicates
                showToast("All files in the selected folder are duplicates of existing, actively managed files and will not be added.", 'info');
            } else if (newFileEntries.length === 0 && duplicateFileEntries.length === 0 && erroredFilesCount === 0) {
                 if (detailedFiles.length === 0 && filesToProcessForUpload.length > 0) {
                     showToast("Could not process any of the selected files.", 'warning');
                } else if (detailedFiles.length === 0) {
                    showToast("No files were processed from the selection.", 'warning');
                }
            }
            // Further specific alerts will be handled after processing newFileEntries.


            if (newFileEntries.length > 0) {
                filesActuallyAddedToUserFolders = true; // Mark that we are attempting to add files
                for (const fileInfo of newFileEntries) {
                    const { file, fullPath, isReactivatingLog } = fileInfo; // Add isReactivatingLog here
                    // Existing path building logic, adapted for fileInfo:
                    const pathParts = fullPath.split('/');
                    let currentLevel = window.userUploadedFolders;
                    let currentBuiltPath = "";
                    let baseFolderName = pathParts[0];

                    if (!currentLevel[baseFolderName]) {
                        currentLevel[baseFolderName] = {
                            path: baseFolderName,
                            type: 'folder',
                            children: {}
                        };
                    }
                    currentLevel = currentLevel[baseFolderName].children;
                    currentBuiltPath = baseFolderName;

                    for (let i = 1; i < pathParts.length; i++) {
                        const part = pathParts[i];
                        currentBuiltPath += '/' + part;
                        if (i === pathParts.length - 1) { // File
                            if (!currentLevel[part] || currentLevel[part].type !== 'file') {
                                currentLevel[part] = {
                                    path: currentBuiltPath,
                                    type: 'file',
                                    fileObject: file, // Store the actual File object
                                    isReactivatingLog: isReactivatingLog || false // Add this line
                                };
                                newFilesProcessedCount++;
                            } else { // File already exists, potentially from a partial previous upload attempt or complex scenario
                                currentLevel[part].fileObject = file; // Update with fresh File object
                                currentLevel[part].isReactivatingLog = isReactivatingLog || false; // Update flag
                                console.log(`Updated fileObject for existing path during new file processing: ${currentBuiltPath}`);
                                // newFilesProcessedCount is for genuinely new additions to the structure if it wasn't there before.
                                // If it was there, this is an update.
                            }
                        } else { // Directory
                            if (!currentLevel[part] || currentLevel[part].type !== 'folder') {
                                currentLevel[part] = {
                                    path: currentBuiltPath,
                                    type: 'folder',
                                    children: {}
                                };
                            }
                            currentLevel = currentLevel[part].children;
                        }
                    }
                     if (pathParts.length === 1 && file.name) { // Handles webkitRelativePath being just "filename.txt"
                        const singleFilePart = file.name;
                        const singleFilePath = baseFolderName; // Which is the filename itself

                        // This logic implies window.userUploadedFolders[singleFilePath] was created as a folder.
                        // And currentLevel is its children. We need to add the file into that.
                        if (!currentLevel[singleFilePart] || currentLevel[singleFilePart].type !== 'file') {
                            currentLevel[singleFilePart] = {
                                path: singleFilePath + '/' + singleFilePart, // e.g. "file.txt/file.txt" - this path structure is kept from original
                                type: 'file',
                                fileObject: file,
                                isReactivatingLog: isReactivatingLog || false // Add this line
                            };
                            newFilesProcessedCount++;
                        } else {
                             currentLevel[singleFilePart].fileObject = file;
                             currentLevel[singleFilePart].isReactivatingLog = isReactivatingLog || false; // Update flag
                             console.log(`Updated fileObject for existing single file path during new file processing: ${currentLevel[singleFilePart].path}`);
                        }
                    }
                }
            }

            // Construct final user feedback messages
            let alertMessage = "";
            const genuineNewFilesCount = newFilesProcessedCount - reactivatedLogsCount; // Files that are not reactivations

            if (newFilesProcessedCount > 0 && reactivatedLogsCount === newFilesProcessedCount && genuineNewFilesCount === 0) {
                // Only reactivated files
                alertMessage = `Successfully re-added ${reactivatedLogsCount} file(s) found in existing logs.`;
            } else if (genuineNewFilesCount > 0 && reactivatedLogsCount > 0) {
                // Both new and reactivated files
                alertMessage = `Successfully added ${genuineNewFilesCount} new file(s). Additionally, ${reactivatedLogsCount} file(s) were found in existing logs and re-added.`;
            } else if (genuineNewFilesCount > 0 && reactivatedLogsCount === 0) {
                // Only new files (no reactivations)
                alertMessage = `Successfully added ${genuineNewFilesCount} new file(s).`;
            }
            // This condition means newFileEntries.length > 0 was true, so filesActuallyAddedToUserFolders is true.

            // Prepend duplicate message if some files were skipped due to being duplicates
            if (duplicateFileEntries.length > 0) {
                let duplicateMessage = `Some files were duplicates and not added. `;
                if (alertMessage) { // If there's already a message about added/reactivated files
                    alertMessage = duplicateMessage + alertMessage.charAt(0).toLowerCase() + alertMessage.slice(1);
                } else if (newFileEntries.length === 0 && erroredFilesCount === 0) {
                    // This means only duplicates were found, and no files to add, and no errors.
                    // The earlier specific alert for "all duplicates" would have been shown.
                    // However, if that alert was suppressed or we want a consolidated one here:
                    showToast(`All files in the selected folder are duplicates of existing, actively managed files and will not be added.`, 'info'); // Replacing the assignment to alertMessage
                    alertMessage = ""; // Clear alertMessage as it's handled by showToast
                } else {
                     alertMessage = duplicateMessage; // Only duplicates, other messages are not applicable.
                }
            }


            if (alertMessage) { // alertMessage might be empty if handled by the specific showToast above
                showToast(alertMessage, 'success');
            }
            // The case for "all files are duplicates" without any new/reactivated is handled by the main if/else if block for newFileEntries.length
            // The case for only errors is handled by the erroredFilesCount alert.
            // The case for "no processable files" is also handled.

            if (filesActuallyAddedToUserFolders) { // If any file (new or reactivated) was added to the structure
                console.log("User uploaded folders data updated (ui.js):", window.userUploadedFolders);
                updateSidebarView(); // Update sidebar
            }
            // An alert for "Folder structure updated. No brand new files..." might be redundant now with more specific messages.
            // Consider if filesActuallyAddedToUserFolders is true but newFilesProcessedCount is 0 (e.g. only updates to existing fileObjects, not new entries)
            // This specific scenario (updating fileObject for an already existing path in userUploadedFolders)
            // is less common for the primary "add folder" flow and might not need a distinct alert if newFilesProcessedCount remains the key metric for "added" files.


            folderUploadInput.value = ''; // Clear input regardless of outcome
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
                showToast("Error: Clear logs functionality is unavailable.", 'error');
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
                showToast("Scan functionality is not available.", 'error');
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

window.updateFileChangesGraph = function() {
    const data = window.getGraphData ? window.getGraphData() : [];

    const svgElement = document.getElementById('file-changes-graph-svg');
    const strokePathElement = document.getElementById('file-changes-graph-path');
    const fillPathElement = document.getElementById('file-changes-graph-fill-path');
    const xAxisContainer = document.getElementById('file-changes-graph-x-axis');

    if (!svgElement || !strokePathElement || !fillPathElement || !xAxisContainer) {
        console.warn('Graph elements not found. Skipping graph update.');
        return;
    }

    // Clear previous graph content
    strokePathElement.setAttribute('d', '');
    fillPathElement.setAttribute('d', '');
    xAxisContainer.innerHTML = ''; // Clear old labels

    if (!data || data.length < 2) {
        const placeholderText = document.createElement('p');
        placeholderText.textContent = 'Not enough data to display graph.';
        placeholderText.className = 'text-slate-400 text-center py-10';
        // Instead of appending to xAxisContainer, we might want a dedicated message area
        // For now, let's put it in the x-axis container for simplicity or hide the graph section.
        xAxisContainer.appendChild(placeholderText);
        // Optionally hide the SVG paths if showing message in x-axis area
        strokePathElement.style.display = 'none';
        fillPathElement.style.display = 'none';
        return;
    }

    strokePathElement.style.display = '';
    fillPathElement.style.display = '';

    const svgWidth = 475; // Effective width from viewBox (478 - 3, though -3 is an offset)
    const svgHeight = 150; // Height from viewBox
    const margin = { top: 20, right: 0, bottom: 20, left: 0 }; // Adjusted margins, viewBox handles left offset
    const graphWidth = svgWidth - margin.left - margin.right;
    const graphHeight = svgHeight - margin.top - margin.bottom;

    const parseTime = isoString => new Date(isoString).getTime(); // Get timestamp for scaling

    const firstTimestamp = parseTime(data[0].time);
    const lastTimestamp = parseTime(data[data.length - 1].time);

    const maxChanges = Math.max(...data.map(d => d.changes));

    // X scale: maps time to horizontal position
    const xScale = (time) => {
        if (lastTimestamp === firstTimestamp) return margin.left; // Avoid division by zero if only one unique timestamp
        return margin.left + ((parseTime(time) - firstTimestamp) / (lastTimestamp - firstTimestamp)) * graphWidth;
    };

    // Y scale: maps changes to vertical position (inverted for SVG)
    const yScale = (changes) => {
        if (maxChanges === 0) return svgHeight - margin.bottom; // Avoid division by zero
        return svgHeight - margin.bottom - (changes / maxChanges) * graphHeight;
    };

    // Generate stroke path string
    let pathD = `M ${xScale(data[0].time)} ${yScale(data[0].changes)}`;
    data.slice(1).forEach(point => {
        pathD += ` L ${xScale(point.time)} ${yScale(point.changes)}`;
    });
    strokePathElement.setAttribute('d', pathD);

    // Generate fill path string
    let fillPathD = `M ${xScale(data[0].time)} ${svgHeight - margin.bottom}`; // Start at bottom-left of first point
    data.forEach(point => {
        fillPathD += ` L ${xScale(point.time)} ${yScale(point.changes)}`;
    });
    fillPathD += ` L ${xScale(data[data.length - 1].time)} ${svgHeight - margin.bottom}`; // Line to bottom-right of last point
    fillPathD += ` Z`; // Close path
    fillPathElement.setAttribute('d', fillPathD);

    // Generate X-axis labels (e.g., 5 labels)
    const numLabels = 5;
    const labelIndices = [];
    if (data.length <= numLabels) {
        data.forEach((_, index) => labelIndices.push(index));
    } else {
        for (let i = 0; i < numLabels; i++) {
            labelIndices.push(Math.floor(i * (data.length - 1) / (numLabels - 1)));
        }
    }

    const uniqueLabelIndices = [...new Set(labelIndices)]; // Ensure unique indices if data.length is small

    uniqueLabelIndices.forEach(index => {
        const point = data[index];
        const date = new Date(point.time);
        const p = document.createElement('p');
        p.className = 'text-xs font-medium text-slate-400';
        // Format: "Mon DD" (e.g., "Jan 15")
        p.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        xAxisContainer.appendChild(p);
    });
};
