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
    // Reset documents view to a default state, e.g. for "demo_files" or empty
    const activeDemoFilesLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
    if (activeDemoFilesLink) {
        displayDocumentFiles("demo_files"); // Or a specific subfolder if that's the default
    } else {
        displayDocumentFiles(""); // Clears the documents table or shows a generic message
    }
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
            case 'error_reading': statusTd.classList.add('text-red-500'); break;
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

function displayDocumentFiles(folderPath) {
    const documentsTbody = document.getElementById('documents-tbody');
    if (!documentsTbody) {
        console.error("Documents table body not found!");
        return;
    }
    documentsTbody.innerHTML = '';
    let filesToList = [];

    const createRow = (file) => {
        const tr = documentsTbody.insertRow();
        tr.className = 'hover:bg-[#1A2B3A]';

        const nameTd = tr.insertCell();
        nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
        nameTd.textContent = file.name;

        const statusTd = tr.insertCell();
        statusTd.className = 'whitespace-nowrap px-6 py-4 text-sm';
        statusTd.textContent = file.status;
        if (file.status === 'Never Scanned') {
            statusTd.classList.add('text-slate-400');
        } else {
            switch (file.status) {
                case 'modified': statusTd.classList.add('text-yellow-400'); break;
                case 'newly_added': statusTd.classList.add('text-blue-400'); break;
                case 'verified': statusTd.classList.add('text-green-400'); break;
                case 'error_reading': statusTd.classList.add('text-red-500'); break;
                default: statusTd.classList.add('text-slate-300');
            }
        }

        const hashTd = tr.insertCell();
        hashTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 font-mono';
        hashTd.textContent = file.hash && file.hash !== 'N/A' ? file.hash.substring(0, 12) + '...' : 'N/A';
        hashTd.title = file.hash && file.hash !== 'N/A' ? file.hash : "";

        const lastCheckedTd = tr.insertCell();
        lastCheckedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
        lastCheckedTd.textContent = file.lastChecked;

        const pathTd = tr.insertCell();
        pathTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300 overflow-hidden text-ellipsis';
        pathTd.textContent = file.path;
        pathTd.title = file.path;
    };

    if (folderPath.startsWith("demo_files")) { // Covers "demo_files" and "demo_files/Subfolder"
        const parts = folderPath.split('/');
        let currentLevel = demoFilesData;
        let targetName = parts[parts.length-1];

        if (folderPath === "demo_files") { // Special case for the root "demo_files"
            currentLevel = demoFilesData.demo_files.children;
        } else { // For subfolders like "demo_files/Jokes Folder 1"
            // Traverse to the correct folder in demoFilesData
            // parts[0] is "demo_files", parts[1] is "Jokes Folder 1", etc.
            let tempCurrentLevel = demoFilesData.demo_files.children;
            for (let i = 1; i < parts.length; i++) { // Start from 1 to skip "demo_files" itself
                if (tempCurrentLevel && tempCurrentLevel[parts[i]] && tempCurrentLevel[parts[i]].type === 'folder') {
                    tempCurrentLevel = tempCurrentLevel[parts[i]].children;
                } else {
                    tempCurrentLevel = null; // Path not found or not a folder
                    break;
                }
            }
            currentLevel = tempCurrentLevel;
        }

        if (currentLevel && typeof currentLevel === 'object') {
            Object.values(currentLevel).forEach(item => {
                if (item.type === 'file') {
                    const logEntry = fileLog.find(entry => entry.currentPath === item.path);
                    if (logEntry) {
                        filesToList.push({
                            name: item.path.substring(item.path.lastIndexOf('/') + 1),
                            status: logEntry.status,
                            hash: logEntry.currentHash,
                            lastChecked: logEntry.lastHashCheckTime ? new Date(logEntry.lastHashCheckTime).toLocaleString() : 'N/A',
                            path: item.path
                        });
                    } else {
                        filesToList.push({
                            name: item.path.substring(item.path.lastIndexOf('/') + 1),
                            status: 'Never Scanned',
                            hash: 'N/A',
                            lastChecked: 'N/A',
                            path: item.path
                        });
                    }
                }
            });
        }
    } else if (folderPath.startsWith("user/")) {
        // For user folders, list files found in fileLog.
        // Pre-scan listing from handle is complex for sync display; handled by "scan to see files" message.
        const filesFromLogForUserFolder = fileLog.filter(entry => {
            // Check if entry.currentPath starts with folderPath + "/" or is exactly folderPath (if folderPath itself is a file, though unlikely for folders)
            return entry.currentPath.startsWith(folderPath + "/") || entry.currentPath === folderPath;
        });

        if (filesFromLogForUserFolder.length > 0) {
            filesFromLogForUserFolder.forEach(logEntry => {
                 // Ensure we only list direct children if folderPath is a directory path
                const relativePath = logEntry.currentPath.substring(folderPath.length + 1);
                if (!relativePath.includes('/')) { // Only direct children
                    filesToList.push({
                        name: logEntry.currentPath.substring(logEntry.currentPath.lastIndexOf('/') + 1),
                        status: logEntry.status,
                        hash: logEntry.currentHash,
                        lastChecked: logEntry.lastHashCheckTime ? new Date(logEntry.lastHashCheckTime).toLocaleString() : 'N/A',
                        path: logEntry.currentPath
                    });
                }
            });
        }
        // Message for empty or unscanned user folders will be handled by the generic block below
    }

    if (filesToList.length > 0) {
        filesToList.sort((a, b) => a.name.localeCompare(b.name)); // Sort files alphabetically by name
        filesToList.forEach(createRow);
    } else if (folderPath && folderPath !== "") {
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        if (folderPath === "demo_files") {
             cell.textContent = 'Select a specific sub-folder to view its documents.';
        } else if (folderPath.startsWith("user/")) {
            const userFolderExists = userAddedFolders.some(f => f.path === folderPath);
            if (userFolderExists) {
                 cell.textContent = 'Folder is empty or has not been scanned yet. Click "Scan" to populate.';
            } else {
                 cell.textContent = 'This user folder is not recognized or no longer accessible.';
            }
        } else {
             cell.textContent = 'No files found in this folder, or folder is empty.';
        }
        cell.className = 'px-6 py-4 text-center text-slate-400';
    } else { // Default message when no folderPath is specified or it's empty
        const tr = documentsTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'Select a folder from the sidebar to view its documents.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
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
    // Traverse demoFilesData to find the file content
    // This logic assumes file content is only for demo files
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "demo_files" && i === 0) { // Start with the 'demo_files' root
            currentLevel = demoFilesData.demo_files;
            if (parts.length === 1) break; // Path is just "demo_files"
            currentLevel = currentLevel.children; // Move to children of "demo_files"
        } else if (currentLevel && currentLevel[parts[i]]) {
            currentLevel = currentLevel[parts[i]];
            if (currentLevel.type === 'file') break; // Found the file
            if (currentLevel.type === 'folder') currentLevel = currentLevel.children; // Move to children of this folder
        } else {
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
            // When going back, call displayDocumentFiles for the parent folder
            // This ensures the "Documents" section is correctly re-rendered.
            displayDocumentFiles(parentFolderPath);
        };

        fileContentDiv.innerHTML = '';
        fileContentDiv.appendChild(backButton);
        fileContentDiv.appendChild(pre);
    } else {
        console.error('File content not found for path:', filePath, "or demoFilesData structure error.");
        alert('File content not found. This feature is primarily for demo files.');
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
            createSidebarEntry(folder.name, folder.path, folder.type || 'folder', folder, 0, sidebarNav, true);
        }
    });
}

