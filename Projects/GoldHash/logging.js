console.log("logging.js loaded");

window.fileLog = []; // Authoritative source for log data, now globally accessible

// --- Core Hashing and ID Generation Functions (moved from script.js) ---

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
        console.error('Error generating SHA-256 hash (logging.js):', error);
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
        if (typeof window !== 'undefined' && typeof process === 'undefined') {
            // console.warn("getOSFileID: OS-level file ID is not reliably accessible in a browser environment for path:", filePath);
            return "os-id-unavailable-browser";
        } else {
            return "os-id-simulated-" + Math.random().toString(36).substr(2, 5);
        }
    } catch (error) {
        console.error('Error trying to get OS File ID (logging.js):', error.message, 'for path:', filePath);
        return "os-id-error";
    }
}

// --- Logging Management Functions ---

function loadLogsFromStorage() {
    console.log("Attempting to load logs from localStorage (logging.js)...");
    const storedLogs = localStorage.getItem('goldHashLog');
    if (storedLogs) {
        window.fileLog = JSON.parse(storedLogs); // Use global fileLog
        console.log(`${window.fileLog.length} logs loaded from localStorage (logging.js).`);
    } else {
        console.log("No logs found in localStorage. Initializing empty log (logging.js).");
        window.fileLog = []; // Use global fileLog
    }
    // Update UI based on loaded logs (calls functions from ui.js)
    // These UI functions should now directly use window.fileLog
    if (typeof updateFileMonitoredCount === 'function') updateFileMonitoredCount();
    if (typeof updateLogSizeDisplayOnLoad === 'function') updateLogSizeDisplayOnLoad();
    if (typeof displayActivityLog === 'function') displayActivityLog();
}

function saveLogsToStorage() {
    console.log(`Saving ${window.fileLog.length} log entries to localStorage (logging.js)...`);
    localStorage.setItem('goldHashLog', JSON.stringify(window.fileLog));
}

function clearLogs() {
    console.log("Clearing logs (logging.js)...");
    window.fileLog = []; // Reset the global in-memory log array

    localStorage.removeItem('goldHashLog');
    console.log("Logs removed from localStorage (logging.js).");

    // Update UI (calls functions from ui.js)
    // These UI functions should now directly use window.fileLog
    if (typeof updateLogSizeDisplay === 'function') updateLogSizeDisplay(0);
    if (typeof updateFileMonitoredCount === 'function') updateFileMonitoredCount();
    if (typeof displayActivityLog === 'function') displayActivityLog();

    // Potentially refresh the documents tab to show no files if a folder was selected
    if (typeof displayFolderContents === 'function') {
        // We need to know which folder is active to refresh it, or refresh to a default.
        // This might be complex if not coordinated with ui.js state.
        // For now, ui.js's clearLogs handler might be better for this part of UI update.
        // Or, we can assume displayActivityLog() is enough for now.
    }

    alert("Logs have been cleared. (logging.js)");
}

window.removeFolderEntriesFromLog = function(folderPath) {
    if (!folderPath || typeof folderPath !== 'string') {
        console.error("removeFolderEntriesFromLog: Invalid folderPath provided.", folderPath);
        return;
    }
    console.log(`Attempting to remove log entries for folder: "${folderPath}" (logging.js)...`);
    const originalLogLength = window.fileLog.length;

    // Filter out entries that are within the folder (path starts with folderPath + '/')
    // Also filter out entries that match the folderPath itself (in case a folder path was somehow logged as a file)
    window.fileLog = window.fileLog.filter(entry => {
        return !entry.currentPath.startsWith(folderPath + '/') && entry.currentPath !== folderPath;
    });

    const removedCount = originalLogLength - window.fileLog.length;
    if (removedCount > 0) {
        console.log(`Removed ${removedCount} log entries associated with folder "${folderPath}" (logging.js).`);
        saveLogsToStorage(); // Persist the changes

        // Update UI elements that depend on fileLog
        if (typeof updateFileMonitoredCount === 'function') {
            updateFileMonitoredCount();
            console.log("Called updateFileMonitoredCount from removeFolderEntriesFromLog (logging.js).");
        }
        if (typeof updateLogSizeDisplayOnLoad === 'function') { // Or a more direct size update if available
            updateLogSizeDisplayOnLoad();
            console.log("Called updateLogSizeDisplayOnLoad from removeFolderEntriesFromLog (logging.js).");
        }
        if (typeof displayActivityLog === 'function') {
            displayActivityLog();
            console.log("Called displayActivityLog from removeFolderEntriesFromLog (logging.js).");
        }
    } else {
        console.log(`No log entries found or removed for folder "${folderPath}" (logging.js).`);
    }
};

