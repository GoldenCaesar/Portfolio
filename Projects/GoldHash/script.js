console.log("script.js loaded");

let fileLog = []; // Global variable for storing log data

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

    console.log("Logs cleared.");
    alert("Logs have been cleared (simulated for browser). The scan.log file will be emptied by the environment.");
}

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

        let filteredLogEntries = [];
        if (fileLog && fileLog.length > 0) {
            if (folderPath === "demo_files" || folderPath === "") {
                // If "demo_files" (the root in sidebar) is clicked, show all logs from "demo_files/"
                // Or if folderPath is empty (e.g. initial load before selection), show all.
                // This condition might need refinement based on how root/all files view is triggered.
                // For now, "demo_files" path means show everything under "demo_files/".
                filteredLogEntries = fileLog.filter(entry => entry.currentPath.startsWith("demo_files/"));
            } else {
                // For specific subfolders like "demo_files/Jokes Folder 1"
                filteredLogEntries = fileLog.filter(entry => entry.currentPath.startsWith(folderPath + "/"));
            }
        }

        displayLoggedFiles(filteredLogEntries);
    }

    function createSidebarEntry(name, path, type, indentLevel = 0, parentContainer, isTopLevel = false) {
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


        if (type === 'folder') {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                if (path === "demo_files") {
                    // Toggle display of subfoldersContainer for "demo_files"
                    const isHidden = subfoldersContainer.style.display === 'none';
                    subfoldersContainer.style.display = isHidden ? 'block' : 'none';
                    // Optionally, change icon
                    iconSpan.textContent = isHidden ? 'folder_open' : 'folder';
                    // Do not call displayFolderContents for "demo_files" itself
                    // Do not change active states of sub-folders here
                } else {
                    // This is a subfolder like "Jokes Folder 1"
                    clearActiveStates();
                    
                    // Keep "demo_files" (parent) highlighted
                    const demoFilesEntryLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"]');
                    if (demoFilesEntryLink) {
                        setActiveState(demoFilesEntryLink);
                         // Ensure its icon reflects open state if its subfolders are visible (which they would be if a child is clicked)
                        const demoFilesSubfoldersContainer = demoFilesEntryLink.closest('div').querySelector('.subfolder-container');
                        if (demoFilesSubfoldersContainer && demoFilesSubfoldersContainer.style.display === 'block') {
                            const demoFilesIcon = demoFilesEntryLink.querySelector('.material-icons-outlined');
                            if (demoFilesIcon) demoFilesIcon.textContent = 'folder_open';
                        }
                    }

                    setActiveState(link);
                    activeSubFolderLink = link;
                    displayFolderContents(path);
                }
            });
        }
        return subfoldersContainer;
    }


    function loadDemoFolders() {
        console.log("loadDemoFolders called");
        if (!sidebarNav) return;
        if (sidebarNav) console.log("sidebarNav innerHTML before changes:", sidebarNav.innerHTML);
        sidebarNav.innerHTML = '';

        Object.keys(demoFilesData).forEach(itemName => { // e.g., "demo_files"
            console.log("Processing demo_files item:", demoFilesData[itemName]);
            const item = demoFilesData[itemName];
            const itemContainer = createSidebarEntry(itemName, item.path, item.type, 0, sidebarNav, true); // isTopLevel = true

            if (item.type === 'folder' && item.children) {
                Object.keys(item.children).forEach(subItemName => { // e.g., "Jokes Folder 1"
                    const subItem = item.children[subItemName];
                    createSidebarEntry(subItemName, subItem.path, subItem.type, 1, itemContainer);
                });
            }
        });

        // Automatically display contents of the first sub-folder of "demo_files"
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

    loadDemoFolders();

    async function scanFiles() {
        console.log("Starting file scan (rescan logic enabled)...");
        const currentTime = new Date().toISOString();

        // Ensure demoFilesData is available
        const currentDemoFiles = (typeof demoFilesData !== "undefined") ? demoFilesData : null;
        if (!currentDemoFiles || !currentDemoFiles.demo_files || !currentDemoFiles.demo_files.children) {
            console.error("demoFilesData is not available or structured as expected for scanning.");
            alert("Error: Demo file data is not available for scanning.");
            return;
        }

        const filesToProcess = [];
        function _internalCollectFiles(currentLevelChildren) { // Renamed and simplified
            for (const key in currentLevelChildren) {
                const item = currentLevelChildren[key];
                if (item.type === 'file') {
                    filesToProcess.push({ path: item.path, content: item.content || "" });
                } else if (item.type === 'folder' && item.children) {
                    _internalCollectFiles(item.children);
                }
            }
        }
        _internalCollectFiles(currentDemoFiles.demo_files.children);


        let newFilesAdded = 0;
        let filesModified = 0;
        let filesVerified = 0;

        for (const fileItem of filesToProcess) {
            const existingLogEntryIndex = fileLog.findIndex(entry => entry.currentPath === fileItem.path);

            if (existingLogEntryIndex !== -1) {
                // Existing file found
                const logEntry = fileLog[existingLogEntryIndex];

                const newHash = await generateSHA256(fileItem.content);

                if (newHash === null) { // Hash generation failed
                    console.error(`Skipping file ${fileItem.path} due to hash generation error.`);
                    continue;
                }

                if (logEntry.currentHash !== newHash) {
                    console.log(`File ${fileItem.path} has changed.`);
                    logEntry.hashHistory.push(logEntry.currentHash);
                    logEntry.currentHash = newHash;
                    logEntry.status = 'modified';
                    logEntry.lastModifiedSystem = currentTime;
                    logEntry.lastHashCheckTime = currentTime;
                    filesModified++;
                } else {
                    // Hash is the same, content has not changed
                    logEntry.status = 'verified';
                    logEntry.lastHashCheckTime = currentTime;
                    filesVerified++;
                }
            } else {
                // New file
                console.log(`New file detected: ${fileItem.path}`);
                const appID = generateAppUniqueID();
                const osID = getOSFileID(fileItem.path);
                const fileContent = fileItem.content;

                const currentHash = await generateSHA256(fileContent);
                if (currentHash === null) { // Hash generation failed
                    console.error(`Skipping new file ${fileItem.path} due to hash generation error.`);
                    continue;
                }

                const hashExists = fileLog.some(entry => {
                    if (entry.currentHash === currentHash) return true;
                    return entry.hashHistory.includes(currentHash);
                });

                if (hashExists) {
                    console.warn(`Hash for new file ${fileItem.path} (${currentHash}) already exists in logs. Adding as new entry anyway.`);
                }

                const newLogEntry = {
                    appID: appID,
                    osID: osID,
                    currentPath: fileItem.path,
                    initialDiscoveryTime: currentTime,
                    lastHashCheckTime: currentTime,
                    lastModifiedSystem: currentTime,
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
        updateLogSizeDisplayOnLoad();
        updateLastScanTime();

        const filesChangedElement = document.querySelector('div.grid div:nth-child(2) p.text-3xl');
        if (filesChangedElement) {
            const modifiedCount = fileLog.filter(entry => entry.status === 'modified').length;
            filesChangedElement.textContent = modifiedCount.toLocaleString();
        }

        // Refresh the displayed table based on current view
        let currentActiveFolderPath = "demo_files"; // Default or determine from active link
        const activeLink = document.querySelector('#sidebar-nav a.bg-\\[\\#1A2B3A\\].text-white');
        if (activeLink && activeLink.dataset.folderPath) {
            currentActiveFolderPath = activeLink.dataset.folderPath;
        } else {
            // If no specific subfolder link is active, check if the main "demo_files" is active
             const demoFilesActiveLink = document.querySelector('#sidebar-nav a[data-folder-path="demo_files"].bg-\\[\\#1A2B3A\\].text-white');
             if (demoFilesActiveLink) currentActiveFolderPath = "demo_files";
        }
        displayFolderContents(currentActiveFolderPath);


        console.log(`File scan complete. New: ${newFilesAdded}, Modified: ${filesModified}, Verified: ${filesVerified}. Log updated.`);
        alert(`File scan complete!\nNew files: ${newFilesAdded}\nModified files: ${filesModified}\nVerified files: ${filesVerified}\nLog has been updated.`);
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
