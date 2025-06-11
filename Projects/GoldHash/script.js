// In Projects/GoldHash/script.js

// Global variable for storing log data
let fileLog = []; // This should already exist
let userAddedFolders = []; // For storing user-added folder handles and metadata

// --- Core Hashing and ID Generation Functions --- (Keep as is)
async function generateSHA256(fileContentString) {
    if (typeof fileContentString !== 'string') {
        console.error('Invalid input to generateSHA256: Expected a string.');
        return null;
    }
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fileContentString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error generating SHA-256 hash:', error);
        return null;
    }
}

function generateAppUniqueID() {
    return 'app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getOSFileID(filePath) {
    try {
        if (typeof window !== 'undefined' && typeof process === 'undefined') {
            return "os-id-unavailable-browser";
        } else {
            return "os-id-simulated-" + Math.random().toString(36).substr(2, 5);
        }
    } catch (error) {
        console.error('Error trying to get OS File ID:', error.message, 'for path:', filePath);
        return "os-id-error";
    }
}
// --- End Core Hashing and ID Generation Functions ---

// --- UI Update Functions ---
function updateFileMonitoredCount() {
    const filesMonitoredElement = document.getElementById('files-monitored-count');
    if (filesMonitoredElement && fileLog) {
        filesMonitoredElement.textContent = fileLog.length.toLocaleString();
    }
}

function updateLogSizeDisplayOnLoad() {
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement && fileLog && fileLog.length > 0) {
        const approximateSize = JSON.stringify(fileLog).length / 1024;
        updateLogSizeDisplay(parseFloat(approximateSize.toFixed(2)));
    } else if (logSizeElement) {
        updateLogSizeDisplay(0);
    }
}

function loadLogsFromStorage() {
    const storedLogs = localStorage.getItem('goldHashLog');
    if (storedLogs) {
        fileLog = JSON.parse(storedLogs);
        console.log("Logs loaded from localStorage.");
    } else {
        console.log("No logs found in localStorage. Initializing empty log.");
        fileLog = [];
    }
}

function updateLastScanTime() {
    const lastScanElement = document.querySelector('.mt-auto.space-y-2.border-t p.text-xs');
    if (lastScanElement) {
        lastScanElement.textContent = 'Last scan: ' + new Date().toLocaleString();
    }
}

function updateLogSizeDisplay(sizeInKB) {
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement) {
        logSizeElement.textContent = sizeInKB + " KB";
    }
}

function clearLogs() {
    console.log("Clearing logs...");
    fileLog = [];
    localStorage.removeItem('goldHashLog');
    updateLogSizeDisplay(0);
    updateFileMonitoredCount();
    displayActivityLog(fileLog);
    displayDocumentFiles("");
    console.log("Logs cleared.");
    alert("Logs have been cleared. Scan log will be emptied by environment if applicable.");
}


