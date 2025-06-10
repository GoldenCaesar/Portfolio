document.addEventListener('DOMContentLoaded', () => {
    const sidebarNav = document.getElementById('sidebar-nav');
    const documentsTbody = document.getElementById('documents-tbody');
    const mainContent = document.querySelector('main.ml-80'); // Used to display file content

    const demoFiles = {
        "Jokes Folder 1": {
            "joke1.txt": "Why don't scientists trust atoms? Because they make up everything!"
        },
        "Jokes Folder 2": {
            "joke2.txt": "Why did the scarecrow win an award? Because he was outstanding in his field!"
        },
        "Jokes Folder 3": {
            "joke3.txt": "Why don't skeletons fight each other? They don't have the guts."
        }
    };

    function displayFileContent(folderName, fileName) {
        const content = demoFiles[folderName]?.[fileName];
        if (content && mainContent) {
            // Clear existing content in main area (documents table, stats, etc.)
            // For simplicity, we'll just hide the existing sections and show the file content.
            // A more robust solution might involve a dedicated content display area.
            const sectionsToHide = mainContent.querySelectorAll('section');
            sectionsToHide.forEach(section => section.style.display = 'none');

            let fileContentDiv = document.getElementById('file-content-display');
            if (!fileContentDiv) {
                fileContentDiv = document.createElement('div');
                fileContentDiv.id = 'file-content-display';
                fileContentDiv.className = 'p-8 text-slate-100'; // Basic styling
                mainContent.appendChild(fileContentDiv);
            }
            fileContentDiv.style.display = 'block'; // Show file content display

            // Sanitize content before inserting as HTML
            const pre = document.createElement('pre');
            pre.textContent = content;

            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Files';
            backButton.className = 'mb-4 px-4 py-2 bg-[#0c7ff2] text-white rounded hover:bg-blue-600 transition-colors';
            backButton.onclick = () => {
                sectionsToHide.forEach(section => section.style.display = 'block'); // Or 'flex' or 'grid' depending on original
                fileContentDiv.style.display = 'none';
                // Redisplay the folder contents
                displayFolderContents(folderName);
            };

            fileContentDiv.innerHTML = ''; // Clear previous content
            fileContentDiv.appendChild(backButton);
            fileContentDiv.appendChild(pre);

        } else {
            alert('File content not found.');
        }
    }

    function displayFolderContents(folderName) {
        if (!documentsTbody) return;
        documentsTbody.innerHTML = ''; // Clear previous file list

        // Make sure sections are visible if they were hidden by file display
        const sectionsToHide = mainContent.querySelectorAll('section');
        sectionsToHide.forEach(section => section.style.display = 'block'); // Or original display type
        let fileContentDiv = document.getElementById('file-content-display');
        if (fileContentDiv) {
            fileContentDiv.style.display = 'none';
        }


        const files = demoFiles[folderName];
        if (files) {
            Object.keys(files).forEach(fileName => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-[#1A2B3A] cursor-pointer'; // Add hover effect and cursor

                const nameTd = document.createElement('td');
                nameTd.className = 'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100';
                nameTd.textContent = fileName;

                // For demo purposes, Last Modified and Size are static
                const modifiedTd = document.createElement('td');
                modifiedTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
                modifiedTd.textContent = '2024-03-10 10:00 AM'; // Static date

                const sizeTd = document.createElement('td');
                sizeTd.className = 'whitespace-nowrap px-6 py-4 text-sm text-slate-300';
                sizeTd.textContent = '1 KB'; // Static size

                tr.appendChild(nameTd);
                tr.appendChild(modifiedTd);
                tr.appendChild(sizeTd);

                tr.addEventListener('click', () => displayFileContent(folderName, fileName));
                documentsTbody.appendChild(tr);
            });
        }
    }

    function loadDemoFolders() {
        if (!sidebarNav) return;
        sidebarNav.innerHTML = ''; // Clear existing (should be empty from HTML modification)

        Object.keys(demoFiles).forEach(folderName => {
            const a = document.createElement('a');
            a.href = '#'; // Prevent page navigation
            a.className = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1A2B3A]';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'material-icons-outlined text-slate-400';
            iconSpan.style.fontSize = '20px';
            iconSpan.textContent = 'folder';

            a.appendChild(iconSpan);
            a.append(` ${folderName}`); // Add folder name text node

            a.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default anchor behavior

                // Remove 'bg-[#1A2B3A]' from all other links and add to current
                document.querySelectorAll('#sidebar-nav a').forEach(link => {
                    link.classList.remove('bg-[#1A2B3A]');
                    link.classList.add('text-slate-300');
                });
                a.classList.add('bg-[#1A2B3A]');
                a.classList.remove('text-slate-300');

                displayFolderContents(folderName);
            });
            sidebarNav.appendChild(a);
        });

        // Optionally, display contents of the first folder by default
        if (Object.keys(demoFiles).length > 0) {
            const firstFolderName = Object.keys(demoFiles)[0];
            const firstFolderLink = sidebarNav.querySelector('a');
            if (firstFolderLink) {
                 firstFolderLink.classList.add('bg-[#1A2B3A]'); // Highlight first folder
                 firstFolderLink.classList.remove('text-slate-300');
            }
            displayFolderContents(firstFolderName);
        }
    }

    loadDemoFolders();
});
