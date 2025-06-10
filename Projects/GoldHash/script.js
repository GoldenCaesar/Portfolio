console.log("script.js loaded");

// Function to recursively count files
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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    const sidebarNav = document.getElementById('sidebar-nav');
    console.log("sidebarNav element:", sidebarNav);
    const documentsTbody = document.getElementById('documents-tbody');
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

    // Update files monitored count
    const filesMonitoredElement = document.getElementById('files-monitored-count');
    if (filesMonitoredElement && typeof demoFilesData !== 'undefined' && demoFilesData.demo_files && demoFilesData.demo_files.children) {
        const totalFiles = countFiles(demoFilesData.demo_files.children);
        filesMonitoredElement.textContent = totalFiles.toLocaleString();
    } else {
        console.error("Files monitored element not found or demoFilesData structure is not as expected.");
    }

    // Update Log Size display (placeholder)
    const logSizeElement = document.getElementById('log-size-display');
    if (logSizeElement) {
        // This is a placeholder value.
        // For a live application, dynamic log size updates would typically require
        // server-side logic to calculate directory/file sizes and an API endpoint
        // to fetch this data, or Node.js 'fs' module if running in a Node environment
        // with direct file system access (not applicable for client-side browser JS).
        // Since the "Logs" folder is currently just for demonstration and might only
        // contain a .gitkeep file, we'll set a minimal representative size.
        logSizeElement.textContent = "1 KB"; // Representing .gitkeep or minimal folder size
    } else {
        console.error("Log size display element not found.");
    }

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
        if (!documentsTbody) return;
        documentsTbody.innerHTML = '';

        const sectionsToHide = mainContent.querySelectorAll('section');
        sectionsToHide.forEach(section => section.style.display = 'block');
        let fileContentDiv = document.getElementById('file-content-display');
        if (fileContentDiv) fileContentDiv.style.display = 'none';

        const parts = folderPath.split('/');
        let currentLevel = demoFilesData;
        for (const part of parts) {
            if (currentLevel[part] && currentLevel[part].children) {
                currentLevel = currentLevel[part].children;
            } else {
                 console.error("Folder not found in demoFilesData:", folderPath);
                return; // Folder not found
            }
        }

        const files = currentLevel;
        if (files) {
            Object.keys(files).forEach(itemName => {
                const item = files[itemName];
                if (item.type === 'file') {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-[#1A2B3A] cursor-pointer';

                    const nameTd = document.createElement('td');
                    nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
                    nameTd.textContent = itemName;

                    const modifiedTd = document.createElement('td');
                    modifiedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
                    modifiedTd.textContent = '2024-03-11 10:00 AM'; // Static

                    const sizeTd = document.createElement('td');
                    sizeTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
                    sizeTd.textContent = '1 KB'; // Static

                    tr.appendChild(nameTd);
                    tr.appendChild(modifiedTd);
                    tr.appendChild(sizeTd);

                    tr.addEventListener('click', () => displayFileContent(item.path));
                    documentsTbody.appendChild(tr);
                }
            });
        }
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
});
