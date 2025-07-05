# GoldHash - Client-Side File Integrity Monitor

## Overview

GoldHash is a web-based application designed to help you monitor the integrity of your important files. It operates entirely on the client-side, meaning your files and their metadata are processed directly in your browser and are never uploaded to a server. You can add folders from your local system, and GoldHash will track them by calculating and storing cryptographic hashes of their contents. If a file is modified, GoldHash will detect this change upon a subsequent scan.

The core principle is to provide assurance that your files have not been altered unexpectedly. This is achieved by comparing known-good hashes (captured during an initial scan or when a file is first added) against current hashes.

## Features

### 1. Folder Monitoring

*   **Add Folders:** You can add folders from your local computer to the GoldHash application. The application will then be able to scan the files within these folders.
*   **Client-Side Processing:** All file access and processing occur within your browser. Files are not uploaded.
*   **Demo Files:** The application includes a "demo_files" directory with sample files to help you explore GoldHash's features without immediately adding your own sensitive folders.

### 2. File Scanning and Integrity Checks

*   **Scan Process:** When you initiate a scan, GoldHash traverses the files in your added folders.
*   **Hashing:** For each file, it calculates a SHA-256 hash of its content. This hash acts as a unique digital fingerprint.
*   **Status Tracking:**
    *   **Newly Added:** Files found for the first time.
    *   **Verified:** Files whose current hash matches the previously recorded hash.
    *   **Modified:** Files whose current hash *does not* match the previously recorded hash, indicating a change.
    *   **Path Updated:** Files whose content is unchanged but their location (path) might have been updated in the log.
    *   **Duplicate:** Files detected during folder addition that appear to be duplicates of already monitored files (based on hash).
    *   **Reactivated:** Files that were previously known (in logs) but not actively tracked, and have now been re-added.
*   **Log Storage:** File paths, their hashes, last modified dates, and status information are stored in your browser's local storage.

### 3. Activity Log and File Display

*   **Documents View:** Displays files from the currently selected folder in the sidebar. For each file, it shows its name, status (Verified, Modified, etc.), a truncated version of its current hash, the time it was last checked, its system last modified time, and its full path.
*   **Activity View:** Provides a chronological log of significant events, such as files being identified as new, modified, or verified during scans.

### 4. Statistics and Reporting

*   **Dashboard Metrics:**
    *   **Files Monitored:** Total number of files currently being tracked by GoldHash.
    *   **Files Changed:** A count of files that have been detected as modified since their last verified state.
    *   **Log Size:** An approximate size of the activity log stored in the browser.
    *   **Total Changes:** A cumulative count of detected changes.
*   **File Changes Over Time Graph:** A visual representation of the number of file changes detected over a period (e.g., the last 30 days).

### 5. Folder Management

*   **Sidebar Navigation:** Added folders (both demo and user-uploaded) are listed in a collapsible tree structure in the sidebar, allowing you to select a folder to view its contents.
*   **Edit Mode:**
    *   Activate "Edit Mode" to select user-added folders in the sidebar.
    *   **Delete Selected Folders:** Remove selected folders from GoldHash's tracking. You will be prompted whether to also remove their associated entries from the activity log. Demo folders cannot be deleted.

### 6. Settings

The settings panel (accessed via the gear icon) provides several configuration options:

*   **General:**
    *   **Appearance:** Choose between Light, Dark, or System theme.
*   **Scans:**
    *   **Schedule Scans:** (Conceptual) Configure automatic scan times and intervals. *(Note: Actual automated background scanning might be limited by browser capabilities for purely client-side applications without extensions.)*
    *   **VirusTotal API Key:** Input your VirusTotal API key. *(Note: The current codebase exploration did not detail the specific integration or usage of this API key, but the UI provides a field for it.)*
*   **Reports:** (Conceptual) Placeholder for future reporting features.
*   **About:**
    *   Basic information about the GoldHash application.
    *   **Clear Logs:** A button to completely erase all stored file logs and activity history from your browser's storage. Use with caution, as this will reset GoldHash's knowledge of your files.

## How to Use GoldHash

1.  **Launch GoldHash:** Open the `index.html` file in your web browser.
2.  **Add Folders (Optional but Recommended):**
    *   Click the "Add Folder" button.
    *   Select a folder from your local system that you wish to monitor.
    *   The folder will appear in the sidebar. You can add multiple folders.
3.  **Explore Demo Files (Optional):**
    *   The "demo_files" folder is available by default. Click on it or its subfolders in the sidebar to see how files are listed.
4.  **Scan Files:**
    *   Click the "Scan" button in the sidebar.
    *   GoldHash will process the files in all added folders (or the selected one, depending on implementation).
    *   Observe the "Documents" view for status updates (New, Verified, Modified).
    *   Check the "Activity" view for a log of actions.
5.  **Review Changes:**
    *   After modifying files in your monitored folders, run another "Scan".
    *   GoldHash will highlight modified files.
    *   Review the "Statistics" and the "File Changes Over Time" graph to see trends.
6.  **Manage Folders:**
    *   If you no longer wish to monitor a folder you added, click "Edit" in the sidebar, select the folder(s) using the checkboxes that appear, and then click "Delete Selected".
7.  **Adjust Settings:**
    *   Click the gear icon to open the Settings overlay.
    *   Customize appearance, review scan options, or clear logs if needed.

## Important Considerations

*   **Client-Side Storage:** All data (file paths, hashes, logs) is stored in your browser's local storage. This data will be lost if you clear your browser's cache/site data for GoldHash or if the local storage becomes corrupted. Consider exporting important log data if such a feature becomes available.
*   **Browser Limitations:** As a purely client-side application, GoldHash's ability to perform background tasks (like truly automated scheduled scans when the browser tab is closed) is limited. Scheduled scans likely rely on the application being open in an active browser tab.
*   **Security:** GoldHash helps detect *unauthorized changes*. It does not prevent them, nor does it inherently protect against malware. If a file is changed by malware, GoldHash will report the change, assuming the malware doesn't also tamper with GoldHash's logs (which are sandboxed by the browser but could be cleared).
*   **No Cloud Backup:** Your file data and GoldHash logs are not backed up to any server.

---

## Known Bugs

*   There are currently no known bugs. If you encounter any issues, please report them.

---
Feel free to contribute or report issues!