// --- File Scanning Function (moved from script.js) ---
async function scanFiles() {
    console.log("Starting file scan (logging.js)...");
    const currentTime = new Date().toISOString();
    const filesToProcess = [];

    // Access demoFilesData and userUploadedFolders from window object (populated by ui.js)
    const currentDemoFiles = (typeof window.demoFilesData !== "undefined") ? window.demoFilesData : null;
    const currentUserFolders = (typeof window.userUploadedFolders !== "undefined") ? window.userUploadedFolders : null;

    if (currentDemoFiles && currentDemoFiles.demo_files && currentDemoFiles.demo_files.children) {
        function _collectDemoFilesRecursive(currentLevelChildren) {
            for (const key in currentLevelChildren) {
                const item = currentLevelChildren[key];
                if (item.type === 'file') {
                    filesToProcess.push({ path: item.path, content: item.content || "", source: "demo" });
                } else if (item.type === 'folder' && item.children) {
                    _collectDemoFilesRecursive(item.children);
                }
            }
        }
        _collectDemoFilesRecursive(currentDemoFiles.demo_files.children);
    } else {
        console.warn("window.demoFilesData is not available or structured as expected for scanning in logging.js.");
    }

    if (currentUserFolders) {
        function _collectUserFilesRecursive(currentLevel) {
            for (const key in currentLevel) {
                const item = currentLevel[key];
                if (item.type === 'file' && item.fileObject) {
                    filesToProcess.push({ path: item.path, fileObject: item.fileObject, source: "user" });
                } else if (item.type === 'folder' && item.children) {
                    _collectUserFilesRecursive(item.children);
                }
            }
        }
        // Iterate over top-level keys in userUploadedFolders
        for (const topLevelFolder in currentUserFolders) {
            if (currentUserFolders.hasOwnProperty(topLevelFolder)) {
                 _collectUserFilesRecursive(currentUserFolders[topLevelFolder].children ? currentUserFolders[topLevelFolder].children : {});
                 // Also check if top-level item itself is a file (if structure allows)
                 if(currentUserFolders[topLevelFolder].type === 'file' && currentUserFolders[topLevelFolder].fileObject) {
                     filesToProcess.push({ path: currentUserFolders[topLevelFolder].path, fileObject: currentUserFolders[topLevelFolder].fileObject, source: "user" });
                 }
            }
        }
    } else {
        console.warn("window.userUploadedFolders is not available for scanning in logging.js.");
    }

    if (filesToProcess.length === 0) {
        alert("No files found to scan. Add demo files or upload folders first.");
        return;
    }

    console.log(`Collected ${filesToProcess.length} total files for scanning (logging.js).`);
    let newFilesAdded = 0;
    let filesModified = 0;
    let filesVerified = 0;
    let pathsUpdated = 0;
    let duplicatesFound = 0;

    // Create a Set of all paths in the current scan for efficient lookup
    const currentScanPaths = new Set(filesToProcess.map(f => f.path));

    for (const fileItem of filesToProcess) {
        let fileContent;
        // DEBUG_REUPLOAD_VERIFICATION Start
        if (fileItem.fileObject) {
            console.log(`DEBUG_REUPLOAD_VERIFICATION: Processing user file: ${fileItem.path}`, {
                name: fileItem.fileObject.name,
                size: fileItem.fileObject.size,
                type: fileItem.fileObject.type,
                lastModified: fileItem.fileObject.lastModified, // Standard File API property
                webkitRelativePath: fileItem.fileObject.webkitRelativePath
            });
        } else {
            console.log(`DEBUG_REUPLOAD_VERIFICATION: Processing demo file: ${fileItem.path}`);
        }
        // DEBUG_REUPLOAD_VERIFICATION End

        if (fileItem.fileObject) { // User file
            try {
                fileContent = await readFileAsText(fileItem.fileObject);
                // DEBUG_REUPLOAD_VERIFICATION Start
                console.log(`DEBUG_REUPLOAD_VERIFICATION: Content for ${fileItem.path}:`, fileContent.substring(0, 100) + (fileContent.length > 100 ? "..." : ""));
                // DEBUG_REUPLOAD_VERIFICATION End
            } catch (error) {
                console.error(`Error reading content for ${fileItem.path} (logging.js):`, error);
                continue;
            }
        } else { // Demo file
            fileContent = fileItem.content;
            // DEBUG_REUPLOAD_VERIFICATION Start
            // For demo files, content is already available, log it if needed for consistency, though it might be less critical than user file content.
            // Considering the request focuses on readFileAsText, this part might be optional.
            // However, to be thorough and if fileContent is the target:
            console.log(`DEBUG_REUPLOAD_VERIFICATION: Content for demo file ${fileItem.path}:`, (fileContent && typeof fileContent === 'string' ? fileContent.substring(0, 100) + (fileContent.length > 100 ? "..." : "") : "Content not available or not a string"));
            // DEBUG_REUPLOAD_VERIFICATION End
        }

        const currentHash = await generateSHA256(fileContent);
        if (currentHash === null) {
            console.error(`Hash generation failed for ${fileItem.path} (logging.js). Skipping.`);
            continue;
        }

        const existingLogEntryIndex = window.fileLog.findIndex(entry => entry.currentPath === fileItem.path);

        if (existingLogEntryIndex !== -1) {
            const logEntry = window.fileLog[existingLogEntryIndex];
            if (logEntry.currentHash !== currentHash) {
                logEntry.hashHistory.push(logEntry.currentHash);
                logEntry.currentHash = currentHash;
                logEntry.status = 'modified';
                logEntry.lastModifiedSystem = currentTime; // Consider using file's actual lastModified if available and reliable
                logEntry.lastHashCheckTime = currentTime;
                filesModified++;
            } else {
                logEntry.status = 'verified';
                logEntry.lastHashCheckTime = currentTime;
                filesVerified++;
            }
        } else {
            const appID = generateAppUniqueID();
            // Path not found in log - check for hash match for rename/move/duplicate detection
            const hashMatchEntryIndex = window.fileLog.findIndex(entry => entry.currentHash === currentHash);
            const hashMatchEntry = hashMatchEntryIndex !== -1 ? window.fileLog[hashMatchEntryIndex] : null;

            if (hashMatchEntry) {
                // Hash found, but path is new. Potential rename/move or duplicate.
                console.log(`Content of ${fileItem.path} (hash: ${currentHash}) already exists in log, currently at ${hashMatchEntry.currentPath}.`);

                if (!currentScanPaths.has(hashMatchEntry.currentPath)) {
                    // Scenario A: Rename/Move Detection
                    // The path previously associated with this hash is NOT in the current scan list.
                    console.log(`File at ${hashMatchEntry.currentPath} seems to have been moved/renamed to ${fileItem.path}. Updating log entry.`);
                    window.fileLog[hashMatchEntryIndex].previousPaths = window.fileLog[hashMatchEntryIndex].previousPaths || [];
                    window.fileLog[hashMatchEntryIndex].previousPaths.push(window.fileLog[hashMatchEntryIndex].currentPath);
                    window.fileLog[hashMatchEntryIndex].currentPath = fileItem.path;
                    window.fileLog[hashMatchEntryIndex].status = 'path_updated'; // New status
                    window.fileLog[hashMatchEntryIndex].lastHashCheckTime = currentTime;
                    window.fileLog[hashMatchEntryIndex].lastModifiedSystem = currentTime; // Or use fileItem.lastModified if available
                    pathsUpdated++;
                } else {
                    // Scenario B: Duplicate/Alternate Path
                    // The path previously associated with this hash IS ALSO in the current scan list. This is a duplicate.
                    console.warn(`DUPLICATE: File ${fileItem.path} has same content as ${hashMatchEntry.currentPath}. Creating new entry with 'duplicate' status.`);
                    const appID = generateAppUniqueID();
                    const newLogEntry = {
                        appID: appID,
                        currentPath: fileItem.path,
                        initialDiscoveryTime: currentTime,
                        lastHashCheckTime: currentTime,
                        lastModifiedSystem: currentTime,
                        currentHash: currentHash,
                        hashHistory: [],
                        previousPaths: [], // Initialize for new duplicate entry
                        status: 'duplicate', // New status
                        originalPath: hashMatchEntry.currentPath // Optional: link to the original
                    };
                    window.fileLog.push(newLogEntry);
                    duplicatesFound++;
                }
            } else {
                // Hash not found - this is a genuinely new file.
                const appID = generateAppUniqueID();
                const newLogEntry = {
                    appID: appID,
                    currentPath: fileItem.path,
                    initialDiscoveryTime: currentTime,
                    lastHashCheckTime: currentTime,
                    lastModifiedSystem: currentTime,
                    currentHash: currentHash,
                    hashHistory: [],
                    previousPaths: [], // Initialize for new entry
                    status: 'newly_added'
                };
                window.fileLog.push(newLogEntry);
                newFilesAdded++;
            }
        }
    }

    saveLogsToStorage(); // Save updated fileLog

    // Update UI (calls functions from ui.js, now explicitly via window)
    // These functions should use the global window.fileLog
    if (typeof window.updateFileMonitoredCount === "function") window.updateFileMonitoredCount();
    if (typeof window.updateLogSizeDisplayOnLoad === "function") window.updateLogSizeDisplayOnLoad();
    if (typeof window.updateLastScanTime === "function") window.updateLastScanTime();

    // Update "Files Changed" count in statistics (this element is in HTML, updated by ui.js function if one exists, or directly)
    const modifiedCount = window.fileLog.filter(entry => entry.status === 'modified').length;
    if (typeof window.updateFilesChangedCount === "function") {
        window.updateFilesChangedCount(modifiedCount);
    }

    // Refresh the displayed table based on current view (call ui.js function)
    // Determine active folder path from UI state if possible, otherwise default
    let currentActiveFolderPath = "demo_files"; // Default
    // Assuming activeSubFolderLink might be a global from ui.js for simplicity, or passed some other way.
    // For robustness, ui.js should expose a function to get the active path if needed by logging.js
    if (typeof window.getActiveSidebarFolderPath === "function") { // Ideal: ui.js provides a getter
        currentActiveFolderPath = window.getActiveSidebarFolderPath();
    } else if (typeof window !== 'undefined' && window.activeSubFolderLink && window.activeSubFolderLink.dataset.folderPath) {
         currentActiveFolderPath = window.activeSubFolderLink.dataset.folderPath; // Less ideal direct access
    } else {
        // Fallback query, though direct DOM manipulation from logging.js is not ideal
        const activeSidebarLink = document.querySelector('#sidebar-nav a.bg-\\[\\#1A2B3A\\].text-white[data-folder-path]');
        if (activeSidebarLink && activeSidebarLink.dataset.folderPath) {
            currentActiveFolderPath = activeSidebarLink.dataset.folderPath;
        }
    }

    if (typeof window.displayFolderContents === "function") window.displayFolderContents(currentActiveFolderPath);
    if (typeof window.displayActivityLog === "function") window.displayActivityLog(); // Refresh activity log

    console.log(`File scan complete (logging.js). New: ${newFilesAdded}, Modified: ${filesModified}, Verified: ${filesVerified}, Paths Updated: ${pathsUpdated}, Duplicates Found: ${duplicatesFound}. Log updated.`);
}

