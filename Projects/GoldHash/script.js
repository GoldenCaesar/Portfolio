console.log("script.js loaded");

let fileLog = []; // Global variable for storing log data
let userUploadedFolders = {}; // To store user-uploaded folder structures

// --- Core Hashing and ID Generation Functions ---

async function generateSHA256(fileContentString) {
    if (typeof fileContentString !== 'string') {
        console.error('Invalid input to generateSHA256: Expected a string.');
        return null;
    }
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fileContentString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
    } catch (error) {
        console.error('Error generating SHA-256 hash:', error);
        // In a future Electron app, this might involve Node.js crypto
        // For the browser demo, return null or a placeholder if SubtleCrypto fails
        return null;
    }
}

async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function generateAppUniqueID() {
    return 'app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getOSFileID(filePath) {
    try {
        // In a Node.js environment (like Electron), you might use fs.statSync(filePath).ino
        // However, this is not available in the browser.
        if (typeof window !== 'undefined' && typeof process === 'undefined') { // Basic check for browser-like environment
            // console.warn("getOSFileID: OS-level file ID is not reliably accessible in a browser environment for path:", filePath);
            return "os-id-unavailable-browser";
        } else {
            // Placeholder for potential future Node.js/Electron implementation
            // For now, even if not strictly a browser, we'll return a simulated ID or null
            // const fs = require('fs'); // This would only work in Node.js
            // const stats = fs.statSync(filePath);
            // return stats.ino.toString();
            return "os-id-simulated-" + Math.random().toString(36).substr(2, 5); // Simulated for non-browser or future
        }
    } catch (error) {
        console.error('Error trying to get OS File ID (expected in browser):', error.message, 'for path:', filePath);
        return "os-id-error";
    }
}

// --- End Core Hashing and ID Generation Functions ---

function updateFileMonitoredCount() {
    const filesMonitoredElement = document.getElementById('files-monitored-count');
    if (filesMonitoredElement && fileLog) {
        // Count only unique files based on appID, if relevant, or just length for now
        filesMonitoredElement.textContent = fileLog.length.toLocaleString();
    }
}

