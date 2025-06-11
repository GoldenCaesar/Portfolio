// GoldHash Application Entry Point (script.js)
//
// This file previously contained much of the application logic.
// It has been refactored into a modular structure:
//
// - ui.js: Handles all user interface interactions, DOM manipulations,
//          and visual updates. It contains the primary DOMContentLoaded
//          listener which initializes the UI and sets up event handlers.
//
// - logging.js: Manages core data operations, including file hashing,
//               reading files, generating unique IDs, loading/saving
//               activity logs (fileLog), and the main file scanning process.
//
// Order of script loading in HTML (if not using ES modules) is generally:
// 1. logging.js (provides core utilities and data management)
// 2. ui.js (depends on logging.js for some operations, sets up UI)
// 3. script.js (this file - now mostly for informational purposes or future global orchestration)
//
// The application starts when ui.js's DOMContentLoaded event fires,
// setting up the user interface and event listeners. These listeners
// then trigger functions primarily from logging.js to perform backend tasks,
// and logging.js functions call back to ui.js functions for display updates.
// The global 'fileLog' array is authoritatively managed within logging.js.
//
// console.log("script.js is now primarily informational.");
// (Retaining one console log to confirm script loading order if needed during debugging,
//  but it can be removed for a production/clean state).
console.log("GoldHash main script loaded (script.js) - primarily informational.");