// Ensure logging.js is loaded, then ui.js, then script.js for dependency reasons if not using modules.
// Or, ensure functions are attached to window object for global access.
// For now, assuming global functions based on current structure.
// ui.js also has a fileLog variable. It should be treated as a reference or copy.
// logging.js's fileLog is the authoritative one. loadLogsFromStorage here updates it.
// UI functions in ui.js should ideally always refer to this authoritative fileLog.
// This might require passing fileLog to UI functions or having ui.js access logging.fileLog.
// For now, the calls to UI functions assume they can access the updated fileLog.
// A simple way is to ensure ui.js's fileLog is reassigned after loadLogsFromStorage or clearLogs.
// Example: In ui.js, after calling loadLogsFromStorage(), set ui.js's local fileLog = logging.js.fileLog (if modules)
// or window.fileLog = fileLog (if logging.js makes fileLog global like window.fileLog = fileLog).
// The most robust way is for UI functions to always read from a single global `fileLog` (window.fileLog) managed by `logging.js`.
// `ui.js`'s local `let fileLog = []` declaration will be removed in the next step.
console.log("logging.js fully parsed and initialized. fileLog is now global (window.fileLog).");

// Alert must be the final action after all UI updates.
let alertMessage = `File scan complete!
New files: ${newFilesAdded}
Modified files: ${filesModified}
Verified files: ${filesVerified}
Paths Updated: ${pathsUpdated}
Duplicates Found: ${duplicatesFound}
Log has been updated.`;

if (newFilesAdded === 0 && filesModified > 0) {
    alertMessage = `Scan complete. No new files were added, but ${filesModified} file(s) were updated.
Verified files: ${filesVerified}
Paths Updated: ${pathsUpdated}
Duplicates Found: ${duplicatesFound}
Log has been updated.`;
} else if (newFilesAdded === 0 && filesModified === 0 && pathsUpdated > 0) {
    alertMessage = `Scan complete. No new or modified files, but ${pathsUpdated} file path(s) were updated.
Verified files: ${filesVerified}
Duplicates Found: ${duplicatesFound}
Log has been updated.`;
}

alert(alertMessage);