function updateLogSizeDisplayOnLoad() {
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement && fileLog && fileLog.length > 0) {
        // Simulate log size based on the number of entries or string length
        const approximateSize = JSON.stringify(fileLog).length / 1024; // Very rough KB
        updateLogSizeDisplay(parseFloat(approximateSize.toFixed(2)));
    } else if (logSizeElement) {
        // If fileLog is empty or not yet loaded, set to a default small value like 0 or 1
        updateLogSizeDisplay(0); // Default to 0KB if no logs
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
    // Update UI based on loaded logs
    updateFileMonitoredCount();
    updateLogSizeDisplayOnLoad();
    displayActivityLog(); // Display activity log on load
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

// Function to clear logs
function clearLogs() {
    console.log("Clearing logs...");
    // Reset the in-memory log array
    fileLog = [];

    // Simulate clearing the log file (actual file operation is handled by subtask environment)
    // For the browser, we can also clear any localStorage representation
    localStorage.removeItem('goldHashLog');

    // Update UI
    updateLogSizeDisplay(0);
    updateFileMonitoredCount(); // Ensure count is updated to 0
    displayActivityLog(); // Refresh activity log view

    console.log("Logs cleared.");
    alert("Logs have been cleared (simulated for browser). The scan.log file will be emptied by the environment.");
}

// --- Activity Log Display Function ---
function displayActivityLog() {
    const activityTbody = document.getElementById('activity-tbody');
    if (!activityTbody) {
        console.error("activity-tbody element not found!");
        return;
    }
    activityTbody.innerHTML = ''; // Clear existing rows

    if (!fileLog || fileLog.length === 0) {
        const tr = activityTbody.insertRow();
        const cell = tr.insertCell();
        cell.colSpan = 5; // Adjusted to 5 columns: File Name, Status, Hash, Last Checked, Path
        cell.textContent = 'No activity logged yet.';
        cell.className = 'px-6 py-4 text-center text-slate-400';
        return;
    }

    fileLog.forEach(entry => {
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
// --- End Activity Log Display Function ---

// Function to recursively count files
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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    const sidebarNav = document.getElementById('sidebar-nav');
    console.log("sidebarNav element:", sidebarNav);
    const documentsTbody = document.getElementById('documents-tbody'); // Keep this reference

    loadLogsFromStorage(); // Load logs at the beginning of DOMContentLoaded
    const mainContent = document.querySelector('main.ml-80');

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
            console.log(`Processing ${files.length} files from selected folder to display in sidebar...`);

            let newFilesProcessedCount = 0;

            for (const file of files) {
                const fullPath = file.webkitRelativePath; // e.g., "FolderName/subfolder/file.txt"
                if (!fullPath) {
                    console.warn("File with no webkitRelativePath, likely a single file selection, not a folder. Skipping for now.", file.name);
                    // Or handle single file upload if desired in the future.
                    continue;
                }

                const pathParts = fullPath.split('/');
                let currentLevel = userUploadedFolders;
                let currentBuiltPath = "";

                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    currentBuiltPath += (i > 0 ? '/' : '') + part;

                    if (i === pathParts.length - 1) { // It's a file
                        if (!currentLevel[part]) { // Check if file already listed (e.g. re-upload)
                             currentLevel[part] = {
                                path: currentBuiltPath,
                                type: 'file',
                                fileObject: file // Store the File object for later scanning
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
                            // This case should ideally not happen if paths are unique and consistent
                            // If a file exists where a folder is expected, log an error or decide on handling
                            console.error(`Conflict: Expected folder, found file at ${currentBuiltPath}`);
                            // Potentially skip this path or overwrite, depending on desired strategy
                            break;
                        }
                        currentLevel = currentLevel[part].children;
                    }
                }
            }

            if (newFilesProcessedCount > 0) {
                console.log("User uploaded folders data:", userUploadedFolders);
                updateSidebarView();
                alert(`Folder structure added to sidebar. ${newFilesProcessedCount} new file references captured. Files will be scanned when you click the Scan button.`);
            } else if (files.length > 0) {
                 alert("Selected folder and its files might have already been added or no new files were found.");
            } else {
                alert("No folder selected or the folder was empty.");
            }

            // Clear the input for the next selection
            folderUploadInput.value = '';
        });
    }

    // 1. Restructure demoFiles
    const demoFilesData = {
        "demo_files": {
            "path": "demo_files", // Store path for clarity if needed
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

    // Note: The initial update of filesMonitoredElement and logSizeDisplay
    // is now handled by loadLogsFromStorage(), so direct updates here are removed.

    let activeSubFolderLink = null;

    // Helper function to find an item in demoFilesData by its path
    function findItemInData(targetPath, dataRoot) {
        const parts = targetPath.split('/');
        if (parts.length === 0) return null;

        let currentItem = dataRoot[parts[0]]; // Handles the first part, e.g., "demo_files"
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
        // Assuming demoFilesData is accessible in this scope
        const demoItem = findItemInData(path, demoFilesData); // findItemInData needs to be defined before this or hoisted
        if (demoItem && demoItem.type === 'folder') {
            return demoItem;
        }

        // 2. Attempt to find in userUploadedFolders
        // Assuming userUploadedFolders is accessible in this scope
        const parts = path.split('/');
        if (parts.length === 0) return null;

        let currentLevel = userUploadedFolders;
        let item = null;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === 0) { // First part is the top-level folder name
                if (currentLevel[part] && currentLevel[part].path === path && currentLevel[part].type === 'folder') {
                    // This handles the case where the path itself is a top-level folder key
                    item = currentLevel[part];
                    break; // Found the top-level folder itself
                } else if (currentLevel[part] && currentLevel[part].type === 'folder') {
                    // This handles navigating into a top-level folder
                    currentLevel = currentLevel[part];
                } else {
                    currentLevel = null; // Path component not found at top level
                    break;
                }
            } else { // Subsequent parts are in 'children'
                if (currentLevel && currentLevel.children && currentLevel.children[part]) {
                    currentLevel = currentLevel.children[part];
                } else {
                    currentLevel = null; // Path component not found in children
                    break;
                }
            }
        }

        if (currentLevel && currentLevel.path === path && currentLevel.type === 'folder') {
            item = currentLevel;
        }


        if (item && item.type === 'folder') {
            return item;
        }

        return null; // Not found or not a folder
    }

    function clearActiveStates() {
        document.querySelectorAll('#sidebar-nav a, #sidebar-nav div[data-folder-path]').forEach(link => {
            link.classList.remove('bg-[#1A2B3A]', 'text-white');
            if (link.tagName === 'A' || link.dataset.folderPath) { // Ensure we only add text-slate-300 to appropriate elements
                 link.classList.add('text-slate-300');
            }
        });
    }

    function setActiveState(element) {
        element.classList.add('bg-[#1A2B3A]', 'text-white');
        element.classList.remove('text-slate-300');
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
            } else {
                currentLevel = null; // Path not found
                break;
            }
        }

        const content = currentLevel?.content;
        const parentFolderPath = parts.slice(0, -1).join('/');

        if (content && mainContent) {
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
            pre.textContent = content;

            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Files';
            backButton.className = 'mb-4 px-4 py-2 bg-[#0c7ff2] text-white rounded hover:bg-blue-600 transition-colors';
            backButton.onclick = () => {
                sectionsToHide.forEach(section => section.style.display = 'block');
                fileContentDiv.style.display = 'none';
                displayFolderContents(parentFolderPath); // Go back to the folder view
            };

            fileContentDiv.innerHTML = '';
            fileContentDiv.appendChild(backButton);
            fileContentDiv.appendChild(pre);
        } else {
            console.error('File content not found for path:', filePath);
            alert('File content not found.');
        }
    }

    function displayFolderContents(folderPath) {
        // documentsTbody is already scoped for DOMContentLoaded
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
        let sourceDataName = ""; // To track if we are using demo or user data

        // Try to find in demoFilesData first
        const demoItem = findItemInData(folderPath, demoFilesData);
        if (demoItem && demoItem.type === 'folder' && demoItem.children) {
            currentFolderChildren = demoItem.children;
            sourceDataName = "demo";
        } else {
            // Try to find in userUploadedFolders
            const parts = folderPath.split('/');
            let currentItem = userUploadedFolders;
            let foundInUser = true;
            for (const part of parts) {
                if (currentItem[part] && currentItem[part].type === 'folder') {
                    currentItem = currentItem[part];
                } else if (currentItem[part] && currentItem[part].children) { // Access children if currentItem is the root of a folder structure
                     currentItem = currentItem[part].children;
                } else if (currentItem.children && currentItem.children[part] && currentItem.children[part].type === 'folder') {
                     currentItem = currentItem.children[part];
                }
                else {
                    // Check if 'part' itself is a top-level key in userUploadedFolders and is a folder
                    if (userUploadedFolders[part] && userUploadedFolders[part].path === folderPath && userUploadedFolders[part].type === 'folder') {
                        currentItem = userUploadedFolders[part];
                        // sourceDataName = "user_top"; // Special case for top-level folder itself
                        break;
                    }
                    foundInUser = false;
                    break;
                }
            }

            if (foundInUser && currentItem && currentItem.children) {
                currentFolderChildren = currentItem.children;
                sourceDataName = "user";
            } else if (foundInUser && currentItem && currentItem.type === 'folder' && !currentItem.children) { // Empty user folder
                currentFolderChildren = {};
                sourceDataName = "user_empty";
            }
             else {
                console.warn(`Could not find children for folderPath: "${folderPath}" in demoFilesData or userUploadedFolders.`);
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
                    status: "Not Scanned Yet", // Default for user files not yet in fileLog
                    currentHash: "N/A",
                    lastHashCheckTime: "N/A"
                };

                // Try to find this file in fileLog
                const loggedFile = fileLog.find(logEntry => logEntry.currentPath === item.path);
                if (loggedFile) {
                    fileDisplayData.status = loggedFile.status;
                    fileDisplayData.currentHash = loggedFile.currentHash;
                    fileDisplayData.lastHashCheckTime = loggedFile.lastHashCheckTime;
                }
                // No 'else' needed here, as defaults are set for "Not Scanned Yet"

                filesForDisplay.push(fileDisplayData);
            }
        }
        displayLoggedFiles(filesForDisplay); // This function renders the filesForDisplay array
    }

    function createSidebarEntry(name, path, type, indentLevel = 0, parentContainer, isTopLevel = false, children = null) {
        if (type === 'file') {
            // If it's a file, don't create a sidebar entry for it.
            // Files will be handled by displayFolderContents when a folder is clicked.
            return;
        }
        console.log("createSidebarEntry called for name:", name, "path:", path, "type:", type, "indentLevel:", indentLevel, "isTopLevel:", isTopLevel);
        const entryDiv = document.createElement('div');
        entryDiv.style.marginLeft = `${indentLevel * 20}px`; // Indentation

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1A2B3A]';
        link.dataset.folderPath = path; // Store path for identification

        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons-outlined text-slate-400';
        iconSpan.style.fontSize = '20px';
        iconSpan.textContent = type === 'folder' ? 'folder' : 'description'; // 'description' for file icon

        link.appendChild(iconSpan);
        link.appendChild(document.createTextNode(` ${name}`));

        entryDiv.appendChild(link);
        console.log("About to append entryDiv for:", name, ". parentContainer:", parentContainer, "entryDiv:", entryDiv);
        parentContainer.appendChild(entryDiv);

        const subfoldersContainer = document.createElement('div');
        subfoldersContainer.className = 'subfolder-container';
        // Initial state: hide "demo_files" children, show others if they were top-level (though current structure only has "demo_files" as top-level)
        if (path === "demo_files") {
            subfoldersContainer.style.display = 'none';
        } else {
            subfoldersContainer.style.display = isTopLevel ? 'block' : 'none';
        }

        // Keep demo_files itself highlighted if it's the main top-level entry, but not its children initially.
        if (isTopLevel && path === "demo_files" && type === 'folder') {
            link.classList.add('bg-[#1A2B3A]', 'text-white');
            link.classList.remove('text-slate-300');
        }
        entryDiv.appendChild(subfoldersContainer);


        // Recursive call for children
        if (type === 'folder' && children) {
            Object.keys(children).forEach(childName => {
                const childItem = children[childName];
                // Pass childItem.children to the recursive call
                createSidebarEntry(childName, childItem.path, childItem.type, indentLevel + 1, subfoldersContainer, false, childItem.children);
            });
        }

        if (type === 'folder') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedPath = path; // Path of the folder item associated with this link
   const folderItem = getFolderItemByPath(clickedPath);
 if (!folderItem) {
                    console.warn(`Sidebar click: Folder item not found or not a folder for path: "${clickedPath}". Result from getFolderItemByPath:`, folderItem);
                    return;
                }

                const subfoldersContainer = link.closest('div').querySelector('.subfolder-container');
                const iconElement = link.querySelector('.material-icons-outlined'); // Get icon from the link itself

                let isNowExpanded = false;
                if (subfoldersContainer) {
                    if (subfoldersContainer.style.display === 'none') {
                        subfoldersContainer.style.display = 'block';
                        if (iconElement) iconElement.textContent = 'folder_open';
                        isNowExpanded = true;
                    } else {
                        subfoldersContainer.style.display = 'none';
                        if (iconElement) iconElement.textContent = 'folder';
                        isNowExpanded = false;
                    }
                } else {
                    // If there's no subfoldersContainer, it implies it's a leaf folder or structure is unexpected.
                    // We might still want to treat it as "expanded" for content display purposes.
                    isNowExpanded = true;
                }

                if (isNowExpanded) {
                    let pathToDisplay = clickedPath;
                    let targetLinkElement = link; // Default to the clicked link

                    // If the clicked folder has sub-folders, try to select and display the first one.
                    let firstSubFolderPath = null;
                    if (folderItem.children) {
                        for (const childName in folderItem.children) {
                            const childItem = folderItem.children[childName];
                            if (childItem.type === 'folder') {
                                firstSubFolderPath = childItem.path;
                                break;
                            }
                        }
                    }

                    if (firstSubFolderPath) {
                        const firstSubfolderLinkElem = document.querySelector(`#sidebar-nav a[data-folder-path="${firstSubFolderPath}"]`);
                        if (firstSubfolderLinkElem) {
                            pathToDisplay = firstSubFolderPath;
                            targetLinkElement = firstSubfolderLinkElem;
                        } else {
                            // If the DOM element for the first subfolder isn't found (e.g., not yet rendered or an issue),
                            // it will default to displaying the content of the clicked folder itself (pathToDisplay = clickedPath).
                            console.warn("DOM element for first subfolder not found:", firstSubFolderPath);
                        }
                    }

                    clearActiveStates();
                    // Special handling for "demo_files" itself: it should remain visually "active" if one of its children is active.
                    if (targetLinkElement.dataset.folderPath !== "demo_files" && targetLinkElement.dataset.folderPath.startsWith("demo_files/")) {
                        const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                        if (demoFilesEntryLink) {
                             setActiveState(demoFilesEntryLink); // Keep "demo_files" (parent) highlighted
                             const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                             if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open'; // Ensure its icon is open
                        }
                    }
                    setActiveState(targetLinkElement);
                    activeSubFolderLink = targetLinkElement;
                    displayFolderContents(pathToDisplay);
                }
                // If !isNowExpanded (folder was collapsed), we don't need to change the displayed content or active state.
                // The content area will continue to show what was last selected.
            });
        }
        return subfoldersContainer;
    }


    function updateSidebarView() {
        console.log("updateSidebarView called");
        if (!sidebarNav) return;
        sidebarNav.innerHTML = ''; // Clear existing sidebar

        // Process demoFilesData
        Object.keys(demoFilesData).forEach(itemName => {
            const item = demoFilesData[itemName];
            // createSidebarEntry will handle its own children recursively
            createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true, item.children);
        });

        // Process userUploadedFolders
        Object.keys(userUploadedFolders).forEach(itemName => {
            const item = userUploadedFolders[itemName];
            // createSidebarEntry will handle its own children recursively
            createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true, item.children);
        });

        // The logic for automatically displaying contents of the first sub-folder
        // might need adjustment if userUploadedFolders can be empty or if we want a different default view.
        // For now, retain existing logic, it will apply to demo files.
        const firstDemoSubfolderPath = demoFilesData.demo_files?.children
            ? Object.values(demoFilesData.demo_files.children)[0]?.path
            : null;

        if (firstDemoSubfolderPath) {
            displayFolderContents(firstDemoSubfolderPath);
            // Set active state for the first subfolder
            setTimeout(() => { // Use timeout to ensure elements are rendered
                const firstSubfolderLink = document.querySelector(`#sidebar-nav a[data-folder-path="${firstDemoSubfolderPath}"]`);
                const demoFilesLinkElement = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]'); // Corrected selector for the link

                if (firstSubfolderLink && demoFilesLinkElement) {
                    // Highlight "demo_files"
                    setActiveState(demoFilesLinkElement);

                    // Expand "demo_files" and update its icon
                    const demoFilesDiv = demoFilesLinkElement.closest('div'); // Get the main div for "demo_files"
                    if (demoFilesDiv) {
                        const subfoldersContainer = demoFilesDiv.querySelector('.subfolder-container');
                        if (subfoldersContainer) {
                            subfoldersContainer.style.display = 'block';
                        }
                        const iconSpan = demoFilesLinkElement.querySelector('.material-icons-outlined');
                        if (iconSpan) {
                            iconSpan.textContent = 'folder_open';
                        }
                    }

                    // Highlight the first subfolder
                    setActiveState(firstSubfolderLink);
                    activeSubFolderLink = firstSubfolderLink;
                }
            }, 0);
        }
        if (sidebarNav) console.log("sidebarNav innerHTML after changes:", sidebarNav.innerHTML);
    }

    updateSidebarView();

    async function scanFiles() {
        console.log("Starting file scan (rescan logic enabled)...");
        const currentTime = new Date().toISOString();
        const filesToProcess = []; // This will hold objects { path: string, content: string, fileObject?: File }

        // 1. Collect files from demoFilesData
        // Ensure demoFilesData is available
        const currentDemoFiles = (typeof demoFilesData !== "undefined") ? demoFilesData : null;
        if (currentDemoFiles && currentDemoFiles.demo_files && currentDemoFiles.demo_files.children) {
            function _collectDemoFilesRecursive(currentLevelChildren) {
                for (const key in currentLevelChildren) {
                    const item = currentLevelChildren[key];
                    if (item.type === 'file') {
                        filesToProcess.push({ path: item.path, content: item.content || "" });
                    } else if (item.type === 'folder' && item.children) {
                        _collectDemoFilesRecursive(item.children);
                    }
                }
            }
            _collectDemoFilesRecursive(currentDemoFiles.demo_files.children);
        } else {
            console.warn("demoFilesData is not available or structured as expected for scanning.");
        }

        // 2. Collect files from userUploadedFolders
        function _collectUserFilesRecursive(currentLevel) {
            for (const key in currentLevel) {
                const item = currentLevel[key];
                if (item.type === 'file' && item.fileObject) {
                    // For user files, we push the path and fileObject. Content will be read async.
                    filesToProcess.push({ path: item.path, fileObject: item.fileObject });
                } else if (item.type === 'folder' && item.children) {
                    _collectUserFilesRecursive(item.children);
                }
            }
        }
        if (typeof userUploadedFolders !== "undefined") {
            _collectUserFilesRecursive(userUploadedFolders);
        }

        if (filesToProcess.length === 0) {
            alert("No files found to scan (neither demo files nor user-uploaded files).");
            return;
        }

        console.log(`Collected ${filesToProcess.length} total files for scanning.`);

        let newFilesAdded = 0;
        let filesModified = 0;
        let filesVerified = 0;

        for (const fileItem of filesToProcess) {
            let fileContent;
            // Read content if it's a user file (has fileObject)
            if (fileItem.fileObject) {
                try {
                    fileContent = await readFileAsText(fileItem.fileObject);
                } catch (error) {
                    console.error(`Error reading content for ${fileItem.path}:`, error);
                    continue; // Skip this file
                }
            } else { // It's a demo file, content is already available
                fileContent = fileItem.content;
            }

            const currentHash = await generateSHA256(fileContent);
            if (currentHash === null) {
                console.error(`Hash generation failed for ${fileItem.path}. Skipping.`);
                continue;
            }

            const existingLogEntryIndex = fileLog.findIndex(entry => entry.currentPath === fileItem.path);

            if (existingLogEntryIndex !== -1) { // Existing file in fileLog
                const logEntry = fileLog[existingLogEntryIndex];
                if (logEntry.currentHash !== currentHash) {
                    console.log(`File ${fileItem.path} has changed.`);
                    logEntry.hashHistory.push(logEntry.currentHash);
                    logEntry.currentHash = currentHash;
                    logEntry.status = 'modified';
                    logEntry.lastModifiedSystem = currentTime; // Or use fileItem.fileObject.lastModified if reliable
                    logEntry.lastHashCheckTime = currentTime;
                    filesModified++;
                } else {
                    logEntry.status = 'verified';
                    logEntry.lastHashCheckTime = currentTime;
                    filesVerified++;
                }
            } else { // New file (not in fileLog yet)
                console.log(`New file detected during scan: ${fileItem.path}`);
                const appID = generateAppUniqueID();
                // const osID = getOSFileID(fileItem.path); // getOSFileID might not be useful for webkitRelativePath

                // Check if this hash already exists for any other file path
                const hashExists = fileLog.some(entry => {
                    if (entry.currentHash === currentHash) return true;
                    return entry.hashHistory.includes(currentHash);
                });
                if (hashExists) {
                    console.warn(`Hash for new file ${fileItem.path} (${currentHash}) already exists in logs under a different path.`);
                }

                const newLogEntry = {
                    appID: appID,
                    // osID: osID, // Reconsider if osID is meaningful here
                    currentPath: fileItem.path,
                    initialDiscoveryTime: currentTime,
                    lastHashCheckTime: currentTime,
                    lastModifiedSystem: currentTime, // Or fileItem.fileObject.lastModified
                    currentHash: currentHash,
                    hashHistory: [],
                    status: 'newly_added'
                };
                fileLog.push(newLogEntry);
                newFilesAdded++;
            }
        }

        localStorage.setItem('goldHashLog', JSON.stringify(fileLog));
        updateFileMonitoredCount();
        updateLogSizeDisplayOnLoad(); // This updates based on fileLog size
        updateLastScanTime();

        // Update the "Files Changed" count in statistics
        const filesChangedElement = document.querySelector('div.grid div:nth-child(2) p.text-3xl');
        if (filesChangedElement) {
            const modifiedCount = fileLog.filter(entry => entry.status === 'modified').length;
            filesChangedElement.textContent = modifiedCount.toLocaleString();
        }

        // Refresh the displayed table based on current view
        let currentActiveFolderPath = "demo_files"; // Default
        const activeSidebarLink = document.querySelector('#sidebar-nav a.bg-\\[\\#1A2B3A\\].text-white[data-folder-path]');
        if (activeSidebarLink && activeSidebarLink.dataset.folderPath) {
            currentActiveFolderPath = activeSidebarLink.dataset.folderPath;
        }
        console.log("Scan complete. Refreshing folder contents for path:", currentActiveFolderPath);
        displayFolderContents(currentActiveFolderPath); // Refresh documents tab
        displayActivityLog(); // Refresh activity log after scan

        console.log(`File scan complete. New: ${newFilesAdded}, Modified: ${filesModified}, Verified: ${filesVerified}. Log updated.`);
        alert(`File scan complete!
New files: ${newFilesAdded}
Modified files: ${filesModified}
Verified files: ${filesVerified}
Log has been updated.`);
    }

    const scanButton = document.getElementById('scan-files-button');
    if (scanButton) {
        scanButton.addEventListener('click', async () => {
            await scanFiles();
        });
    }

    const settingsIconContainer = document.querySelector('div[data-icon="Gear"]'); // More specific selector for the gear icon's div
    const settingsContextMenu = document.getElementById('settings-context-menu');

    if (settingsIconContainer && settingsContextMenu) {
        settingsIconContainer.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling to document
            settingsContextMenu.classList.toggle('hidden');
        });

        // Close menu if clicked outside
        document.addEventListener('click', (event) => {
            if (!settingsContextMenu.contains(event.target) && !settingsIconContainer.contains(event.target)) {
                settingsContextMenu.classList.add('hidden');
            }
        });
    }

    // Placeholder for Clear Logs button functionality
    const clearLogsButton = document.getElementById('clear-logs-button');
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', (event) => {
            event.preventDefault();
            clearLogs(); // Call the new function
            settingsContextMenu.classList.add('hidden'); // Hide menu after click
        });
    }
});