// Renamed and modified from displayLoggedFiles
function displayActivityLog(logEntriesToDisplay) {
    const activityTbody = document.getElementById('activity-tbody');
    if (!activityTbody) {
        console.error("Activity table body not found!");
        return;
    }
    activityTbody.innerHTML = '';

    if (!logEntriesToDisplay || logEntriesToDisplay.length === 0) {
        const tr = activityTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No activity to display.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    const entriesToDisplayOrdered = [...logEntriesToDisplay].reverse();

    entriesToDisplayOrdered.forEach(entry => {
        const tr = activityTbody.insertRow();

        const nameTd = tr.insertCell();
        nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
        nameTd.textContent = entry.currentPath.substring(entry.currentPath.lastIndexOf('/') + 1);

        const statusTd = tr.insertCell();
        statusTd.className = 'whitespace-nowrap px-6 py-4 text-sm';
        statusTd.textContent = entry.status;
        switch (entry.status) {
            case 'modified': statusTd.classList.add('text-yellow-400'); break;
            case 'newly_added': statusTd.classList.add('text-blue-400'); break;
            case 'verified': statusTd.classList.add('text-green-400'); break;
            default: statusTd.classList.add('text-slate-300');
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
        pathTd.title = entry.currentPath;
    });
}

// New function to display files in the "Documents" section for a specific folder
function displayDocumentFiles(folderPath) {
    const documentsTbody = document.getElementById('documents-tbody');
    if (!documentsTbody) {
        console.error("Documents table body not found!");
        return;
    }
    documentsTbody.innerHTML = '';

    if (!fileLog || fileLog.length === 0) {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No files monitored. Scan demo files or add a folder.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    let filesInFolder = [];
    if (folderPath && folderPath !== "demo_files" && folderPath !== "") {
        filesInFolder = fileLog.filter(entry => {
            const parentPath = entry.currentPath.substring(0, entry.currentPath.lastIndexOf('/'));
            return parentPath === folderPath;
        });
    } else if (folderPath === "demo_files") {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'Select a specific sub-folder to view its documents.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    } else {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'Select a folder from the sidebar to view its documents.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    if (filesInFolder.length === 0 && folderPath && folderPath !== "demo_files") {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No files found in this folder.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
    } else {
        filesInFolder.forEach(entry => {
            const tr = documentsTbody.insertRow();
            tr.className = 'hover:bg-[#1A2B3A]';

            const nameTd = tr.insertCell();
            nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
            nameTd.textContent = entry.currentPath.substring(entry.currentPath.lastIndexOf('/') + 1);

            const statusTd = tr.insertCell();
            statusTd.className = 'whitespace-nowrap px-6 py-4 text-sm';
            statusTd.textContent = entry.status;
            switch (entry.status) {
                case 'modified': statusTd.classList.add('text-yellow-400'); break;
                case 'newly_added': statusTd.classList.add('text-blue-400'); break;
                case 'verified': statusTd.classList.add('text-green-400'); break;
                default: statusTd.classList.add('text-slate-300');
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
            pathTd.title = entry.currentPath;
        });
    }
}

function displayFolderContents(folderPath) {
    const mainContent = document.querySelector('main.ml-80');
    const fileContentDiv = document.getElementById('file-content-display');
    if (fileContentDiv) {
        fileContentDiv.style.display = 'none';
    }
    const sectionsToUnhide = mainContent.querySelectorAll('main > section');
    sectionsToUnhide.forEach(section => {
         section.style.display = 'block';
    });
    displayDocumentFiles(folderPath);
}

function displayFileContent(filePath) {
    const parts = filePath.split('/');
    let currentLevel = demoFilesData;
    for (let i = 0; i < parts.length; i++) {
        if (currentLevel[parts[i]] && currentLevel[parts[i]].children) {
            currentLevel = currentLevel[parts[i]].children;
        } else if (currentLevel[parts[i]] && currentLevel[parts[i]].type === 'file') {
            currentLevel = currentLevel[parts[i]];
            break;
        } else if (i === 0 && demoFilesData[parts[i]]){
             currentLevel = demoFilesData[parts[i]];
        }
         else {
            currentLevel = null;
            break;
        }
    }

    const content = currentLevel?.content;
    const parentFolderPath = parts.slice(0, -1).join('/');
    const mainContent = document.querySelector('main.ml-80');

    if (content && mainContent) {
        const sectionsToHide = mainContent.querySelectorAll('main > section');
        sectionsToHide.forEach(section => section.style.display = 'none');

        let fileContentDiv = document.getElementById('file-content-display');
        if (!fileContentDiv) {
            fileContentDiv = document.createElement('div');
            fileContentDiv.id = 'file-content-display';
            fileContentDiv.className = 'p-8 text-slate-100';
            const header = mainContent.querySelector('header');
            if (header) {
                header.insertAdjacentElement('afterend', fileContentDiv);
            } else {
                mainContent.appendChild(fileContentDiv);
            }
        }
        fileContentDiv.style.display = 'block';

        const pre = document.createElement('pre');
        pre.textContent = content;

        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Files';
        backButton.className = 'mb-4 px-4 py-2 bg-[#0c7ff2] text-white rounded hover:bg-blue-600 transition-colors';
        backButton.onclick = () => {
            sectionsToHide.forEach(section => section.style.display = 'block');
            fileContentDiv.style.display = 'none';
            displayDocumentFiles(parentFolderPath);
        };

        fileContentDiv.innerHTML = '';
        fileContentDiv.appendChild(backButton);
        fileContentDiv.appendChild(pre);
    } else {
        console.error('File content not found for path:', filePath, "or demoFilesData structure error.");
    }
}

// --- User Added Folders ---
function saveUserAddedFoldersToStorage() {
    const foldersToStore = userAddedFolders.map(folder => ({
        name: folder.name,
        path: folder.path
        // Do not store 'handle' directly as it's not serializable
    }));
    localStorage.setItem('userAddedFolders', JSON.stringify(foldersToStore));
}

function loadUserAddedFoldersFromStorage() {
    const storedFolders = localStorage.getItem('userAddedFolders');
    if (storedFolders) {
        userAddedFolders = JSON.parse(storedFolders).map(folder => ({
            ...folder,
            handle: null, // Handle needs to be re-acquired if needed
            type: 'user-folder' // Add type for consistency
        }));
        console.log("User added folders loaded from localStorage.");
    } else {
        console.log("No user added folders found in localStorage.");
        userAddedFolders = [];
    }
}

function displayUserAddedFoldersInSidebar() {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) {
        console.error("Sidebar nav not found for user folders!");
        return;
    }
    // Simple approach: add to existing nav. Could be enhanced with a separator or new section.
    userAddedFolders.forEach(folder => {
        // Ensure it's not already added (e.g., if this function is called multiple times)
        if (!document.querySelector(`#sidebar-nav a[data-folder-path="${folder.path}"]`)) {
            // Use a modified version of createSidebarEntry or a new function if structure is very different
            // For now, let's assume createSidebarEntry can handle it with the correct type
            createSidebarEntry(folder.name, folder.path, folder.type || 'folder', 0, sidebarNav, true);
             // The 'true' for isTopLevel might need adjustment based on desired sidebar structure
        }
    });
}

let demoFilesData;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    const sidebarNav = document.getElementById('sidebar-nav');

    loadUserAddedFoldersFromStorage(); // Load user folders first

    demoFilesData = {
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

    loadLogsFromStorage();
    displayActivityLog(fileLog);
    displayUserAddedFoldersInSidebar(); // Display loaded user folders

    updateFileMonitoredCount();
    updateLogSizeDisplayOnLoad();

    // Event Listener for Add Folder button
    const addFolderButton = document.getElementById('add-folder-button');
    if (addFolderButton) {
        addFolderButton.addEventListener('click', async () => {
            try {
                const directoryHandle = await window.showDirectoryPicker();
                if (directoryHandle) {
                    // Check if folder already exists (by path, which we'll derive from name for simplicity here)
                    // More robust path generation might be needed in a real app.
                    const folderPath = `user/${directoryHandle.name}`; // Simulate a path
                    const existingFolder = userAddedFolders.find(f => f.path === folderPath);

                    if (existingFolder) {
                        alert(`Folder "${directoryHandle.name}" is already added.`);
                        return;
                    }

                    const newFolder = {
                        name: directoryHandle.name,
                        path: folderPath, // This path is conceptual for the browser.
                        handle: directoryHandle, // Keep the handle for scanning
                        type: 'user-folder' // Distinguish from demo folders
                    };
                    userAddedFolders.push(newFolder);
                    saveUserAddedFoldersToStorage();
                    // Add to sidebar immediately
                    createSidebarEntry(newFolder.name, newFolder.path, newFolder.type, 0, sidebarNav, true);

                    // Optionally, trigger a scan or display its contents
                    // For now, just adding to sidebar. User can click to view/scan.
                    alert(`Folder "${directoryHandle.name}" added. You can now select it in the sidebar.`);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log("User cancelled folder selection.");
                } else {
                    console.error("Error adding folder:", error);
                    alert("Error adding folder. See console for details.");
                }
            }
        });
    }

    let activeSubFolderLink = null;

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

    function createSidebarEntry(name, path, type, indentLevel = 0, parentContainer, isTopLevel = false) {
        const entryDiv = document.createElement('div');
        entryDiv.style.marginLeft = `${indentLevel * 20}px`;

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1A2B3A]';
        link.dataset.folderPath = path;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons-outlined text-slate-400';
        iconSpan.style.fontSize = '20px';
        // Adjust icon based on type
        if (type === 'user-folder') {
            iconSpan.textContent = 'folder_special'; // Example for user folder
        } else if (type === 'folder') {
            iconSpan.textContent = 'folder';
        } else {
            iconSpan.textContent = 'description';
        }

        link.appendChild(iconSpan);
        link.appendChild(document.createTextNode(` ${name}`));
        entryDiv.appendChild(link);
        parentContainer.appendChild(entryDiv);

        const subfoldersContainer = document.createElement('div');
        subfoldersContainer.className = 'subfolder-container';
        if (path === "demo_files" || type === 'user-folder') { // User folders are also top-level initially, no sub-sub-folders for them in this iteration
            subfoldersContainer.style.display = 'none'; // Children (if any for user folders) start hidden
        } else {
            subfoldersContainer.style.display = isTopLevel ? 'block' : 'none';
        }

        entryDiv.appendChild(subfoldersContainer);

        if (type === 'folder' || type === 'user-folder') { // Handle clicks for demo folders and user folders
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (path === "demo_files") {  // Special handling for the root "demo_files"
                    const isHidden = subfoldersContainer.style.display === 'none';
                    subfoldersContainer.style.display = isHidden ? 'block' : 'none';
                    iconSpan.textContent = isHidden ? 'folder_open' : (type === 'user-folder' ? 'folder_special' : 'folder');
                    clearActiveStates();
                    setActiveState(link);
                    activeSubFolderLink = null;
                    displayFolderContents(path); // Show "select subfolder" message for demo_files
                } else if (type === 'user-folder') { // User-added folders
                    clearActiveStates();
                    setActiveState(link);
                    activeSubFolderLink = link; // Track active user folder
                    displayFolderContents(path); // Display contents (which will be empty until scanned and fileLog populated for this path)
                } else { // This is a subfolder of "demo_files"
                    clearActiveStates();
                    const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                    if (demoFilesEntryLink) {
                        setActiveState(demoFilesEntryLink);
                        const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                        if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open';
                        const parentDemoSubfolderContainer = demoFilesEntryLink.closest('div').querySelector('.subfolder-container');
                        if (parentDemoSubfolderContainer) parentDemoSubfolderContainer.style.display = 'block';
                    }
                    setActiveState(link);
                    activeSubFolderLink = link;
                    displayFolderContents(path);
                }
            });
        } else if (type === 'file') { // File clicks (currently only for demo files)
            link.addEventListener('click', (e) => {
                e.preventDefault();
                 clearActiveStates();
                 // Potentially highlight parent folder as well
                 setActiveState(link);
                 displayFileContent(path);
            });
        }
        return subfoldersContainer;
    }

    function loadDemoFolders() {
        if (!sidebarNav) return;
        sidebarNav.innerHTML = '';

        Object.keys(demoFilesData).forEach(itemName => {
            const item = demoFilesData[itemName];
            const itemContainer = createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true);
            if (item.type === 'folder' && item.children) {
                Object.keys(item.children).forEach(subItemName => {
                    const subItem = item.children[subItemName];
                    createSidebarEntry(subItemName, subItem.path, subItem.type, 1, itemContainer);
                });
            }
        });

        const firstDemoSubfolderPath = demoFilesData.demo_files?.children
            ? Object.values(demoFilesData.demo_files.children)[0]?.path
            : null;

        if (firstDemoSubfolderPath) {
            displayFolderContents(firstDemoSubfolderPath);

            setTimeout(() => {
                const firstSubfolderLink = document.querySelector(`#sidebar-nav a[data-folder-path="${firstDemoSubfolderPath}"]`);
                const demoFilesLinkElement = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');

                if (demoFilesLinkElement) {
                    setActiveState(demoFilesLinkElement);
                    const demoFilesDiv = demoFilesLinkElement.closest('div');
                    if (demoFilesDiv) {
                        const subContainer = demoFilesDiv.querySelector('.subfolder-container');
                        if (subContainer) subContainer.style.display = 'block';
                        const icon = demoFilesLinkElement.querySelector('.material-icons-outlined');
                        if (icon) icon.textContent = 'folder_open';
                    }
                }
                if (firstSubfolderLink) {
                    setActiveState(firstSubfolderLink);
                    activeSubFolderLink = firstSubfolderLink;
                }
            }, 0);
        } else {
            displayFolderContents("demo_files");
            const demoFilesLinkElement = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
            if (demoFilesLinkElement) setActiveState(demoFilesLinkElement);
        }
    }

    loadDemoFolders();

    // Helper function to recursively collect files from a user-selected directory handle
    async function _collectFilesFromUserFolder(folderHandle, basePath, filesArray) {
        try {
            for await (const entry of folderHandle.values()) {
                const entryPath = `${basePath}/${entry.name}`;
                if (entry.kind === 'file') {
                    try {
                        const file = await entry.getFile();
                        const content = await file.text(); // Or handle binary files appropriately
                        filesArray.push({ path: entryPath, content: content, source: "user" });
                    } catch (fileError) {
                        console.error(`Error reading file ${entryPath}:`, fileError);
                        // Optionally, add a log entry indicating this file couldn't be processed
                        const errorEntry = {
                            appID: generateAppUniqueID(),
                            osID: "os-id-error",
                            currentPath: entryPath,
                            initialDiscoveryTime: new Date().toISOString(),
                            lastHashCheckTime: new Date().toISOString(),
                            lastModifiedSystem: new Date().toISOString(),
                            currentHash: "ERROR_READING_FILE",
                            hashHistory: [],
                            status: 'error_reading'
                        };
                        // Decide if you want to push error entries to fileLog directly or handle differently
                        // For now, just logging the error.
                    }
                } else if (entry.kind === 'directory') {
                    await _collectFilesFromUserFolder(entry, entryPath, filesArray);
                }
            }
        } catch (error) {
            console.error(`Error iterating folder ${basePath}:`, error);
            // Could create a log entry for the folder itself if iteration fails
        }
    }


    async function scanFiles() {
        console.log("Starting file scan...");
        const currentTime = new Date().toISOString();
        let filesToProcess = [];

        // 1. Process Demo Files
        function _internalCollectDemoFiles(currentLevelChildren) {
            for (const key in currentLevelChildren) {
                const item = currentLevelChildren[key];
                if (item.type === 'file') {
                    filesToProcess.push({ path: item.path, content: item.content || "", source: "demo" });
                } else if (item.type === 'folder' && item.children) {
                    _internalCollectDemoFiles(item.children);
                }
            }
        }
        if (demoFilesData && demoFilesData.demo_files && demoFilesData.demo_files.children) {
            _internalCollectDemoFiles(demoFilesData.demo_files.children);
        }

        // 2. Process User Added Folders
        for (const userFolder of userAddedFolders) {
            if (userFolder.handle) { // Only scan if we have a live handle
                console.log(`Scanning user folder: ${userFolder.path}`);
                await _collectFilesFromUserFolder(userFolder.handle, userFolder.path, filesToProcess);
            } else {
                console.warn(`Skipping scan for ${userFolder.path}: No active directory handle. Please re-add the folder if you want to scan it.`);
                // Optionally, create a specific log entry for this folder indicating it needs re-adding.
            }
        }

        console.log(`Total files to process (demo + user): ${filesToProcess.length}`);
        if (filesToProcess.length === 0 && userAddedFolders.length > 0 && userAddedFolders.every(f => !f.handle)) {
             alert("No files were scanned. If you added folders in a previous session, you might need to re-add them to grant access for scanning.");
        }


        let newFilesAdded = 0, filesModified = 0, filesVerified = 0;

        for (const fileItem of filesToProcess) {
            const existingLogEntryIndex = fileLog.findIndex(entry => entry.currentPath === fileItem.path);

            if (existingLogEntryIndex !== -1) {
                const logEntry = fileLog[existingLogEntryIndex];
                const newHash = await generateSHA256(fileItem.content);
                if (newHash === null) { console.error(`Skipping ${fileItem.path} (hash error).`); continue; }

                if (logEntry.currentHash !== newHash) {
                    logEntry.hashHistory.push(logEntry.currentHash);
                    logEntry.currentHash = newHash;
                    logEntry.status = 'modified';
                    logEntry.lastModifiedSystem = currentTime;
                    logEntry.lastHashCheckTime = currentTime;
                    filesModified++;
                } else {
                    logEntry.status = 'verified';
                    logEntry.lastHashCheckTime = currentTime;
                    filesVerified++;
                }
            } else {
                const appID = generateAppUniqueID();
                const osID = getOSFileID(fileItem.path);
                const currentHash = await generateSHA256(fileItem.content);
                if (currentHash === null) { console.error(`Skipping new ${fileItem.path} (hash error).`); continue; }

                const newLogEntry = {
                    appID, osID, currentPath: fileItem.path, initialDiscoveryTime: currentTime,
                    lastHashCheckTime: currentTime, lastModifiedSystem: currentTime,
                    currentHash, hashHistory: [], status: 'newly_added'
                };
                fileLog.push(newLogEntry);
                newFilesAdded++;
            }
        }

        localStorage.setItem('goldHashLog', JSON.stringify(fileLog));
        updateFileMonitoredCount();
        updateLogSizeDisplayOnLoad();
        updateLastScanTime();

        const filesChangedElement = document.querySelector('div.grid div:nth-child(2) p.text-3xl');
        if (filesChangedElement) {
            const modifiedCount = fileLog.filter(entry => entry.status === 'modified').length;
            filesChangedElement.textContent = modifiedCount.toLocaleString();
        }

        let currentActiveDocFolderPath = "";
        if (activeSubFolderLink && activeSubFolderLink.dataset.folderPath) {
            currentActiveDocFolderPath = activeSubFolderLink.dataset.folderPath;
        } else {
            const demoFilesLinkActive = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"].bg-\[\#1A2B3A\].text-white');
            if (demoFilesLinkActive) {
                 currentActiveDocFolderPath = "demo_files";
            }
        }
        displayDocumentFiles(currentActiveDocFolderPath);

        displayActivityLog(fileLog);

        console.log(`Scan complete. New: ${newFilesAdded}, Mod: ${filesModified}, Ver: ${filesVerified}.`);
        alert(`Scan Complete!\nNew: ${newFilesAdded}, Modified: ${filesModified}, Verified: ${filesVerified}`);
    }

    const scanButton = document.getElementById('scan-files-button');
    if (scanButton) {
        scanButton.addEventListener('click', async () => {
            await scanFiles();
        });
    }

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
    const clearLogsButton = document.getElementById('clear-logs-button');
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', (event) => {
            event.preventDefault();
            clearLogs();
            settingsContextMenu.classList.add('hidden');
        });
    }
});