function createSidebarEntry(name, path, type, currentItemObject, indentLevel = 0, parentContainer, isTopLevel = false) {
    const entryDiv = document.createElement('div');
    entryDiv.style.marginLeft = `${indentLevel * 20}px`;

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1A2B3A]';
    link.dataset.folderPath = path;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-icons-outlined text-slate-400';
    iconSpan.style.fontSize = '20px';

    if (type === 'user-folder') {
        iconSpan.textContent = 'folder_special';
    } else if (type === 'folder') {
        iconSpan.textContent = 'folder';
    } else {
        iconSpan.textContent = 'description'; // File
    }

    link.appendChild(iconSpan);
    link.appendChild(document.createTextNode(` ${name}`));
    entryDiv.appendChild(link);
    parentContainer.appendChild(entryDiv);

    const subfoldersContainer = document.createElement('div');
    subfoldersContainer.className = 'subfolder-container';

    // User folders are top-level and don't have expandable sub-folders in this design
    // Demo files root is expandable. Its children (sub-folders) are not further expandable.
    if (path === "demo_files") {
        subfoldersContainer.style.display = 'none'; // demo_files children start hidden
    } else if (type === 'folder' && currentItemObject && currentItemObject.children) { // A demo sub-folder
         subfoldersContainer.style.display = 'none'; // No sub-sub-folders for demo files shown
    } else {
        // User folders and files don't have subfolder containers or are not expandable
         subfoldersContainer.style.display = 'none';
    }

    entryDiv.appendChild(subfoldersContainer);

    if (type === 'folder' || type === 'user-folder') {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarManager.clearActiveStates();
            sidebarManager.setActiveState(link);
            activeSubFolderLink = link;

            if (path === "demo_files") {
                const isHidden = subfoldersContainer.style.display === 'none';
                subfoldersContainer.style.display = isHidden ? 'block' : 'none';
                iconSpan.textContent = isHidden ? 'folder_open' : 'folder';
                displayFolderContents(path);
            } else if (type === 'user-folder') {
                // For user folders, ensure the "demo_files" entry is closed if it was open
                const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                if (demoFilesEntryLink) {
                    const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                    if (demoFilesIcon) demoFilesIcon.textContent = 'folder';
                    const parentDemoSubfolderContainer = demoFilesEntryLink.closest('div').querySelector('.subfolder-container');
                    if (parentDemoSubfolderContainer) parentDemoSubfolderContainer.style.display = 'none';
                }
                displayFolderContents(path);
            } else { // This is a subfolder of "demo_files"
                const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                if (demoFilesEntryLink) {
                    sidebarManager.setActiveState(demoFilesEntryLink); // Keep "demo_files" highlighted as parent
                    const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                    if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open';
                    const parentDemoSubfolderContainer = demoFilesEntryLink.closest('div').querySelector('.subfolder-container');
                    if (parentDemoSubfolderContainer) parentDemoSubfolderContainer.style.display = 'block';
                }
                sidebarManager.setActiveState(link); // Then highlight the actual subfolder
                displayFolderContents(path);
            }
        });
    } else if (type === 'file') {
        link.addEventListener('click', (e) => {
            e.preventDefault();
             sidebarManager.clearActiveStates();
             // Highlight parent folder and this file link
             const parentPath = path.substring(0, path.lastIndexOf('/'));
             const parentLink = document.querySelector(`#sidebar-nav a[data-folder-path="${parentPath}"]`);
             sidebarManager.setActiveState(parentLink);
             sidebarManager.setActiveState(link);
             displayFileContent(path);
        });
    }
    return subfoldersContainer;
}

let demoFilesData;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    const sidebarNav = document.getElementById('sidebar-nav');

    // Order of operations on DOMContentLoaded:
    // 1. Load data from localStorage (logs, user folders)
    // 2. Display logs (Activity Log)
    // 3. Define demoFilesData
    // 4. Render sidebar (demo folders first, then user folders)
    // 5. Determine and set initial folder view in Documents section
    // 6. Update UI counts/stats

    loadLogsFromStorage();
    displayActivityLog(fileLog); // Display activity early

    loadUserAddedFoldersFromStorage(); // Loads user folder data

    demoFilesData = { // Define demo data
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

    // loadDemoFolders will now handle initial sidebar rendering for demo files,
    // then user files, then determine and set the initial documents view.
    loadDemoFolders();

    updateFileMonitoredCount();
    updateLogSizeDisplayOnLoad();

    // Event Listener for Add Folder button
    const addFolderButton = document.getElementById('add-folder-button');
    if (addFolderButton) {
        addFolderButton.addEventListener('click', async () => {
            try {
                if (typeof window.showDirectoryPicker !== 'function') {
                    alert("Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.");
                    return;
                }
                const directoryHandle = await window.showDirectoryPicker();
                if (directoryHandle) {
                    const folderPath = `user/${directoryHandle.name}`;
                    const existingFolder = userAddedFolders.find(f => f.path === folderPath);

                    if (existingFolder) {
                        alert(`Folder "${directoryHandle.name}" is already added.`);
                        return;
                    }

                    const newFolder = {
                        name: directoryHandle.name,
                        path: folderPath,
                        handle: directoryHandle,
                        type: 'user-folder'
                    };
                    userAddedFolders.push(newFolder);
                    saveUserAddedFoldersToStorage();
                    createSidebarEntry(newFolder.name, newFolder.path, newFolder.type, newFolder, 0, sidebarNav, true);
                    alert(`Folder "${directoryHandle.name}" added. You can now select it in the sidebar. Please scan to see its files.`);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log("User cancelled folder selection.");
                } else {
                    console.error("Error adding folder:", error);
                    alert("Error adding folder. See console for details. Your browser might not support this feature or there was a permission issue.");
                }
            }
        });
    }

    const sidebarManager = {};

    sidebarManager.clearActiveStates = function() {
        document.querySelectorAll('#sidebar-nav a, #sidebar-nav div[data-folder-path]').forEach(link => {
            link.classList.remove('bg-[#1A2B3A]', 'text-white');
            if (link.tagName === 'A' || link.dataset.folderPath) {
                 link.classList.add('text-slate-300');
            }
        });
    }

    sidebarManager.setActiveState = function(element) {
        if (element) {
            element.classList.add('bg-[#1A2B3A]', 'text-white');
            element.classList.remove('text-slate-300');
        }
    }

    let activeSubFolderLink = null;

    function loadDemoFolders() {
        if (!sidebarNav) return;
        sidebarNav.innerHTML = ''; // Clear sidebar

        // Render Demo Folders & Files
        Object.keys(demoFilesData).forEach(itemName => {
            const item = demoFilesData[itemName]; // "demo_files"
            const itemContainer = createSidebarEntry(itemName, item.path, item.type, item, 0, sidebarNav, true);
            if (item.type === 'folder' && item.children) {
                Object.keys(item.children).forEach(subItemName => {
                    const subItem = item.children[subItemName]; // "Jokes Folder 1", etc.
                    const subItemContainer = createSidebarEntry(subItemName, subItem.path, subItem.type, subItem, 1, itemContainer);
                    if (subItem.type === 'folder' && subItem.children) {
                        Object.keys(subItem.children).forEach(fileName => {
                            const fileItem = subItem.children[fileName]; // "joke1.txt"
                            createSidebarEntry(fileName, fileItem.path, fileItem.type, fileItem, 2, subItemContainer);
                        });
                    }
                });
            }
        });

        // Render User Added Folders
        displayUserAddedFoldersInSidebar(); // This function adds user folders to sidebarNav

        // Determine and set initial folder view for Documents section
        let initialFolderPathToDisplay = null;
        let isDemoFolderSelected = false;

        const firstDemoFolder = demoFilesData.demo_files;
        if (firstDemoFolder) {
            const firstDemoSubfolder = firstDemoFolder.children ? Object.values(firstDemoFolder.children)[0] : null;
            if (firstDemoSubfolder && firstDemoSubfolder.type === 'folder') {
                initialFolderPathToDisplay = firstDemoSubfolder.path; // e.g., "demo_files/Jokes Folder 1"
                isDemoFolderSelected = true;
            } else if (firstDemoFolder.children && Object.values(firstDemoFolder.children).some(f => f.type === 'file')){
                // If no subfolders, but "demo_files" has direct files, select "demo_files" itself.
                initialFolderPathToDisplay = firstDemoFolder.path; // "demo_files"
                isDemoFolderSelected = true;
            }
        }

        if (!initialFolderPathToDisplay && userAddedFolders.length > 0) {
            initialFolderPathToDisplay = userAddedFolders[0].path; // e.g., "user/MyFolder1"
            isDemoFolderSelected = false;
        }

        if (initialFolderPathToDisplay) {
            displayDocumentFiles(initialFolderPathToDisplay);
            setTimeout(() => {
                sidebarManager.clearActiveStates(); // Clear any prematurely set active states
                const targetLink = document.querySelector(`#sidebar-nav a[data-folder-path="${initialFolderPathToDisplay}"]`);
                if (targetLink) {
                    sidebarManager.setActiveState(targetLink);
                    activeSubFolderLink = targetLink; // Update global active link

                    if (isDemoFolderSelected && initialFolderPathToDisplay !== "demo_files") {
                        // If a demo subfolder is selected, ensure "demo_files" is visually open
                        const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                        if (demoFilesEntryLink) {
                            sidebarManager.setActiveState(demoFilesEntryLink); // Highlight "demo_files" as well (as parent)
                            const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                            if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open';
                            const demoFilesSubContainer = demoFilesEntryLink.closest('div').querySelector('.subfolder-container');
                            if (demoFilesSubContainer) demoFilesSubContainer.style.display = 'block';

                            // Re-set the actual targetLink active as setActiveState on demoFilesLink might have cleared others
                            sidebarManager.setActiveState(targetLink);
                        }
                    } else if (initialFolderPathToDisplay === "demo_files"){
                         // If "demo_files" itself is selected, ensure its icon is 'folder' (not 'folder_open' unless clicked)
                        const demoFilesIcon = targetLink.querySelector('.material-icons-outlined');
                        if (demoFilesIcon && targetLink.closest('div').querySelector('.subfolder-container').style.display !== 'block') {
                            demoFilesIcon.textContent = 'folder';
                        }
                    }
                }
            }, 0);
        } else {
            displayDocumentFiles(""); // Display a default empty/welcome message
        }
    }

    // Helper function to recursively collect files from a user-selected directory handle
    async function _collectFilesFromUserFolder(folderHandle, basePath, filesArray) {
        try {
            for await (const entry of folderHandle.values()) {
                const entryPath = `${basePath}/${entry.name}`;
                if (entry.kind === 'file') {
                    try {
                        const file = await entry.getFile();
                        const content = await file.text();
                        filesArray.push({ path: entryPath, content: content, source: "user" });
                    } catch (fileError) {
                        console.error(`Error reading file ${entryPath}:`, fileError);
                        const errorEntry = {
                            appID: generateAppUniqueID(), osID: "os-id-error", currentPath: entryPath,
                            initialDiscoveryTime: new Date().toISOString(), lastHashCheckTime: new Date().toISOString(),
                            lastModifiedSystem: new Date().toISOString(), currentHash: "ERROR_READING_FILE",
                            hashHistory: [], status: 'error_reading'
                        };
                        fileLog.push(errorEntry); // Add error entry to main fileLog
                    }
                } else if (entry.kind === 'directory') {
                    await _collectFilesFromUserFolder(entry, entryPath, filesArray);
                }
            }
        } catch (error) {
            console.error(`Error iterating folder ${basePath}:`, error);
        }
    }


    async function scanFiles() {
        console.log("Starting file scan...");
        const currentTime = new Date().toISOString();
        let filesToProcess = [];

        // 1. Process Demo Files
        function _internalCollectDemoFiles(obj, pathPrefix = "") {
            for (const key in obj) {
                const item = obj[key];
                const currentPath = pathPrefix ? `${pathPrefix}/${key}` : key;
                if (item.type === 'file') {
                    filesToProcess.push({ path: item.path, content: item.content || "", source: "demo" });
                } else if (item.type === 'folder' && item.children) {
                    _internalCollectDemoFiles(item.children, item.path);
                }
            }
        }
        if (demoFilesData && demoFilesData.demo_files && demoFilesData.demo_files.children) {
             _internalCollectDemoFiles(demoFilesData.demo_files.children, "demo_files");
        }


        // 2. Process User Added Folders
        for (const userFolder of userAddedFolders) {
            if (userFolder.handle) {
                console.log(`Scanning user folder: ${userFolder.path}`);
                await _collectFilesFromUserFolder(userFolder.handle, userFolder.path, filesToProcess);
            } else {
                console.warn(`Skipping scan for ${userFolder.path}: No active directory handle. Please re-add the folder.`);
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
                const osID = getOSFileID(fileItem.path); // This is a simulated ID
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
        const currentActiveLink = document.querySelector('#sidebar-nav a.bg-\\[\\#1A2B3A\\].text-white');
        if (currentActiveLink && currentActiveLink.dataset.folderPath) {
            currentActiveDocFolderPath = currentActiveLink.dataset.folderPath;
        } else { // Fallback or determine default if nothing is active
            currentActiveDocFolderPath = demoFilesData.demo_files?.children ? Object.values(demoFilesData.demo_files.children)[0]?.path : "demo_files";
        }
        displayDocumentFiles(currentActiveDocFolderPath);

        displayActivityLog(fileLog);

        console.log(`Scan complete. New: ${newFilesAdded}, Mod: ${filesModified}, Ver: ${filesVerified}.`);
        if (newFilesAdded > 0 || filesModified > 0) {
            alert(`Scan Complete!\nNew files: ${newFilesAdded}\nModified files: ${filesModified}\nVerified files: ${filesVerified}`);
        } else {
            alert(`Scan Complete! All monitored files verified. Total verified: ${filesVerified}`);
        }
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
