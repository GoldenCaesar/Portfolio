document.addEventListener('DOMContentLoaded', () => {
    const skills = {
        'Acrobatics': 'dexterity',
        'Animal Handling': 'wisdom',
        'Arcana': 'intelligence',
        'Athletics': 'strength',
        'Deception': 'charisma',
        'History': 'intelligence',
        'Insight': 'wisdom',
        'Intimidation': 'charisma',
        'Investigation': 'intelligence',
        'Medicine': 'wisdom',
        'Nature': 'intelligence',
        'Perception': 'wisdom',
        'Performance': 'charisma',
        'Persuasion': 'charisma',
        'Religion': 'intelligence',
        'Sleight of Hand': 'dexterity',
        'Stealth': 'dexterity',
        'Survival': 'wisdom'
    };

    function calculateModifier(score) {
        let mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? '+' + mod : mod;
    }

    // --- Convex Hull Algorithm (Monotone Chain) ---
    // Adapted from https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
    function crossProduct(p1, p2, p3) {
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    }

    function getConvexHull(points) {
        if (points.length <= 3) return points;

        points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

        const lowerHull = [];
        for (const p of points) {
            while (lowerHull.length >= 2 && crossProduct(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], p) <= 0) {
                lowerHull.pop();
            }
            lowerHull.push(p);
        }

        const upperHull = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (upperHull.length >= 2 && crossProduct(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], p) <= 0) {
                upperHull.pop();
            }
            upperHull.push(p);
        }

        lowerHull.pop();
        upperHull.pop();
        return lowerHull.concat(upperHull);
    }

    const saveCampaignModal = document.getElementById('save-campaign-modal');
    const saveCampaignModalCloseButton = document.getElementById('save-campaign-modal-close-button');
    const confirmSaveButton = document.getElementById('confirm-save-button');
    const cancelSaveButton = document.getElementById('cancel-save-button');
    const saveOptionsContainer = document.getElementById('save-options-container');
    const saveConflictWarnings = document.getElementById('save-conflict-warnings');
    const saveMapsCheckbox = document.getElementById('save-maps-checkbox');
    const saveCharactersCheckbox = document.getElementById('save-characters-checkbox');
    const saveNotesCheckbox = document.getElementById('save-notes-checkbox');
    const saveInitiativeCheckbox = document.getElementById('save-initiative-checkbox');
    const saveRollsCheckbox = document.getElementById('save-rolls-checkbox');
    const saveTimerCheckbox = document.getElementById('save-timer-checkbox');
    const saveAudioCheckbox = document.getElementById('save-audio-checkbox');
    const saveStoryBeatsCheckbox = document.getElementById('save-story-beats-checkbox');
    const saveQuotesCheckbox = document.getElementById('save-quotes-checkbox');

    const loadCampaignModal = document.getElementById('load-campaign-modal');
    const loadCampaignModalCloseButton = document.getElementById('load-campaign-modal-close-button');
    const loadOptionsContainer = document.getElementById('load-options-container');
    const confirmLoadButton = document.getElementById('confirm-load-button');
    const cancelLoadButton = document.getElementById('cancel-load-button');

    const uploadMapsInput = document.getElementById('upload-maps-input');
    const mapsList = document.getElementById('maps-list');
    const openPlayerViewButton = document.getElementById('open-player-view-button'); // Added for player view
    const editMapsIcon = document.getElementById('edit-maps-icon');
    const dmCanvas = document.getElementById('dm-canvas');
    const shadowCanvas = document.getElementById('shadow-canvas');
    const gridCanvas = document.getElementById('grid-canvas');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const mapContainer = document.getElementById('map-container');
    const noteEditorContainer = document.getElementById('note-editor-container'); // New container for the editor
    const hoverLabel = document.getElementById('hover-label');
    const polygonContextMenu = document.getElementById('polygon-context-menu');
    const noteContextMenu = document.getElementById('note-context-menu');
    const characterContextMenu = document.getElementById('character-context-menu');
    const mapToolsContextMenu = document.getElementById('map-tools-context-menu');
    const viewModeMapContextMenu = document.getElementById('view-mode-map-context-menu');
    const lightSourceContextMenu = document.getElementById('light-source-context-menu');
    const displayedFileNames = new Set();

    // Shadow tool elements
    const shadowToolsContainer = document.getElementById('shadow-tools-container');
    const btnShadowObject = document.getElementById('btn-shadow-object');
    const btnShadowWall = document.getElementById('btn-shadow-wall');
    const btnShadowDoor = document.getElementById('btn-shadow-door');
    const btnAddLightSource = document.getElementById('btn-add-light-source');
    const btnShadowErase = document.getElementById('btn-shadow-erase');
    const btnShadowDone = document.getElementById('btn-shadow-done');

    const assetsToolsContainer = document.getElementById('assets-tools-container');
    const btnAssetsSelect = document.getElementById('btn-assets-select');
    const btnAssetsStamp = document.getElementById('btn-assets-stamp');
    const btnAssetsChain = document.getElementById('btn-assets-chain');
    const btnAssetsDelete = document.getElementById('btn-assets-delete');
    const btnAssetsFlatten = document.getElementById('btn-assets-flatten');
    const btnAssetsMerge = document.getElementById('btn-assets-merge');
    const btnAssetsDone = document.getElementById('btn-assets-done');
    const btnAssetsGrid = document.getElementById('btn-assets-grid');
    const assetPreviewContainer = document.getElementById('asset-preview-container');
    const gridControlsContainer = document.getElementById('grid-controls-container');
    const gridScaleSlider = document.getElementById('grid-scale-slider');
    const gridScaleValue = document.getElementById('grid-scale-value');
    const gridSqftInput = document.getElementById('grid-sqft-input');
    const gridOnCheckbox = document.getElementById('grid-on-checkbox');
    const assetPreviewImage = document.getElementById('asset-preview-image');
    const assetPreviewTitle = document.getElementById('asset-preview-title');
    const assetPreviewOpacitySlider = document.getElementById('asset-preview-opacity');
    const assetPreviewOpacityValue = document.getElementById('asset-preview-opacity-value');
    const assetChainPointsSliderContainer = document.getElementById('asset-chain-points-slider-container');
    const assetChainPointsSlider = document.getElementById('asset-chain-points');
    const assetChainStartPoint = document.getElementById('asset-chain-start-point');
    const assetChainEndPoint = document.getElementById('asset-chain-end-point');
    const autoShadowContainer = document.getElementById('auto-shadow-container');
    const autoShadowCheckbox = document.getElementById('auto-shadow-checkbox');
    const autoShadowModeToggle = document.getElementById('auto-shadow-mode-toggle');
    const autoShadowWallLabel = document.getElementById('auto-shadow-wall-label');
    const autoShadowObjectLabel = document.getElementById('auto-shadow-object-label');
    const footerAssetsTab = document.querySelector('[data-tab="footer-assets"]');
    const footerAssetsContent = document.getElementById('footer-assets');

    // Token Stat Block Elements
    const tokenStatBlock = document.getElementById('token-stat-block');
    const tokenStatBlockCharName = document.getElementById('token-stat-block-char-name');
    const tokenStatBlockPlayerName = document.getElementById('token-stat-block-player-name');
    const tokenStatBlockHp = document.getElementById('token-stat-block-hp');
    const tokenStatBlockMaxHp = document.getElementById('token-stat-block-max-hp');
    const tokenStatBlockSetTargets = document.getElementById('token-stat-block-set-targets');
    const tokenStatBlockTargetsContainer = document.getElementById('token-stat-block-targets-container');
    const tokenStatBlockTargetsList = document.getElementById('token-stat-block-targets-list');
    const tokenStatBlockRollsList = document.getElementById('token-stat-block-rolls-list');
    const tokenStatBlockAddRollName = document.getElementById('token-stat-block-add-roll-name');
    const tokenStatBlockAddRollTags = document.getElementById('token-stat-block-add-roll-tags');
    // const tokenStatBlockAddRollDice = document.getElementById('token-stat-block-add-roll-dice'); // REPLACED
    // const tokenStatBlockAddRollBtn = document.getElementById('token-stat-block-add-roll-btn'); // REPLACED
    const tokenStatBlockDiceButtons = document.getElementById('token-stat-block-dice-buttons');
    const tokenStatBlockAddRollModifier = document.getElementById('token-stat-block-add-roll-modifier');
    const tokenStatBlockSaveRollBtn = document.getElementById('token-stat-block-save-roll-btn');
    let tokenStatBlockDiceCounts = {};

    // Dice Roller Elements
    const diceRollerIcon = document.getElementById('dice-roller-icon');
    const dmFloatingFooter = document.getElementById('dm-floating-footer');
    const dmToolsList = document.getElementById('dm-tools-list');
    const footerInitiativeControls = document.getElementById('footer-initiative-controls');
    const footerPrevTurnButton = document.getElementById('footer-prev-turn-button');
    const footerStopInitiativeButton = document.getElementById('footer-stop-initiative-button');
    const footerNextTurnButton = document.getElementById('footer-next-turn-button');
    const footerWanderControls = document.getElementById('footer-wander-controls');
    const footerStopWanderButton = document.getElementById('footer-stop-wander-button');
    const diceRollerOverlay = document.getElementById('dice-roller-overlay');
    const diceRollerCloseButton = document.getElementById('dice-roller-close-button');
    const diceDialogueRecord = document.getElementById('dice-dialogue-record');
    let diceDialogueTimeout;
    let diceRollHistory = [];
    let savedRolls = []; // To store saved roll configurations
    const saveRollNameInput = document.getElementById('save-roll-name-input');
    const saveRollButton = document.getElementById('save-roll-button');
    const savedRollsList = document.getElementById('saved-rolls-list');

    // Initiative Tracker Elements
    const initiativeTrackerOverlay = document.getElementById('initiative-tracker-overlay');
    const initiativeTrackerCloseButton = document.getElementById('initiative-tracker-close-button');
    const initiativeTrackerTitle = document.getElementById('initiative-tracker-title');
    const masterCharacterList = document.getElementById('initiative-master-character-list');
    const activeInitiativeList = document.getElementById('initiative-active-list');
    const savedInitiativesList = document.getElementById('saved-initiatives-list');
    const autoInitiativeButton = document.getElementById('auto-initiative-button');
    const saveInitiativeNameInput = document.getElementById('save-initiative-name-input');
    const saveInitiativeButton = document.getElementById('save-initiative-button');
    const loadInitiativeButton = document.getElementById('load-initiative-button');
    const startInitiativeButton = document.getElementById('start-initiative-button');
    const wanderButton = document.getElementById('wander-button');
    const prevTurnButton = document.getElementById('prev-turn-button');
    const nextTurnButton = document.getElementById('next-turn-button');
    const initiativeTimers = document.getElementById('initiative-timers');
    const realTimeTimer = document.getElementById('real-time-timer');
    const gameTimeTimer = document.getElementById('game-time-timer');
    const mapIconSizeSlider = document.getElementById('map-icon-size-slider');
    const mapIconSizeValue = document.getElementById('map-icon-size-value');


    // Notes Tab Elements
    const createNewNoteButton = document.getElementById('create-new-note-button');
    const editNotesIcon = document.getElementById('edit-notes-icon');
    const notesList = document.getElementById('notes-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const saveNoteButton = document.getElementById('save-note-button');
    const markdownEditorTextarea = document.getElementById('markdown-editor');
    const tabNotes = document.getElementById('tab-notes');

    // Characters Tab Elements
    const addCharacterButton = document.getElementById('add-character-button');
    const editCharactersIcon = document.getElementById('edit-characters-icon');
    const charactersList = document.getElementById('characters-list');
    const characterNameInput = document.getElementById('character-name-input');
    const saveCharacterButton = document.getElementById('save-character-button');
    const clearFieldsButton = document.getElementById('clear-fields-button');
    const fillFromButton = document.getElementById('fill-from-button');
    const fillFromDropdown = document.getElementById('fill-from-dropdown');
    const fillFromPdfOption = document.getElementById('fill-from-pdf-option');
    const pdfUploadInput = document.getElementById('pdf-upload-input');
    const characterSheetContainer = document.getElementById('character-sheet-container');
    const characterSheetIframe = document.getElementById('character-sheet-iframe');
    const tabCharacters = document.getElementById('tab-characters');
    const characterNotesButton = document.getElementById('character-notes-button');
    const viewCharacterButton = document.getElementById('view-character-button');
    const characterNotesEditorContainer = document.getElementById('character-notes-editor-container');
    const characterMarkdownEditor = document.getElementById('character-markdown-editor');
    const modeToggleSwitch = document.getElementById('mode-toggle-switch');
    const viewPdfButton = document.getElementById('view-pdf-button');
    const deletePdfButton = document.getElementById('delete-pdf-button');
    const characterSheetContent = document.getElementById('character-sheet-content');
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');

    // Story Beats Tab Elements
    const storyBeatsTab = document.getElementById('tab-story-beats');
    const modifyQuotesButton = document.getElementById('modify-quotes-button');
    const viewStoryTreeButton = document.getElementById('view-story-tree-button');
    const automationButton = document.getElementById('automation-button');
    const automationContainer = document.getElementById('automation-container');
    const storyTreeContainer = document.getElementById('canvas-container');
    const storyTreeCanvas = document.getElementById('quest-canvas');
    const storyTreeCardContainer = document.getElementById('card-container');
    const storyBeatCardOverlay = document.getElementById('story-beat-card-overlay');
    const automationManagementSection = document.getElementById('automation-management-section');
    const automationBranchNameInput = document.getElementById('automation-branch-name-input');
    const saveAutomationBranchButton = document.getElementById('save-automation-branch-button');
    const automationBranchesList = document.getElementById('automation-branches-list');
    const storyBeatCardBody = document.getElementById('story-beat-card-body');
    const beginAutomationButton = document.getElementById('begin-automation-button');
    const automationActiveControls = document.getElementById('automation-active-controls');
    const previousAutomationButton = document.getElementById('previous-automation-button');
    const stopAutomationButton = document.getElementById('stop-automation-button');
    const nextAutomationButton = document.getElementById('next-automation-button');
    const quoteEditorContainer = document.getElementById('quote-editor-container');
    const jsonEditOverlay = document.getElementById('json-export-overlay'); // Changed name
    const jsonEditContent = document.getElementById('json-edit-content'); // Changed name
    const jsonEditCloseButton = document.getElementById('json-export-close-button'); // Changed name
    const copyJsonButton = document.getElementById('copy-json-button');
    const saveJsonButton = document.getElementById('save-json-button'); // New button
    const saveQuotesButton = document.getElementById('save-quotes-button');
    const quoteJsonEditor = document.getElementById('quote-json-editor');


    // Map Tools Elements
    const mapToolsSection = document.getElementById('map-tools-section');
    // const mapToolButtons = mapToolsSection ? mapToolsSection.querySelectorAll('.map-tools-buttons button') : []; // Will re-evaluate usage of this

    // Button References for Map Tools
    const btnLinkChildMap = document.getElementById('btn-link-child-map');
    // Add other tool buttons here as needed, e.g.:
    const btnLinkNote = document.getElementById('btn-link-note');
    const btnLinkCharacter = document.getElementById('btn-link-character');
    // const btnLinkTrigger = document.getElementById('btn-link-trigger');
    // const btnRemoveLinks = document.getElementById('btn-remove-links');


    // const mapObjectURLs = new Map(); // Old: To store filename -> objectURL mapping for Manage Maps
    // New structure: fileName -> { url: objectURL, name: fileName, overlays: [], transform: { scale: 1, originX: 0, originY: 0 } }
    const detailedMapData = new Map();
    const fogOfWarCanvasCache = new Map();
    let isEditMode = false;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let isQuestLogVisible = false;

    // Core state variables
    let selectedMapFileName = null;

    // Notes State Variables
    let notesData = []; // Array of note objects: { id: uniqueId, title: "Note 1", content: "# Markdown" }
    let selectedNoteId = null;
    let isNotesEditMode = false;
    let easyMDE = null;

    // Characters State Variables
    let charactersData = []; // Array of character objects: { id: uniqueId, name: "Character 1", sheetData: "...", notes: "" }
    let selectedCharacterId = null;
    let isCharactersEditMode = false;
    let characterEasyMDE = null;

    // Story Beats State Variables
    let quests = [
        {
            id: 1,
            name: 'Final Quest',
            parentIds: [],
            x: 0,
            y: 0,
            description: '',
            // New Fields
            questStatus: 'Active', // Unavailable, Available, Active, Completed, Failed, Abandoned
            questType: ['Main Story'], // Taggable field
            startingTriggers: [], // Now an array of objects: { text: "trigger text", linkedQuestId: null }
            associatedMaps: [], // List of map file names
            associatedNPCs: [], // List of objects: { id: characterId, role: 'Quest Giver' }
            failureTriggers: [], // Now an array of objects: { text: "trigger text", linkedQuestId: null }
            successTriggers: [], // Now an array of objects: { text: "trigger text", linkedQuestId: null }
            detailedRewards: {
                xp: 0,
                loot: '',
                magicItems: '',
                information: ''
            },
            storyDuration: '1 Session',
            difficulty: 3,
            storySteps: [],
            // Old fields that are being replaced or kept for compatibility
            status: 'active', // Will be deprecated in favor of questStatus
            prerequisites: [],
            rewards: [],
            recommendations: [],
            completionSteps: []
        }
    ];
    let nextQuestId = 2;
    let selectedQuestId = 1;
    let activeOverlayCardId = null;
    let originalQuestState = null;
    let automationCanvasData = [];
    let automationCardCounters = {};
    let automationBranches = {};
    let automationHistory = [];
    let lastAutomationCard = null;
    let hasDeviatedFromAutomation = false;

    // Initiative Tracker State Variables
    let savedInitiatives = {}; // Object to store saved initiatives: { "name": [...] }
    let activeInitiative = []; // Array of character objects in the current initiative
    let initiativeTurn = -1; // Index of the current turn in activeInitiative
    let isWandering = false;
    let initiativeStartTime = null;
    let realTimeInterval = null;
    let gameTime = 0;
    let initiativeRound = 0;
    let initiativeTokens = [];
    let mapIconSize = 5;
    let isDraggingToken = false;
    let draggedToken = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let selectedTokenForStatBlock = null;

    // State for 'Link to Child Map' tool
    let isLinkingChildMap = false;
    let isLinkingNote = false;
    let isLinkingCharacter = false;
    let currentPolygonPoints = [];
    let polygonDrawingComplete = false; // Will be used in Phase 2
    let selectedPolygonForContextMenu = null; // Added: To store right-clicked polygon info
    let selectedNoteForContextMenu = null;
    let selectedCharacterForContextMenu = null;
    let selectedLightSourceForContextMenu = null;
let linkingNoteForAutomationCard = null;
    let isChangingChildMapForPolygon = false; // Added: State for "Change Child Map" action
    let isRedrawingPolygon = false; // Added: State for "Redraw Polygon" action
    let preservedLinkedMapNameForRedraw = null; // Added: To store linked map name during redraw

    // Player View window reference
    let playerWindow = null;

    let isMovingPolygon = false; // Added: State for "Move Polygon" action
    let polygonBeingMoved = null; // Added: { overlay: reference, originalPoints: copy, parentMapName: string }
    let isMovingNote = false;
    let noteBeingMoved = null;
    let isMovingCharacter = false;
    let characterBeingMoved = null;
    let moveStartPoint = null; // Added: {x, y} image-relative coords for drag start
    let currentDragOffsets = {x: 0, y: 0};

    // Shadow tool state
    let isShadowMode = false;
    let activeShadowTool = null; // 'wall', 'door', 'erase'
    let isDrawing = false; // Generic drawing flag for wall tool
    let isAssetsMode = false;
    let assetsByPath = {};
    let currentAssetPath = [];
    let assetFavorites = {}; // path: true
    let isFavoritesView = false;
    let selectedAssetPath = null;
    let selectedAssetForPreview = null; // To hold the Image object for previewing
    let assetImageCache = {};
    let selectedPlacedAssets = []; // Replaces selectedPlacedAsset for multi-select
    let isSelecting = false; // For marquee selection
    let selectionBox = null; // For marquee box coordinates
    let currentAssetPreviewTransform = { scale: 1, rotation: 0, opacity: 1 };
    let assetTransformHandles = {};
let activeAssetTool = null; // Can be 'select', 'stamp', or 'chain'
let isGridToolActive = false;
let gridScale = 50;
let gridSqft = 5;
let isGridVisible = false;
let gridData = {};
let chainPointsAngle = 0; // In radians
let isChaining = false;
let lastStampedAssetEndpoint = null;
    let isDraggingAssetHandle = false;
    let draggedHandleInfo = null; // { name, initialAsset, initialMouseCoords }
    let isDraggingAsset = false;
    let draggedAssetInfo = null; // { initialAsset, initialMouseCoords }
let assetBoundingBoxCache = {};
let isAutoShadowActive = false;
let autoShadowMode = 'wall'; // 'wall' or 'object'
    let lastX = 0;
    let lastY = 0;
    let lineStartPoint = null; // For door tool
    let isDraggingLightSource = false;
    let draggedLightSource = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Rendering optimization state
    let lightMapCanvas = null;
    let lightMapCtx = null;
    let isLightMapDirty = true;
    let dmRenderQuality = 0.5; // Default quality for DM view (0.1 to 1.0)
    let playerRenderQuality = 0.5; // Default quality for Player view

    // Fog of War State
    let fogOfWarUpdateTimeout = null;

    // Campaign Timer State
    let campaignTimerInterval = null;
    let campaignTime = 0; // Total elapsed seconds
    let isCampaignTimerPaused = true;

    let isTargeting = false;
    let targetingCharacter = null;

    let currentMapDisplayData = { // To store details of the currently displayed map for coordinate conversion
        img: null,
        ratio: 1,
        offsetX: 0,
        offsetY: 0,
        imgWidth: 0,
        imgHeight: 0
    };

    // Slideshow state
    let slideshowPlaylist = [];
    let slideshowCurrentIndex = 0;
    let quoteMap = null;
    const quoteMapPromise = fetch('quote_map.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            quoteMap = data;
            return data;
        })
        .catch(e => {
            console.error("Failed to load quote_map.json for DM view:", e);
            return null;
        });


    // Debounce utility function
    const getQuestDataFromOverlay = () => {
        if (!activeOverlayCardId) return null;

        const difficultyStars = document.querySelectorAll('#quest-difficulty .star');
        let difficulty = 0;
        difficultyStars.forEach(star => {
            if (star.textContent === '★') {
                difficulty = Math.max(difficulty, parseInt(star.dataset.value, 10));
            }
        });

        const currentQuestData = {
            id: activeOverlayCardId,
            name: document.getElementById('quest-name').innerText,
            description: document.getElementById('quest-description').innerText,
            questStatus: document.getElementById('quest-status').value,
            questType: document.getElementById('quest-type').value.split(',').map(s => s.trim()).filter(Boolean),
            storyDuration: document.getElementById('quest-story-duration').value,
            difficulty: difficulty,
            startingTriggers: Array.from(document.querySelectorAll('#quest-starting-triggers .trigger-row')).map((row, index) => {
                const existingTrigger = originalQuestState.startingTriggers[index] || {};
                return {
                    text: row.querySelector('.trigger-text').innerText,
                    linkedQuestId: existingTrigger.linkedQuestId || null
                };
            }),
            associatedMaps: Array.from(document.getElementById('quest-associated-maps').selectedOptions).map(opt => opt.value),
            associatedNPCs: Array.from(document.querySelectorAll('.npc-row')).map(row => ({
                id: parseInt(row.querySelector('.npc-select').value, 10),
                role: row.querySelector('.npc-role').value
            })).filter(npc => npc.id),
            storySteps: Array.from(document.querySelectorAll('.story-step-row')).map(row => ({
                title: row.querySelector('.story-step-title').innerText,
                text: row.querySelector('.story-step-text').innerText,
                completed: row.querySelector('.story-step-checkbox').checked
            })),
            successTriggers: Array.from(document.querySelectorAll('#quest-success-triggers .trigger-row')).map((row, index) => {
                const existingTrigger = originalQuestState.successTriggers[index] || {};
                return {
                    text: row.querySelector('.trigger-text').innerText,
                    linkedQuestId: existingTrigger.linkedQuestId || null
                };
            }),
            failureTriggers: Array.from(document.querySelectorAll('#quest-failure-triggers .trigger-row')).map((row, index) => {
                const existingTrigger = originalQuestState.failureTriggers[index] || {};
                return {
                    text: row.querySelector('.trigger-text').innerText,
                    linkedQuestId: existingTrigger.linkedQuestId || null
                };
            }),
            detailedRewards: {
                xp: parseInt(document.getElementById('reward-xp').value, 10) || 0,
                loot: document.getElementById('reward-loot').value,
                magicItems: document.getElementById('reward-magic-items').value,
                information: document.getElementById('reward-information').value,
            },
            parentIds: originalQuestState.parentIds,
            x: originalQuestState.x,
            y: originalQuestState.y,
            status: originalQuestState.status,
            prerequisites: originalQuestState.prerequisites,
            rewards: originalQuestState.rewards,
            recommendations: originalQuestState.recommendations,
            completionSteps: originalQuestState.completionSteps
        };
        return currentQuestData;
    };

    const areChangesUnsaved = () => {
        if (!originalQuestState) return false;
        const currentQuestState = getQuestDataFromOverlay();
        return !isDeepEqual(originalQuestState, currentQuestState);
    };

    const hideOverlay = () => {
        if (areChangesUnsaved()) {
            if (confirm("You have unsaved changes. Do you want to save them before closing?")) {
                document.getElementById('save-quest-details-btn').click();
            }
        }
        storyBeatCardOverlay.style.display = 'none';
        activeOverlayCardId = null;
        originalQuestState = null;
        const currentlySelected = document.querySelector('.card.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
    };

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    function getQuote(stat, character) {
        if (!quoteMap) {
            return "Loading quotes...";
        }

        const visibility = character.isDetailsVisible ? 'visible' : 'notVisible';

        if (quoteMap.ability_scores[stat.statName]) {
            const score = parseInt(stat.statValue.score, 10);
            const tiers = quoteMap.ability_scores[stat.statName];
            for (const tier of tiers) {
                if (score >= tier.condition.min && score <= tier.condition.max) {
                    const quotes = tier[visibility];
                    let quote = quotes[Math.floor(Math.random() * quotes.length)];
                    if (visibility === 'visible') {
                        quote = quote.replace('{{score}}', stat.statValue.score).replace('{{modifier}}', stat.statValue.modifier);
                    }
                    return quote;
                }
            }
        } else if (quoteMap.character_details[stat.statName]) {
            const quotes = quoteMap.character_details[stat.statName][visibility];
            let quote = quotes[Math.floor(Math.random() * quotes.length)];
            if (visibility === 'visible') {
                if (stat.statName === 'class_and_level') {
                    const level = stat.statValue.match(/\d+/);
                    const className = stat.statValue.replace(/\d+/,'').trim();
                    quote = quote.replace('{{level}}', level ? level[0] : '').replace('{{class}}', className);
                } else if (stat.statName === 'alignment' && stat.statValue && typeof stat.statValue === 'object') {
                    quote = quote.replace('{{alignment}}', stat.statValue.name || '');
                } else {
                    quote = quote.replace('{{race}}', stat.statValue);
                }
            }
            return quote;
        } else if (quoteMap.roleplaying_details[stat.statName]) {
            const hasValue = stat.statValue ? 'has_value' : 'no_value';
            const quotes = quoteMap.roleplaying_details[stat.statName][hasValue][visibility];
            let quote = quotes[Math.floor(Math.random() * quotes.length)];
            if (visibility === 'visible' && hasValue === 'has_value') {
                quote = quote.replace('{{value}}', stat.statValue);
            }
            return quote;
        }

        return "No quote found.";
    }

    async function generateSlideshowPlaylist() {
        await quoteMapPromise;

        if (!quoteMap || charactersData.length === 0) {
            return [];
        }

        const statKeyMap = {
            'strength': 'strength_score',
            'dexterity': 'dexterity_score',
            'constitution': 'constitution_score',
            'intelligence': 'intelligence_score',
            'wisdom': 'wisdom_score',
            'charisma': 'charisma_score',
            'hit_points': ['hp_current', 'hp_max']
        };

        const allStats = [
            ...Object.keys(quoteMap.ability_scores),
            ...Object.keys(quoteMap.combat_stats),
            ...Object.keys(quoteMap.character_details).filter(stat => stat !== 'alignment'),
            ...Object.keys(quoteMap.roleplaying_details)
        ];

        let commonStats = allStats.filter(stat => {
            return charactersData.every(character => {
                if (!character.sheetData) return false;
                const key = statKeyMap[stat] || stat;
                if (Array.isArray(key)) {
                    return key.every(k => character.sheetData[k] !== undefined && character.sheetData[k] !== '');
                }
                return character.sheetData[key] !== undefined && character.sheetData[key] !== '';
            });
        });

        if (commonStats.length === 0) {
            console.warn("No common stats found for all characters to generate a themed slideshow.");
            return [];
        }

        const chosenStatName = commonStats[Math.floor(Math.random() * commonStats.length)];
        console.log(`Generating slideshow playlist with common stat: ${chosenStatName}`);

        const shuffledCharacters = [...charactersData].sort(() => 0.5 - Math.random());

        const playlist = shuffledCharacters.map(character => {
            let statValue;
            const key = statKeyMap[chosenStatName] || chosenStatName;

            if (quoteMap.ability_scores[chosenStatName]) {
                const scoreKey = statKeyMap[chosenStatName]; // e.g., 'strength_score'
                const modifierKey = scoreKey.replace('_score', '_modifier');
                statValue = {
                    score: character.sheetData[scoreKey],
                    modifier: character.sheetData[modifierKey]
                };
            } else if (chosenStatName === 'hit_points') {
                statValue = {
                    current: character.sheetData['hp_current'],
                    maximum: character.sheetData['hp_max']
                };
            } else {
                statValue = character.sheetData[key];
            }

            const stat = {
                statName: chosenStatName,
                statValue: statValue
            };
            const quote = getQuote(stat, character);

            return {
                character: character,
                quote: quote
            };
        });

        return playlist;
    }

    function filterPlayerContent(content) {
        if (!content) return "";
        return content.replace(/\[dm\](.*?)\[\/dm\]/gs, '');
    }

    function censorCharacterDataForPlayerView(character) {
        const rootCharacter = charactersData.find(c => c.id === character.id || c.id === character.characterId);
        const isVisible = rootCharacter ? rootCharacter.isDetailsVisible : (character.isDetailsVisible !== false);

        if (isVisible) {
            return character;
        }

        const censoredCharacter = JSON.parse(JSON.stringify(character));

        censoredCharacter.name = '???';
        if ('playerName' in censoredCharacter) {
            censoredCharacter.playerName = '???';
        }
        if ('initials' in censoredCharacter) {
            censoredCharacter.initials = '??';
        }
        if ('portrait' in censoredCharacter) {
            censoredCharacter.portrait = null;
        }
        if (censoredCharacter.sheetData) {
            const originalSheet = censoredCharacter.sheetData;
            censoredCharacter.sheetData = {
                char_name: '???',
                player_name: '???',
                hp_current: '??',
                hp_max: '??',
                ac: '??',
            };
            for (const key in originalSheet) {
                if (censoredCharacter.sheetData[key] === undefined) {
                    censoredCharacter.sheetData[key] = '??';
                }
            }
        }

    // Ensure the visibility flag is correctly set for the player view's logic
    if ('isDetailsVisible' in censoredCharacter) {
        censoredCharacter.isDetailsVisible = false;
    }

        return censoredCharacter;
    }

function propagateCharacterUpdate(characterId) {
    const masterCharacter = charactersData.find(c => c.id === characterId);
    if (!masterCharacter) {
        console.warn(`propagateCharacterUpdate: Could not find master character with ID ${characterId}`);
        return;
    }

    // 1. Propagate changes to the original character instance in the active initiative list
    activeInitiative.forEach(activeChar => {
        // Only update the original, not the token copies
        if (activeChar.id === characterId && !activeChar.isTokenCopy) {
            // Update properties from the master character
            activeChar.name = masterCharacter.name;
            activeChar.isDetailsVisible = masterCharacter.isDetailsVisible;
            activeChar.vision = masterCharacter.vision;
            activeChar.sheetData = masterCharacter.sheetData; // Re-link sheet data to get all updates
        }
    });

    // 2. Propagate changes to the original character's token on the map
    initiativeTokens.forEach(token => {
        // Find the corresponding character in initiative to check if it's a copy
        const linkedChar = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (token.characterId === characterId && linkedChar && !linkedChar.isTokenCopy) {
            token.name = masterCharacter.name;
            token.playerName = masterCharacter.sheetData.player_name;
            token.portrait = masterCharacter.sheetData.character_portrait;
            token.initials = getInitials(masterCharacter.name);
            token.isDetailsVisible = masterCharacter.isDetailsVisible;
            token.vision = masterCharacter.vision;
        }
    });

    // 3. Re-render UI elements and synchronize with the player view
    renderActiveInitiativeList();
    if (selectedMapFileName) {
        displayMapOnCanvas(selectedMapFileName); // This will redraw the tokens
    }
    requestFogOfWarUpdate();
    sendInitiativeDataToPlayerView();

    if (selectedCharacterId === characterId && characterSheetIframe.contentWindow) {
        characterSheetIframe.contentWindow.postMessage({
            type: 'characterVisionFtChange_from_dm',
            visionRange: masterCharacter.sheetData.vision_ft
        }, '*');
    }
}

    let animationFrameRequest = null;

    function redrawCanvas() {
        if (!selectedMapFileName) return;
        const mapData = detailedMapData.get(selectedMapFileName);
        const displayData = currentMapDisplayData;

        if (!mapData || !displayData || !displayData.img || !displayData.img.complete) {
            return;
        }

        const ctx = dmCanvas.getContext('2d');
        const transform = mapData.transform;

        ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
        ctx.save();
        ctx.translate(transform.originX, transform.originY);
        ctx.scale(transform.scale, transform.scale);
        ctx.drawImage(displayData.img, 0, 0, displayData.imgWidth, displayData.imgHeight);
        ctx.restore();

        // Overlays are on a separate canvas, so they need their own redraw.
        drawOverlays(mapData.overlays);
        drawGrid();
    }

    function requestRedraw() {
        if (animationFrameRequest) {
            cancelAnimationFrame(animationFrameRequest);
        }
        animationFrameRequest = requestAnimationFrame(redrawCanvas);
    }

    // Function to resize the canvas to fit its container
    function resizeCanvas() {
        if (dmCanvas && shadowCanvas && drawingCanvas && gridCanvas && mapContainer) {
            const style = window.getComputedStyle(mapContainer);
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            const paddingTop = parseFloat(style.paddingTop) || 0;
            const paddingBottom = parseFloat(style.paddingBottom) || 0;

            const canvasWidth = mapContainer.clientWidth - paddingLeft - paddingRight;
            const canvasHeight = mapContainer.clientHeight - paddingTop - paddingBottom;

            let mapWasDisplayed = currentMapDisplayData.img && currentMapDisplayData.img.complete;
            let currentFileNameToRedraw = selectedMapFileName;

            if (mapWasDisplayed) {
                currentMapDisplayData.img = null;
            }

            // Apply new dimensions to all canvases
            dmCanvas.width = canvasWidth;
            dmCanvas.height = canvasHeight;
            shadowCanvas.width = canvasWidth;
            shadowCanvas.height = canvasHeight;
            gridCanvas.width = canvasWidth;
            gridCanvas.height = canvasHeight;
            drawingCanvas.width = canvasWidth;
            drawingCanvas.height = canvasHeight;

            if (mapWasDisplayed && currentFileNameToRedraw) {
                displayMapOnCanvas(currentFileNameToRedraw);
            } else if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            } else {
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            }
        }
    }

    function displayMapOnCanvas(fileName) {
        if (gridData[fileName]) {
            const savedGridData = gridData[fileName];
            gridScale = savedGridData.scale;
            gridSqft = savedGridData.sqft;
            isGridVisible = savedGridData.visible;
        } else {
            // If no data for this map, create a default entry
            gridScale = 50;
            gridSqft = 5;
            isGridVisible = false;
            gridData[fileName] = {
                scale: gridScale,
                sqft: gridSqft,
                visible: isGridVisible,
            };
        }

        // Update UI controls to reflect the state of the current map
        if (gridScaleSlider) gridScaleSlider.value = gridScale;
        if (gridScaleValue) gridScaleValue.textContent = gridScale;
        if (gridSqftInput) gridSqftInput.value = gridSqft;
        if (gridOnCheckbox) gridOnCheckbox.checked = isGridVisible;

        if (!dmCanvas || !shadowCanvas || !drawingCanvas || !gridCanvas || !mapContainer) {
            console.error("One or more canvas elements or map container not found!");
            return;
        }

        const shadowCtx = shadowCanvas.getContext('2d');
        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        const gridCtx = gridCanvas.getContext('2d');
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        const drawingCtx = drawingCanvas.getContext('2d');
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        const mapData = detailedMapData.get(fileName);
        if (!mapData || !mapData.url) {
            console.error(`Map data or URL not found for ${fileName}`);
            return;
        }

        const ctx = dmCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            if (fileName !== selectedMapFileName) {
                console.log(`Map draw for ${fileName} cancelled; ${selectedMapFileName} is now selected.`);
                return;
            }

            const transform = mapData.transform;
            if (!transform) {
                console.error(`Transform data not found for map: ${fileName}`);
                return;
            }

            if (!transform.initialized) {
                const hRatio = dmCanvas.width / img.width;
                const vRatio = dmCanvas.height / img.height;
                const ratio = Math.min(hRatio, vRatio);
                const imgScaledWidth = img.width * ratio;
                const imgScaledHeight = img.height * ratio;
                const centerShift_x = (dmCanvas.width - imgScaledWidth) / 2;
                const centerShift_y = (dmCanvas.height - imgScaledHeight) / 2;

                transform.scale = ratio;
                transform.originX = centerShift_x;
                transform.originY = centerShift_y;
                transform.initialized = true;
            }

            const hRatio = dmCanvas.width / img.width;
            const vRatio = dmCanvas.height / img.height;
            const fitRatio = Math.min(hRatio, vRatio);

            currentMapDisplayData = {
                img: img,
                ratio: fitRatio,
                imgWidth: img.width,
                imgHeight: img.height,
                scaledWidth: img.width * transform.scale,
                scaledHeight: img.height * transform.scale,
                offsetX: transform.originX,
                offsetY: transform.originY,
                scale: transform.scale
            };

            if (!fogOfWarCanvasCache.has(fileName)) {
                const fowCanvas = document.createElement('canvas');
                fowCanvas.width = img.width;
                fowCanvas.height = img.height;
                const fowCtx = fowCanvas.getContext('2d');

                if (mapData.fogOfWarDataUrl) {
                    const fowImage = new Image();
                    fowImage.onload = () => {
                        fowCtx.drawImage(fowImage, 0, 0);
                        console.log(`Loaded existing Fog of War for ${fileName}`);
                    };
                    fowImage.src = mapData.fogOfWarDataUrl;
                } else {
                    // It's a new map or a map from an old save. Start with full fog.
                    fowCtx.fillStyle = 'black';
                    fowCtx.fillRect(0, 0, fowCanvas.width, fowCanvas.height);
                    mapData.fogOfWarDataUrl = fowCanvas.toDataURL(); // Save this initial state
                    console.log(`Initialized new Fog of War for ${fileName}`);
                }
                fogOfWarCanvasCache.set(fileName, fowCanvas);
            }

            if (initiativeTokens.length > 0) {
                const imgWidth = currentMapDisplayData.imgWidth;
                const imgHeight = currentMapDisplayData.imgHeight;
                initiativeTokens.forEach(token => {
                    const tokenRadius = (token.size / 100 * imgWidth) / 2;
                    token.x = Math.max(tokenRadius, Math.min(token.x, imgWidth - tokenRadius));
                    token.y = Math.max(tokenRadius, Math.min(token.y, imgHeight - tokenRadius));
                });
            }

            updateButtonStates();
            redrawCanvas(); // Use the new centralized drawing function
            isLightMapDirty = true;
            requestFogOfWarUpdate(); // Reveal initial token positions

            if (isLinkingChildMap && currentPolygonPoints.length > 0 && selectedMapFileName === fileName) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'edit') {
                    drawCurrentPolygon();
                }
            }
        };
        img.onerror = () => {
            console.error(`Error loading image for ${fileName} from ${mapData.url}`);
            ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            currentMapDisplayData = { img: null, ratio: 1, offsetX: 0, offsetY: 0, imgWidth: 0, imgHeight: 0, scaledWidth: 0, scaledHeight: 0 };
            ctx.fillText(`Error loading: ${fileName}`, 10, 50);
        };
        img.src = mapData.url;
    }

    function drawToken(ctx, token) {
        const { scale, originX, originY } = detailedMapData.get(selectedMapFileName).transform;

        const canvasX = (token.x * scale) + originX;
        const canvasY = (token.y * scale) + originY;

        const percentage = token.size / 100;
        const baseDimension = currentMapDisplayData.imgWidth;
        const pixelSizeOnImage = percentage * baseDimension;
        const size = pixelSizeOnImage * scale;

        // Highlight for active turn
        if (initiativeTurn !== -1 && activeInitiative[initiativeTurn] && activeInitiative[initiativeTurn].uniqueId === token.uniqueId) {
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, (size / 2) + (5 * scale), 0, Math.PI * 2, true);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Golden glow
            ctx.fill();
        }

        // Highlight for targeting
        if (targetingCharacter && targetingCharacter.targets && targetingCharacter.targets.includes(token.uniqueId)) {
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, (size / 2) + (5 * scale), 0, Math.PI * 2, true);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red glow
            ctx.fill();
        }

        // Health Ring
        const characterInInitiative = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (characterInInitiative && characterInInitiative.sheetData) {
            const maxHp = parseInt(characterInInitiative.sheetData.hp_max, 10);
            const currentHp = parseInt(characterInInitiative.sheetData.hp_current, 10);

            if (!isNaN(maxHp) && !isNaN(currentHp) && maxHp > 0) {
                const healthPercentage = Math.max(0, currentHp / maxHp);
                const ringRadius = (size / 2) + (8 * scale);
                const ringWidth = 6 * scale;

                // Red background ring
                ctx.beginPath();
                ctx.arc(canvasX, canvasY, ringRadius, 0, Math.PI * 2, false);
                ctx.strokeStyle = 'red';
                ctx.lineWidth = ringWidth;
                ctx.stroke();

                // Green foreground ring
                if (healthPercentage > 0) {
                    ctx.beginPath();
                    ctx.arc(canvasX, canvasY, ringRadius, -Math.PI / 2, (-Math.PI / 2) + (healthPercentage * Math.PI * 2), false);
                    ctx.strokeStyle = 'green';
                    ctx.lineWidth = ringWidth;
                    ctx.stroke();
                }
            }
        }

        ctx.save();

        // Draw circle
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = '#4a5f7a'; // Default background
        ctx.fill();

        // Clip to circle
        ctx.clip();

        // Draw portrait or initials
        if (token.portrait) {
            const img = new Image();
            img.src = token.portrait;
            if (img.complete) {
                ctx.drawImage(img, canvasX - size / 2, canvasY - size / 2, size, size);
            } else {
                ctx.fillStyle = '#e0e0e0';
                ctx.font = `${size * 0.4}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(token.initials, canvasX, canvasY);
                img.onload = () => {
                    if(selectedMapFileName) displayMapOnCanvas(selectedMapFileName);
                }
            }
        } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.font = `${size * 0.4}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(token.initials, canvasX, canvasY);
        }

        ctx.restore();

        // Draw border
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Draw name and player name
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.font = `bold ${12 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(token.name, canvasX, canvasY + size / 2 + (14 * scale));
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.fillText(`(${token.playerName})`, canvasX, canvasY + size / 2 + (26 * scale));
        ctx.shadowBlur = 0;
    }

    function updateCompactDiceDisplay() {
        const buttons = tokenStatBlockDiceButtons.querySelectorAll('.dice-button-compact');
        buttons.forEach(button => {
            const die = button.dataset.die;
            const count = tokenStatBlockDiceCounts[die] || 0;
            const countSpan = button.querySelector('.dice-count');
            if (countSpan) {
                countSpan.textContent = count > 0 ? `+${count}` : '';
            }
        });
    }

    const tokenStatBlockVisionFtInput = document.getElementById('token-stat-block-vision-ft-input');
    if (tokenStatBlockVisionFtInput) {
        tokenStatBlockVisionFtInput.addEventListener('change', (event) => {
            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character) return;

            if (character.isTokenCopy) {
                if (!character.sheetData) character.sheetData = {};
                character.sheetData.vision_ft = event.target.value;
            } else {
                const masterCharacter = charactersData.find(c => c.id === character.id);
                if (masterCharacter) {
                    if (!masterCharacter.sheetData) masterCharacter.sheetData = {};
                    masterCharacter.sheetData.vision_ft = event.target.value;
                    propagateCharacterUpdate(masterCharacter.id);
                }
            }
        });
    }

function getTightBoundingBox(img) {
    // Check cache first
    if (assetBoundingBoxCache[img.src]) {
        return assetBoundingBoxCache[img.src];
    }

    const canvas = document.createElement('canvas');
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let data;
    try {
        data = ctx.getImageData(0, 0, w, h).data;
    } catch (e) {
        // This can happen due to CORS issues if the image is tainted
        console.error("Could not get image data for tight bounding box, likely due to CORS policy. Falling back to full image dimensions.", e);
        // Fallback to the original dimensions
        const fallbackBox = { x: 0, y: 0, width: w, height: h, fromCache: false, isFallback: true };
        assetBoundingBoxCache[img.src] = fallbackBox; // Cache the fallback to avoid repeated errors
        return fallbackBox;
    }

    let minX = w, minY = h, maxX = -1, maxY = -1;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // The alpha channel is the 4th byte in each pixel
            const alpha = data[((y * w) + x) * 4 + 3];
            if (alpha > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // If the image is completely transparent, maxX will be less than minX.
    // In this case, we'll return the full image dimensions as a fallback.
    const result = (maxX < minX) ?
        { x: 0, y: 0, width: w, height: h, fromCache: false, isFallback: true } :
        { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, fromCache: false, isFallback: false };

    // Cache the result
    assetBoundingBoxCache[img.src] = result;
    return result;
}

    function getChainPoints(assetImage, angle) {
        if (!assetImage || !assetImage.complete || assetImage.naturalWidth === 0) {
            return { startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0} };
        }
        const tightBox = getTightBoundingBox(assetImage);

        const originalCenterX = assetImage.naturalWidth / 2;
        const originalCenterY = assetImage.naturalHeight / 2;

        const tightBoxCenterX = tightBox.x + tightBox.width / 2;
        const tightBoxCenterY = tightBox.y + tightBox.height / 2;

        const halfW = tightBox.width / 2;
        const halfH = tightBox.height / 2;

        const startAngle = angle;
        const endAngle = angle + Math.PI;

        const startPointOnTightEllipse = {
            x: halfW * Math.cos(startAngle),
            y: halfH * Math.sin(startAngle)
        };
        const endPointOnTightEllipse = {
            x: halfW * Math.cos(endAngle),
            y: halfH * Math.sin(endAngle)
        };

        const startPoint = {
            x: (tightBoxCenterX - originalCenterX) + startPointOnTightEllipse.x,
            y: (tightBoxCenterY - originalCenterY) + startPointOnTightEllipse.y
        };

        const endPoint = {
            x: (tightBoxCenterX - originalCenterX) + endPointOnTightEllipse.x,
            y: (tightBoxCenterY - originalCenterY) + endPointOnTightEllipse.y
        };

        return { startPoint, endPoint };
    }

    function updateChainPointsVisuals() {
        if (!assetPreviewImage || !assetPreviewImage.complete || assetPreviewImage.naturalWidth === 0) {
            return;
        }
        if (!assetChainStartPoint || !assetChainEndPoint) {
            return;
        }

        const tightBox = getTightBoundingBox(assetPreviewImage);

        // The displayed size of the preview image
        const displayedW = assetPreviewImage.offsetWidth;
        const displayedH = assetPreviewImage.offsetHeight;

        // The ratio between the displayed size and the image's natural size
        const ratioW = displayedW / assetPreviewImage.naturalWidth;
        const ratioH = displayedH / assetPreviewImage.naturalHeight;

        // The dimensions of the tight box, scaled to the preview's display size
        const tightBoxDisplayedW = tightBox.width * ratioW;
        const tightBoxDisplayedH = tightBox.height * ratioH;

        // The center of the tight box, relative to the top-left of the preview element
        const tightBoxDisplayedCenterX = (tightBox.x + tightBox.width / 2) * ratioW;
        const tightBoxDisplayedCenterY = (tightBox.y + tightBox.height / 2) * ratioH;

        const startAngle = chainPointsAngle;
        const endAngle = chainPointsAngle + Math.PI;

        // Calculate dot positions on the tight box ellipse
        const startX_local = (tightBoxDisplayedW / 2) * Math.cos(startAngle);
        const startY_local = (tightBoxDisplayedH / 2) * Math.sin(startAngle);
        const endX_local = (tightBoxDisplayedW / 2) * Math.cos(endAngle);
        const endY_local = (tightBoxDisplayedH / 2) * Math.sin(endAngle);

        // Position the dots by starting at the tight box center and adding the local ellipse offset
        const startX = tightBoxDisplayedCenterX + startX_local - (assetChainStartPoint.offsetWidth / 2);
        const startY = tightBoxDisplayedCenterY + startY_local - (assetChainStartPoint.offsetHeight / 2);
        assetChainStartPoint.style.left = `${startX}px`;
        assetChainStartPoint.style.top = `${startY}px`;

        const endX = tightBoxDisplayedCenterX + endX_local - (assetChainEndPoint.offsetWidth / 2);
        const endY = tightBoxDisplayedCenterY + endY_local - (assetChainEndPoint.offsetHeight / 2);
        assetChainEndPoint.style.left = `${endX}px`;
        assetChainEndPoint.style.top = `${endY}px`;
    }

    if (assetChainPointsSlider) {
        assetChainPointsSlider.addEventListener('input', (e) => {
            const sliderValue = parseInt(e.target.value, 10);
            chainPointsAngle = (sliderValue / 100) * 2 * Math.PI;
            updateChainPointsVisuals();

            // If an asset is selected and auto-shadow wall mode is on, update the shadow
            if (isAutoShadowActive && autoShadowMode === 'wall' && selectedPlacedAssets.length > 0) {
                selectedPlacedAssets.forEach(asset => {
                    applyOrUpdateAutoShadow(asset);
                });
            }
        });
    }

    if (btnAssetsChain) {
        btnAssetsChain.addEventListener('click', () => {
            setActiveAssetTool('chain');
        });
    }

    const dmRenderQualitySlider = document.getElementById('dm-render-quality-slider');
    const dmRenderQualityValue = document.getElementById('dm-render-quality-value');
    const playerRenderQualitySlider = document.getElementById('player-render-quality-slider');
    const playerRenderQualityValue = document.getElementById('player-render-quality-value');

    if (dmRenderQualitySlider && dmRenderQualityValue) {
        dmRenderQualitySlider.addEventListener('input', (e) => {
            dmRenderQuality = parseFloat(e.target.value);
            dmRenderQualityValue.textContent = dmRenderQuality.toFixed(1);
            isLightMapDirty = true; // Recalculate our own light map
        });
    }

    if (playerRenderQualitySlider && playerRenderQualityValue) {
        playerRenderQualitySlider.addEventListener('input', (e) => {
            playerRenderQuality = parseFloat(e.target.value);
            playerRenderQualityValue.textContent = playerRenderQuality.toFixed(1);
            if (playerWindow && !playerWindow.closed) {
                playerWindow.postMessage({ type: 'renderQualityUpdate', quality: playerRenderQuality }, '*');
            }
        });
    }

    if (storyBeatCardBody) {
        storyBeatCardBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('quest-link')) {
                e.preventDefault();
                const questId = parseInt(e.target.dataset.questId, 10);
                const quest = quests.find(q => q.id === questId);
                if (quest) {
                    populateAndShowStoryBeatCard(quest);
                }
            }


            if (e.target.classList.contains('remove-trigger-btn')) {
                const row = e.target.closest('.trigger-row');
                if (!row) return;
                const container = row.parentElement;
                const triggerType = container.id.replace('quest-', '');
                const index = parseInt(row.dataset.index, 10);
                const currentQuest = quests.find(q => q.id === activeOverlayCardId);

                if (currentQuest && currentQuest[triggerType] && currentQuest[triggerType][index]) {
                    currentQuest[triggerType].splice(index, 1);
                    populateAndShowStoryBeatCard(currentQuest);
                }
            }
        });
    }

    if (tokenStatBlockSetTargets) {
        tokenStatBlockSetTargets.addEventListener('click', () => {
            if (!selectedTokenForStatBlock) return;

            isTargeting = !isTargeting;

            if (isTargeting) {
                targetingCharacter = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
                if (!targetingCharacter.targets) {
                    targetingCharacter.targets = [];
                }
                document.body.classList.add('targeting');
                tokenStatBlockSetTargets.textContent = 'Finish Targeting';
                tokenStatBlockSetTargets.classList.add('active');
                tokenStatBlock.style.display = 'none';
            } else {
                document.body.classList.remove('targeting');
                tokenStatBlockSetTargets.textContent = 'Set Targets';
                tokenStatBlockSetTargets.classList.remove('active');

                const token = selectedTokenForStatBlock;
                if (token) {
                    populateAndShowStatBlock(token, parseInt(tokenStatBlock.style.left), parseInt(tokenStatBlock.style.top));
                }

                targetingCharacter = null;
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
            }
        });
    }

    function formatDiceString(dice, modifier) {
        let parts = [];
        for (const die in dice) {
            if (dice[die] > 0) {
                parts.push(`${dice[die]}${die}`);
            }
        }
        let str = parts.join(' + ');
        if (modifier > 0) {
            str += ` + ${modifier}`;
        } else if (modifier < 0) {
            str += ` - ${Math.abs(modifier)}`;
        }
        return str;
    }

    function populateAndShowStatBlock(token, pageX, pageY) {
        const character = activeInitiative.find(c => c.uniqueId === token.uniqueId);
        if (!character) return;

        // Reset compact roller state
        tokenStatBlockDiceCounts = {};
        updateCompactDiceDisplay();
        tokenStatBlockAddRollName.value = '';
        tokenStatBlockAddRollModifier.value = '0';


        tokenStatBlockCharName.textContent = character.name;
        tokenStatBlockPlayerName.textContent = `(${character.sheetData.player_name || 'N/A'})`;

        const detailsToggle = document.getElementById('token-stat-block-details-toggle');
        const visionToggle = document.getElementById('token-stat-block-vision-toggle');
        if (detailsToggle) {
            detailsToggle.checked = character.isDetailsVisible;
        }
        if (visionToggle) {
            visionToggle.checked = typeof character.vision === 'boolean' ? character.vision : true;
        }

        const visionFtInput = document.getElementById('token-stat-block-vision-ft-input');
        if (visionFtInput) {
            visionFtInput.value = character.sheetData.vision_ft || '60';
        }

        tokenStatBlockHp.value = character.sheetData.hp_current || 0;
        tokenStatBlockMaxHp.textContent = `/ ${character.sheetData.hp_max || 'N/A'}`;

        // Render saved rolls
        tokenStatBlockRollsList.innerHTML = '';
        if (character.savedRolls && character.savedRolls.length > 0) {
            character.savedRolls.forEach((roll, index) => {
                const li = document.createElement('li');
                const diceString = formatDiceString(roll.dice, roll.modifier);
                li.innerHTML = `
                    <span class="roll-name">${roll.name} (${diceString})</span>
                    <div class="roll-actions">
                        <button class="roll-btn" data-action="roll" data-index="${index}">Roll</button>
                        <button class="delete-roll-btn" data-action="delete" data-index="${index}">Del</button>
                    </div>
                `;
                tokenStatBlockRollsList.appendChild(li);
            });
        }

        // Render target list
        if (character.targets && character.targets.length > 0) {
            tokenStatBlockTargetsContainer.style.display = 'block';
            tokenStatBlockTargetsList.innerHTML = '';
            character.targets.forEach(targetId => {
                const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                if (targetCharacter) {
                    const li = document.createElement('li');
                    li.textContent = targetCharacter.name;
                    tokenStatBlockTargetsList.appendChild(li);
                }
            });
        } else {
            tokenStatBlockTargetsContainer.style.display = 'none';
        }

        // Position the stat block, ensuring it doesn't go off-screen
        tokenStatBlock.style.display = 'block';
        const statBlockRect = tokenStatBlock.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        let left = pageX;
        let top = pageY;

        if (pageX + statBlockRect.width > bodyRect.width) {
            left = pageX - statBlockRect.width;
        }
        if (pageY + statBlockRect.height > bodyRect.height) {
            top = pageY - statBlockRect.height;
        }

        tokenStatBlock.style.left = `${left}px`;
        tokenStatBlock.style.top = `${top}px`;
        sendTokenStatBlockStateToPlayerView(true, token, { left: left, top: top });
    }

    function drawGrid() {
        if (!selectedMapFileName || !currentMapDisplayData.img) return;

        const gridCtx = gridCanvas.getContext('2d');
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        if (!isGridVisible) return;

        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.transform) return;

        const {
            scale,
            originX,
            originY
        } = mapData.transform;
        const {
            imgWidth,
            imgHeight
        } = currentMapDisplayData;

        gridCtx.save();
        gridCtx.translate(originX, originY);
        gridCtx.scale(scale, scale);

        gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        gridCtx.lineWidth = 1 / scale; // Keep grid lines thin when zooming

        const gridSize = gridScale;

        // Vertical lines
        for (let x = 0; x <= imgWidth; x += gridSize) {
            gridCtx.beginPath();
            gridCtx.moveTo(x, 0);
            gridCtx.lineTo(x, imgHeight);
            gridCtx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= imgHeight; y += gridSize) {
            gridCtx.beginPath();
            gridCtx.moveTo(0, y);
            gridCtx.lineTo(imgWidth, y);
            gridCtx.stroke();
        }

        gridCtx.restore();
    }

    function drawOverlays(overlays, isPlayerViewContext = false) {
        if ((!overlays || overlays.length === 0) && initiativeTokens.length === 0) {
             if (!currentMapDisplayData.img) return;
        }
        const drawingCtx = drawingCanvas.getContext('2d');
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.transform) return;
        const { scale, originX, originY } = mapData.transform;

        if(overlays){
            overlays.forEach(overlay => {
            if (overlay.type === 'childMapLink' && overlay.polygon) {
                if (isPlayerViewContext && (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible)) {
                    return;
                }

                drawingCtx.beginPath();
                let currentPointsToDraw = overlay.polygon;
                let strokeStyle = 'rgba(0, 0, 255, 0.7)';
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') {
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    } else {
                        strokeStyle = 'rgba(0, 255, 0, 0.7)';
                    }
                }
                if (isMovingPolygon && polygonBeingMoved && overlay === polygonBeingMoved.overlayRef) {
                    strokeStyle = 'rgba(255, 255, 0, 0.9)';
                    currentPointsToDraw = polygonBeingMoved.originalPoints.map(p => ({
                        x: p.x + currentDragOffsets.x,
                        y: p.y + currentDragOffsets.y
                    }));
                }

                drawingCtx.strokeStyle = strokeStyle;
                drawingCtx.lineWidth = 2;

                currentPointsToDraw.forEach((point, index) => {
                    const canvasX = (point.x * scale) + originX;
                    const canvasY = (point.y * scale) + originY;
                    if (index === 0) {
                        drawingCtx.moveTo(canvasX, canvasY);
                    } else {
                        drawingCtx.lineTo(canvasX, canvasY);
                    }
                });

                if (currentPointsToDraw.length > 2) {
                    const firstPoint = currentPointsToDraw[0];
                    const lastPoint = currentPointsToDraw[currentPointsToDraw.length - 1];
                    if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
                        const firstPointCanvasX = (firstPoint.x * scale) + originX;
                        const firstPointCanvasY = (firstPoint.y * scale) + originY;
                        drawingCtx.lineTo(firstPointCanvasX, firstPointCanvasY);
                    }
                }
                drawingCtx.stroke();
            } else if (overlay.type === 'noteLink' && overlay.position) {
                const iconSize = 20;
                let position = overlay.position;
                if (isMovingNote && noteBeingMoved && overlay === noteBeingMoved.overlayRef) {
                    position = {
                        x: noteBeingMoved.originalPosition.x + currentDragOffsets.x,
                        y: noteBeingMoved.originalPosition.y + currentDragOffsets.y
                    };
                }

                const canvasX = (position.x * scale) + originX;
                const canvasY = (position.y * scale) + originY;

                let fillStyle = 'rgba(255, 255, 102, 0.9)';
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') {
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        fillStyle = 'rgba(255, 102, 102, 0.7)';
                    } else {
                        fillStyle = 'rgba(102, 255, 102, 0.9)';
                    }
                }
                if (isMovingNote && noteBeingMoved && overlay === noteBeingMoved.overlayRef) {
                    fillStyle = 'rgba(255, 255, 0, 0.9)';
                }

                drawingCtx.fillStyle = fillStyle;
                drawingCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
                drawingCtx.strokeStyle = 'black';
                drawingCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                drawingCtx.fillStyle = 'black';
                drawingCtx.font = `${iconSize * 0.8}px sans-serif`;
                drawingCtx.textAlign = 'center';
                drawingCtx.textBaseline = 'middle';
                drawingCtx.fillText('📝', canvasX, canvasY);
            } else if (overlay.type === 'characterLink' && overlay.position) {
                const iconSize = 20;
                let position = overlay.position;
                if (isMovingCharacter && characterBeingMoved && overlay === characterBeingMoved.overlayRef) {
                    position = {
                        x: characterBeingMoved.originalPosition.x + currentDragOffsets.x,
                        y: characterBeingMoved.originalPosition.y + currentDragOffsets.y
                    };
                }

                const canvasX = (position.x * scale) + originX;
                const canvasY = (position.y * scale) + originY;

                let fillStyle = 'rgba(135, 206, 250, 0.9)';
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.mode === 'view') {
                    if (typeof overlay.playerVisible === 'boolean' && !overlay.playerVisible) {
                        fillStyle = 'rgba(255, 102, 102, 0.7)';
                    } else {
                        fillStyle = 'rgba(102, 255, 102, 0.9)';
                    }
                }
                if (isMovingCharacter && characterBeingMoved && overlay === characterBeingMoved.overlayRef) {
                    fillStyle = 'rgba(255, 255, 0, 0.9)';
                }

                drawingCtx.fillStyle = fillStyle;
                drawingCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
                drawingCtx.strokeStyle = 'black';
                drawingCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                drawingCtx.fillStyle = 'black';
                drawingCtx.font = `${iconSize * 0.8}px sans-serif`;
                drawingCtx.textAlign = 'center';
                drawingCtx.textBaseline = 'middle';
                drawingCtx.fillText('👤', canvasX, canvasY);

                const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                if (character && character.sheetData && character.sheetData.character_portrait) {
                    const img = new Image();
                    img.onload = function() {
                        drawingCtx.save();
                        drawingCtx.beginPath();
                        drawingCtx.arc(canvasX, canvasY, iconSize / 2, 0, Math.PI * 2, true);
                        drawingCtx.closePath();
                        drawingCtx.clip();

                        drawingCtx.drawImage(img, canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                        drawingCtx.restore();
                    };
                    img.src = character.sheetData.character_portrait;
                }
            } else if (overlay.type === 'lightSource' && overlay.position) {
                const canvasX = (overlay.position.x * scale) + originX;
                const canvasY = (overlay.position.y * scale) + originY;
                const radius = (overlay.radius || 15) * scale;
                drawingCtx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                drawingCtx.beginPath();
                drawingCtx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
                drawingCtx.fill();
            } else if (overlay.type === 'wall' && overlay.points) {
                if (isPlayerViewContext) return;
                drawingCtx.beginPath();
                drawingCtx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
                drawingCtx.lineWidth = 5;
                drawingCtx.lineCap = 'round';
                overlay.points.forEach((point, index) => {
                    const canvasX = (point.x * scale) + originX;
                    const canvasY = (point.y * scale) + originY;
                    if (index === 0) {
                        drawingCtx.moveTo(canvasX, canvasY);
                    } else {
                        drawingCtx.lineTo(canvasX, canvasY);
                    }
                });
                drawingCtx.stroke();
            } else if (overlay.type === 'door' && overlay.points) {
                if (isPlayerViewContext) return;
                drawingCtx.beginPath();
                drawingCtx.strokeStyle = overlay.isOpen ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
                drawingCtx.lineWidth = 5;
                drawingCtx.lineCap = 'round';
                if (overlay.isOpen) {
                    drawingCtx.setLineDash([10, 10]);
                }
                const p1 = overlay.points[0];
                const p2 = overlay.points[1];
                const p1CanvasX = (p1.x * scale) + originX;
                const p1CanvasY = (p1.y * scale) + originY;
                const p2CanvasX = (p2.x * scale) + originX;
                const p2CanvasY = (p2.y * scale) + originY;
                drawingCtx.moveTo(p1CanvasX, p1CanvasY);
                drawingCtx.lineTo(p2CanvasX, p2CanvasY);
                drawingCtx.stroke();
                drawingCtx.setLineDash([]); // Reset line dash
            } else if (overlay.type === 'placedAsset' && overlay.position) {
                if (assetImageCache[overlay.path] && assetImageCache[overlay.path].complete) {
                    const img = assetImageCache[overlay.path];
                    const assetScale = overlay.scale || 1;
                    const assetRotation = overlay.rotation || 0;
                    const assetOpacity = overlay.opacity ?? 1;

                    const canvasX = (overlay.position.x * scale) + originX;
                    const canvasY = (overlay.position.y * scale) + originY;

                    const assetCanvasWidth = overlay.width * assetScale * scale;
                    const assetCanvasHeight = overlay.height * assetScale * scale;

                    drawingCtx.save();
                    drawingCtx.globalAlpha = assetOpacity;
                    drawingCtx.translate(canvasX, canvasY);
                    drawingCtx.rotate(assetRotation);

                    drawingCtx.drawImage(img, -assetCanvasWidth / 2, -assetCanvasHeight / 2, assetCanvasWidth, assetCanvasHeight);

                    drawingCtx.restore();

                    // If this asset is one of the selected ones, draw the selection box over it
                    if (selectedPlacedAssets.includes(overlay)) {
                        drawAssetSelectionBox(overlay);
                    }
                } else if (!assetImageCache[overlay.path]) {
                    // Image not in cache, start loading it
                    const asset = findAssetByPath(overlay.path);
                    if (asset && asset.url) {
                        const img = new Image();
                        img.src = asset.url;
                        assetImageCache[overlay.path] = img;
                        img.onload = () => {
                            // Once loaded, redraw the canvas
                            if (selectedMapFileName) {
                                displayMapOnCanvas(selectedMapFileName);
                            }
                        };
                    }
                }
            } else if (overlay.type === 'smart_object' && overlay.polygon) {
                if (isPlayerViewContext) return;

                drawingCtx.beginPath();
                drawingCtx.strokeStyle = 'rgba(255, 0, 255, 0.7)'; // Magenta for smart objects
                drawingCtx.lineWidth = 3;
                drawingCtx.fillStyle = 'rgba(255, 0, 255, 0.1)';

                overlay.polygon.forEach((point, index) => {
                    const canvasX = (point.x * scale) + originX;
                    const canvasY = (point.y * scale) + originY;
                    if (index === 0) {
                        drawingCtx.moveTo(canvasX, canvasY);
                    } else {
                        drawingCtx.lineTo(canvasX, canvasY);
                    }
                });
                drawingCtx.closePath();
                drawingCtx.stroke();
                drawingCtx.fill();
            }
            });
        }

        // Draw initiative tokens
        if (initiativeTokens.length > 0) {
            initiativeTokens.forEach(token => {
                drawToken(drawingCtx, token);
            });
        }

        // Draw marquee selection box
        if (isSelecting && selectionBox) {
            drawingCtx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
            drawingCtx.lineWidth = 1;
            drawingCtx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            const rectWidth = selectionBox.endX - selectionBox.startX;
            const rectHeight = selectionBox.endY - selectionBox.startY;
            drawingCtx.fillRect(selectionBox.startX, selectionBox.startY, rectWidth, rectHeight);
            drawingCtx.strokeRect(selectionBox.startX, selectionBox.startY, rectWidth, rectHeight);
        }
    }

    const characterPreviewClose = document.getElementById('character-preview-close');
    if (characterPreviewClose) {
        characterPreviewClose.addEventListener('click', () => {
            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
            if (characterPreviewOverlay) {
                characterPreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideCharacterPreview' }, '*');
                }
            }
            hasDeviatedFromAutomation = true;
            updatePreviousButtonState();
        });
    }

    if (viewCharacterButton) {
        viewCharacterButton.addEventListener('click', () => {
            if (characterSheetIframe && characterSheetIframe.contentWindow) {
                characterSheetIframe.contentWindow.postMessage({ type: 'requestSheetDataForView' }, '*');
            }
        });
    }

    function getLineIntersection(p1, p2) {
        const dX = p1.x2 - p1.x1;
        const dY = p1.y2 - p1.y1;
        const dX2 = p2.x2 - p2.x1;
        const dY2 = p2.y2 - p2.y1;
        const denominator = dX * dY2 - dY * dX2;

        if (denominator === 0) return null;

        const t = ((p2.x1 - p1.x1) * dY2 - (p2.y1 - p1.y1) * dX2) / denominator;
        const u = -((p1.x1 - p2.x1) * dY - (p1.y1 - p2.y1) * dX) / denominator;

        if (t >= 0 && u >= 0 && u <= 1) {
            return { x: p1.x1 + t * dX, y: p1.y1 + t * dY };
        }

        return null;
    }

    let shadowAnimationId = null;

    function recalculateLightMap() {
        if (!isLightMapDirty) return;

        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || mapData.mode !== 'view' || !currentMapDisplayData.img) {
            if (lightMapCtx) {
                lightMapCtx.clearRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);
            }
            isLightMapDirty = false;
            return;
        }

        const requiredWidth = Math.floor(currentMapDisplayData.imgWidth * dmRenderQuality);
        const requiredHeight = Math.floor(currentMapDisplayData.imgHeight * dmRenderQuality);

        if (!lightMapCanvas || lightMapCanvas.width !== requiredWidth || lightMapCanvas.height !== requiredHeight) {
            lightMapCanvas = document.createElement('canvas');
            lightMapCanvas.width = requiredWidth;
            lightMapCanvas.height = requiredHeight;
            lightMapCtx = lightMapCanvas.getContext('2d');
        }

        const dmLightSources = mapData.overlays.filter(o => o.type === 'lightSource');
        const tokenLightSources = initiativeTokens
            .filter(token => token.isDetailsVisible !== false)
            .map(token => ({
                type: 'lightSource',
                position: { x: token.x, y: token.y },
                radius: 40 // A reasonable default radius for a token
            }));
        const lightSources = [...dmLightSources, ...tokenLightSources];
        const walls = mapData.overlays.filter(o => o.type === 'wall');
        const closedDoors = mapData.overlays.filter(o => o.type === 'door' && !o.isOpen);
        const smartObjects = mapData.overlays.filter(o => o.type === 'smart_object');

        lightMapCtx.clearRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);
        lightMapCtx.fillStyle = 'rgba(0, 0, 0, 0.33)';
        lightMapCtx.fillRect(0, 0, lightMapCanvas.width, lightMapCanvas.height);

        const lightScale = dmRenderQuality;
        const imgWidth = currentMapDisplayData.imgWidth;
        const imgHeight = currentMapDisplayData.imgHeight;

        const allSegments = [];
        walls.forEach(wall => {
            for (let i = 0; i < wall.points.length - 1; i++) {
                allSegments.push({ p1: wall.points[i], p2: wall.points[i + 1], parent: wall });
            }
        });
        closedDoors.forEach(door => {
            allSegments.push({ p1: door.points[0], p2: door.points[1], parent: door });
        });
        smartObjects.forEach(object => {
            for (let i = 0; i < object.polygon.length - 1; i++) {
                allSegments.push({ p1: object.polygon[i], p2: object.polygon[i + 1], parent: object });
            }
        });

        allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });

        const allVertices = [];
        allSegments.forEach(seg => {
            allVertices.push(seg.p1, seg.p2);
        });

        lightSources.forEach(light => {
            const visiblePoints = [];
            const angles = new Set();

            let lightIsInsideObject = false;
            for (const so of smartObjects) {
                if (isPointInPolygon(light.position, so.polygon)) {
                    lightIsInsideObject = true;
                    break;
                }
            }

            allVertices.forEach(vertex => {
                const angle = Math.atan2(vertex.y - light.position.y, vertex.x - light.position.x);
                angles.add(angle - 0.0001);
                angles.add(angle);
                angles.add(angle + 0.0001);
            });

            const sortedAngles = Array.from(angles).sort((a, b) => a - b);

            sortedAngles.forEach(angle => {
                const ray = {
                    x1: light.position.x,
                    y1: light.position.y,
                    x2: light.position.x + (imgWidth + imgHeight) * 2 * Math.cos(angle),
                    y2: light.position.y + (imgWidth + imgHeight) * 2 * Math.sin(angle)
                };

                let closestIntersection = null;
                let minDistance = Infinity;

                allSegments.forEach(segment => {
                    const intersectionPoint = getLineIntersection(ray, { x1: segment.p1.x, y1: segment.p1.y, x2: segment.p2.x, y2: segment.p2.y });
                    if (intersectionPoint) {
                        let ignoreThisIntersection = false;
                        if (segment.parent.type === 'smart_object') {
                            const p1 = segment.p1;
                            const p2 = segment.p2;
                            const normal = { x: p2.y - p1.y, y: p1.x - p2.x }; // Outward-facing normal for clockwise polygons
                            const lightVector = { x: intersectionPoint.x - light.position.x, y: intersectionPoint.y - light.position.y };
                            const dot = (lightVector.x * normal.x) + (lightVector.y * normal.y);

                            if (!lightIsInsideObject && dot > 0) {
                                ignoreThisIntersection = true;
                            }
                        }

                        if (!ignoreThisIntersection) {
                            const distance = Math.sqrt(Math.pow(intersectionPoint.x - light.position.x, 2) + Math.pow(intersectionPoint.y - light.position.y, 2));
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestIntersection = intersectionPoint;
                            }
                        }
                    }
                });

                if (closestIntersection) {
                    visiblePoints.push(closestIntersection);
                } else {
                    visiblePoints.push({ x: ray.x2, y: ray.y2 });
                }
            });

            lightMapCtx.save();
            lightMapCtx.globalCompositeOperation = 'destination-out';
            lightMapCtx.beginPath();
            if (visiblePoints.length > 0) {
                const firstPoint = visiblePoints[0];
                lightMapCtx.moveTo(firstPoint.x * lightScale, firstPoint.y * lightScale);
                visiblePoints.forEach(point => {
                    lightMapCtx.lineTo(point.x * lightScale, point.y * lightScale);
                });
                lightMapCtx.closePath();
                lightMapCtx.fill();
            }
            lightMapCtx.restore();
        });

        isLightMapDirty = false;
    }

    function animateShadows() {
        if (!shadowAnimationId) return;

        if (isLightMapDirty) {
            recalculateLightMap();
        }

        const shadowCtx = shadowCanvas.getContext('2d');
        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);

        const mapData = detailedMapData.get(selectedMapFileName);
        if (mapData && mapData.mode === 'view' && lightMapCanvas) {
            const { scale, originX, originY } = mapData.transform;
            shadowCtx.save();
            shadowCtx.translate(originX, originY);
            shadowCtx.scale(scale, scale);
            // Use nearest-neighbor scaling for performance and sharp pixels
            shadowCtx.imageSmoothingEnabled = false;
            shadowCtx.drawImage(lightMapCanvas, 0, 0, currentMapDisplayData.imgWidth, currentMapDisplayData.imgHeight);
            shadowCtx.restore();
        }

        requestAnimationFrame(animateShadows);
    }

    function toggleShadowAnimation(start) {
        isLightMapDirty = true;
        if (start && !shadowAnimationId) {
            shadowAnimationId = requestAnimationFrame(animateShadows);
        } else if (!start && shadowAnimationId) {
            cancelAnimationFrame(shadowAnimationId);
            shadowAnimationId = null;
            const shadowCtx = shadowCanvas.getContext('2d');
            shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        }
    }

    function handleShadowMouseDown(e) {
        const { x: mouseX, y: mouseY } = getRelativeCoords(e.offsetX, e.offsetY);
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData) return;

        if (activeShadowTool) {
            e.stopPropagation();
        }

        if (!activeShadowTool) {
            const lightSources = mapData.overlays.filter(o => o.type === 'lightSource');
            for (let i = lightSources.length - 1; i >= 0; i--) {
                const light = lightSources[i];
                const lightRadius = (light.radius || 15) / (currentMapDisplayData.scale || 1);
                const distance = Math.sqrt((mouseX - light.position.x) ** 2 + (mouseY - light.position.y) ** 2);
                if (distance < lightRadius) {
                    isDraggingLightSource = true;
                    draggedLightSource = light;
                    dragOffsetX = mouseX - light.position.x;
                    dragOffsetY = mouseY - light.position.y;
                    return;
                }
            }
        }

        if (activeShadowTool === 'wall') {
            isDrawing = true;
            lastX = mouseX;
            lastY = mouseY;
            const newWall = { type: 'wall', points: [{x: mouseX, y: mouseY}] };
            mapData.overlays.push(newWall);
            isLightMapDirty = true;
        } else if (activeShadowTool === 'door') {
            if (lineStartPoint) {
                const newDoor = { type: 'door', points: [lineStartPoint, {x: mouseX, y: mouseY}], isOpen: false };
                mapData.overlays.push(newDoor);
                lineStartPoint = null;
                drawOverlays(mapData.overlays);
            } else {
                lineStartPoint = { x: mouseX, y: mouseY };
            }
        } else if (activeShadowTool === 'erase') {
            isDrawing = true;
        } else if (activeShadowTool === 'lightSource') {
            const newLight = {
                type: 'lightSource',
                id: Date.now(),
                position: { x: mouseX, y: mouseY },
                vision: true,
                vision_ft: 20,
            };
            mapData.overlays.push(newLight);
            isLightMapDirty = true;
            drawOverlays(mapData.overlays);
            // After placing, deactivate the tool to prevent placing more on subsequent clicks
            setShadowTool(null);
        }
    }

    let eraserPositionForDraw = null;
    function handleShadowMouseMove(e) {
        const { x: mouseX, y: mouseY } = getRelativeCoords(e.offsetX, e.offsetY);
        eraserPositionForDraw = { canvasX: e.offsetX, canvasY: e.offsetY };

        if (isDraggingLightSource) {
            draggedLightSource.position.x = mouseX - dragOffsetX;
            draggedLightSource.position.y = mouseY - dragOffsetY;
            drawOverlays(detailedMapData.get(selectedMapFileName).overlays);
            return;
        }

        if (isDrawing && activeShadowTool === 'wall') {
            const mapData = detailedMapData.get(selectedMapFileName);
            const currentWall = mapData.overlays[mapData.overlays.length - 1];
            currentWall.points.push({x: mouseX, y: mouseY});
            isLightMapDirty = true;
            drawOverlays(mapData.overlays);
        } else if (activeShadowTool === 'door' && lineStartPoint) {
            const mapData = detailedMapData.get(selectedMapFileName);
            if (mapData) {
                // Redraw all existing overlays first to clear old temp line
                drawOverlays(mapData.overlays);

                // Now draw the temporary line on top
                const drawingCtx = drawingCanvas.getContext('2d');
                const { scale, originX, originY } = mapData.transform;
                drawingCtx.beginPath();
                drawingCtx.strokeStyle = 'rgba(255, 0, 0, 0.9)'; // Bright red for temp door
                drawingCtx.lineWidth = 5;
                drawingCtx.lineCap = 'round';

                const startCanvasX = (lineStartPoint.x * scale) + originX;
                const startCanvasY = (lineStartPoint.y * scale) + originY;
                const currentCanvasX = (mouseX * scale) + originX;
                const currentCanvasY = (mouseY * scale) + originY;

                drawingCtx.moveTo(startCanvasX, startCanvasY);
                drawingCtx.lineTo(currentCanvasX, currentCanvasY);
                drawingCtx.stroke();
            }
        } else if (activeShadowTool === 'erase') {
            const mapData = detailedMapData.get(selectedMapFileName);
            if (!mapData) return;

            // Redraw existing overlays to prevent flicker
            drawOverlays(mapData.overlays);

            // Draw the eraser circle on top
            const drawingCtx = drawingCanvas.getContext('2d');
            const radius = 15; // Eraser radius in canvas pixels
            drawingCtx.beginPath();
            drawingCtx.arc(e.offsetX, e.offsetY, radius, 0, Math.PI * 2, false);
            drawingCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            drawingCtx.lineWidth = 2;
            drawingCtx.stroke();

            if (isDrawing) {
                const eraserRadius = 15 / (currentMapDisplayData.scale || 1); // Eraser radius in image pixels
                let changed = false;
                for (let i = mapData.overlays.length - 1; i >= 0; i--) {
                    const overlay = mapData.overlays[i];
                    if ((overlay.type === 'wall' || overlay.type === 'door') && overlay.points && overlay.points.length > 1) {
                        for (let j = 0; j < overlay.points.length - 1; j++) {
                            if (checkLineCircleCollision(overlay.points[j], overlay.points[j+1], {x: mouseX, y: mouseY}, eraserRadius)) {
                                mapData.overlays.splice(i, 1);
                                changed = true;
                                break;
                            }
                        }
            } else if (overlay.type === 'smart_object' && overlay.polygon) {
                for (let j = 0; j < overlay.polygon.length - 1; j++) {
                    if (checkLineCircleCollision(overlay.polygon[j], overlay.polygon[j+1], {x: mouseX, y: mouseY}, eraserRadius)) {
                        mapData.overlays.splice(i, 1);
                        changed = true;
                        break;
                    }
                }
                    } else if (overlay.type === 'lightSource') {
                        const lightRadius = (overlay.radius || 15) / (currentMapDisplayData.scale || 1);
                        const distance = Math.sqrt((mouseX - overlay.position.x)**2 + (mouseY - overlay.position.y)**2);
                        if (distance < eraserRadius + lightRadius) {
                            mapData.overlays.splice(i, 1);
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    isLightMapDirty = true;
                    // Redraw again to show the erased items have disappeared
                    drawOverlays(mapData.overlays);
                }
            }
        }
    }

    function stopShadowInteraction() {
        if(isDrawing || isDraggingLightSource) {
            isLightMapDirty = true;
        }
        isDrawing = false;
        isDraggingLightSource = false;
        draggedLightSource = null;
    }

    function getRelativeCoords(canvasX, canvasY) {
        if (!currentMapDisplayData.img || !currentMapDisplayData.img.complete || !selectedMapFileName) {
            return null;
        }
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.transform) {
            return null;
        }
        const { scale, originX, originY } = mapData.transform;

        const imageX = (canvasX - originX) / scale;
        const imageY = (canvasY - originY) / scale;

        // Optional: Check if the coords are within the image bounds
        if (imageX < 0 || imageX > currentMapDisplayData.imgWidth || imageY < 0 || imageY > currentMapDisplayData.imgHeight) {
            // return null; // This might be too restrictive for panning/zooming outside bounds
        }

        return { x: imageX, y: imageY };
    }


    function getAssetTransformHandles(asset) {
        // We need map scale to keep handle sizes visually consistent when zooming
        const mapScale = currentMapDisplayData.scale || 1;
        const assetScale = asset.scale || 1;

        // Define handle size in canvas pixels for visual consistency
        const handleCanvasSize = 8;
        const rotateHandleCanvasOffset = 20;

        // Convert canvas size back to local image space size, considering both map and asset zoom
        const handleImageSize = handleCanvasSize / (mapScale * assetScale);
        const rotateHandleImageOffset = rotateHandleCanvasOffset / (mapScale * assetScale);

        // Use the asset's original, unscaled dimensions
        const halfWidth = asset.width / 2;
        const halfHeight = asset.height / 2;

        return {
            topLeft:     { x: -halfWidth, y: -halfHeight,       width: handleImageSize, height: handleImageSize },
            topRight:    { x:  halfWidth, y: -halfHeight,       width: handleImageSize, height: handleImageSize },
            bottomLeft:  { x: -halfWidth, y:  halfHeight,       width: handleImageSize, height: handleImageSize },
            bottomRight: { x:  halfWidth, y:  halfHeight,       width: handleImageSize, height: handleImageSize },
            rotate:      { x: 0,          y: -halfHeight - rotateHandleImageOffset, radius: handleImageSize / 1.5 }
        };
    }

    function getHandleForPoint(point, asset) {
        if (!asset || !point) return null;

        const assetScale = asset.scale || 1;
        const assetRotation = asset.rotation || 0;

        // 1. Translate the world-space `point` to be relative to the asset's center.
        const dx = point.x - asset.position.x;
        const dy = point.y - asset.position.y;

        // 2. Rotate the point by the *negative* of the asset's rotation.
        const cos = Math.cos(-assetRotation);
        const sin = Math.sin(-assetRotation);
        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        // 3. Scale the point by the inverse of the asset's scale to get to local space.
        const localPoint = {
            x: rotatedX / assetScale,
            y: rotatedY / assetScale,
        };

        // 4. Get the handles, which are in local, un-rotated, un-scaled space.
        const handles = getAssetTransformHandles(asset);

        // 5. Check for collision in local space.
        for (const name in handles) {
            const handle = handles[name];
            if (handle.radius) { // Circle check for rotate handle
                const hdx = localPoint.x - handle.x;
                const hdy = localPoint.y - handle.y;
                if (hdx * hdx + hdy * hdy <= handle.radius * handle.radius) {
                    return name;
                }
            } else { // Rectangle check for resize handles
                const halfHandleWidth = handle.width / 2;
                const halfHandleHeight = handle.height / 2;
                if (localPoint.x >= handle.x - halfHandleWidth && localPoint.x <= handle.x + halfHandleWidth &&
                    localPoint.y >= handle.y - halfHandleHeight && localPoint.y <= handle.y + halfHandleHeight) {
                    return name;
                }
            }
        }
        return null;
    }


    function drawAssetSelectionBox(asset) {
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.transform) return;
        const { scale: mapScale, originX, originY } = mapData.transform;
        const drawingCtx = drawingCanvas.getContext('2d');

        const assetScale = asset.scale || 1;
        const assetRotation = asset.rotation || 0;

        // Final canvas position and dimensions
        const canvasX = (asset.position.x * mapScale) + originX;
        const canvasY = (asset.position.y * mapScale) + originY;
        const assetCanvasWidth = asset.width * assetScale * mapScale;
        const assetCanvasHeight = asset.height * assetScale * mapScale;

        drawingCtx.save();
        drawingCtx.translate(canvasX, canvasY);
        drawingCtx.rotate(assetRotation);

        // Draw the main bounding box - it's centered, so from -half to +half
        drawingCtx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        drawingCtx.lineWidth = 2; // Keep line width consistent regardless of zoom
        drawingCtx.strokeRect(-assetCanvasWidth / 2, -assetCanvasHeight / 2, assetCanvasWidth, assetCanvasHeight);

        // Get handle definitions. These are in asset-local space. We need to scale them to canvas space for drawing.
        const handles = getAssetTransformHandles(asset);
        drawingCtx.fillStyle = 'rgba(0, 150, 255, 0.8)';

        // Draw resize handles (rectangles)
        ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].forEach(name => {
            const handle = handles[name];
            // Scale handle position and size from asset-local space to canvas space
            const handleCanvasX = handle.x * assetScale * mapScale;
            const handleCanvasY = handle.y * assetScale * mapScale;
            const handleCanvasWidth = handle.width * assetScale * mapScale;
            const handleCanvasHeight = handle.height * assetScale * mapScale;
            drawingCtx.fillRect(handleCanvasX - handleCanvasWidth / 2, handleCanvasY - handleCanvasHeight / 2, handleCanvasWidth, handleCanvasHeight);
        });

        // Draw rotate handle (circle and line)
        const rotateHandle = handles.rotate;
        const rotateHandleCanvasX = rotateHandle.x * assetScale * mapScale;
        const rotateHandleCanvasY = rotateHandle.y * assetScale * mapScale;
        const rotateHandleCanvasRadius = rotateHandle.radius * assetScale * mapScale;

        drawingCtx.beginPath();
        drawingCtx.arc(rotateHandleCanvasX, rotateHandleCanvasY, rotateHandleCanvasRadius, 0, Math.PI * 2);
        drawingCtx.fill();

        drawingCtx.beginPath();
        drawingCtx.moveTo(0, -assetCanvasHeight / 2);
        drawingCtx.lineTo(rotateHandleCanvasX, rotateHandleCanvasY);
        drawingCtx.stroke();

        drawingCtx.restore();
    }

    function drawCurrentPolygon() {
        if (currentPolygonPoints.length === 0 || !currentMapDisplayData.img) return;

        const ctx = drawingCanvas.getContext('2d');
        // Don't clear here, as other overlays might be drawn already.
        // The main drawOverlays function will clear the canvas.
        // Let's assume this is called within a context where the canvas is ready for drawing.

        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.transform) return;
        const { scale, originX, originY } = mapData.transform;


        ctx.beginPath();
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';

        currentPolygonPoints.forEach((point, index) => {
            const canvasX = (point.x * scale) + originX;
            const canvasY = (point.y * scale) + originY;
            if (index === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        });

        if (polygonDrawingComplete && currentPolygonPoints.length > 2) {
            ctx.closePath();
            ctx.fill();
        }

        ctx.stroke();

        ctx.fillStyle = 'red';
        currentPolygonPoints.forEach(point => {
            const canvasX = (point.x * scale) + originX;
            const canvasY = (point.y * scale) + originY;
            ctx.fillRect(canvasX - 3, canvasY - 3, 6, 6);
        });
    }




    drawingCanvas.addEventListener('click', (event) => {
        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);
        if (!imageCoords) return;

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;

        // This listener handles all polygon-drawing tools
        if (isLinkingChildMap || isRedrawingPolygon || activeShadowTool === 'object') {
            // All these tools require edit mode
            if (selectedMapData.mode !== 'edit') return;

            if (polygonDrawingComplete) return; // a polygon was just completed and is awaiting another action (e.g. linking)

            const clickThreshold = 10 / (currentMapDisplayData.scale || 1);

            if (currentPolygonPoints.length > 0) {
                const firstPoint = currentPolygonPoints[0];
                const dx = Math.abs(imageCoords.x - firstPoint.x);
                const dy = Math.abs(imageCoords.y - firstPoint.y);

                // Check for closing the polygon
                if (currentPolygonPoints.length >= 2 && dx < clickThreshold && dy < clickThreshold) {
                    currentPolygonPoints.push({ x: firstPoint.x, y: firstPoint.y });

                    // --- Tool-specific completion logic ---
                    if (isLinkingChildMap) {
                        polygonDrawingComplete = true; // Stop further drawing until action is taken
                        drawingCanvas.style.pointerEvents = 'none';
                        dmCanvas.style.cursor = 'auto';
                        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Select Child Map from List';
                        alert('Polygon complete. Select a map from the list to link as its child.');
                    } else if (isRedrawingPolygon) {
                        const newOverlay = {
                            type: 'childMapLink',
                            polygon: [...currentPolygonPoints],
                            linkedMapName: preservedLinkedMapNameForRedraw
                        };
                        selectedMapData.overlays.push(newOverlay);
                        alert(`Polygon redrawn successfully, linked to "${preservedLinkedMapNameForRedraw}".`);
                        resetAllInteractiveStates(); // This will redraw canvas
                    } else if (activeShadowTool === 'object') {
                        // Ensure polygon is clockwise for consistent normal calculations
                        const area = getPolygonSignedArea(currentPolygonPoints);
                        if (area > 0) { // It's counter-clockwise, reverse it to make it clockwise
                            currentPolygonPoints.reverse();
                        }

                        const newObjectOverlay = {
                            type: 'smart_object',
                            polygon: [...currentPolygonPoints]
                        };
                        selectedMapData.overlays.push(newObjectOverlay);
                        isLightMapDirty = true;

                        // Reset for next drawing, but keep the tool active
                        currentPolygonPoints = [];
                        // polygonDrawingComplete remains false, allowing immediate new drawing
                        drawOverlays(selectedMapData.overlays); // Redraw to show the new permanent object
                    }
                } else {
                    // Not closing, just add a new point
                    currentPolygonPoints.push(imageCoords);
                }
            } else {
                // First point of the polygon
                currentPolygonPoints.push(imageCoords);
            }

            // After any click that modifies the polygon, redraw the scene
            if (!polygonDrawingComplete) {
                 drawOverlays(selectedMapData.overlays); // Redraw existing overlays
                 drawCurrentPolygon(); // Draw the in-progress polygon on top
            }
        }
    });

    dmCanvas.addEventListener('mousemove', (event) => {
        if (!isChaining || activeAssetTool !== 'chain') return;
        event.stopPropagation();

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;

        const assetImage = selectedAssetForPreview;
        if (!assetImage || !assetImage.complete || assetImage.naturalWidth === 0) return;

        const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
        if (!imageCoords) return;

        const assetW = assetImage.naturalWidth;
        const assetH = assetImage.naturalHeight;

        // Calculate a sensible default scale to make the asset ~5% of the map width
        const defaultSize = currentMapDisplayData.imgWidth * 0.05;
        const longestDim = Math.max(assetW, assetH);
        const defaultScale = longestDim > 0 ? defaultSize / longestDim : 1;

        // If the current scale is the default (1), use our calculated default scale.
        // Otherwise, use the scale inherited from a previously selected placed asset.
        const assetScale = currentAssetPreviewTransform.scale === 1 ? defaultScale : currentAssetPreviewTransform.scale;

        const { startPoint: localStart, endPoint: localEnd } = getChainPoints(assetImage, chainPointsAngle);

        const chainVectorX = localEnd.x - localStart.x;
        const chainVectorY = localEnd.y - localStart.y;
        const assetChainLength = Math.sqrt(chainVectorX * chainVectorX + chainVectorY * chainVectorY) * assetScale;
        const assetChainAngle = Math.atan2(chainVectorY, chainVectorX);

        if (assetChainLength === 0) return; // Avoid division by zero if points are the same

        let dx = imageCoords.x - lastStampedAssetEndpoint.x;
        let dy = imageCoords.y - lastStampedAssetEndpoint.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        while (distance >= assetChainLength) {
            // Recalculate dragAngle inside the loop to allow the chain to curve.
            let dragAngle = Math.atan2(dy, dx);
            const newAssetRotation = dragAngle - assetChainAngle;

            const rotatedStartOffsetX = (localStart.x * Math.cos(newAssetRotation) - localStart.y * Math.sin(newAssetRotation)) * assetScale;
            const rotatedStartOffsetY = (localStart.x * Math.sin(newAssetRotation) + localStart.y * Math.cos(newAssetRotation)) * assetScale;

            const assetCenter = {
                x: lastStampedAssetEndpoint.x - rotatedStartOffsetX,
                y: lastStampedAssetEndpoint.y - rotatedStartOffsetY
            };

            const newAssetOverlay = {
                type: 'placedAsset',
                id: Date.now() + Math.random(), // Unique ID for the asset
                path: selectedAssetPath,
                position: assetCenter,
                width: assetW,
                height: assetH,
                scale: assetScale,
                rotation: newAssetRotation,
                opacity: currentAssetPreviewTransform.opacity
            };

            if (!selectedMapData.overlays) selectedMapData.overlays = [];
            selectedMapData.overlays.push(newAssetOverlay);

            if (isAutoShadowActive) {
                applyOrUpdateAutoShadow(newAssetOverlay);
            }

            const rotatedEndOffsetX = (localEnd.x * Math.cos(newAssetRotation) - localEnd.y * Math.sin(newAssetRotation)) * assetScale;
            const rotatedEndOffsetY = (localEnd.x * Math.sin(newAssetRotation) + localEnd.y * Math.cos(newAssetRotation)) * assetScale;

            lastStampedAssetEndpoint = {
                x: assetCenter.x + rotatedEndOffsetX,
                y: assetCenter.y + rotatedEndOffsetY
            };

            dx = imageCoords.x - lastStampedAssetEndpoint.x;
            dy = imageCoords.y - lastStampedAssetEndpoint.y;
            distance = Math.sqrt(dx * dx + dy * dy);
            dragAngle = Math.atan2(dy, dx);
        }

        // Redraw all overlays, including any that were just added.
        // `drawOverlays` handles clearing the canvas itself.
        drawOverlays(selectedMapData.overlays);

        // Now, draw the ghost preview on top of the newly drawn overlays.
        const drawingCtx = drawingCanvas.getContext('2d');

        const ghostDragAngle = Math.atan2(imageCoords.y - lastStampedAssetEndpoint.y, imageCoords.x - lastStampedAssetEndpoint.y);
        const ghostRotation = ghostDragAngle - assetChainAngle;

        const ghostRotatedStartOffsetX = (localStart.x * Math.cos(ghostRotation) - localStart.y * Math.sin(ghostRotation)) * assetScale;
        const ghostRotatedStartOffsetY = (localStart.x * Math.sin(ghostRotation) + localStart.y * Math.cos(ghostRotation)) * assetScale;

        const ghostCenter = {
            x: imageCoords.x,
            y: imageCoords.y
        };

        const { scale: mapScale, originX, originY } = selectedMapData.transform;
        const canvasX = (ghostCenter.x * mapScale) + originX;
        const canvasY = (ghostCenter.y * mapScale) + originY;
        const assetCanvasWidth = assetW * assetScale * mapScale;
        const assetCanvasHeight = assetH * assetScale * mapScale;

        drawingCtx.save();
        drawingCtx.globalAlpha = 0.5 * currentAssetPreviewTransform.opacity;
        drawingCtx.translate(canvasX, canvasY);
        drawingCtx.rotate(ghostRotation);
        drawingCtx.drawImage(assetImage, -assetCanvasWidth / 2, -assetCanvasHeight / 2, assetCanvasWidth, assetCanvasHeight);
        drawingCtx.restore();
    });

    dmCanvas.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return; // Only left-click
        const imageCoords = getRelativeCoords(event.offsetX, event.offsetY);
        if (!imageCoords) return;

        if (activeAssetTool === 'chain') {
            if (!selectedAssetPath || !selectedAssetForPreview || !selectedAssetForPreview.complete) {
                alert("Please select an asset from the library to chain.");
                return;
            }
            isChaining = true;
            lastStampedAssetEndpoint = imageCoords;
            event.stopPropagation();
            return;
        }

        if (activeAssetTool === 'select') {
            event.stopPropagation();
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (!selectedMapData || !selectedMapData.overlays) return;

            let clickedOnExistingSelection = false;
            let clickedAsset = null;

            // If exactly one asset is selected, check for handle clicks.
            if (selectedPlacedAssets.length === 1) {
                const asset = selectedPlacedAssets[0];
                const handleName = getHandleForPoint(imageCoords, asset);
                if (handleName) {
                    isDraggingAssetHandle = true;
                    // selectedPlacedAsset = asset; // Set the global for the move handler
                    draggedHandleInfo = {
                        name: handleName,
                        initialAsset: { ...asset, position: { ...asset.position } },
                        initialMouseCoords: imageCoords
                    };
                    mapContainer.style.cursor = 'grabbing';
                    return; // Done.
                }
            }

            // Check if click is on an already selected asset
            for (let i = selectedPlacedAssets.length - 1; i >= 0; i--) {
                const asset = selectedPlacedAssets[i];
                if (isPointInPlacedAsset(imageCoords, asset)) {
                    clickedOnExistingSelection = true;
                    break;
                }
            }

            // If clicked on existing selection, initiate group drag
            if (clickedOnExistingSelection) {
                isDraggingAsset = true;
                draggedAssetInfo = {
                    initialMouseCoords: imageCoords,
                    initialAssetPositions: selectedPlacedAssets.map(a => ({ asset: a, x: a.position.x, y: a.position.y }))
                };
                mapContainer.style.cursor = 'grabbing';
                return;
            }

            // Check for a click on any asset (not just selected ones)
            for (let i = selectedMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = selectedMapData.overlays[i];
                if (overlay.type === 'placedAsset' && isPointInPlacedAsset(imageCoords, overlay)) {
                    clickedAsset = overlay;
                    break;
                }
            }

            if (clickedAsset) {
                if (event.shiftKey) { // Add/remove from selection
                    const index = selectedPlacedAssets.indexOf(clickedAsset);
                    if (index > -1) {
                        selectedPlacedAssets.splice(index, 1);
                    } else {
                        selectedPlacedAssets.push(clickedAsset);
                    }
                } else { // New selection
                    selectedPlacedAssets = [clickedAsset];
                }
                isDraggingAsset = true; // Prepare for potential drag
                 draggedAssetInfo = {
                    initialMouseCoords: imageCoords,
                    initialAssetPositions: selectedPlacedAssets.map(a => ({ asset: a, x: a.position.x, y: a.position.y }))
                };
            } else { // Clicked on empty space, start marquee selection
                if (!event.shiftKey) {
                    selectedPlacedAssets = [];
                }
                isSelecting = true;
                selectionBox = { startX: event.offsetX, startY: event.offsetY, endX: event.offsetX, endY: event.offsetY };
            }

            const lastSelected = selectedPlacedAssets.length > 0 ? selectedPlacedAssets[selectedPlacedAssets.length - 1] : null;
            if (lastSelected) {
                selectedAssetPath = lastSelected.path;
            }
            updateAssetPreview(lastSelected);
            renderAssetExplorer();
            displayMapOnCanvas(selectedMapFileName);
            updateAssetTools();
        }
    });

    dmCanvas.addEventListener('click', (event) => {
        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);
        if (!imageCoords) return;

        // If an asset drag/resize just finished, don't process a click.
        if (isDraggingAssetHandle || isDraggingAsset) {
            return;
        }

        // Handle Stamp Tool
        if (activeAssetTool === 'stamp') {
            // Ensure an asset is selected in the footer and its image is loaded
            if (!selectedAssetPath || !selectedAssetForPreview || !selectedAssetForPreview.complete) {
                alert("Please select an asset from the library to stamp.");
                return;
            }

            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (!selectedMapData) return;

            const assetWidth = selectedAssetForPreview.naturalWidth;
            const assetHeight = selectedAssetForPreview.naturalHeight;

            // Calculate a sensible default scale to make the asset ~5% of the map width
            const defaultSize = currentMapDisplayData.imgWidth * 0.05;
            const longestDim = Math.max(assetWidth, assetHeight);
            const defaultScale = longestDim > 0 ? defaultSize / longestDim : 1;

            // If the current scale is the default (1), use our calculated default scale.
            // Otherwise, use the scale inherited from a previously selected placed asset.
            const finalScale = currentAssetPreviewTransform.scale === 1 ? defaultScale : currentAssetPreviewTransform.scale;

            const newAssetOverlay = {
                type: 'placedAsset',
                id: Date.now() + Math.random(), // Unique ID for the asset
                path: selectedAssetPath,
                position: imageCoords,
                width: assetWidth,
                height: assetHeight,
                scale: finalScale,
                rotation: currentAssetPreviewTransform.rotation,
                opacity: currentAssetPreviewTransform.opacity
            };

            if (!selectedMapData.overlays) {
                selectedMapData.overlays = [];
            }
            selectedMapData.overlays.push(newAssetOverlay);

            // If auto-shadow is active, create the shadow for the new asset
            if (isAutoShadowActive) {
                applyOrUpdateAutoShadow(newAssetOverlay);
            }

            // Redraw the map to show the newly placed asset and its shadow
            displayMapOnCanvas(selectedMapFileName);
            return; // Stamping is an exclusive action.
        }

        if (imageCoords && initiativeTokens.length > 0) {
            let tokenClicked = false;
            for (const token of initiativeTokens) {
                if (isPointInToken(imageCoords, token)) {
                    tokenClicked = true;
                    if (isTargeting) {
                        if (targetingCharacter && token.uniqueId === targetingCharacter.uniqueId) {
                            // Finish targeting by clicking the originating token
                            isTargeting = false;
                            document.body.classList.remove('targeting');
                            tokenStatBlockSetTargets.textContent = 'Set Targets';
                            tokenStatBlockSetTargets.classList.remove('active');
                            populateAndShowStatBlock(token, event.pageX, event.pageY);
                            targetingCharacter = null;
                        } else {
                            // Add/remove a target from the list
                            const targetCharacter = activeInitiative.find(c => c.uniqueId === token.uniqueId);
                            if (targetCharacter) {
                                const targetIndex = targetingCharacter.targets.indexOf(targetCharacter.uniqueId);
                                if (targetIndex > -1) {
                                    targetingCharacter.targets.splice(targetIndex, 1);
                                } else {
                                    targetingCharacter.targets.push(targetCharacter.uniqueId);
                                }
                                if (selectedMapFileName) {
                                    displayMapOnCanvas(selectedMapFileName);
                                }
                            }
                        }
                    }
                    break;
                }
            }
            if (tokenClicked) {
                return;
            }
        }

        if (isMovingPolygon) {
            if (!moveStartPoint) {
                console.log("In move mode, click occurred but not on polygon to start drag. No action.");
                return;
            }
            return;
        }

        if (!imageCoords) {
            return;
        }

        if (selectedTokenForStatBlock) {
            tokenStatBlock.style.display = 'none';
            selectedTokenForStatBlock = null;
            sendTokenStatBlockStateToPlayerView(false);
        }

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;
        if (selectedMapData.mode === 'edit' && isLinkingNote) {
            const newOverlay = {
                type: 'noteLink',
                position: imageCoords,
                linkedNoteId: null,
                playerVisible: false
            };
            selectedMapData.overlays.push(newOverlay);
            console.log('Note icon placed. Overlay:', newOverlay);
            resetAllInteractiveStates();
            return;
        }

        if (selectedMapData.mode === 'edit' && isLinkingCharacter) {
            const newOverlay = {
                type: 'characterLink',
                position: imageCoords,
                linkedCharacterId: null,
                playerVisible: false
            };
            selectedMapData.overlays.push(newOverlay);
            console.log('Character icon placed. Overlay:', newOverlay);
            resetAllInteractiveStates();
            return;
        }

        if (selectedMapData.mode === 'view' && selectedMapData.overlays) {
            for (let i = selectedMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = selectedMapData.overlays[i];
            if (overlay.type === 'door' && isPointOnDoor(imageCoords, overlay)) {
                overlay.isOpen = !overlay.isOpen;
                isLightMapDirty = true;
                displayMapOnCanvas(selectedMapFileName);
                sendMapToPlayerView(selectedMapFileName);
                return;
            } else if (overlay.type === 'door' && isPointOnDoor(imageCoords, overlay)) {
                overlay.isOpen = !overlay.isOpen;
                isLightMapDirty = true;
                displayMapOnCanvas(selectedMapFileName);
                sendMapToPlayerView(selectedMapFileName);
                return;
            } else if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    console.log("Clicked on child map link:", overlay);
                    const childMapName = overlay.linkedMapName;
                    const childMapData = detailedMapData.get(childMapName);
                    if (childMapData) {
                        childMapData.mode = 'view';
                        selectedMapFileName = childMapName;
                        clearAllSelections();
                        const mapItems = mapsList.querySelectorAll('li');
                        mapItems.forEach(li => {
                            if (li.dataset.fileName === childMapName) {
                                li.classList.add('selected-map-item');
                            }
                        });
                        displayMapOnCanvas(childMapName);
                        updateButtonStates();
                        sendMapToPlayerView(childMapName);
                        console.log(`Switched to child map: ${childMapName}`);
                    } else {
                        alert(`Map "${childMapName}" not found.`);
                    }
                    return;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay)) {
                    if (overlay.linkedNoteId) {
                        const note = notesData.find(n => n.id === overlay.linkedNoteId);
                        if (note) {
                            const notePreviewOverlay = document.getElementById('note-preview-overlay');
                            const notePreviewBody = document.getElementById('note-preview-body');
                            if (notePreviewOverlay && notePreviewBody) {
                                const renderedHTML = easyMDE.options.previewRender(note.content);
                                notePreviewBody.innerHTML = renderedHTML;
                                notePreviewOverlay.style.display = 'flex';
                                if (playerWindow && !playerWindow.closed && overlay.playerVisible) {
                                    const playerNoteContent = filterPlayerContent(note.content);
                                    const playerRenderedHTML = easyMDE.options.previewRender(playerNoteContent);
                                    playerWindow.postMessage({
                                        type: 'showNotePreview',
                                        content: playerRenderedHTML
                                    }, '*');
                                }
                            }
                        }
                    }
                    return;
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay)) {
                    if (overlay.linkedCharacterId) {
                        const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                        if (character) {
                            const markdown = generateCharacterMarkdown(character.sheetData, character.notes, false, character.isDetailsVisible);
                            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                            const characterPreviewBody = document.getElementById('character-preview-body');
                            if (characterPreviewOverlay && characterPreviewBody) {
                                characterPreviewBody.innerHTML = markdown;
                                characterPreviewOverlay.style.display = 'flex';
                            }

                            if (playerWindow && !playerWindow.closed && overlay.playerVisible) {
                                const playerMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, true, character.isDetailsVisible);
                                playerWindow.postMessage({
                                    type: 'showCharacterPreview',
                                    content: playerMarkdown
                                }, '*');
                            }
                        }
                    }
                    return;
                }
            }
        }
    });

    function getPolygonSignedArea(polygon) {
        let area = 0;
        if (polygon.length < 4) { // A closed polygon needs at least 4 points (e.g., A, B, C, A)
            return 0;
        }
        for (let i = 0; i < polygon.length - 1; i++) {
            const p1 = polygon[i];
            const p2 = polygon[i + 1];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        return area / 2;
    }

    function isPointInPolygon(point, polygon) {
        if (!polygon || polygon.length < 3) return false;
        let x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].x, yi = polygon[i].y;
            let xj = polygon[j].x, yj = polygon[j].y;
            let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function isPointInNoteIcon(point, noteOverlay) {
        const iconSize = 20 / currentMapDisplayData.ratio;
        const notePos = noteOverlay.position;
        return point.x >= notePos.x - iconSize / 2 && point.x <= notePos.x + iconSize / 2 &&
               point.y >= notePos.y - iconSize / 2 && point.y <= notePos.y + iconSize / 2;
    }

    function isPointInCharacterIcon(point, characterOverlay) {
        const iconSize = 20 / currentMapDisplayData.ratio;
        const charPos = characterOverlay.position;
        return point.x >= charPos.x - iconSize / 2 && point.x <= charPos.x + iconSize / 2 &&
               point.y >= charPos.y - iconSize / 2 && point.y <= charPos.y + iconSize / 2;
    }

    function isPointInToken(point, token) {
        const percentage = token.size / 100;
        const baseDimension = currentMapDisplayData.imgWidth;
        const pixelSizeOnImage = percentage * baseDimension;
        const tokenRadius = pixelSizeOnImage / 2;
        const dx = point.x - token.x;
        const dy = point.y - token.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= tokenRadius;
    }

    function isPointInLightSource(point, lightSource) {
        const radius = 15;
        const dx = point.x - lightSource.position.x;
        const dy = point.y - lightSource.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= radius;
    }

    function isPointInPlacedAsset(point, asset) {
        // Use scale and rotation if they exist, otherwise default them.
        const assetScale = asset.scale || 1;
        const assetRotation = asset.rotation || 0; // in radians

        const assetWidth = asset.width * assetScale;
        const assetHeight = asset.height * assetScale;

        // 1. Translate the point to be relative to the asset's center (position)
        const dx = point.x - asset.position.x;
        const dy = point.y - asset.position.y;

        // 2. Rotate the translated point by the *negative* of the asset's rotation
        const cos = Math.cos(-assetRotation);
        const sin = Math.sin(-assetRotation);
        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        // 3. Check if the now-rotated point is within the asset's un-rotated, scaled bounding box
        const halfWidth = assetWidth / 2;
        const halfHeight = assetHeight / 2;

        return rotatedX >= -halfWidth && rotatedX <= halfWidth &&
               rotatedY >= -halfHeight && rotatedY <= halfHeight;
    }

    function isPointOnDoor(point, doorOverlay) {
        const p1 = doorOverlay.points[0];
        const p2 = doorOverlay.points[1];
        const { x, y } = point;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        if (dx === 0 && dy === 0) return false;

        const t = ((x - p1.x) * dx + (y - p1.y) * dy) / (dx * dx + dy * dy);

        let closestX, closestY;
        if (t < 0) {
            closestX = p1.x;
            closestY = p1.y;
        } else if (t > 1) {
            closestX = p2.x;
            closestY = p2.y;
        } else {
            closestX = p1.x + t * dx;
            closestY = p1.y + t * dy;
        }

        const distance = Math.sqrt((x - closestX)**2 + (y - closestY)**2);

        const clickThreshold = 5 / currentMapDisplayData.scale;
        return distance < clickThreshold;
    }


    function checkLineCircleCollision(p1, p2, circleCenter, radius) {
        // Check if either endpoint is inside the circle
        if (Math.sqrt((p1.x - circleCenter.x)**2 + (p1.y - circleCenter.y)**2) <= radius) return true;
        if (Math.sqrt((p2.x - circleCenter.x)**2 + (p2.y - circleCenter.y)**2) <= radius) return true;

        // Check for intersection with the line segment
        const len_sq = (p2.x - p1.x)**2 + (p2.y - p1.y)**2;
        if (len_sq === 0) return false; // Line segment is a point, already checked

        let t = ((circleCenter.x - p1.x) * (p2.x - p1.x) + (circleCenter.y - p1.y) * (p2.y - p1.y)) / len_sq;
        t = Math.max(0, Math.min(1, t));

        const closestX = p1.x + t * (p2.x - p1.x);
        const closestY = p1.y + t * (p2.y - p1.y);

        const dist_sq = (closestX - circleCenter.x)**2 + (closestY - circleCenter.y)**2;

        return dist_sq <= radius**2;
    }

    function handleMouseMoveOnCanvas(event) {
        if (!currentMapDisplayData.img || !hoverLabel) return;

        const rect = dmCanvas.getBoundingClientRect();
        const canvasX = Math.round(event.clientX - rect.left);
        const canvasY = Math.round(event.clientY - rect.top);
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        let overlaysToCheck = selectedMapData ? selectedMapData.overlays : null;

        if (imageCoords && overlaysToCheck && overlaysToCheck.length > 0) {
            for (let i = overlaysToCheck.length - 1; i >= 0; i--) {
                const overlay = overlaysToCheck[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    hoverLabel.textContent = overlay.linkedMapName;
                    hoverLabel.style.left = `${event.pageX + 10}px`;
                    hoverLabel.style.top = `${event.pageY + 10}px`;
                    hoverLabel.style.display = 'block';
                    return;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay) && overlay.linkedNoteId) {
                    const note = notesData.find(n => n.id === overlay.linkedNoteId);
                    if (note) {
                        hoverLabel.textContent = note.title;
                        hoverLabel.style.left = `${event.pageX + 10}px`;
                        hoverLabel.style.top = `${event.pageY + 10}px`;
                        hoverLabel.style.display = 'block';
                        return;
                    }
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay) && overlay.linkedCharacterId) {
                    const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                    if (character) {
                        hoverLabel.textContent = character.name;
                        hoverLabel.style.left = `${event.pageX + 10}px`;
                        hoverLabel.style.top = `${event.pageY + 10}px`;
                        hoverLabel.style.display = 'block';
                        return;
                    }
                }
            }
        }

        hoverLabel.style.display = 'none';
    }

    function handleDelete(item) {
        const fileName = item.dataset.fileName;
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            const list = item.parentNode;
            item.remove();
            displayedFileNames.delete(fileName);

            const mapDataEntry = detailedMapData.get(fileName);
            if (mapDataEntry && mapDataEntry.url) {
                URL.revokeObjectURL(mapDataEntry.url);
                detailedMapData.delete(fileName);
            }

            if (selectedMapFileName === fileName) {
                selectedMapFileName = null;
                if (modeToggleSwitch) modeToggleSwitch.disabled = true;
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
                updateButtonStates();
            }

            updateMoveIconVisibility(list);
        }
    }

    function moveItemUp(item) {
        if (item.previousElementSibling) {
            item.parentNode.insertBefore(item, item.previousElementSibling);
            updateMoveIconVisibility(item.parentNode);
        }
    }

    function moveItemDown(item) {
        if (item.nextElementSibling) {
            item.parentNode.insertBefore(item.nextElementSibling, item);
            updateMoveIconVisibility(item.parentNode);
        }
    }

    function updateMoveIconVisibility(list) {
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-map-up');
            const downIcon = item.querySelector('.move-map-down');

            if (upIcon) upIcon.style.display = (index === 0) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1) ? 'none' : 'inline-block';
        });
    }

    function resetAllInteractiveStates() {
        isLinkingChildMap = false;
        isLinkingNote = false;
        isLinkingCharacter = false;
        isRedrawingPolygon = false;
        isMovingPolygon = false;
        isMovingNote = false;
        isMovingCharacter = false;

        preservedLinkedMapNameForRedraw = null;
        currentPolygonPoints = [];
        polygonDrawingComplete = false;

        polygonBeingMoved = null;
        noteBeingMoved = null;
        characterBeingMoved = null;
        moveStartPoint = null;
        currentDragOffsets = {x: 0, y: 0};

        if (btnLinkChildMap) btnLinkChildMap.textContent = 'Link to Child Map';
        if (btnLinkNote) btnLinkNote.textContent = 'Link Note';
        if (btnLinkCharacter) btnLinkCharacter.textContent = 'Link Character';

        const drawingCtx = drawingCanvas.getContext('2d');
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCanvas.style.pointerEvents = 'none';
        mapContainer.style.cursor = 'grab';
        dmCanvas.style.cursor = 'auto';

        if (activeShadowTool) {
            setShadowTool(null);
        }

        // This block handles the full shutdown of the Assets tool.
        isAssetsMode = false;
        if(assetsToolsContainer) assetsToolsContainer.style.display = 'none';
        isGridToolActive = false;
        if(gridControlsContainer) gridControlsContainer.style.display = 'none';
        if (btnAssetsGrid) btnAssetsGrid.classList.remove('active');
        if (footerAssetsTab) {
            footerAssetsTab.style.display = 'none';
            if (footerAssetsTab.classList.contains('active')) {
                const toolsTabButton = document.querySelector('.footer-tab-button[data-tab="footer-tools"]');
                if (toolsTabButton) {
                    toolsTabButton.click();
                }
            }
        }
        setActiveAssetTool(null);
        selectedPlacedAssets = [];
        isSelecting = false;
        selectionBox = null;
        updateAssetPreview(); // This will also clear the preview
        isDraggingAssetHandle = false;
        draggedHandleInfo = null;
        isDraggingAsset = false;
        draggedAssetInfo = null;
        updateAssetTools();


        selectedPolygonForContextMenu = null;
        selectedNoteForContextMenu = null;
        selectedCharacterForContextMenu = null;

        if (selectedMapFileName) {
            displayMapOnCanvas(selectedMapFileName);
        }
        updateButtonStates();
        console.log("All interactive states reset.");
    }


    if (btnLinkChildMap) {
        btnLinkChildMap.addEventListener('click', () => {
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (!selectedMapData || selectedMapData.mode !== 'edit') {
                alert("Please select a map and ensure it is in 'Edit' mode to add a link to it.");
                return;
            }

            if (isLinkingChildMap || isRedrawingPolygon || isMovingPolygon || isLinkingNote) {
                resetAllInteractiveStates();
                console.log("Interactive operation cancelled via Link/Cancel button.");
            } else {
                resetAllInteractiveStates();
                isLinkingChildMap = true;
                btnLinkChildMap.textContent = 'Cancel Drawing Link';
                drawingCanvas.style.pointerEvents = 'auto';
                dmCanvas.style.cursor = 'crosshair';
                drawingCanvas.style.cursor = 'crosshair';
                alert("Click on the map to start drawing a polygon for the link. Click the first point to close the shape.");
                updateButtonStates();
            }
        });
    }

    if (btnLinkNote) {
        btnLinkNote.addEventListener('click', () => {
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (!selectedMapData || selectedMapData.mode !== 'edit') {
                alert("Please select a map and ensure it is in 'Edit' mode to add a note to it.");
                return;
            }

            if (isLinkingChildMap || isRedrawingPolygon || isMovingPolygon || isLinkingNote || isLinkingCharacter) {
                resetAllInteractiveStates();
                console.log("Interactive operation cancelled via Link Note/Cancel button.");
            } else {
                resetAllInteractiveStates();
                isLinkingNote = true;
                btnLinkNote.textContent = 'Cancel Linking Note';
                dmCanvas.style.cursor = 'crosshair';
                alert("Click on the map to place a note icon.");
                updateButtonStates();
            }
        });
    }

    if (btnLinkCharacter) {
        btnLinkCharacter.addEventListener('click', () => {
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (!selectedMapData || selectedMapData.mode !== 'edit') {
                alert("Please select a map and ensure it is in 'Edit' mode to add a character to it.");
                return;
            }

            if (isLinkingChildMap || isRedrawingPolygon || isMovingPolygon || isLinkingNote || isLinkingCharacter) {
                resetAllInteractiveStates();
                console.log("Interactive operation cancelled via Link Character/Cancel button.");
            } else {
                resetAllInteractiveStates();
                isLinkingCharacter = true;
                btnLinkCharacter.textContent = 'Cancel Linking Character';
                dmCanvas.style.cursor = 'crosshair';
                alert("Click on the map to place a character icon.");
                updateButtonStates();
            }
        });
    }

    if (shadowCanvas) {
        shadowCanvas.addEventListener('mousedown', handleShadowMouseDown);
        shadowCanvas.addEventListener('mousemove', handleShadowMouseMove);
        shadowCanvas.addEventListener('mouseup', stopShadowInteraction);
        shadowCanvas.addEventListener('mouseout', stopShadowInteraction);
    }

    function setShadowTool(tool) {
        // If a polygon drawing tool from another system is active, cancel it.
        if (isLinkingChildMap || isRedrawingPolygon) {
            resetAllInteractiveStates();
        }

        if (activeShadowTool === tool) {
            activeShadowTool = null;
        } else {
            activeShadowTool = tool;
        }

        // Reset polygon points if we are deactivating or switching away from the object tool
        if (activeShadowTool !== 'object') {
            currentPolygonPoints = [];
            polygonDrawingComplete = false;
        }

        // Cleanup for door tool
        if (activeShadowTool !== 'door') {
            lineStartPoint = null;
        }

        // Redraw to clear temp lines from door tool
        const mapData = detailedMapData.get(selectedMapFileName);
        if (mapData) {
            drawOverlays(mapData.overlays);
        }

        // Update button styles
        if (btnShadowObject) btnShadowObject.classList.toggle('active', activeShadowTool === 'object');
        btnShadowWall.classList.toggle('active', activeShadowTool === 'wall');
        btnShadowDoor.classList.toggle('active', activeShadowTool === 'door');
        btnAddLightSource.classList.toggle('active', activeShadowTool === 'lightSource');
        btnShadowErase.classList.toggle('active', activeShadowTool === 'erase');

        // Set cursor style and enable pointer events on the appropriate canvas
        const cursorStyle = activeShadowTool ? 'crosshair' : 'auto';
        dmCanvas.style.cursor = cursorStyle;
        drawingCanvas.style.cursor = cursorStyle;
        shadowCanvas.style.cursor = cursorStyle;

        if (activeShadowTool === 'object') {
            drawingCanvas.style.pointerEvents = 'auto';
            shadowCanvas.style.pointerEvents = 'none';
            if (currentPolygonPoints.length === 0) {
                alert("Click on the map to start drawing an object polygon. Click the first point to close the shape.");
            }
        } else if (activeShadowTool) { // For wall, door, erase, lightSource
            drawingCanvas.style.pointerEvents = 'none';
            shadowCanvas.style.pointerEvents = 'auto';
        } else { // No tool active
            drawingCanvas.style.pointerEvents = 'none';
            shadowCanvas.style.pointerEvents = 'none';
        }
    }

    if (btnShadowObject) {
        btnShadowObject.addEventListener('click', () => setShadowTool('object'));
    }

    if (btnShadowWall) {
        btnShadowWall.addEventListener('click', () => setShadowTool('wall'));
    }

    if (btnShadowDoor) {
        btnShadowDoor.addEventListener('click', () => setShadowTool('door'));
    }

    if (btnAddLightSource) {
        btnAddLightSource.addEventListener('click', () => setShadowTool('lightSource'));
    }

    if (btnShadowErase) {
        btnShadowErase.addEventListener('click', () => setShadowTool('erase'));
    }

    if (btnShadowDone) {
        btnShadowDone.addEventListener('click', () => {
            isShadowMode = false;
            shadowToolsContainer.style.display = 'none';
            setShadowTool(null); // This will reset all tool states correctly
        });
    }

    function updateAssetTools() {
        if (btnAssetsMerge) {
            btnAssetsMerge.style.display = selectedPlacedAssets.length > 1 ? 'inline-block' : 'none';
        }
    }

    function setActiveAssetTool(tool) {
        const oldTool = activeAssetTool;
        // If the same tool is clicked again, deactivate it.
        if (activeAssetTool === tool) {
            tool = null;
        }

        activeAssetTool = tool;

        // If switching away from stamp, clear any ghost preview
        if (oldTool === 'stamp' && activeAssetTool !== 'stamp') {
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (selectedMapData) {
                drawOverlays(selectedMapData.overlays);
            }
        }

        // Update button active states
        if (btnAssetsSelect) btnAssetsSelect.classList.toggle('active', activeAssetTool === 'select');
        if (btnAssetsStamp) btnAssetsStamp.classList.toggle('active', activeAssetTool === 'stamp');
        // if (btnAssetsGrid) btnAssetsGrid.classList.toggle('active', isGridToolActive);
        if (btnAssetsChain) btnAssetsChain.classList.toggle('active', activeAssetTool === 'chain');

        // Update cursor style
        if (activeAssetTool === 'select') {
            mapContainer.style.cursor = 'pointer';
        } else if (activeAssetTool === 'stamp') {
            mapContainer.style.cursor = 'copy';
    } else if (activeAssetTool === 'chain') {
        mapContainer.style.cursor = 'crosshair';
        } else {
            mapContainer.style.cursor = 'grab';
        }

        updateAssetPreview();
    }

    if (btnAssetsSelect) {
        btnAssetsSelect.addEventListener('click', () => {
            const wasActive = activeAssetTool === 'select';
            setActiveAssetTool('select');

            // If we are turning select mode ON
            if (!wasActive) {
                updateAssetPreview();
            } else { // If we are turning select mode OFF
                // Deselect any placed asset
                selectedPlacedAssets = [];
                updateAssetPreview(); // This will hide the preview
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName); // Redraw to remove selection box
                }
            }
        });
    }

    if (btnAssetsStamp) {
        btnAssetsStamp.addEventListener('click', () => {
            setActiveAssetTool('stamp');
        });
    }

    if (btnAssetsGrid) {
        btnAssetsGrid.addEventListener('click', () => {
            isGridToolActive = !isGridToolActive;
            gridControlsContainer.style.display = isGridToolActive ? 'block' : 'none';
            btnAssetsGrid.classList.toggle('active', isGridToolActive);
        });
    }

    if (gridScaleSlider) {
        gridScaleSlider.addEventListener('input', (e) => {
            gridScale = parseInt(e.target.value, 10);
            gridScaleValue.textContent = gridScale;
            if (gridData[selectedMapFileName]) {
                gridData[selectedMapFileName].scale = gridScale;
            }
            drawGrid();
            sendGridToPlayerView();
        });
    }

    if (gridSqftInput) {
        gridSqftInput.addEventListener('change', (e) => {
            gridSqft = parseInt(e.target.value, 10);
            if (gridData[selectedMapFileName]) {
                gridData[selectedMapFileName].sqft = gridSqft;
            }
        });
    }

    if (gridOnCheckbox) {
        gridOnCheckbox.addEventListener('change', (e) => {
            isGridVisible = e.target.checked;
            if (gridData[selectedMapFileName]) {
                gridData[selectedMapFileName].visible = isGridVisible;
            }
            drawGrid();
            sendGridToPlayerView();
        });
    }

    if (autoShadowCheckbox) {
        autoShadowCheckbox.addEventListener('change', () => {
            isAutoShadowActive = autoShadowCheckbox.checked;
            // If an asset is selected, apply/remove shadow immediately
            if (selectedPlacedAssets.length > 0) {
                selectedPlacedAssets.forEach(asset => {
                    if (isAutoShadowActive) {
                        applyOrUpdateAutoShadow(asset);
                    } else {
                        removeAutoShadow(asset);
                    }
                });
            }
            updateAssetPreview(); // To show/hide chain points slider
        });
    }

    if (autoShadowModeToggle) {
        autoShadowModeToggle.addEventListener('change', () => {
            autoShadowMode = autoShadowModeToggle.checked ? 'object' : 'wall';
            autoShadowWallLabel.classList.toggle('active', autoShadowMode === 'wall');
            autoShadowObjectLabel.classList.toggle('active', autoShadowMode === 'object');

            // If auto-shadow is active and an asset is selected, switch the shadow type
            if (isAutoShadowActive && selectedPlacedAssets.length > 0) {
                 selectedPlacedAssets.forEach(asset => {
                    applyOrUpdateAutoShadow(asset);
                });
            }
            updateAssetPreview(); // To show/hide chain points slider
        });
    }

    if (assetPreviewOpacitySlider) {
        assetPreviewOpacitySlider.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            currentAssetPreviewTransform.opacity = opacity;
            
            if (assetPreviewOpacityValue) {
                assetPreviewOpacityValue.textContent = opacity.toFixed(1);
            }
            if (assetPreviewImage) {
                assetPreviewImage.style.opacity = opacity;
            }

            // If assets are selected on the map, update their opacity value directly
            if (activeAssetTool === 'select' && selectedPlacedAssets.length > 0) {
                selectedPlacedAssets.forEach(asset => {
                    asset.opacity = opacity;
                });
                // Redraw the canvas to show the change on the placed assets immediately
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
            }
        });
    }

    if (btnAssetsDelete) {
        btnAssetsDelete.addEventListener('click', () => {
            if (activeAssetTool === 'select' && selectedPlacedAssets.length > 0) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData && selectedMapData.overlays) {
                    // Remove associated shadows first
                    selectedPlacedAssets.forEach(asset => removeAutoShadow(asset));

                    // Now remove the assets themselves
                    selectedMapData.overlays = selectedMapData.overlays.filter(o => !selectedPlacedAssets.includes(o));

                    selectedPlacedAssets = [];
                    updateAssetPreview();
                    displayMapOnCanvas(selectedMapFileName);
                    updateAssetTools();
                }
            } else {
                alert("Select one or more assets on the map to delete.");
            }
        });
    }

    if (btnAssetsDone) {
        btnAssetsDone.addEventListener('click', () => {
            resetAllInteractiveStates();
            // Also ensure the main tools tab is re-selected in the footer
            const toolsTabButton = document.querySelector('.footer-tab-button[data-tab="footer-tools"]');
            if (toolsTabButton) toolsTabButton.click();
        });
    }

    if (btnAssetsMerge) {
        btnAssetsMerge.addEventListener('click', () => {
            if (selectedPlacedAssets.length < 2) {
                alert("Please select at least two assets to merge.");
                return;
            }

            // Helper function to get the transformed corners of an asset
            const getTransformedCorners = (asset) => {
                const w = asset.width * (asset.scale || 1);
                const h = asset.height * (asset.scale || 1);
                const angle = asset.rotation || 0;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const halfW = w / 2;
                const halfH = h / 2;

                const corners = [
                    { x: -halfW, y: -halfH },
                    { x:  halfW, y: -halfH },
                    { x:  halfW, y:  halfH },
                    { x: -halfW, y:  halfH }
                ];

                return corners.map(corner => ({
                    x: asset.position.x + corner.x * cos - corner.y * sin,
                    y: asset.position.y + corner.x * sin + corner.y * cos
                }));
            };

            let allCorners = [];
            selectedPlacedAssets.forEach(asset => {
                allCorners = allCorners.concat(getTransformedCorners(asset));
            });

            const minX = Math.min(...allCorners.map(c => c.x));
            const maxX = Math.max(...allCorners.map(c => c.x));
            const minY = Math.min(...allCorners.map(c => c.y));
            const maxY = Math.max(...allCorners.map(c => c.y));

            const newWidth = maxX - minX;
            const newHeight = maxY - minY;

            if (newWidth <= 0 || newHeight <= 0) {
                alert("Cannot merge assets with zero or negative size.");
                return;
            }

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            const tempCtx = tempCanvas.getContext('2d');

            const assetImagePromises = selectedPlacedAssets.map(asset => {
                return new Promise((resolve, reject) => {
                    const img = assetImageCache[asset.path];
                    if (img && img.complete) {
                        resolve({ asset, img });
                    } else {
                        const newImg = new Image();
                        newImg.src = findAssetByPath(asset.path).url;
                        newImg.onload = () => {
                            assetImageCache[asset.path] = newImg;
                            resolve({ asset, img: newImg });
                        };
                        newImg.onerror = reject;
                    }
                });
            });

            Promise.all(assetImagePromises).then(assetsToDraw => {
                assetsToDraw.forEach(({ asset, img }) => {
                    const scale = asset.scale || 1;
                    const rotation = asset.rotation || 0;
                    const opacity = asset.opacity ?? 1;

                    const drawX = asset.position.x - minX;
                    const drawY = asset.position.y - minY;
                    const drawW = asset.width * scale;
                    const drawH = asset.height * scale;

                    tempCtx.save();
                    tempCtx.globalAlpha = opacity;
                    tempCtx.translate(drawX, drawY);
                    tempCtx.rotate(rotation);
                    tempCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                    tempCtx.restore();
                });

                const dataUrl = tempCanvas.toDataURL('image/png');

                let counter = 1;
                let newAssetName = `Merged Asset ${counter}.png`;
                let newAssetPath = `Merged/${newAssetName}`;

                if (!assetsByPath['Merged']) {
                    assetsByPath['Merged'] = { type: 'folder', children: {} };
                }

                while (assetsByPath['Merged'].children[newAssetName]) {
                    counter++;
                    newAssetName = `Merged Asset ${counter}.png`;
                    newAssetPath = `Merged/${newAssetName}`;
                }

                const newAsset = {
                    type: 'file',
                    path: newAssetPath,
                    url: dataUrl,
                    file: null // Merged assets don't have a source file object
                };

                assetsByPath['Merged'].children[newAssetName] = newAsset;
                assetFavorites[newAssetPath] = true;

                // Clear selection and redraw map without the merged assets
                const mapData = detailedMapData.get(selectedMapFileName);
                if (mapData && mapData.overlays) {
                    mapData.overlays = mapData.overlays.filter(o => !selectedPlacedAssets.includes(o));
                }
                selectedPlacedAssets = [];
                updateAssetTools();
                displayMapOnCanvas(selectedMapFileName);

                // Switch to favorites view to show the new asset
                isFavoritesView = true;
                currentAssetPath = [];
                renderAssetExplorer();

                alert(`New asset "${newAssetName}" created and added to favorites!`);

            }).catch(error => {
                console.error("Error loading asset images for merging:", error);
                alert("An error occurred while loading assets for merging. Please try again.");
            });
        });
    }

    if (btnAssetsFlatten) {
        btnAssetsFlatten.addEventListener('click', () => {
            if (!selectedMapFileName) {
                alert("Please select a map to flatten.");
                return;
            }

            if (confirm("Are you sure you want to flatten all assets onto the map? This action cannot be undone.")) {
                const mapData = detailedMapData.get(selectedMapFileName);
                if (!mapData || !currentMapDisplayData.img) {
                    alert("Map data is not loaded correctly. Cannot flatten.");
                    return;
                }

                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = currentMapDisplayData.imgWidth;
                tempCanvas.height = currentMapDisplayData.imgHeight;

                // 1. Draw the base map
                tempCtx.drawImage(currentMapDisplayData.img, 0, 0);

                // 2. Draw all placed assets
                const assetOverlays = mapData.overlays.filter(o => o.type === 'placedAsset');
                const assetImagePromises = assetOverlays.map(overlay => {
                    return new Promise((resolve, reject) => {
                        if (assetImageCache[overlay.path] && assetImageCache[overlay.path].complete) {
                            resolve({overlay, img: assetImageCache[overlay.path]});
                        } else {
                            const img = new Image();
                            img.src = findAssetByPath(overlay.path).url;
                            img.onload = () => {
                                assetImageCache[overlay.path] = img;
                                resolve({overlay, img});
                            };
                            img.onerror = reject;
                        }
                    });
                });

                Promise.all(assetImagePromises).then(assetsToDraw => {
                    assetsToDraw.forEach(({ overlay, img }) => {
                        const assetScale = overlay.scale || 1;
                        const assetRotation = overlay.rotation || 0;
                        const assetOpacity = overlay.opacity ?? 1;

                        const w = overlay.width * assetScale;
                        const h = overlay.height * assetScale;
                        const x = overlay.position.x;
                        const y = overlay.position.y;

                        tempCtx.save();
                        tempCtx.globalAlpha = assetOpacity;
                        tempCtx.translate(x, y);
                        tempCtx.rotate(assetRotation);
                        tempCtx.drawImage(img, -w / 2, -h / 2, w, h);
                        tempCtx.restore();
                    });

                    // 3. Create a new image from the flattened canvas
                    const flattenedImageDataUrl = tempCanvas.toDataURL('image/png');
                    const newMapImage = new Image();
                    newMapImage.onload = () => {
                        // 4. Update the map data
                        mapData.url = flattenedImageDataUrl;
                        // Revoke the old object URL to free memory
                        URL.revokeObjectURL(currentMapDisplayData.img.src);

                        // 5. Remove the placed assets from the overlays
                        mapData.overlays = mapData.overlays.filter(o => o.type !== 'placedAsset');
                        selectedPlacedAssets = [];

                        // 6. Redraw the canvas with the new, flattened map
                        displayMapOnCanvas(selectedMapFileName);
                        alert("Assets have been flattened to the map.");
                    };
                    newMapImage.src = flattenedImageDataUrl;
                }).catch(error => {
                    console.error("Error loading asset images for flattening:", error);
                    alert("An error occurred while loading assets. Flattening failed.");
                });
            }
        });
    }

    function toggleFavorite(assetPath) {
        if (assetFavorites[assetPath]) {
            delete assetFavorites[assetPath];
        } else {
            assetFavorites[assetPath] = true;
        }
        renderAssetExplorer();
    }

    function findAssetByPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        let currentLevel = assetsByPath;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (currentLevel[part]) {
                if (i === parts.length - 1) {
                    return currentLevel[part];
                }
                currentLevel = currentLevel[part].children;
            } else {
                return null; // Not found
            }
        }
        return null;
    }

    function renderAssetExplorer() {
        if (!footerAssetsContent) return;

        // Create the main structure if it doesn't exist
        if (!document.getElementById('asset-explorer-wrapper')) {
            footerAssetsContent.innerHTML = `
                <div id="asset-explorer-wrapper">
                    <div id="assets-controls">
                        <button id="upload-assets-folder-btn">Upload Assets Folder</button>
                        <input type="file" id="assets-folder-input" style="display: none;" webkitdirectory directory multiple>
                        <input type="text" id="asset-search-input" placeholder="Search assets..." style="margin-left: 10px;">
                    </div>
                    <div id="asset-explorer">
                        <div id="asset-path-display"></div>
                        <div id="asset-file-list"></div>
                    </div>
                </div>
            `;

            document.getElementById('upload-assets-folder-btn').addEventListener('click', () => {
                document.getElementById('assets-folder-input').click();
            });
            document.getElementById('assets-folder-input').addEventListener('change', handleAssetFolderUpload);
            document.getElementById('asset-search-input').addEventListener('keyup', renderAssetExplorer);
            footerAssetsContent.addEventListener('click', (e) => e.stopPropagation());
        }

        const filterText = document.getElementById('asset-search-input').value.toLowerCase();
        const pathDisplay = document.getElementById('asset-path-display');
        const fileListContainer = document.getElementById('asset-file-list');

        pathDisplay.innerHTML = '';
        fileListContainer.innerHTML = '';

        function findAssetsRecursively(directory, term, pathPrefix = '') {
            let results = [];
            for (const name in directory) {
                const item = directory[name];
                const currentPath = pathPrefix ? `${pathPrefix}/${name}` : name;

                if (item.type === 'folder') {
                    results = results.concat(findAssetsRecursively(item.children, term, currentPath));
                } else if (item.type === 'file' && name.toLowerCase().includes(term)) {
                    // Add the name to the item object so we can sort by it later
                    results.push({ ...item, name: name });
                }
            }
            return results;
        }

        function renderItems(items) {
            fileListContainer.innerHTML = ''; // Clear previous items
            items.forEach(item => {
                const { name } = item;
                const assetItemDiv = document.createElement('div');
                assetItemDiv.className = 'asset-item';
                assetItemDiv.title = name;

                if (item.path && item.path === selectedAssetPath) {
                    assetItemDiv.classList.add('selected');
                }

                if (item.type === 'folder') {
                    assetItemDiv.innerHTML = `
                        <svg fill="currentColor" viewBox="0 0 256 256"><path d="M216,72H145.41a16,16,0,0,1-10.42-3.89L123.08,59.32A8,8,0,0,0,117.41,56H40A16,16,0,0,0,24,72v24H232V88A16,16,0,0,0,216,72ZM24,120V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V120Z"></path></svg>
                        <span class="asset-name">${name}</span>
                    `;
                    assetItemDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (item.special === 'favorites') {
                            isFavoritesView = true;
                            currentAssetPath = [];
                        } else {
                            isFavoritesView = false;
                            currentAssetPath.push(name);
                        }
                        renderAssetExplorer();
                    });
                } else if (item.type === 'file') {
                    const isFavorite = assetFavorites[item.path];
                    assetItemDiv.innerHTML = `
                        <button class="asset-favorite-btn ${isFavorite ? 'is-favorite' : ''}" title="Toggle Favorite">${isFavorite ? '⭐' : '⚪'}</button>
                        <img src="${item.url}" alt="${name}">
                        <span class="asset-name">${name}</span>
                    `;
                    assetItemDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (e.target.classList.contains('asset-favorite-btn')) return;

                        const clickedPath = item.path;
                        if (selectedAssetPath === clickedPath) {
                            selectedAssetPath = null;
                            currentAssetPreviewTransform = { scale: 1, rotation: 0, opacity: 1 };
                        } else {
                            selectedAssetPath = clickedPath;
                            currentAssetPreviewTransform = { scale: 1, rotation: 0, opacity: 1 };
                        }
                        updateAssetPreview();
                        // Re-render to update selection highlight
                        const currentFilter = document.getElementById('asset-search-input').value;
                        if(currentFilter) {
                            renderAssetExplorer();
                        } else {
                            // Find the currently displayed items and update the class
                            const allItems = fileListContainer.querySelectorAll('.asset-item');
                            allItems.forEach(div => {
                                const path = findAssetByPath(div.title)?.path; // A bit inefficient but works
                                if(path === selectedAssetPath) {
                                    div.classList.add('selected');
                                } else {
                                    div.classList.remove('selected');
                                }
                            });
                        }
                    });

                    const favButton = assetItemDiv.querySelector('.asset-favorite-btn');
                    favButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleFavorite(item.path);
                    });
                }
                fileListContainer.appendChild(assetItemDiv);
            });
        }

        if (filterText) {
            pathDisplay.innerHTML = 'Search Results';
            let searchRoot = assetsByPath;
            if (!isFavoritesView) {
                let currentLevel = assetsByPath;
                currentAssetPath.forEach(folderName => {
                    currentLevel = currentLevel[folderName].children;
                });
                searchRoot = currentLevel;
            }
            const searchResults = findAssetsRecursively(searchRoot, filterText);
            searchResults.sort((a, b) => a.name.localeCompare(b.name));
            renderItems(searchResults);
        } else {
            // Breadcrumbs
            const rootLink = document.createElement('a');
            rootLink.href = '#';
            rootLink.textContent = 'Assets';
            rootLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isFavoritesView = false;
                currentAssetPath = [];
                renderAssetExplorer();
            });
            pathDisplay.appendChild(rootLink);

            if (isFavoritesView) {
                pathDisplay.append(' / Favorites');
            } else {
                currentAssetPath.forEach((folderName, index) => {
                    pathDisplay.append(' / ');
                    const partLink = document.createElement('a');
                    partLink.href = '#';
                    partLink.textContent = folderName;
                    partLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isFavoritesView = false;
                        currentAssetPath = currentAssetPath.slice(0, index + 1);
                        renderAssetExplorer();
                    });
                    pathDisplay.appendChild(partLink);
                });
            }

            let baseItems = {};
            if (isFavoritesView) {
                pathDisplay.append(' / Favorites');
                for (const path in assetFavorites) {
                    const item = findAssetByPath(path);
                    if (item) {
                        const name = path.substring(path.lastIndexOf('/') + 1);
                        baseItems[name] = item;
                    }
                }
            } else {
                let currentLevel = assetsByPath;
                currentAssetPath.forEach(folderName => {
                    currentLevel = currentLevel[folderName].children;
                });
                baseItems = currentLevel;
            }

            const itemsToRender = Object.entries(baseItems)
                .map(([name, item]) => ({ name, ...item }))
                .sort((a, b) => {
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });

            // Add favorites folder at root
            if (currentAssetPath.length === 0 && !isFavoritesView) {
                const favoritesFolder = {
                    name: 'Favorites',
                    type: 'folder',
                    special: 'favorites'
                };
                itemsToRender.unshift(favoritesFolder);
            }

            renderItems(itemsToRender);
        }
    }

    function handleAssetFolderUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        for (const file of files) {
            // We only care about images
            if (!file.type.startsWith('image/')) continue;

            const pathParts = file.webkitRelativePath.split('/');
            const filename = pathParts.pop();
            let currentLevel = assetsByPath;

            pathParts.forEach(folder => {
                if (!currentLevel[folder]) {
                    currentLevel[folder] = { type: 'folder', children: {} };
                }
                currentLevel = currentLevel[folder].children;
            });

            currentLevel[filename] = {
                type: 'file',
                path: file.webkitRelativePath,
                url: URL.createObjectURL(file),
                file: file // Store the file object itself for saving later
            };
        }
        currentAssetPath = [];
        renderAssetExplorer();
        event.target.value = ''; // Reset input
    }

    function applyOrUpdateAutoShadow(asset) {
        if (!asset || !asset.id || !selectedMapFileName) return;
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData) return;

        // First, remove any existing auto-shadow for this asset
        removeAutoShadow(asset);

        const assetImage = assetImageCache[asset.path];
        if (!assetImage || !assetImage.complete || assetImage.naturalWidth === 0) {
            // If the image isn't loaded, try again in a moment.
            setTimeout(() => applyOrUpdateAutoShadow(asset), 100);
            return;
        }

        if (autoShadowMode === 'wall') {
            const { startPoint: localStart, endPoint: localEnd } = getChainPoints(assetImage, chainPointsAngle);

            const assetScale = asset.scale || 1;
            const assetRotation = asset.rotation || 0;
            const cos = Math.cos(assetRotation);
            const sin = Math.sin(assetRotation);

            const transformPoint = (localPoint) => {
                const rotatedX = (localPoint.x * cos - localPoint.y * sin) * assetScale;
                const rotatedY = (localPoint.x * sin + localPoint.y * cos) * assetScale;
                return { x: asset.position.x + rotatedX, y: asset.position.y + rotatedY };
            };

            const wallStartPoint = transformPoint(localStart);
            const wallEndPoint = transformPoint(localEnd);

            const newWall = { type: 'wall', points: [wallStartPoint, wallEndPoint], autoShadowParentId: asset.id };
            mapData.overlays.push(newWall);

        } else { // 'object' mode
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = assetImage.naturalWidth;
            tempCanvas.height = assetImage.naturalHeight;
            tempCtx.drawImage(assetImage, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const pixelPoints = [];
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i + 3] > 0) { // Check alpha channel
                    const x = (i / 4) % tempCanvas.width;
                    const y = Math.floor((i / 4) / tempCanvas.width);
                    pixelPoints.push({ x, y });
                }
            }

            if (pixelPoints.length > 2) {
                const hullPoints = getConvexHull(pixelPoints);
                hullPoints.reverse(); // Ensure clockwise winding for the lighting engine.

                const assetScale = asset.scale || 1;
                const assetRotation = asset.rotation || 0;
                const cos = Math.cos(assetRotation);
                const sin = Math.sin(assetRotation);
                const assetCenterX = assetImage.naturalWidth / 2;
                const assetCenterY = assetImage.naturalHeight / 2;

                const transformedHull = hullPoints.map(p => {
                    const localX = (p.x - assetCenterX);
                    const localY = (p.y - assetCenterY);
                    const rotatedX = (localX * cos - localY * sin) * assetScale;
                    const rotatedY = (localX * sin + localY * cos) * assetScale;
                    return { x: asset.position.x + rotatedX, y: asset.position.y + rotatedY };
                });

                const newPolygon = { type: 'smart_object', polygon: transformedHull, autoShadowParentId: asset.id };
                mapData.overlays.push(newPolygon);
            }
        }

        isLightMapDirty = true;
        drawOverlays(mapData.overlays);
    }

    function removeAutoShadow(asset) {
        if (!asset || !asset.id) return;
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !mapData.overlays) return;

        const initialOverlayCount = mapData.overlays.length;
        mapData.overlays = mapData.overlays.filter(o => o.autoShadowParentId !== asset.id);

        if (mapData.overlays.length < initialOverlayCount) {
            console.log(`Removed auto-shadow for asset ID: ${asset.id}`);
            isLightMapDirty = true;
            drawOverlays(mapData.overlays);
        }
    }

    function updateAssetPreview(assetToPreview = null) {
        selectedAssetForPreview = null;

        if (assetToPreview) {
            currentAssetPreviewTransform.scale = assetToPreview.scale || 1;
            currentAssetPreviewTransform.rotation = assetToPreview.rotation || 0;
            currentAssetPreviewTransform.opacity = assetToPreview.opacity ?? 1;
        }

        const assetData = assetToPreview || findAssetByPath(selectedAssetPath);

        if (isAssetsMode && assetData && currentMapDisplayData.img) {
            const assetUrl = assetData.url || findAssetByPath(assetData.path)?.url;
            if (!assetUrl) {
                assetPreviewContainer.style.display = 'none';
                return;
            }

            assetPreviewContainer.style.display = 'block';
            autoShadowContainer.style.display = 'flex';
            assetPreviewImage.src = assetUrl;

            assetPreviewImage.onload = () => {
                const assetWidth = assetPreviewImage.naturalWidth;
                const assetHeight = assetPreviewImage.naturalHeight;

                if (assetWidth === 0) return;

                let assetScale;
                if (assetToPreview) {
                    assetScale = assetToPreview.scale || 1;
                } else {
                    const defaultSize = currentMapDisplayData.imgWidth * 0.05;
                    const longestDim = Math.max(assetWidth, assetHeight);
                    assetScale = longestDim > 0 ? defaultSize / longestDim : 1;
                }

                const fitRatio = currentMapDisplayData.ratio;
                const previewWidth = assetWidth * assetScale * fitRatio;
                assetPreviewImage.style.width = `${previewWidth}px`;
                assetPreviewImage.style.height = 'auto';

                const { rotation, opacity } = currentAssetPreviewTransform;
                assetPreviewImage.style.transform = `rotate(${rotation}rad)`;
                assetPreviewImage.style.opacity = opacity;

                if (assetPreviewOpacitySlider) assetPreviewOpacitySlider.value = opacity;
                if (assetPreviewOpacityValue) assetPreviewOpacityValue.textContent = opacity.toFixed(1);

                const showChainSlider = (activeAssetTool === 'chain') || (isAutoShadowActive && autoShadowMode === 'wall');
                if (showChainSlider) {
                    updateChainPointsVisuals();
                }
            };
            if (assetPreviewImage.complete) {
                assetPreviewImage.onload();
            }

            const path = assetData.path || selectedAssetPath;
            assetPreviewTitle.textContent = path.substring(path.lastIndexOf('/') + 1);

            const showChainSlider = (activeAssetTool === 'chain') || (isAutoShadowActive && autoShadowMode === 'wall');
            if (assetChainPointsSliderContainer && assetChainStartPoint && assetChainEndPoint) {
                assetChainPointsSliderContainer.style.display = showChainSlider ? 'block' : 'none';
                assetChainStartPoint.style.display = showChainSlider ? 'block' : 'none';
                assetChainEndPoint.style.display = showChainSlider ? 'block' : 'none';
            }

        } else {
            assetPreviewContainer.style.display = 'none';
            if (autoShadowContainer) autoShadowContainer.style.display = 'none';
            assetPreviewImage.src = '';
            assetPreviewImage.style.width = 'auto';
            assetPreviewImage.style.height = 'auto';
            assetPreviewImage.style.transform = 'none';
            assetPreviewTitle.textContent = '';
            if (assetChainPointsSliderContainer) assetChainPointsSliderContainer.style.display = 'none';
            if (assetChainStartPoint) assetChainStartPoint.style.display = 'none';
            if (assetChainEndPoint) assetChainEndPoint.style.display = 'none';
        }

        // This part is for caching the full Image object for drawing on canvas later
        const assetForSizing = findAssetByPath(selectedAssetPath);
        if (assetForSizing && assetForSizing.url) {
            if (!assetImageCache[assetForSizing.path]) {
                assetImageCache[assetForSizing.path] = new Image();
                assetImageCache[assetForSizing.path].src = assetForSizing.url;
            }
            selectedAssetForPreview = assetImageCache[assetForSizing.path];
        }
    }

    dmCanvas.addEventListener('mouseup', (event) => {
        if (event.button !== 0) return;

        if (isSelecting) {
            isSelecting = false;
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (selectedMapData && selectedMapData.overlays && selectionBox) {
                const { scale, originX, originY } = selectedMapData.transform;
                const selectionRect = {
                    x1: (Math.min(selectionBox.startX, selectionBox.endX) - originX) / scale,
                    y1: (Math.min(selectionBox.startY, selectionBox.endY) - originY) / scale,
                    x2: (Math.max(selectionBox.startX, selectionBox.endX) - originX) / scale,
                    y2: (Math.max(selectionBox.startY, selectionBox.endY) - originY) / scale
                };

                const assetsInBox = selectedMapData.overlays.filter(overlay => {
                    if (overlay.type !== 'placedAsset') return false;
                    return overlay.position.x >= selectionRect.x1 && overlay.position.x <= selectionRect.x2 &&
                           overlay.position.y >= selectionRect.y1 && overlay.position.y <= selectionRect.y2;
                });

                if (!event.shiftKey) {
                    selectedPlacedAssets = assetsInBox;
                } else {
                    assetsInBox.forEach(asset => {
                        if (!selectedPlacedAssets.includes(asset)) {
                            selectedPlacedAssets.push(asset);
                        }
                    });
                }
            }
            selectionBox = null;
            const lastSelected = selectedPlacedAssets.length > 0 ? selectedPlacedAssets[selectedPlacedAssets.length - 1] : null;
            if (lastSelected) {
                selectedAssetPath = lastSelected.path;
            }
            updateAssetPreview(lastSelected);
            renderAssetExplorer();
            displayMapOnCanvas(selectedMapFileName); // Redraw to remove marquee and show selections
            updateAssetTools();
        }


        if (isChaining) {
            isChaining = false;
            lastStampedAssetEndpoint = null;
            // The ghost preview is already cleared by the mousemove handler not running.
            // We just need to ensure the final state of the overlays is drawn.
            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            }
        }

        if (isDraggingAssetHandle) {
            isDraggingAssetHandle = false;
            draggedHandleInfo = null;
            mapContainer.style.cursor = 'grab';
             if (activeAssetTool === 'select') {
                mapContainer.style.cursor = 'pointer';
            }
        }

        if (isDraggingAsset) {
            isDraggingAsset = false;
            draggedAssetInfo = null;
            mapContainer.style.cursor = 'grab';
            if (activeAssetTool === 'select') {
                mapContainer.style.cursor = 'pointer';
            }
        }

        if (isDraggingToken) {
            isDraggingToken = false;
            draggedToken = null;
            requestFogOfWarUpdate();
            sendInitiativeDataToPlayerView();
        }

        if (isMovingPolygon && polygonBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            polygonBeingMoved.overlayRef.polygon = polygonBeingMoved.originalPoints.map(p => ({
                x: p.x + finalDeltaX,
                y: p.y + finalDeltaY
            }));
            console.log(`Polygon moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Polygon moved to new position.`);
            resetAllInteractiveStates();
        } else if (isMovingNote && noteBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            noteBeingMoved.overlayRef.position = {
                x: noteBeingMoved.originalPosition.x + finalDeltaX,
                y: noteBeingMoved.originalPosition.y + finalDeltaY
            };
            console.log(`Note moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Note moved to new position.`);
            resetAllInteractiveStates();
        } else if (isMovingCharacter && characterBeingMoved && moveStartPoint) {
            const finalDeltaX = currentDragOffsets.x;
            const finalDeltaY = currentDragOffsets.y;
            characterBeingMoved.overlayRef.position = {
                x: characterBeingMoved.originalPosition.x + finalDeltaX,
                y: characterBeingMoved.originalPosition.y + finalDeltaY
            };
            console.log(`Character moved. Final delta: {x: ${finalDeltaX}, y: ${finalDeltaY}}.`);
            alert(`Character moved to new position.`);
            resetAllInteractiveStates();
        }
    });

    function enableRename(listItem, textNode) {
        const currentName = textNode.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.classList.add('rename-input-active');
        input.addEventListener('blur', () => finishRename(listItem, textNode, input, currentName));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                textNode.textContent = currentName;
                listItem.replaceChild(textNode, input);
            }
        });

        listItem.replaceChild(input, textNode);
        input.focus();
        input.select();
    }

    function finishRename(listItem, textNode, input, originalName) {
        const newName = input.value.trim();
        if (newName && newName !== originalName) {
            if (displayedFileNames.has(newName)) {
                alert(`A map with the name "${newName}" already exists. Please choose a different name.`);
                textNode.textContent = originalName;
                listItem.replaceChild(textNode, input);
            } else {
                textNode.textContent = newName;
                listItem.dataset.fileName = newName;
                displayedFileNames.delete(originalName);
                displayedFileNames.add(newName);

                const mapDataEntry = detailedMapData.get(originalName);
                if (mapDataEntry) {
                    mapDataEntry.name = newName;
                    detailedMapData.delete(originalName);
                    detailedMapData.set(newName, mapDataEntry);

                    let displayedMapLinksUpdated = false;

                    detailedMapData.forEach(dmEntry => {
                        if (dmEntry.overlays && dmEntry.overlays.length > 0) {
                            dmEntry.overlays.forEach(overlay => {
                                if (overlay.type === 'childMapLink' && overlay.linkedMapName === originalName) {
                                    overlay.linkedMapName = newName;
                                    console.log(`DM Overlay: Map '${dmEntry.name}' link to '${originalName}' changed to '${newName}'.`);
                                    if (dmEntry.name === selectedMapFileName && selectedMapFileName !== newName) {
                                        displayedMapLinksUpdated = true;
                                    }
                                }
                            });
                        }
                    });

                    let selectionUpdated = false;
                    if (selectedMapFileName === originalName) {
                        selectedMapFileName = newName;
                        selectionUpdated = true;
                    }

                    if (selectionUpdated || displayedMapLinksUpdated) {
                        if (selectedMapFileName) {
                            console.log(`Redrawing canvas for: ${selectedMapFileName} (Selection updated: ${selectionUpdated}, Links updated: ${displayedMapLinksUpdated})`);
                            displayMapOnCanvas(selectedMapFileName);
                        }
                    }
                    updateButtonStates();
                }
                listItem.replaceChild(textNode, input);
            }
        } else {
            textNode.textContent = originalName;
            listItem.replaceChild(textNode, input);
        }
    }


    if (editMapsIcon) {
        editMapsIcon.addEventListener('click', () => {
            isEditMode = !isEditMode;
            mapsList.classList.toggle('edit-mode-active', isEditMode);
            const mapItems = mapsList.querySelectorAll('li');
            mapItems.forEach(item => {
                item.classList.toggle('clickable-map', !isEditMode);
                let actionsSpan = item.querySelector('.file-actions');
                if (!actionsSpan && isEditMode) {
                    actionsSpan = document.createElement('span');
                    actionsSpan.classList.add('file-actions');
                    actionsSpan.style.marginLeft = '10px';

                    const renameIcon = document.createElement('span');
                    renameIcon.textContent = '✏️';
                    renameIcon.classList.add('file-action-icon', 'rename-map');
                    renameIcon.title = 'Rename map';
                    renameIcon.style.cursor = 'pointer';
                    renameIcon.style.marginRight = '5px';
                    renameIcon.onclick = () => {
                        const textNode = Array.from(item.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                        if (textNode) enableRename(item, textNode);
                    };

                    const deleteIcon = document.createElement('span');
                    deleteIcon.textContent = '🗑️';
                    deleteIcon.classList.add('file-action-icon', 'delete-map');
                    deleteIcon.title = 'Delete map';
                    deleteIcon.style.cursor = 'pointer';
                    deleteIcon.onclick = () => handleDelete(item);

                    const upIcon = document.createElement('span');
                    upIcon.textContent = '↑';
                    upIcon.classList.add('file-action-icon', 'move-map-up');
                    upIcon.title = 'Move up';
                    upIcon.style.cursor = 'pointer';
                    upIcon.style.marginRight = '5px';
                    upIcon.onclick = () => moveItemUp(item);

                    const downIcon = document.createElement('span');
                    downIcon.textContent = '↓';
                    downIcon.classList.add('file-action-icon', 'move-map-down');
                    downIcon.title = 'Move down';
                    downIcon.style.cursor = 'pointer';
                    downIcon.onclick = () => moveItemDown(item);

                    actionsSpan.appendChild(renameIcon);
                    actionsSpan.appendChild(upIcon);
                    actionsSpan.appendChild(downIcon);
                    actionsSpan.appendChild(deleteIcon);
                    item.appendChild(actionsSpan);
                }
                if (actionsSpan) {
                    actionsSpan.style.display = isEditMode ? 'inline' : 'none';
                }
                updateMoveIconVisibility(mapsList);
                const activeInput = item.querySelector('.rename-input-active');
                if (!isEditMode && activeInput) {
                    const originalName = item.dataset.fileName;
                    const textNode = document.createTextNode(originalName);
                    item.replaceChild(textNode, activeInput);
                    if (actionsSpan) item.insertBefore(textNode, actionsSpan);
                }
            });
            editMapsIcon.textContent = isEditMode ? '✅' : '✏️';
        });
    }

    if (uploadMapsInput && mapsList) {
        uploadMapsInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (!files) {
                return;
            }

            for (const file of files) {
                if (!displayedFileNames.has(file.name)) {
                    const listItem = document.createElement('li');

                    listItem.dataset.fileName = file.name;
                    listItem.classList.add('map-list-item');

                    const textNode = document.createTextNode(file.name);

                    listItem.appendChild(textNode);

                    mapsList.appendChild(listItem);
                    displayedFileNames.add(file.name);

                    const objectURL = URL.createObjectURL(file);
                    detailedMapData.set(file.name, {
                        url: objectURL,
                        name: file.name,
                        overlays: [],
                        mode: 'edit',
                        transform: { scale: 1, originX: 0, originY: 0, initialized: false },
                        fogOfWarDataUrl: null
                    });

                    if (!isEditMode) {
                        listItem.classList.add('clickable-map');
                    }

                    if (isEditMode) {
                        const actionsSpan = document.createElement('span');
                        actionsSpan.classList.add('file-actions');
                        actionsSpan.style.marginLeft = '10px';
                        actionsSpan.style.display = 'inline';

                        const renameIcon = document.createElement('span');
                        renameIcon.textContent = '✏️';
                        renameIcon.classList.add('file-action-icon', 'rename-map');
                        renameIcon.title = 'Rename map';
                        renameIcon.style.cursor = 'pointer';
                        renameIcon.style.marginRight = '5px';
                        renameIcon.onclick = () => {
                            const textNode = Array.from(listItem.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                            if (textNode) enableRename(listItem, textNode);
                        };

                        const deleteIcon = document.createElement('span');
                        deleteIcon.textContent = '🗑️';
                        deleteIcon.classList.add('file-action-icon', 'delete-map');
                        deleteIcon.title = 'Delete map';
                        deleteIcon.style.cursor = 'pointer';
                        deleteIcon.onclick = () => handleDelete(listItem);

                        const upIcon = document.createElement('span');
                        upIcon.textContent = '↑';
                        upIcon.classList.add('file-action-icon', 'move-map-up');
                        upIcon.title = 'Move up';
                        upIcon.style.cursor = 'pointer';
                        upIcon.style.marginRight = '5px';
                        upIcon.onclick = () => moveItemUp(listItem);

                        const downIcon = document.createElement('span');
                        downIcon.textContent = '↓';
                        downIcon.classList.add('file-action-icon', 'move-map-down');
                        downIcon.title = 'Move down';
                        downIcon.style.cursor = 'pointer';
                        downIcon.onclick = () => moveItemDown(listItem);

                        actionsSpan.appendChild(renameIcon);
                        actionsSpan.appendChild(upIcon);
                        actionsSpan.appendChild(downIcon);
                        actionsSpan.appendChild(deleteIcon);
                        listItem.appendChild(actionsSpan);
                        updateMoveIconVisibility(mapsList);
                    }
                }
            }
            event.target.value = null;
            updateMoveIconVisibility(mapsList);
        });
    } else {
        console.error('Could not find the upload input or the list element. Check IDs.');
    }

    mapsList.addEventListener('click', (event) => {
        if (isEditMode) {
            return;
        }

        let targetItem = event.target;
        while (targetItem && targetItem.tagName !== 'LI' && targetItem !== mapsList) {
            targetItem = targetItem.parentNode;
        }

        if (targetItem && targetItem.tagName === 'LI' && targetItem.classList.contains('map-list-item')) {
            const clickedFileName = targetItem.dataset.fileName;
            if (clickedFileName) {
                const selectedMapData = detailedMapData.get(selectedMapFileName);

                if (isChangingChildMapForPolygon && selectedPolygonForContextMenu && selectedMapData && selectedMapData.mode === 'edit') {
                    const { overlay, index, parentMapName } = selectedPolygonForContextMenu;
                    if (parentMapName === clickedFileName) {
                        alert("Cannot link a map to itself as a child. Please select a different map.");
                        return;
                    }
                    const parentMapData = detailedMapData.get(parentMapName);
                    if (parentMapData && parentMapData.overlays[index] === overlay) {
                        const oldLinkedMapName = overlay.linkedMapName;
                        parentMapData.overlays[index].linkedMapName = clickedFileName;
                        alert(`Child map for the selected polygon on "${parentMapName}" changed from "${oldLinkedMapName}" to "${clickedFileName}".`);
                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                    } else {
                        alert("An error occurred while trying to change the child map. Please try again.");
                    }
                    isChangingChildMapForPolygon = false;
                    selectedPolygonForContextMenu = null;
                } else if (isLinkingChildMap && polygonDrawingComplete && selectedMapData && selectedMapData.mode === 'edit') {
                    if (selectedMapFileName === clickedFileName) {
                        alert("Cannot link a map to itself. Please select a different map to be the child.");
                        return;
                    }

                    const parentMapData = detailedMapData.get(selectedMapFileName);
                    if (parentMapData) {
                        const newOverlay = {
                            type: 'childMapLink',
                            polygon: [...currentPolygonPoints],
                            linkedMapName: clickedFileName,
                            playerVisible: false
                        };
                        parentMapData.overlays.push(newOverlay);
                        alert(`Map "${clickedFileName}" successfully linked as a new child to "${parentMapData.name}".`);

                        const drawingCtx = drawingCanvas.getContext('2d');
                        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                        resetAllInteractiveStates();
                        displayMapOnCanvas(selectedMapFileName);
                    } else {
                        alert("Error: Could not find data for the parent map. Linking failed.");
                        resetAllInteractiveStates();
                    }
                } else {
                    if (selectedMapFileName === clickedFileName) {
                        // Re-clicked the same map, so reset the view
                        const mapData = detailedMapData.get(clickedFileName);
                        if (mapData && mapData.transform) {
                            mapData.transform.initialized = false;
                            displayMapOnCanvas(clickedFileName);
                            if (mapData.mode === 'view') {
                                sendMapToPlayerView(clickedFileName);
                            }
                        }
                        hasDeviatedFromAutomation = true;
                        updatePreviousButtonState();
                        return;
                    }

                    if (selectedMapFileName !== null && selectedMapFileName !== clickedFileName) {
                        resetAllInteractiveStates();
                    }
                    selectedMapFileName = clickedFileName;

                    clearAllSelections();
                    targetItem.classList.add('selected-map-item');

                    displayMapOnCanvas(clickedFileName);
                    updateButtonStates();

                    const newSelectedMapData = detailedMapData.get(clickedFileName);
                    if (newSelectedMapData) {
                        modeToggleSwitch.checked = newSelectedMapData.mode === 'view';
                        modeToggleSwitch.disabled = false;
                        if (newSelectedMapData.mode === 'view') {
                            sendMapToPlayerView(clickedFileName);
                        }
                    } else {
                        modeToggleSwitch.disabled = true;
                    }
                    hasDeviatedFromAutomation = true;
                    updatePreviousButtonState();
                }
            }
        }
    });

    if (modeToggleSwitch) {
        modeToggleSwitch.addEventListener('change', () => {
            if (!selectedMapFileName) return;
            const selectedMapData = detailedMapData.get(selectedMapFileName);
            if (selectedMapData) {
                selectedMapData.mode = modeToggleSwitch.checked ? 'view' : 'edit';
                console.log(`Map '${selectedMapFileName}' mode changed to ${selectedMapData.mode}`);
                displayMapOnCanvas(selectedMapFileName);
                updateButtonStates();
                if (selectedMapData.mode === 'view') {
                    resetAllInteractiveStates(); // This handles closing all tools
                    sendMapToPlayerView(selectedMapFileName);
                    toggleShadowAnimation(true);
                } else {
                    triggerSlideshow();
                    toggleShadowAnimation(false);
                }
                hasDeviatedFromAutomation = true;
                updatePreviousButtonState();
            }
        });
    }

    function clearAllSelections() {
        const allMapItems = document.querySelectorAll('#maps-list li');
        allMapItems.forEach(item => item.classList.remove('selected-map-item'));
    }

    if (dmCanvas && mapContainer) {
        window.addEventListener('resize', debounce(resizeCanvas, 250));

        mapContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;

            if (activeAssetTool) {
                // If an asset tool is active, we don't want to start a pan.
                // The event will fall through to the canvas listeners for selection/stamping.
            } else if (activeShadowTool === 'erase') {
                isDrawing = true;
                e.preventDefault(); // Prevent other actions like panning
                return;
            }

            const imageCoords = getRelativeCoords(e.offsetX, e.offsetY);
            if (!imageCoords) return;

            // Priority 1: Check for token drag
            for (let i = initiativeTokens.length - 1; i >= 0; i--) {
                const token = initiativeTokens[i];
                if (isPointInToken(imageCoords, token)) {
                    isDraggingToken = true;
                    draggedToken = token;
                    dragStartX = imageCoords.x;
                    dragStartY = imageCoords.y;
                    e.preventDefault();
                    return; // Token found, stop further processing
                }
            }

            // Priority 2: Check for overlay move (polygons, notes, etc.)
            if (isMovingPolygon && polygonBeingMoved) {
                if (isPointInPolygon(imageCoords, polygonBeingMoved.originalPoints.map(p => ({
                    x: p.x + currentDragOffsets.x,
                    y: p.y + currentDragOffsets.y
                })))) {
                    moveStartPoint = imageCoords;
                    moveStartPoint.x -= currentDragOffsets.x;
                    moveStartPoint.y -= currentDragOffsets.y;
                    e.preventDefault();
                    return;
                }
            } else if (isMovingNote && noteBeingMoved) {
                if (isPointInNoteIcon(imageCoords, noteBeingMoved.overlayRef)) {
                    moveStartPoint = imageCoords;
                    moveStartPoint.x -= currentDragOffsets.x;
                    moveStartPoint.y -= currentDragOffsets.y;
                    e.preventDefault();
                    return;
                }
            } else if (isMovingCharacter && characterBeingMoved) {
                if (isPointInCharacterIcon(imageCoords, characterBeingMoved.overlayRef)) {
                    moveStartPoint = imageCoords;
                    moveStartPoint.x -= currentDragOffsets.x;
                    moveStartPoint.y -= currentDragOffsets.y;
                    e.preventDefault();
                    return;
                }
            }

            // If nothing else was clicked, start panning the map
            const mapData = detailedMapData.get(selectedMapFileName);
            if (!mapData) return;

            if (!activeAssetTool && !isGridToolActive) { // Prevent panning if an asset tool or grid tool is active
                isPanning = true;
                panStartX = e.clientX - mapData.transform.originX;
                panStartY = e.clientY - mapData.transform.originY;
                mapContainer.style.cursor = 'grabbing';
            }
        });

        mapContainer.addEventListener('mouseup', (e) => {
            if (e.button !== 0) return;
            if (activeShadowTool === 'erase') {
                isDrawing = false;
            }
            isPanning = false;
            mapContainer.style.cursor = 'grab';
        });

        dmCanvas.addEventListener('mouseout', (event) => {
            if (isChaining) {
                isChaining = false;
                lastStampedAssetEndpoint = null;
                const drawingCtx = drawingCanvas.getContext('2d');
                drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            }
        });

        mapContainer.addEventListener('mouseleave', () => {
            isPanning = false;
            mapContainer.style.cursor = 'grab';
        });

        mapContainer.addEventListener('wheel', (e) => {
            if (activeAssetTool) return; // Prevent zooming if an asset tool is active
            e.preventDefault();
            const mapData = detailedMapData.get(selectedMapFileName);
            if (!mapData) return;

            const transform = mapData.transform;
            const zoomAmount = -e.deltaY * 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale + zoomAmount), 10.0);

            const rect = mapContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            transform.originX = mouseX - (mouseX - transform.originX) * (newScale / transform.scale);
            transform.originY = mouseY - (mouseY - transform.originY) * (newScale / transform.scale);
            transform.scale = newScale;

            isLightMapDirty = true;
            displayMapOnCanvas(selectedMapFileName);
            sendMapTransformToPlayerView(transform);
        });

    function drawEraserCircle() {
        const ctx = drawingCanvas.getContext('2d');
        const radius = 15; // Eraser radius in pixels
        ctx.beginPath();
        ctx.arc(eraserPosition.canvasX, eraserPosition.canvasY, radius, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

        mapContainer.addEventListener('mousemove', (e) => {
            const imageCoords = getRelativeCoords(e.offsetX, e.offsetY);

            if (isSelecting && selectionBox) {
                selectionBox.endX = e.offsetX;
                selectionBox.endY = e.offsetY;
                requestRedraw(); // Use the lighter redraw function
                return;
            }

            if (isDraggingAsset && draggedAssetInfo) {
                e.stopPropagation();
                if (!imageCoords) return;

                const dx = imageCoords.x - draggedAssetInfo.initialMouseCoords.x;
                const dy = imageCoords.y - draggedAssetInfo.initialMouseCoords.y;

                draggedAssetInfo.initialAssetPositions.forEach(pos => {
                    pos.asset.position.x = pos.x + dx;
                    pos.asset.position.y = pos.y + dy;
                });


                requestRedraw();
                return;
            }

            if (isDraggingAssetHandle && draggedHandleInfo) {
                e.stopPropagation();
                if (!imageCoords) return;

                const { name, initialAsset, initialMouseCoords } = draggedHandleInfo;
                const assetCenter = initialAsset.position;
                const assetToUpdate = selectedPlacedAssets[0];

                if (name === 'rotate') {
                    const initialAngle = Math.atan2(initialMouseCoords.y - assetCenter.y, initialMouseCoords.x - assetCenter.x);
                    const currentAngle = Math.atan2(imageCoords.y - assetCenter.y, imageCoords.x - assetCenter.x);
                    const angleDelta = currentAngle - initialAngle;
                    assetToUpdate.rotation = initialAsset.rotation + angleDelta;
                } else {
                    // Handle uniform scaling based on distance from center
                    const initialDist = Math.sqrt(Math.pow(initialMouseCoords.x - assetCenter.x, 2) + Math.pow(initialMouseCoords.y - assetCenter.y, 2));
                    const currentDist = Math.sqrt(Math.pow(imageCoords.x - assetCenter.x, 2) + Math.pow(imageCoords.y - assetCenter.y, 2));

                    if (initialDist > 0) {
                        const scaleFactor = currentDist / initialDist;
                        let newScale = initialAsset.scale * scaleFactor;

                        // Prevent scaling down to nothing or inverting
                        if (newScale < 0.1) newScale = 0.1;

                        assetToUpdate.scale = newScale;
                    }
                }

                requestRedraw(); // Redraw to show the change
                updateAssetPreview(assetToUpdate); // Update the preview pane in real-time
                return;
            }


            if (isDraggingToken && draggedToken) {
                if (imageCoords) {
                    const dx = imageCoords.x - dragStartX;
                    const dy = imageCoords.y - dragStartY;
                    draggedToken.x += dx;
                    draggedToken.y += dy;
                    dragStartX = imageCoords.x;
                    dragStartY = imageCoords.y;
                    requestFogOfWarUpdate();
                    // Set dirty flag because token positions affect player view lighting
                    isLightMapDirty = true;
                    const mapData = detailedMapData.get(selectedMapFileName);
                    if (mapData) {
                        drawOverlays(mapData.overlays);
                    }
                }
            } else if ((isMovingPolygon && polygonBeingMoved && moveStartPoint) || (isMovingNote && noteBeingMoved && moveStartPoint) || (isMovingCharacter && characterBeingMoved && moveStartPoint)) {
                if (imageCoords) {
                    currentDragOffsets.x = imageCoords.x - moveStartPoint.x;
                    currentDragOffsets.y = imageCoords.y - moveStartPoint.y;
                    // This more direct redraw approach seems to work better for smoother dragging.
                    const mapData = detailedMapData.get(selectedMapFileName);
                    if (mapData) {
                        drawOverlays(mapData.overlays);
                    }
                }
            } else if (isPanning) {
                const mapData = detailedMapData.get(selectedMapFileName);
                if (!mapData) return;
                mapData.transform.originX = e.clientX - panStartX;
                mapData.transform.originY = e.clientY - panStartY;
                isLightMapDirty = true;
                requestRedraw();
                sendMapTransformToPlayerView(mapData.transform);
            } else {
                const imageCoords = getRelativeCoords(e.offsetX, e.offsetY);
                if (!imageCoords) return;

                // Handle stamp preview
                if (activeAssetTool === 'stamp' && selectedAssetForPreview && selectedAssetForPreview.complete) {
                    const selectedMapData = detailedMapData.get(selectedMapFileName);
                    if (!selectedMapData) return;

                    drawOverlays(selectedMapData.overlays); // Redraw permanent overlays

                    const drawingCtx = drawingCanvas.getContext('2d');

                    const assetWidth = selectedAssetForPreview.naturalWidth;
                    const assetHeight = selectedAssetForPreview.naturalHeight;

                    const defaultSize = currentMapDisplayData.imgWidth * 0.05;
                    const longestDim = Math.max(assetWidth, assetHeight);
                    const defaultScale = longestDim > 0 ? defaultSize / longestDim : 1;

                    const finalScale = currentAssetPreviewTransform.scale === 1 ? defaultScale : currentAssetPreviewTransform.scale;
                    const finalRotation = currentAssetPreviewTransform.rotation;
                    const finalOpacity = currentAssetPreviewTransform.opacity;

                    const { scale: mapScale, originX, originY } = selectedMapData.transform;

                    const canvasX = (imageCoords.x * mapScale) + originX;
                    const canvasY = (imageCoords.y * mapScale) + originY;
                    const assetCanvasWidth = assetWidth * finalScale * mapScale;
                    const assetCanvasHeight = assetHeight * finalScale * mapScale;

                    drawingCtx.save();
                    drawingCtx.globalAlpha = 0.5 * finalOpacity;
                    drawingCtx.translate(canvasX, canvasY);
                    drawingCtx.rotate(finalRotation);
                    drawingCtx.drawImage(selectedAssetForPreview, -assetCanvasWidth / 2, -assetCanvasHeight / 2, assetCanvasWidth, assetCanvasHeight);
                    drawingCtx.restore();

                } else {
                     // Update cursor for asset selection mode
                    if (activeAssetTool === 'select' && selectedPlacedAssets.length === 1) {
                        const handleName = getHandleForPoint(imageCoords, selectedPlacedAssets[0]);
                        mapContainer.style.cursor = handleName ? 'grab' : 'pointer';
                    } else if (activeAssetTool === 'select') {
                        mapContainer.style.cursor = 'pointer';
                    }

                    handleMouseMoveOnCanvas(e);
                }
            }
        });
        dmCanvas.addEventListener('mouseout', () => {
            if (hoverLabel) {
                hoverLabel.style.display = 'none';
            }
            // If leaving the canvas while stamping, clear the ghost preview
            if (activeAssetTool === 'stamp') {
                const selectedMapData = detailedMapData.get(selectedMapFileName);
                if (selectedMapData) {
                    drawOverlays(selectedMapData.overlays);
                }
            }
        });
    } else {
        console.error("Could not find DM canvas or map container for initial sizing.");
    }

    function updateButtonStates() {
        const selectedMapData = detailedMapData.get(selectedMapFileName);
        const isEditMode = selectedMapData && selectedMapData.mode === 'edit';
        const inLinkingProcess = isLinkingChildMap || polygonDrawingComplete;

        if (btnLinkChildMap) {
            if (isLinkingChildMap && !polygonDrawingComplete) {
                btnLinkChildMap.textContent = 'Cancel Drawing Link';
                btnLinkChildMap.disabled = false;
            } else if (isLinkingChildMap && polygonDrawingComplete) {
                btnLinkChildMap.textContent = 'Cancel Link - Select Child';
                btnLinkChildMap.disabled = false;
            } else {
                btnLinkChildMap.textContent = 'Link to Child Map';
                btnLinkChildMap.disabled = !isEditMode || inLinkingProcess;
            }
        }

        const btnLinkNote = document.getElementById('btn-link-note');
        if (btnLinkNote) btnLinkNote.disabled = !isEditMode || inLinkingProcess;
        const btnLinkCharacter = document.getElementById('btn-link-character');
        if (btnLinkCharacter) btnLinkCharacter.disabled = !isEditMode || inLinkingProcess;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    updateButtonStates();

    renderNotesList();
    renderCharactersList();

    const saveCampaignButton = document.getElementById('save-campaign-button');
    const loadCampaignInput = document.getElementById('load-campaign-input');


    async function saveCampaign() {
        if (!isCampaignTimerPaused) {
            toggleCampaignTimer(); // Pause the timer
            alert("Campaign timer has been automatically paused for the save operation.");
        }

        confirmSaveButton.textContent = 'Saving...';
        confirmSaveButton.disabled = true;

        try {
            const zip = new JSZip();
            const campaignData = {};

            const saveAssetsCheckbox = document.getElementById('save-assets-checkbox');
            if (saveAssetsCheckbox && saveAssetsCheckbox.checked && Object.keys(assetsByPath).length > 0) {
                const assetsFolder = zip.folder("assets");
                const assetFiles = [];

                function findAssetFiles(level) {
                    for (const name in level) {
                        const item = level[name];
                        if (item.type === 'file') {
                            assetFiles.push(item);
                        } else if (item.type === 'folder') {
                            findAssetFiles(item.children);
                        }
                    }
                }
                findAssetFiles(assetsByPath);

                assetFiles.forEach(asset => {
                    if (asset.file) {
                        assetsFolder.file(asset.path, asset.file);
                    }
                });

                const serializableAssetsByPath = JSON.parse(JSON.stringify(assetsByPath, (key, value) => {
                    if (key === 'file' || key === 'url') return undefined;
                    return value;
                }));
                campaignData.assets = serializableAssetsByPath;
                campaignData.assetFavorites = assetFavorites;
            }

            // 1. Handle Maps & Map Links
            if (saveMapsCheckbox.checked) {
                const imagesFolder = zip.folder("images");
                const imagePromises = [];
                for (const [name, data] of detailedMapData.entries()) {
                    if (data.url) {
                        const promise = fetch(data.url)
                            .then(response => response.blob())
                            .then(blob => {
                                imagesFolder.file(name, blob);
                            })
                            .catch(err => console.error(`Failed to fetch and zip map ${name}:`, err));
                        imagePromises.push(promise);
                    }
                }
                await Promise.all(imagePromises);

                const serializableDetailedMapData = {};
                for (const [name, data] of detailedMapData) {
                    serializableDetailedMapData[name] = {
                        name: data.name,
                        overlays: data.overlays,
                        mode: data.mode,
                        transform: data.transform,
                        fogOfWarDataUrl: data.fogOfWarDataUrl,
                        grid: gridData[name] || null
                    };
                }
                campaignData.mapDefinitions = serializableDetailedMapData;
            }

            // 2. Handle Characters
            if (saveCharactersCheckbox.checked) {
                const charactersFolder = zip.folder("characters");
                if (activeInitiative.length > 0) {
                    activeInitiative.forEach(activeChar => {
                        // Only sync back HP from the original character, not from token copies.
                        if (!activeChar.isTokenCopy) {
                            const mainChar = charactersData.find(c => c.id === activeChar.id);
                            if (mainChar) {
                                if (!mainChar.sheetData) mainChar.sheetData = {};
                                mainChar.sheetData.hp_current = activeChar.sheetData.hp_current;
                                mainChar.savedRolls = activeChar.savedRolls;
                            }
                        }
                    });
                }

                const charactersToSave = JSON.parse(JSON.stringify(charactersData));
                charactersToSave.forEach(character => {
                    const originalCharacter = charactersData.find(c => c.id === character.id);
                    if (originalCharacter && originalCharacter.pdfData && originalCharacter.pdfFileName) {
                        charactersFolder.file(originalCharacter.pdfFileName, originalCharacter.pdfData);
                        delete character.pdfData;
                    }
                });
                campaignData.characters = charactersToSave;
                campaignData.selectedCharacterId = selectedCharacterId;
            }

            // 3. Handle Notes
            if (saveNotesCheckbox.checked) {
                campaignData.notes = notesData;
                campaignData.selectedNoteId = selectedNoteId;
            }

            // 4. Handle Initiative
            if (saveInitiativeCheckbox.checked) {
                campaignData.savedInitiatives = savedInitiatives;
                campaignData.initiativeTokens = initiativeTokens;
                campaignData.mapIconSize = mapIconSize;
                campaignData.activeInitiative = activeInitiative;
                campaignData.initiativeTurn = initiativeTurn;
                campaignData.initiativeRound = initiativeRound;
                campaignData.gameTime = gameTime;
                campaignData.initiativeStartTime = initiativeStartTime ? Date.now() - initiativeStartTime : null;
                campaignData.isWandering = isWandering;
            }

            // 5. Handle Rolls & History
            if (saveRollsCheckbox.checked) {
                campaignData.diceRollHistory = diceRollHistory;
                campaignData.savedRolls = savedRolls;
            }

            // 6. Handle Campaign Timer
            if (saveTimerCheckbox.checked) {
                campaignData.campaignTime = campaignTime;
            }

            // 7. Handle Audio Recordings
            if (saveAudioCheckbox.checked && audioBlobs.length > 0) {
                const audioFolder = zip.folder("audio");
                audioBlobs.forEach(audio => {
                    audioFolder.file(audio.name, audio.blob);
                });
            }

            // 8. Handle Story Beats
            if (saveStoryBeatsCheckbox.checked) {
                const automationCanvas = document.getElementById('automation-canvas');
                if (automationCanvas) {
                    automationCanvasData = Array.from(automationCanvas.children).map(card => {
                        const label = card.querySelector('.automation-card-label');
                        return {
                            cardClass: card.className,
                            dataset: { ...card.dataset },
                            labelText: label ? label.textContent : ''
                        };
                    });
                }

                campaignData.storyTree = {
                    quests: quests,
                    nextQuestId: nextQuestId,
                    selectedQuestId: selectedQuestId,
                    automationCanvasData: automationCanvasData,
                    automationBranches: automationBranches,
                    isAutomationActive: automationActiveControls.style.display === 'flex',
                    automationHistory: automationHistory,
                    lastAutomationCardId: lastAutomationCard ? lastAutomationCard.dataset.cardId : null
                };
            }

            // 9. Handle Custom Quotes
            if (saveQuotesCheckbox.checked && quoteMap) {
                campaignData.quoteMap = quoteMap;
            }

            // 10. Handle Settings
            campaignData.settings = {
                dmRenderQuality: dmRenderQuality,
                playerRenderQuality: playerRenderQuality,
                mapIconSize: mapIconSize // Also save this here
            };

            const campaignJSON = JSON.stringify(campaignData, null, 2);
            zip.file("campaign.json", campaignJSON);

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;

            const date = new Date();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            a.download = `DnDemicube_campaign_${month}-${day}-${year}.zip`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("Campaign saved successfully to zip.");
            alert("Campaign saved successfully!");

        } catch (error) {
            console.error("Error saving campaign to zip:", error);
            alert("An error occurred while saving the campaign. Please check the console for details.");
        } finally {
            confirmSaveButton.textContent = 'Save';
            confirmSaveButton.disabled = false;
        }
    }

    function restoreInitiativeState(campaignData) {
        isWandering = campaignData.isWandering || false;
        if (isWandering) {
            wanderButton.textContent = 'Stop Wandering';
        }

        activeInitiative = campaignData.activeInitiative || [];
        initiativeTurn = campaignData.initiativeTurn ?? -1;
        initiativeRound = campaignData.initiativeRound || 0;
        gameTime = campaignData.gameTime || 0;

        if (initiativeTurn > -1 && campaignData.initiativeStartTime) {
            initiativeStartTime = Date.now() - campaignData.initiativeStartTime;
            realTimeInterval = setInterval(updateRealTimeTimer, 1000);
            initiativeTimers.style.display = 'flex';
            updateGameTimeTimer();
            startInitiativeButton.textContent = 'Stop Initiative';
            nextTurnButton.style.display = 'inline-block';
            prevTurnButton.style.display = 'inline-block';
        }
    }

    function isDeepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
            return obj1 === obj2;
        }
        if (obj1.constructor !== obj2.constructor) return false;

        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!isDeepEqual(obj1[i], obj2[i])) return false;
            }
            return true;
        }

        if (obj1 instanceof Object) {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;
            for (const key of keys1) {
                if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) return false;
            }
            return true;
        }

        return false;
    }


    async function loadCampaign(event) {
        const file = event.target.files[0];
        if (!file) return;

        const loadButtonLabel = document.querySelector('label[for="load-campaign-input"]');
        loadButtonLabel.textContent = 'Loading...';
        loadCampaignInput.disabled = true;

        try {
            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                const campaignFile = zip.file("campaign.json");
                if (!campaignFile) throw new Error("campaign.json not found in the zip file.");

                const campaignJSON = await campaignFile.async("string");
                const campaignData = JSON.parse(campaignJSON);

                await showLoadOptionsModal(zip, campaignData);
            } else if (file.name.endsWith('.json')) {
                await loadFromJson(file);
                alert("Legacy JSON campaign loaded successfully.");
                renderAllLists();
                if (selectedCharacterId) loadCharacterIntoEditor(selectedCharacterId);
                if (selectedNoteId) loadNoteIntoEditor(selectedNoteId);
            } else {
                throw new Error("Unsupported file type. Please select a .zip or .json file.");
            }
        } catch (error) {
            console.error("Error preparing campaign load:", error);
            alert(`Failed to prepare campaign for loading: ${error.message}`);
        } finally {
            loadButtonLabel.textContent = 'Load Campaign';
            loadCampaignInput.disabled = false;
            loadCampaignInput.value = null;
        }
    }

    async function showLoadOptionsModal(zip, campaignData) {
        loadOptionsContainer.innerHTML = ''; // Clear previous options
        const availableData = {};

        const dataTypeMapping = {
            mapDefinitions: "Maps & Map Links",
            characters: "Characters",
            notes: "Notes",
            savedInitiatives: "Initiative",
            diceRollHistory: "Dice Rolls & History",
            campaignTime: "Campaign Timer",
            audio: "Audio Recordings",
            storyTree: "Story Beats",
            quoteMap: "Character Quotes",
            assets: "Assets"
        };

        for (const key in dataTypeMapping) {
            let dataExists = false;
            if (key === 'audio') {
                const audioFolder = zip.folder("audio");
                dataExists = audioFolder && audioFolder.filter((_, file) => !file.dir).length > 0;
            } else {
                dataExists = campaignData.hasOwnProperty(key) && campaignData[key] !== null && (!Array.isArray(campaignData[key]) || campaignData[key].length > 0);
            }

            if (dataExists) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `load-${key}-checkbox`;
                checkbox.name = key;
                checkbox.value = key;
                checkbox.checked = true;

                const label = document.createElement('label');
                label.htmlFor = `load-${key}-checkbox`;
                label.textContent = ` ${dataTypeMapping[key]}`;

                const div = document.createElement('div');
                div.appendChild(checkbox);
                div.appendChild(label);
                loadOptionsContainer.appendChild(div);
                availableData[key] = true;
            }
        }

        if (Object.keys(availableData).length === 0) {
            alert("The selected campaign file appears to be empty.");
            return;
        }

        loadCampaignModal.style.display = 'block';

        const handleConfirm = async () => {
            const selectedOptions = {};
            loadOptionsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                selectedOptions[checkbox.name] = checkbox.checked;
            });

            await mergeCampaignData(zip, campaignData, selectedOptions);
            loadCampaignModal.style.display = 'none';
            confirmLoadButton.removeEventListener('click', handleConfirm);
            cancelLoadButton.removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            loadCampaignModal.style.display = 'none';
            confirmLoadButton.removeEventListener('click', handleConfirm);
            cancelLoadButton.removeEventListener('click', handleCancel);
        };

        confirmLoadButton.addEventListener('click', handleConfirm);
        cancelLoadButton.addEventListener('click', handleCancel);
        loadCampaignModalCloseButton.addEventListener('click', handleCancel);
    }


    async function mergeCampaignData(zip, campaignData, selectedOptions) {
        try {
            const loadAssetsCheckbox = document.getElementById('load-assets-checkbox');
            if (loadAssetsCheckbox && loadAssetsCheckbox.checked && campaignData.assets) {
                assetsByPath = campaignData.assets;
                assetFavorites = campaignData.assetFavorites || {};
                const assetsFolder = zip.folder("assets");
                if (assetsFolder) {
                    const assetPromises = [];

                    function restoreAssetUrls(level) {
                        for (const name in level) {
                            const item = level[name];
                            if (item.type === 'file') {
                                const fileInZip = assetsFolder.file(item.path);
                                if (fileInZip) {
                                    const promise = fileInZip.async("blob").then(blob => {
                                        item.url = URL.createObjectURL(blob);
                                        item.file = new File([blob], name, { type: blob.type });
                                    });
                                    assetPromises.push(promise);
                                }
                            } else if (item.type === 'folder') {
                                restoreAssetUrls(item.children);
                            }
                        }
                    }
                    restoreAssetUrls(assetsByPath);
                    await Promise.all(assetPromises);
                }
            }
            // Merge Characters
            if (selectedOptions.characters && campaignData.characters) {
                const characterPromises = [];
                const charactersFolder = zip.folder("characters");

                for (const incomingChar of campaignData.characters) {
                    const existingChar = charactersData.find(c => c.id === incomingChar.id);
                    if (!existingChar) {
                        if (!incomingChar.sheetData) incomingChar.sheetData = {};
                        if (typeof incomingChar.sheetData.vision_ft === 'undefined') {
                            incomingChar.sheetData.vision_ft = '60';
                        }
                        if (incomingChar.pdfFileName && charactersFolder) {
                            const pdfFile = charactersFolder.file(incomingChar.pdfFileName);
                            if (pdfFile) {
                                const promise = pdfFile.async("uint8array").then(pdfData => {
                                    incomingChar.pdfData = pdfData;
                                });
                                characterPromises.push(promise);
                            }
                        }
                        charactersData.push(incomingChar);
                    } else {
                        console.log(`Skipping character "${incomingChar.name}" (ID: ${incomingChar.id}) as it already exists.`);
                    }
                }
                await Promise.all(characterPromises);
            }

            // Merge Notes
            if (selectedOptions.notes && campaignData.notes) {
                for (const incomingNote of campaignData.notes) {
                    const existingNote = notesData.find(n => n.id === incomingNote.id);
                    if (!existingNote) {
                        notesData.push(incomingNote);
                    } else {
                         console.log(`Skipping note "${incomingNote.title}" (ID: ${incomingNote.id}) as it already exists.`);
                    }
                }
            }

            // Merge Maps
            if (selectedOptions.mapDefinitions && campaignData.mapDefinitions) {
                const imagePromises = [];
                const imagesFolder = zip.folder("images");

                for (const mapName in campaignData.mapDefinitions) {
                    const definition = campaignData.mapDefinitions[mapName];

                    // Backward compatibility: Ensure smart object polygons are clockwise
                    if (definition.overlays) {
                        definition.overlays.forEach(overlay => {
                            if (overlay.type === 'smart_object' && Array.isArray(overlay.polygon) && overlay.polygon.length > 0) {
                                const area = getPolygonSignedArea(overlay.polygon);
                                if (area > 0) { // It's counter-clockwise, reverse it
                                    overlay.polygon.reverse();
                                }
                            }
                        });
                    }

                    if (!detailedMapData.has(mapName)) {
                        const imageFile = imagesFolder ? imagesFolder.file(mapName) : null;
                        if (imageFile) {
                            const promise = imageFile.async("blob").then(blob => {
                                const url = URL.createObjectURL(blob);
                                detailedMapData.set(mapName, {
                                    name: definition.name,
                                    url: url,
                                    overlays: definition.overlays || [],
                                    mode: definition.mode || 'edit',
                                    transform: definition.transform ? { ...definition.transform, initialized: true } : { scale: 1, originX: 0, originY: 0, initialized: false },
                                    fogOfWarDataUrl: definition.fogOfWarDataUrl || null
                                });
                                if (definition.grid) {
                                    gridData[mapName] = definition.grid;
                                }
                                displayedFileNames.add(mapName);
                            });
                            imagePromises.push(promise);
                        }
                    } else {
                        console.log(`Skipping map "${mapName}" as it already exists.`);
                    }
                }
                await Promise.all(imagePromises);
            }

            // Merge Initiative
            if (selectedOptions.savedInitiatives && campaignData.savedInitiatives) {
                // Overwrite existing initiatives with the same name
                Object.assign(savedInitiatives, campaignData.savedInitiatives);
            }

            // For active initiative, it's better to replace than merge if loaded.
            if (selectedOptions.savedInitiatives && campaignData.activeInitiative) {
                activeInitiative = campaignData.activeInitiative || [];
                initiativeTurn = campaignData.initiativeTurn ?? -1;
                initiativeRound = campaignData.initiativeRound || 0;
                gameTime = campaignData.gameTime || 0;
                initiativeStartTime = campaignData.initiativeStartTime ? Date.now() - campaignData.initiativeStartTime : null;
                isWandering = campaignData.isWandering || false;
                initiativeTokens = campaignData.initiativeTokens || [];
                mapIconSize = campaignData.mapIconSize || 5;
                if (mapIconSizeSlider) mapIconSizeSlider.value = mapIconSize;
                if (mapIconSizeValue) mapIconSizeValue.textContent = `${mapIconSize}%`;
            }


            // Merge Rolls & History
            if (selectedOptions.diceRollHistory && campaignData.diceRollHistory) {
                const existingHistory = new Set(diceRollHistory.map(h => JSON.stringify(h)));
                const newHistory = campaignData.diceRollHistory.filter(h => !existingHistory.has(JSON.stringify(h)));
                diceRollHistory.push(...newHistory);
            }
            if (selectedOptions.diceRollHistory && campaignData.savedRolls) {
                 const existingRolls = new Set(savedRolls.map(r => r.name));
                 const newRolls = campaignData.savedRolls.filter(r => !existingRolls.has(r.name));
                 savedRolls.push(...newRolls);
            }

            // Merge Campaign Timer
            if (selectedOptions.campaignTime && typeof campaignData.campaignTime === 'number') {
                campaignTime = campaignData.campaignTime;
                isCampaignTimerPaused = true;
                clearInterval(campaignTimerInterval);
                campaignTimerToggle.textContent = 'Resume Campaign';
                updateCampaignTimerDisplay();
            }


            // Merge Audio
            if (selectedOptions.audio && zip.folder("audio")) {
                const audioFolder = zip.folder("audio");
                const audioPromises = [];
                audioFolder.forEach((relativePath, file) => {
                    if (!file.dir) {
                        const promise = file.async("blob").then(blob => {
                            if (!audioBlobs.some(ab => ab.name === relativePath)) {
                                audioBlobs.push({ name: relativePath, blob: blob });
                            }
                        });
                        audioPromises.push(promise);
                    }
                });
                await Promise.all(audioPromises);
            }

            // Merge Story Beats
            if (selectedOptions.storyTree && campaignData.storyTree) {
                if (campaignData.storyTree.quests) { // New format
                    quests = campaignData.storyTree.quests;
                    nextQuestId = campaignData.storyTree.nextQuestId;
                    selectedQuestId = campaignData.storyTree.selectedQuestId;
                    automationCanvasData = campaignData.storyTree.automationCanvasData || [];
                    automationBranches = campaignData.storyTree.automationBranches || {};
                    renderAutomationCanvasFromData();
                    renderAutomationBranches();

                    if (campaignData.storyTree.isAutomationActive) {
                        beginAutomationButton.style.display = 'none';
                        automationActiveControls.style.display = 'flex';
                    } else {
                        beginAutomationButton.style.display = 'block';
                        automationActiveControls.style.display = 'none';
                    }

                    // Restore automation history and state
                    automationHistory = campaignData.storyTree.automationHistory || [];
                    const lastCardId = campaignData.storyTree.lastAutomationCardId;
                    if (lastCardId) {
                        const automationCanvas = document.getElementById('automation-canvas');
                        if (automationCanvas) {
                            lastAutomationCard = Array.from(automationCanvas.querySelectorAll('.module-card')).find(card => card.dataset.cardId === lastCardId);
                        }
                    } else {
                        lastAutomationCard = null;
                    }
                    updatePreviousButtonState();

                    // Backward compatibility for quests missing new fields
                    quests.forEach(quest => {
                        if (quest.parentId !== undefined) {
                            quest.parentIds = quest.parentId !== null ? [quest.parentId] : [];
                            delete quest.parentId;
                        }
                        if (quest.description === undefined) {
                            quest.description = '';
                        }
                        if (quest.status === undefined) {
                            quest.status = 'active';
                        }
                        if (quest.prerequisites === undefined) {
                            quest.prerequisites = [];
                        }
                        if (quest.rewards === undefined) {
                            quest.rewards = [];
                        }
                        if (quest.recommendations === undefined) {
                            quest.recommendations = [];
                        }
                        if (quest.completionSteps === undefined) {
                            quest.completionSteps = [];
                        }
                        // New fields for backward compatibility
                        if (quest.questStatus === undefined) {
                            quest.questStatus = quest.status || 'Active';
                        }
                        if (quest.questType === undefined) {
                            quest.questType = [];
                        }
                        if (quest.startingTriggers === undefined) {
                            quest.startingTriggers = [];
                        }
                        if (quest.associatedMaps === undefined) {
                            quest.associatedMaps = [];
                        }
                        if (quest.associatedNPCs === undefined) {
                            quest.associatedNPCs = [];
                        }
                        if (quest.failureTriggers === undefined) {
                            quest.failureTriggers = [];
                        }
                        if (quest.successTriggers === undefined) {
                            quest.successTriggers = [];
                        }
                        if (quest.detailedRewards === undefined) {
                            quest.detailedRewards = { xp: 0, loot: '', magicItems: '', information: '' };
                        }
                        if (quest.storyDuration === undefined) {
                            quest.storyDuration = '';
                        }
                        if (quest.difficulty === undefined) {
                            quest.difficulty = 0;
                        }
                        if (quest.storySteps === undefined) {
                            quest.storySteps = [];
                        } else {
                            // Backward compatibility for story steps
                            quest.storySteps = quest.storySteps.map((step, index) => {
                                if (typeof step === 'string') {
                                    return { title: step, text: '', completed: false };
                                }
                                if (typeof step.title === 'undefined') {
                                    return { title: `Step ${index + 1}`, text: step.text, completed: step.completed };
                                }
                                return step;
                            });
                        }

                        // Convert old string triggers to new object format
                        ['startingTriggers', 'successTriggers', 'failureTriggers'].forEach(triggerType => {
                            if (quest[triggerType] && quest[triggerType].length > 0 && typeof quest[triggerType][0] === 'string') {
                                quest[triggerType] = quest[triggerType].map(triggerText => ({ text: triggerText, linkedQuestId: null }));
                            }
                        });
                    });
                } else if (Object.keys(campaignData.storyTree).length > 0) { // Old fabric.js format
                    // Attempt to convert old data or notify user
                    console.warn("Old story tree data format detected. Automatic conversion is not supported. Please recreate the story tree.");
                    alert("Your campaign contains an old version of the Story Beats data that cannot be automatically upgraded. You will need to recreate it manually.");
                    // Reset to default state
                    quests = [{
                        id: 1, name: 'Final Quest', parentIds: [], x: 0, y: 0, description: '',
                        questStatus: 'Active', questType: ['Main Story'], startingTriggers: [], associatedMaps: [],
                        associatedNPCs: [], failureTriggers: [], successTriggers: [],
                        detailedRewards: { xp: 0, loot: '', magicItems: '', information: '' },
                        storyDuration: '1 Session', difficulty: 3, storySteps: [],
                        status: 'active', prerequisites: [], rewards: [], recommendations: [], completionSteps: []
                    }];
                    nextQuestId = 2;
                    selectedQuestId = 1;
                }
            }

            // Merge Custom Quotes
            if (selectedOptions.quoteMap && campaignData.quoteMap) {
                quoteMap = campaignData.quoteMap;
                console.log("Custom character quotes loaded from campaign file.");
            }

            // Merge Settings
            if (campaignData.settings) {
                dmRenderQuality = campaignData.settings.dmRenderQuality || 0.5;
                playerRenderQuality = campaignData.settings.playerRenderQuality || 0.5;
                mapIconSize = campaignData.settings.mapIconSize || 5;

                if (dmRenderQualitySlider) dmRenderQualitySlider.value = dmRenderQuality;
                if (dmRenderQualityValue) dmRenderQualityValue.textContent = dmRenderQuality.toFixed(1);
                if (playerRenderQualitySlider) playerRenderQualitySlider.value = playerRenderQuality;
                if (playerRenderQualityValue) playerRenderQualityValue.textContent = playerRenderQuality.toFixed(1);
                if (mapIconSizeSlider) mapIconSizeSlider.value = mapIconSize;
                if (mapIconSizeValue) mapIconSizeValue.textContent = `${mapIconSize}%`;

                isLightMapDirty = true; // Mark as dirty to apply new quality settings
            }


            // Final UI updates
            renderAllLists();
            renderSavedInitiativesList();
            renderSavedRolls();
            updateButtonStates();

            if (selectedCharacterId) loadCharacterIntoEditor(selectedCharacterId);
            if (selectedNoteId) loadNoteIntoEditor(selectedNoteId);
            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            } else {
                const ctx = dmCanvas.getContext('2d');
                ctx.clearRect(0, 0, dmCanvas.width, dmCanvas.height);
            }

            alert("Campaign data merged successfully!");

        } catch (error) {
            console.error("Error merging campaign data:", error);
            alert(`An error occurred while merging campaign data: ${error.message}`);
        }
    }

    function renderAllLists() {
        renderMapsList();
        renderNotesList();
        renderCharactersList();
    }

    async function loadFromJson(file) {
        const campaignJSON = await file.text();
        const campaignData = JSON.parse(campaignJSON);

        notesData = campaignData.notes || [];
        charactersData = campaignData.characters || [];
        charactersData.forEach(character => {
            if (typeof character.isDetailsVisible === 'undefined') {
                character.isDetailsVisible = true;
            }
            if (typeof character.vision === 'undefined') {
                character.vision = true;
            }
            if (!character.sheetData) {
                character.sheetData = {};
            }
            if (typeof character.sheetData.vision_ft === 'undefined') {
                character.sheetData.vision_ft = '60';
            }
        });
        selectedNoteId = campaignData.selectedNoteId || null;
        selectedCharacterId = campaignData.selectedCharacterId || null;
        savedRolls = campaignData.savedRolls || [];
        savedInitiatives = campaignData.savedInitiatives || {};
        initiativeTokens = campaignData.initiativeTokens || [];
        restoreInitiativeState(campaignData);

        if (campaignData.storyTree) {
            if (campaignData.storyTree.quests) { // New format check
                quests = campaignData.storyTree.quests;
                nextQuestId = campaignData.storyTree.nextQuestId;
                selectedQuestId = campaignData.storyTree.selectedQuestId;
                automationCanvasData = campaignData.storyTree.automationCanvasData || [];
                automationBranches = campaignData.storyTree.automationBranches || {};
                renderAutomationCanvasFromData();
                renderAutomationBranches();
                if (campaignData.storyTree.isAutomationActive) {
                    beginAutomationButton.style.display = 'none';
                    automationActiveControls.style.display = 'flex';
                } else {
                    beginAutomationButton.style.display = 'block';
                    automationActiveControls.style.display = 'none';
                }

                // Restore automation history and state
                automationHistory = campaignData.storyTree.automationHistory || [];
                const lastCardId = campaignData.storyTree.lastAutomationCardId;
                if (lastCardId) {
                    const automationCanvas = document.getElementById('automation-canvas');
                    if (automationCanvas) {
                        lastAutomationCard = Array.from(automationCanvas.querySelectorAll('.module-card')).find(card => card.dataset.cardId === lastCardId);
                    }
                } else {
                    lastAutomationCard = null;
                }
                updatePreviousButtonState();
            } else {
                // Attempt to convert old data or notify user
                console.warn("Old story tree data format detected. Automatic conversion is not supported. Please recreate the story tree.");
                alert("Your campaign contains an old version of the Story Beats data that cannot be automatically upgraded. You will need to recreate it manually.");
                // Reset to default state
                quests = [{
                    id: 1, name: 'Final Quest', parentIds: [], x: 0, y: 0, description: '',
                    questStatus: 'Active', questType: ['Main Story'], startingTriggers: [], associatedMaps: [],
                    associatedNPCs: [], failureTriggers: [], successTriggers: [],
                    detailedRewards: { xp: 0, loot: '', magicItems: '', information: '' },
                    status: 'active', prerequisites: [], rewards: [], recommendations: [], completionSteps: []
                }];
                nextQuestId = 2;
                selectedQuestId = 1;
                automationCanvasData = [];
                renderAutomationCanvasFromData();
            }
        } else {
            automationCanvasData = [];
            renderAutomationCanvasFromData();
        }

        let loadedMapIconSize = campaignData.mapIconSize || 40;
        if (loadedMapIconSize > 20) { // Likely old pixel value
            mapIconSize = 5; // Default to 5%
        } else {
            mapIconSize = loadedMapIconSize;
        }

        if (mapIconSizeSlider) mapIconSizeSlider.value = mapIconSize;
        if (mapIconSizeValue) mapIconSizeValue.textContent = `${mapIconSize}%`;

        diceDialogueRecord.innerHTML = ''; // Clear the log first
        if (diceRollHistory && diceRollHistory.length > 0) {
            diceRollHistory.forEach(historyItem => {
                let rollData;
                if (typeof historyItem === 'string') {
                    const parts = historyItem.split(': ');
                    rollData = {
                        type: 'roll',
                        sum: parts[0],
                        roll: parts.length > 1 ? parts.slice(1).join(': ') : '',
                        characterName: 'Dice Roller',
                        playerName: 'DM',
                        id: Date.now() + Math.random(),
                        timestamp: '... old entry ...'
                    };
                } else {
                    rollData = historyItem;
                }
                const messageElement = createLogCard(rollData);
                diceDialogueRecord.prepend(messageElement);
            });
        } else if (campaignData.combatLog) { // Fallback for very old saves
            diceDialogueRecord.innerHTML = campaignData.combatLog;
        }

        if (campaignData.mapDefinitions) {
            for (const mapName in campaignData.mapDefinitions) {
                const definition = campaignData.mapDefinitions[mapName];

                // Backward compatibility: Ensure smart object polygons are clockwise
                if (definition.overlays) {
                    definition.overlays.forEach(overlay => {
                        if (overlay.type === 'smart_object' && Array.isArray(overlay.polygon) && overlay.polygon.length > 0) {
                            const area = getPolygonSignedArea(overlay.polygon);
                            if (area > 0) { // It's counter-clockwise, reverse it
                                overlay.polygon.reverse();
                            }
                        }
                    });
                }

                detailedMapData.set(mapName, {
                    name: definition.name,
                    url: null,
                    overlays: definition.overlays || [],
                    mode: definition.mode || 'edit',
                    transform: definition.transform ? { ...definition.transform, initialized: true } : { scale: 1, originX: 0, originY: 0, initialized: false },
                    fogOfWarDataUrl: definition.fogOfWarDataUrl || null
                });
                displayedFileNames.add(mapName);
            }
        }
        if (campaignData.activeMaps) {
            campaignData.activeMaps.forEach(activeMap => {
                const mapData = detailedMapData.get(activeMap.fileName);
                if (mapData) {
                    mapData.mode = 'view';
                }
            });
        }
        alert("Legacy campaign loaded. Please re-upload map and character files manually.");
    }

    function renderMapsList() {
        mapsList.innerHTML = '';
        for (const mapName of displayedFileNames) {
            const mapData = detailedMapData.get(mapName);
            if (!mapData) continue;

            const listItem = document.createElement('li');
            listItem.dataset.fileName = mapName;
            listItem.classList.add('map-list-item');

            const textNode = document.createTextNode(mapName);

            listItem.appendChild(textNode);
            mapsList.appendChild(listItem);
        }
        if (isEditMode) {
            editMapsIcon.click();
            editMapsIcon.click();
        }
    }

    if (saveCampaignButton) {
        saveCampaignButton.addEventListener('click', () => {
            updateSaveOptionsDependencies();
            saveCampaignModal.style.display = 'block';
        });
    }

    if (saveCampaignModalCloseButton) {
        saveCampaignModalCloseButton.addEventListener('click', () => {
            saveCampaignModal.style.display = 'none';
        });
    }

    if (cancelSaveButton) {
        cancelSaveButton.addEventListener('click', () => {
            saveCampaignModal.style.display = 'none';
        });
    }

    if (confirmSaveButton) {
        confirmSaveButton.addEventListener('click', () => {
            saveCampaign();
            saveCampaignModal.style.display = 'none';
        });
    }

    if (saveOptionsContainer) {
        saveOptionsContainer.addEventListener('change', updateSaveOptionsDependencies);
    }

    function updateSaveOptionsDependencies() {
        let warnings = [];
        let mapsNeedNotes = false;
        let mapsNeedCharacters = false;
        let initiativeNeedsCharacters = false;

        // Reset disabled states to re-evaluate
        saveNotesCheckbox.disabled = false;
        saveCharactersCheckbox.disabled = false;

        // Check for dependencies if Maps is selected
        if (saveMapsCheckbox.checked) {
            for (const mapData of detailedMapData.values()) {
                if (mapData.overlays) {
                    for (const overlay of mapData.overlays) {
                        if (overlay.type === 'noteLink' && overlay.linkedNoteId) {
                            mapsNeedNotes = true;
                        }
                        if (overlay.type === 'characterLink' && overlay.linkedCharacterId) {
                            mapsNeedCharacters = true;
                        }
                        if(mapsNeedNotes && mapsNeedCharacters) break;
                    }
                }
                if(mapsNeedNotes && mapsNeedCharacters) break;
            }
        }

        // Check for dependencies if Initiative is selected
        if (saveInitiativeCheckbox.checked) {
            if (activeInitiative.length > 0 || Object.keys(savedInitiatives).length > 0 || initiativeTokens.length > 0) {
                initiativeNeedsCharacters = true;
            }
        }

        // Enforce dependencies
        if (mapsNeedNotes) {
            if (!saveNotesCheckbox.checked) {
                warnings.push("Notes must be saved because one or more maps have note links.");
            }
            saveNotesCheckbox.checked = true;
            saveNotesCheckbox.disabled = true;
        }

        if (mapsNeedCharacters) {
            if (!saveCharactersCheckbox.checked) {
                warnings.push("Characters must be saved because one or more maps have character links.");
            }
            saveCharactersCheckbox.checked = true;
            saveCharactersCheckbox.disabled = true;
        }

        if (initiativeNeedsCharacters) {
            if (!saveCharactersCheckbox.checked) {
                warnings.push("Characters must be saved because you have initiative data.");
            }
            saveCharactersCheckbox.checked = true;
            saveCharactersCheckbox.disabled = true;
        }

        // Display warnings
        saveConflictWarnings.innerHTML = warnings.join('<br>');
    }

    if (loadCampaignInput) {
        loadCampaignInput.addEventListener('change', loadCampaign);
    }

    function sendMapToPlayerView(mapFileName) {
        if (playerWindow && !playerWindow.closed && mapFileName) {
            const mapData = detailedMapData.get(mapFileName);

            if (mapData && mapData.url && mapData.mode === 'view') {
                fetch(mapData.url)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64dataUrl = reader.result;
                            const visibleOverlays = mapData.overlays
                                .filter(overlay => (typeof overlay.playerVisible === 'boolean' ? overlay.playerVisible : true))
                                .map(overlay => {
                                    if (overlay.type === 'characterLink' && overlay.linkedCharacterId) {
                                        const character = charactersData.find(c => c.id === overlay.linkedCharacterId);
                                        if (character && character.sheetData && character.sheetData.character_portrait) {
                                            return {
                                                ...overlay,
                                                character_portrait: character.sheetData.character_portrait
                                            };
                                        }
                                    }
                                    return overlay;
                                });

                            const transform = mapData.transform;
                            const viewRectangle = {
                                x: (0 - transform.originX) / transform.scale,
                                y: (0 - transform.originY) / transform.scale,
                                width: dmCanvas.width / transform.scale,
                                height: dmCanvas.height / transform.scale
                            };
                            const gridInfo = gridData[mapFileName];
                            const playerGridData = gridInfo ? {
                                scale: gridInfo.scale,
                                visible: gridInfo.visible
                            } : null;
                            playerWindow.postMessage({
                                type: 'loadMap',
                                mapDataUrl: base64dataUrl,
                                overlays: JSON.parse(JSON.stringify(visibleOverlays)),
                                viewRectangle: viewRectangle,
                                dmCanvasWidth: dmCanvas.width,
                                dmCanvasHeight: dmCanvas.height,
                                active: mapData.mode === 'view',
                                gridData: playerGridData
                            }, '*');
                            console.log(`Sent map "${mapFileName}" and ${visibleOverlays.length} visible overlays to player view.`);
                        };
                        reader.onerror = () => {
                            console.error(`Error converting map "${mapFileName}" to data URL for player view.`);
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(error => {
                        console.error(`Error fetching blob for map "${mapFileName}" to send to player view:`, error);
                    });
            } else {
                console.warn(`Could not send map to player view: Map data, URL for "${mapFileName}", or mode is not 'view'.`);
            }
        }
    }

    function sendPolygonVisibilityUpdateToPlayerView(mapFileName, polygonIdentifier, isVisible) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({
                type: 'polygonVisibilityUpdate',
                mapFileName: mapFileName,
                polygonIdentifier: polygonIdentifier,
                isVisible: isVisible
            }, '*');
            console.log(`Sent polygon visibility update to player view: Map: ${mapFileName}, Visible: ${isVisible}`);
        }
    }

    function sendMapTransformToPlayerView(transform) {
        if (playerWindow && !playerWindow.closed) {
            const viewRectangle = {
                x: (0 - transform.originX) / transform.scale,
                y: (0 - transform.originY) / transform.scale,
                width: dmCanvas.width / transform.scale,
                height: dmCanvas.height / transform.scale
            };
            playerWindow.postMessage({
                type: 'mapTransformUpdate',
                viewRectangle: viewRectangle,
                dmCanvasWidth: dmCanvas.width,
                dmCanvasHeight: dmCanvas.height
            }, '*');
        }
    }


    async function triggerSlideshow() {
        if (playerWindow && !playerWindow.closed) {
            if (slideshowPlaylist.length === 0 || slideshowCurrentIndex >= slideshowPlaylist.length) {
                console.log("Generating new slideshow playlist...");
                slideshowPlaylist = await generateSlideshowPlaylist();
                slideshowCurrentIndex = 0;
            }

            if (slideshowPlaylist.length > 0) {
                playerWindow.postMessage({
                    type: 'startSlideshow',
                    playlist: slideshowPlaylist,
                    startIndex: slideshowCurrentIndex
                }, '*');
                console.log(`Sent startSlideshow message to player view with playlist of ${slideshowPlaylist.length} items, starting at index ${slideshowCurrentIndex}.`);
            } else {
                console.warn("Could not generate a slideshow playlist. No common stats or no characters.");
            }
        }
    }

    function sendDiceIconMenuStateToPlayerView(isOpen) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({ type: 'diceIconMenuState', isOpen: isOpen }, '*');
        }
    }

    function sendInitiativeTrackerStateToPlayerView(isOpen) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({ type: 'initiativeTrackerState', isOpen: isOpen }, '*');
        }
    }

    function sendActionLogStateToPlayerView(isOpen) {
        if (playerWindow && !playerWindow.closed) {
            const censoredHistory = diceRollHistory.map(logEntry => {
                let censoredEntry = { ...logEntry };
                if (censoredEntry.characterId) {
                    const character = charactersData.find(c => c.id === censoredEntry.characterId);
                    if (character && !character.isDetailsVisible) {
                        censoredEntry.characterName = '???';
                        censoredEntry.playerName = '???';
                        censoredEntry.characterPortrait = null;
                        censoredEntry.characterInitials = '??';
                    }
                }
                return censoredEntry;
            });
            playerWindow.postMessage({ type: 'actionLogState', isOpen: isOpen, history: censoredHistory }, '*');
        }
    }

    function sendToastToPlayerView(rollData) {
        if (playerWindow && !playerWindow.closed) {
            let censoredRollData = JSON.parse(JSON.stringify(rollData));
            if (censoredRollData.characterId) {
                const character = charactersData.find(c => c.id === censoredRollData.characterId);
                if (character && !character.isDetailsVisible) {
                    censoredRollData.characterName = '???';
                    censoredRollData.playerName = '???';
                    censoredRollData.characterPortrait = null;
                    censoredRollData.characterInitials = '??';
                }
            }
            playerWindow.postMessage({ type: 'toast', rollData: censoredRollData }, '*');
        }
    }

    function sendInitiativeDataToPlayerView() {
        if (playerWindow && !playerWindow.closed) {
            const censoredActiveInitiative = activeInitiative.map(censorCharacterDataForPlayerView);
            const censoredInitiativeTokens = initiativeTokens.map(censorCharacterDataForPlayerView);

            playerWindow.postMessage({
                type: 'initiativeDataUpdate',
                activeInitiative: censoredActiveInitiative,
                initiativeTurn: initiativeTurn,
                initiativeRound: initiativeRound,
                gameTime: gameTime,
                initiativeTokens: censoredInitiativeTokens
            }, '*');
        }
    }

    function sendTokenStatBlockStateToPlayerView(show, token, position) {
        if (playerWindow && !playerWindow.closed) {
            const character = token ? activeInitiative.find(c => c.uniqueId === token.uniqueId) : null;
            let characterToSend = null;
            if (character) {
                characterToSend = censorCharacterDataForPlayerView(character);
            }
            playerWindow.postMessage({ type: 'tokenStatBlockState', show: show, character: characterToSend, position: position }, '*');
        }
    }

    function sendGridToPlayerView() {
        if (playerWindow && !playerWindow.closed && selectedMapFileName) {
            const gridInfo = gridData[selectedMapFileName];
            if (gridInfo) {
                const playerGridData = {
                    scale: gridInfo.scale,
                    visible: gridInfo.visible
                };
                playerWindow.postMessage({
                    type: 'gridUpdate',
                    gridData: playerGridData
                }, '*');
            }
        }
    }

    if (openPlayerViewButton) {
        openPlayerViewButton.addEventListener('click', () => {
            const playerViewUrl = 'player_view.html';
            if (playerWindow === null || playerWindow.closed) {
                playerWindow = window.open(playerViewUrl, 'PlayerViewDnDemicube', 'width=800,height=600,resizable=yes,scrollbars=yes');
                if (playerWindow) {
                    setTimeout(() => {
                        if (selectedMapFileName) {
                            sendMapToPlayerView(selectedMapFileName);
                        }
                    }, 500);
                }
            } else {
                playerWindow.focus();
                if (selectedMapFileName) {
                     sendMapToPlayerView(selectedMapFileName);
                }
            }
        });
    }

    if (tokenStatBlockHp) {
        tokenStatBlockHp.addEventListener('change', (event) => {
            if (!selectedTokenForStatBlock) return;

            const newHp = parseInt(event.target.value, 10);
            if (isNaN(newHp)) return;

            const characterInInitiative = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (characterInInitiative) {
                characterInInitiative.sheetData.hp_current = newHp;

                // Only update the master character sheet if this is not a temporary token copy
                if (!characterInInitiative.isTokenCopy) {
                    const mainCharacter = charactersData.find(c => c.id === characterInInitiative.id);
                    if (mainCharacter) {
                        if (!mainCharacter.sheetData) mainCharacter.sheetData = {};
                        mainCharacter.sheetData.hp_current = newHp;
                    }
                }

                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
                sendInitiativeDataToPlayerView();
            }
        });
    }

    if (tokenStatBlockDiceButtons) {
        tokenStatBlockDiceButtons.addEventListener('click', (event) => {
            const button = event.target.closest('.dice-button-compact');
            if (!button) return;
            const die = button.dataset.die;
            if (die) {
                tokenStatBlockDiceCounts[die] = (tokenStatBlockDiceCounts[die] || 0) + 1;
                updateCompactDiceDisplay();
            }
        });

        tokenStatBlockDiceButtons.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const button = event.target.closest('.dice-button-compact');
            if (!button) return;
            const die = button.dataset.die;
            if (die && tokenStatBlockDiceCounts[die] > 0) {
                tokenStatBlockDiceCounts[die]--;
                updateCompactDiceDisplay();
            }
        });
    }

    if (tokenStatBlockSaveRollBtn) {
        tokenStatBlockSaveRollBtn.addEventListener('click', () => {
            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character) return;

            const rollName = tokenStatBlockAddRollName.value.trim();
            if (!rollName) {
                alert('Please enter a name for the roll.');
                return;
            }

            const tags = [tokenStatBlockAddRollTags.value];

            const hasDice = Object.values(tokenStatBlockDiceCounts).some(count => count > 0);
            if (!hasDice) {
                alert('Please select at least one die to save.');
                return;
            }

            const modifier = parseInt(tokenStatBlockAddRollModifier.value, 10) || 0;

            if (!character.savedRolls) {
                character.savedRolls = [];
            }

            character.savedRolls.push({
                name: rollName,
                dice: { ...tokenStatBlockDiceCounts },
                modifier: modifier,
                tags: tags
            });

            populateAndShowStatBlock(selectedTokenForStatBlock, parseInt(tokenStatBlock.style.left), parseInt(tokenStatBlock.style.top));
        });
    }

    if (tokenStatBlockAddRollTags) {
        tokenStatBlockAddRollTags.addEventListener('change', () => {
            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character || !character.sheetData) return;

            const selectedTag = tokenStatBlockAddRollTags.value;
            const attributeMatch = selectedTag.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/);

            if (attributeMatch) {
                const attribute = attributeMatch[0].toLowerCase();
                const statName = attribute.charAt(0).toUpperCase() + attribute.slice(1);

                tokenStatBlockAddRollName.value = `${statName} Check`;

                // Reset dice and add a d20
                for (const die in tokenStatBlockDiceCounts) {
                    tokenStatBlockDiceCounts[die] = 0;
                }
                tokenStatBlockDiceCounts['d20'] = 1;
                updateCompactDiceDisplay();

                // Set modifier from character sheet data
                const modifierValue = character.sheetData[`${attribute}_modifier`] || '+0';
                tokenStatBlockAddRollModifier.value = parseInt(modifierValue.replace('+', ''), 10) || 0;
            }
        });
    }

    if (tokenStatBlockRollsList) {
        tokenStatBlockRollsList.addEventListener('click', (event) => {
            const button = event.target;
            const action = button.dataset.action;
            const index = parseInt(button.dataset.index, 10);

            if (!action || isNaN(index)) return;

            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character || !character.savedRolls || !character.savedRolls[index]) return;

            if (action === 'delete') {
                character.savedRolls.splice(index, 1);
                populateAndShowStatBlock(selectedTokenForStatBlock, parseInt(tokenStatBlock.style.left), parseInt(tokenStatBlock.style.top));
            } else if (action === 'roll') {
                const savedRoll = character.savedRolls[index];
                let allRolls = [];
                let totalSum = 0;
                const rollsByDie = {};
                const modifier = savedRoll.modifier || 0;

                for (const die in savedRoll.dice) {
                    const count = savedRoll.dice[die];
                    if (count === 0) continue;

                    const sides = parseInt(die.substring(1), 10);
                    if (isNaN(sides)) continue;

                    if (!rollsByDie[die]) rollsByDie[die] = [];
                    for (let i = 0; i < count; i++) {
                        const roll = Math.floor(Math.random() * sides) + 1;
                        allRolls.push(roll);
                        totalSum += roll;
                        rollsByDie[die].push(roll);
                    }
                }

                totalSum += modifier;

                const detailsParts = [];
                for (const dieName in rollsByDie) {
                    detailsParts.push(`${rollsByDie[dieName].length}${dieName}[${rollsByDie[dieName].join(',')}]`);
                }
                let detailsMessage = `${savedRoll.name}: ${detailsParts.join(', ')}`;
                if (modifier !== 0) {
                    detailsMessage += ` ${modifier > 0 ? '+' : ''}${modifier}`;
                }

                if (savedRoll.tags && savedRoll.tags.includes('Hit')) {
                    if (!character.targets || character.targets.length === 0) {
                        addLogEntry({
                            type: 'system',
                            message: `${character.name} made a 'Hit' roll but has no targets.`
                        });
                        return; // Stop here if no targets
                    }

                    character.targets.forEach(targetId => {
                        const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                        if (targetCharacter) {
                            const targetAC = parseInt(targetCharacter.sheetData.ac, 10) || 10;
                            let hitResult = 'miss';
                            if (totalSum >= targetAC) {
                                hitResult = 'hit';
                            }

                            addLogEntry({
                                type: 'system',
                                message: `${character.name} attacks ${targetCharacter.name}! Roll: ${totalSum} vs AC: ${targetAC}. It's a ${hitResult.toUpperCase()}!`
                            });
                        }
                    });
                } else if (savedRoll.tags && savedRoll.tags.includes('Damage')) {
                    if (!character.targets || character.targets.length === 0) {
                        addLogEntry({
                            type: 'system',
                            message: `${character.name} made a 'Damage' roll but has no targets.`
                        });
                        return; // Stop here if no targets
                    }

                    character.targets.forEach(targetId => {
                        const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                        if (targetCharacter) {
                            const currentHp = parseInt(targetCharacter.sheetData.hp_current, 10) || 0;
                            const newHp = currentHp - totalSum;
                            targetCharacter.sheetData.hp_current = newHp;

                            if (!targetCharacter.isTokenCopy) {
                                const mainCharacter = charactersData.find(c => c.id === targetCharacter.id);
                                if (mainCharacter) {
                                    if (!mainCharacter.sheetData) mainCharacter.sheetData = {};
                                    mainCharacter.sheetData.hp_current = newHp;
                                }
                            }

                            addLogEntry({
                                type: 'system',
                                message: `${character.name} deals ${totalSum} damage to ${targetCharacter.name}! Their HP is now ${newHp}.`
                            });

                            if (selectedMapFileName) {
                                displayMapOnCanvas(selectedMapFileName);
                            }
                            sendInitiativeDataToPlayerView();
                        }
                    });
                } else if (savedRoll.tags && savedRoll.tags.includes('Healing')) {
                    if (!character.targets || character.targets.length === 0) {
                        addLogEntry({
                            type: 'system',
                            message: `${character.name} made a 'Healing' roll but has no targets.`
                        });
                        return;
                    }

                    character.targets.forEach(targetId => {
                        const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                        if (targetCharacter) {
                            const currentHp = parseInt(targetCharacter.sheetData.hp_current, 10) || 0;
                            const newHp = currentHp + totalSum;
                            targetCharacter.sheetData.hp_current = newHp;

                            if (!targetCharacter.isTokenCopy) {
                                const mainCharacter = charactersData.find(c => c.id === targetCharacter.id);
                                if (mainCharacter) {
                                    if (!mainCharacter.sheetData) mainCharacter.sheetData = {};
                                    mainCharacter.sheetData.hp_current = newHp;
                                }
                            }

                            addLogEntry({
                                type: 'system',
                                message: `${character.name} heals ${targetCharacter.name} for ${totalSum}! Their HP is now ${newHp}.`
                            });

                            if (selectedMapFileName) {
                                displayMapOnCanvas(selectedMapFileName);
                            }
                            sendInitiativeDataToPlayerView();
                        }
                    });
                } else if (savedRoll.tags && (savedRoll.tags.includes('Strength') || savedRoll.tags.includes('Dexterity') || savedRoll.tags.includes('Constitution') || savedRoll.tags.includes('Intelligence') || savedRoll.tags.includes('Wisdom') || savedRoll.tags.includes('Charisma'))) {
                    const skillName = savedRoll.tags.find(t => ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].includes(t));
                    if (!character.targets || character.targets.length === 0) {
                        addLogEntry({
                            type: 'system',
                            message: `${character.name} made a '${skillName}' roll but has no targets.`
                        });
                        return;
                    }

                    character.targets.forEach(targetId => {
                        const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                        if (targetCharacter) {
                            const attackerTotal = totalSum;

                            const targetAttr = skillName.toLowerCase();
                            const targetModifier = calculateModifier(parseInt(targetCharacter.sheetData[`${targetAttr}_score`], 10) || 10);
                            const defenderRoll = Math.floor(Math.random() * 20) + 1;
                            const defenderTotal = defenderRoll + parseInt(targetModifier);

                            let resultMessage;
                            if (attackerTotal > defenderTotal) {
                                resultMessage = `${character.name} wins the contested ${skillName} check against ${targetCharacter.name}! (${attackerTotal} to ${defenderTotal})`;
                            } else if (defenderTotal > attackerTotal) {
                                resultMessage = `${targetCharacter.name} wins the contested ${skillName} check against ${character.name}! (${defenderTotal} to ${attackerTotal})`;
                            } else {
                                resultMessage = `It's a tie for the contested ${skillName} check between ${character.name} and ${targetCharacter.name}! (${attackerTotal} to ${defenderTotal})`;
                            }

                            addLogEntry({
                                type: 'system',
                                message: resultMessage
                            });
                        }
                    });
                } else {
                    addLogEntry({
                        characterId: character.id,
                        characterName: character.name,
                        playerName: character.sheetData.player_name || 'DM',
                        roll: detailsMessage,
                        sum: totalSum,
                        characterPortrait: character.sheetData.character_portrait,
                        characterInitials: getInitials(character.name)
                    });
                    sendDiceRollToPlayerView(allRolls, totalSum);
                }
            }
        });
    }

    mapContainer.addEventListener('contextmenu', (event) => {
        event.preventDefault();


        if (isMovingPolygon) {
            resetAllInteractiveStates();
            alert("Polygon move cancelled.");
            console.log("Polygon move cancelled via right-click.");
            return;
        }

        polygonContextMenu.style.display = 'none';
        noteContextMenu.style.display = 'none';
        characterContextMenu.style.display = 'none';
        mapToolsContextMenu.style.display = 'none';
        document.querySelectorAll('.dynamic-context-menu').forEach(menu => menu.remove());
        selectedPolygonForContextMenu = null;
        selectedNoteForContextMenu = null;
        selectedLightSourceForContextMenu = null;

        if (!selectedMapFileName) {
            return;
        }

        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        const imageCoords = getRelativeCoords(canvasX, canvasY);

        if (!imageCoords) return;

        if (initiativeTokens.length > 0) {
            for (const token of initiativeTokens) {
                if (isPointInToken(imageCoords, token)) {
                    if (selectedTokenForStatBlock && selectedTokenForStatBlock.uniqueId === token.uniqueId) {
                        tokenStatBlock.style.display = 'none';
                        selectedTokenForStatBlock = null;
                        sendTokenStatBlockStateToPlayerView(false);
                    } else {
                        selectedTokenForStatBlock = token;
                        populateAndShowStatBlock(token, event.pageX, event.pageY);
                    }
                    return; // Token was clicked, don't show other context menus
                }
            }
        }

        const selectedMapData = detailedMapData.get(selectedMapFileName);
        if (!selectedMapData) return;

        let overlayClicked = false;
        if (selectedMapData.overlays) {
            for (let i = selectedMapData.overlays.length - 1; i >= 0; i--) {
                const overlay = selectedMapData.overlays[i];
                if (overlay.type === 'childMapLink' && overlay.polygon && isPointInPolygon(imageCoords, overlay.polygon)) {
                    selectedPolygonForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };
                    const toggleVisibilityItem = polygonContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const changeChildMapItem = polygonContextMenu.querySelector('[data-action="change-child-map"]');
                    const redrawPolygonItem = polygonContextMenu.querySelector('[data-action="redraw-polygon"]');
                    const movePolygonItem = polygonContextMenu.querySelector('[data-action="move-polygon"]');
                    const deleteLinkItem = polygonContextMenu.querySelector('[data-action="delete-link"]');
                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'none';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'none';
                        if (movePolygonItem) movePolygonItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (changeChildMapItem) changeChildMapItem.style.display = 'list-item';
                        if (redrawPolygonItem) redrawPolygonItem.style.display = 'list-item';
                        if (movePolygonItem) movePolygonItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }
                    polygonContextMenu.style.left = `${event.pageX}px`;
                    polygonContextMenu.style.top = `${event.pageY}px`;
                    polygonContextMenu.style.display = 'block';
                    console.log('Right-clicked on polygon:', selectedPolygonForContextMenu);
                    overlayClicked = true;
                    break;
                } else if (overlay.type === 'noteLink' && isPointInNoteIcon(imageCoords, overlay)) {
                    selectedNoteForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };
                    const toggleVisibilityItem = noteContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const linkToNewNoteItem = noteContextMenu.querySelector('[data-action="link-to-new-note"]');
                    const moveNoteItem = noteContextMenu.querySelector('[data-action="move-note"]');
                    const deleteLinkItem = noteContextMenu.querySelector('[data-action="delete-link"]');
                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (linkToNewNoteItem) linkToNewNoteItem.style.display = 'none';
                        if (moveNoteItem) moveNoteItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (linkToNewNoteItem) linkToNewNoteItem.style.display = 'list-item';
                        if (moveNoteItem) moveNoteItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }
                    noteContextMenu.style.left = `${event.pageX}px`;
                    noteContextMenu.style.top = `${event.pageY}px`;
                    noteContextMenu.style.display = 'block';
                    console.log('Right-clicked on note icon:', selectedNoteForContextMenu);
                    overlayClicked = true;
                    break;
                } else if (overlay.type === 'characterLink' && isPointInCharacterIcon(imageCoords, overlay)) {
                    selectedCharacterForContextMenu = {
                        overlay: overlay,
                        index: i,
                        parentMapName: selectedMapData.name,
                        source: selectedMapData.mode
                    };
                    const toggleVisibilityItem = characterContextMenu.querySelector('[data-action="toggle-player-visibility"]');
                    const linkToCharacterItem = characterContextMenu.querySelector('[data-action="link-to-character"]');
                    const moveCharacterItem = characterContextMenu.querySelector('[data-action="move-character"]');
                    const deleteLinkItem = characterContextMenu.querySelector('[data-action="delete-link"]');
                    if (selectedMapData.mode === 'view') {
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'list-item';
                        if (linkToCharacterItem) linkToCharacterItem.style.display = 'none';
                        if (moveCharacterItem) moveCharacterItem.style.display = 'none';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'none';
                    } else { // edit mode
                        if (toggleVisibilityItem) toggleVisibilityItem.style.display = 'none';
                        if (linkToCharacterItem) linkToCharacterItem.style.display = 'list-item';
                        if (moveCharacterItem) moveCharacterItem.style.display = 'list-item';
                        if (deleteLinkItem) deleteLinkItem.style.display = 'list-item';
                    }
                    characterContextMenu.style.left = `${event.pageX}px`;
                    characterContextMenu.style.top = `${event.pageY}px`;
                    characterContextMenu.style.display = 'block';
                    console.log('Right-clicked on character icon:', selectedCharacterForContextMenu);
                    overlayClicked = true;
                    break;
                } else if (overlay.type === 'lightSource' && isPointInLightSource(imageCoords, overlay)) {
                    if (selectedMapData.mode === 'edit') {
                        selectedLightSourceForContextMenu = overlay;
                        const visionToggle = document.getElementById('light-source-vision-toggle');
                        const visionFtInput = document.getElementById('light-source-vision-ft-input');

                        visionToggle.checked = overlay.vision;
                        visionFtInput.value = overlay.vision_ft;

                        lightSourceContextMenu.style.left = `${event.pageX}px`;
                        lightSourceContextMenu.style.top = `${event.pageY}px`;
                        lightSourceContextMenu.style.display = 'block';
                    }
                    overlayClicked = true;
                    break;
                }
            }
        }

        if (!overlayClicked) {
            if (selectedMapData.mode === 'edit') {
                mapToolsContextMenu.style.left = `${event.pageX}px`;
                mapToolsContextMenu.style.top = `${event.pageY}px`;
                mapToolsContextMenu.style.display = 'block';
            } else if (selectedMapData.mode === 'view' && viewModeMapContextMenu) {
                viewModeMapContextMenu.style.left = `${event.pageX}px`;
                viewModeMapContextMenu.style.top = `${event.pageY}px`;
                viewModeMapContextMenu.style.display = 'block';
            }
        }
    });

    if (viewModeMapContextMenu) {
        viewModeMapContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;
            if (action === 'reset-fog-of-war') {
                if (confirm("Are you sure you want to reset the fog of war for this map? This cannot be undone.")) {
                    if (selectedMapFileName) {
                        const mapData = detailedMapData.get(selectedMapFileName);
                        const fowCanvas = fogOfWarCanvasCache.get(selectedMapFileName);

                        if (mapData && fowCanvas) {
                            // Reset the off-screen canvas to be fully black
                            const fowCtx = fowCanvas.getContext('2d');
                            fowCtx.fillStyle = 'black';
                            fowCtx.fillRect(0, 0, fowCanvas.width, fowCanvas.height);

                            // Save the newly blackened state
                            mapData.fogOfWarDataUrl = fowCanvas.toDataURL();

                            // Push the update to the player view
                            sendFogOfWarToPlayerView();
                            alert("Fog of War has been reset.");
                        }
                    }
                }
            }
            viewModeMapContextMenu.style.display = 'none';
        });
    }

    document.addEventListener('click', (event) => {
        if (dmFloatingFooter && dmFloatingFooter.classList.contains('visible')) {
            if (!diceRollerIcon.contains(event.target) && !dmFloatingFooter.contains(event.target)) {
                dmFloatingFooter.classList.remove('visible');
            }
        }
        // Unified handler to close all context menus (static and dynamic) when clicking outside of any of them.
        const clickInsideAnyMenu =
            (polygonContextMenu.style.display === 'block' && polygonContextMenu.contains(event.target)) ||
            (noteContextMenu.style.display === 'block' && noteContextMenu.contains(event.target)) ||
            (characterContextMenu.style.display === 'block' && characterContextMenu.contains(event.target)) ||
            (mapToolsContextMenu.style.display === 'block' && mapToolsContextMenu.contains(event.target)) ||
            (viewModeMapContextMenu.style.display === 'block' && viewModeMapContextMenu.contains(event.target)) ||
            (lightSourceContextMenu.style.display === 'block' && lightSourceContextMenu.contains(event.target)) ||
            Array.from(document.querySelectorAll('.dynamic-context-menu')).some(menu => menu.contains(event.target));


        if (!clickInsideAnyMenu) {
            polygonContextMenu.style.display = 'none';
            noteContextMenu.style.display = 'none';
            characterContextMenu.style.display = 'none';
            mapToolsContextMenu.style.display = 'none';
            viewModeMapContextMenu.style.display = 'none';
            lightSourceContextMenu.style.display = 'none';
            document.querySelectorAll('.dynamic-context-menu').forEach(menu => menu.remove());

            // Reset selection states
            selectedPolygonForContextMenu = null;
            selectedNoteForContextMenu = null;
            selectedCharacterForContextMenu = null;
        }

        if (tokenStatBlock.style.display === 'block' && !tokenStatBlock.contains(event.target) && !dmCanvas.contains(event.target)) {
            tokenStatBlock.style.display = 'none';
            selectedTokenForStatBlock = null;
            sendTokenStatBlockStateToPlayerView(false);
            if (isTargeting) {
                isTargeting = false;
                document.body.classList.remove('targeting');
                tokenStatBlockSetTargets.textContent = 'Set Targets';
                tokenStatBlockSetTargets.classList.remove('active');
                targetingCharacter = null;
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
            }
        }
    });

    mapToolsContextMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        resetAllInteractiveStates();
        const action = event.target.dataset.action;

        if (action === 'shadow-tool') {
            isShadowMode = true;
            shadowToolsContainer.style.display = 'flex';
        } else if (action === 'assets-tool') {
            isAssetsMode = true;
            assetsToolsContainer.style.display = 'flex';
            if (footerAssetsTab) {
                footerAssetsTab.style.display = 'block';
                footerAssetsTab.click();
            }
            renderAssetExplorer();
        } else if (action) {
            const button = document.getElementById(`btn-${action.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (button) {
                button.click();
            } else if (action === 'link-child-map') {
                // Special case for the first button's ID
                document.getElementById('btn-link-child-map').click();
            }
        }
        mapToolsContextMenu.style.display = 'none';
    });

    polygonContextMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = event.target.dataset.action;

        if (action && selectedPolygonForContextMenu) {
            const { overlay, index, parentMapName, source } = selectedPolygonForContextMenu;

            const parentMapData = detailedMapData.get(parentMapName);

            if (!parentMapData) {
                console.error(`Parent map data not found for context menu action. Name: ${parentMapName}, Source: ${source}`);
                polygonContextMenu.style.display = 'none';
                selectedPolygonForContextMenu = null;
                return;
            }

            switch (action) {
                case 'toggle-player-visibility':
                    if (source === 'view') {
                        if (typeof overlay.playerVisible !== 'boolean') {
                            overlay.playerVisible = true;
                        }
                        overlay.playerVisible = !overlay.playerVisible;
                        console.log(`Polygon visibility for "${overlay.linkedMapName}" on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                        alert(`Player visibility for this area is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);

                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                            sendMapToPlayerView(parentMapName);
                        } else {
                            if (playerWindow && !playerWindow.closed) {
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                    } else {
                        console.warn("Toggle Player Visibility action called on a map not in 'view' mode.");
                        alert("This action is only available for maps in 'View' mode.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                case 'change-child-map':
                    if (source === 'edit') {
                        isChangingChildMapForPolygon = true;
                        alert(`"Change Child Map" selected for polygon linking to "${overlay.linkedMapName}". Please click a new map from the list to be its new child.`);
                    }
                    polygonContextMenu.style.display = 'none';
                    break;
                case 'redraw-polygon':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        isRedrawingPolygon = true;
                        preservedLinkedMapNameForRedraw = overlay.linkedMapName;
                        currentPolygonPoints = [];
                        polygonDrawingComplete = false;
                        parentMapData.overlays.splice(index, 1);
                        drawingCanvas.style.pointerEvents = 'auto';
                        dmCanvas.style.cursor = 'crosshair';
                        alert(`Redrawing polygon for link to "${preservedLinkedMapNameForRedraw}". Click on the map to start drawing. Click the first point to close it.`);
                        if (selectedMapFileName === parentMapName) {
                            displayMapOnCanvas(parentMapName);
                        }
                        console.log('Redraw Polygon initiated. Old polygon removed. Preserved link:', preservedLinkedMapNameForRedraw);
                    } else if (source === 'edit') {
                        console.error("Error initiating redraw: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to redraw.");
                    }
                    polygonContextMenu.style.display = 'none';
                    if (!isRedrawingPolygon) selectedPolygonForContextMenu = null;
                    break;
                case 'move-polygon':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        isMovingPolygon = true;
                        polygonBeingMoved = {
                            overlayRef: overlay,
                            originalPoints: JSON.parse(JSON.stringify(overlay.polygon)),
                            parentMapName: parentMapName,
                            originalIndex: index
                        };
                        moveStartPoint = null;
                        currentPolygonDragOffsets = {x: 0, y: 0};
                        dmCanvas.style.cursor = 'move';
                        alert(`Move mode activated for polygon linking to "${overlay.linkedMapName}". Click and drag the polygon. Click again to place, or right-click to cancel.`);
                        console.log('Move Polygon initiated for:', polygonBeingMoved);
                    } else if (source === 'edit') {
                        console.error("Error initiating move: Parent map data or overlay not found.");
                        alert("Error: Could not find the polygon to move.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
                case 'delete-link':
                    if (source === 'edit' && parentMapData.overlays && parentMapData.overlays[index]) {
                        if (confirm(`Are you sure you want to delete the link to "${overlay.linkedMapName}"?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Link to "${overlay.linkedMapName}" deleted from map "${parentMapName}".`);
                            alert(`Link to "${overlay.linkedMapName}" has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                    } else if (source === 'edit') {
                        console.error("Error deleting link: Parent map data or overlay not found.");
                        alert("Error: Could not find the link to delete.");
                    }
                    polygonContextMenu.style.display = 'none';
                    selectedPolygonForContextMenu = null;
                    break;
            }
        } else if (action) {
            console.warn("Context menu action clicked, but no polygon was selected.");
            polygonContextMenu.style.display = 'none';
            selectedPolygonForContextMenu = null;
        }
    });

    function initEasyMDE() {
        if (easyMDE) {
            return;
        }
        if (!markdownEditorTextarea) {
            console.error("Markdown textarea element not found for EasyMDE.");
            return;
        }
        try {
            easyMDE = new EasyMDE({
                element: markdownEditorTextarea,
                spellChecker: false,
                placeholder: "Type your markdown notes here...",
                minHeight: "150px",
                autosave: {
                    enabled: true,
                    uniqueId: selectedNoteId ? `note_${selectedNoteId}` : "dndemicube_unsaved_note",
                    delay: 3000,
                },
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "table", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide", "|",
                    {
                        name: "dm-mode",
                        action: function(editor) {
                            const cm = editor.codemirror;
                            const selection = cm.getSelection();
                            cm.replaceSelection(`[dm]${selection}[/dm]`);
                        },
                        className: "fa fa-user-secret",
                        title: "DM Only Content",
                    }
                ],
                uploadImage: true,
                imageUploadFunction: function(file, onSuccess, onError) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        onSuccess(event.target.result);
                    };
                    reader.onerror = function (error) {
                        onError("Error reading file: " + error);
                    };
                    reader.readAsDataURL(file);
                },
            });

            if (tabNotes && tabNotes.classList.contains('active') && easyMDE.codemirror) {
                setTimeout(() => easyMDE.codemirror.refresh(), 10);
            }
        } catch (e) {
            console.error("Error initializing EasyMDE:", e);
            easyMDE = null;
        }
    }

    function destroyEasyMDE() {
        if (easyMDE) {
            try {
                easyMDE.toTextArea();
            } catch (e) {
                console.error("Error destroying EasyMDE:", e);
            }
            easyMDE = null;
        }
    }

    function clearNoteEditor() {
        if (noteTitleInput) noteTitleInput.value = "";

        if (easyMDE && typeof easyMDE.value === 'function') {
            easyMDE.value("");
        } else if (markdownEditorTextarea) {
             markdownEditorTextarea.value = "";
        }
    }


    function renderNotesList() {
        if (!notesList) return;
        const currentScrollTop = notesList.scrollTop;
        notesList.innerHTML = '';

        notesData.forEach(note => {
            const listItem = document.createElement('li');
            listItem.dataset.noteId = note.id;
            listItem.classList.add('note-list-item');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('note-list-item-name');
            nameSpan.textContent = note.title;
            listItem.appendChild(nameSpan);


            if (note.id === selectedNoteId) {
                listItem.classList.add('selected-note-item');
            }

            if (isNotesEditMode) {
                notesList.classList.add('edit-mode-active');
                const actionsSpan = document.createElement('span');
                actionsSpan.classList.add('note-actions');

                const renameIconHTML = `<span class="note-action-icon rename-note" title="Rename Note" data-action="rename">✏️</span>`;
                const upIconHTML = `<span class="note-action-icon move-note-up" title="Move Up" data-action="move-up">↑</span>`;
                const downIconHTML = `<span class="note-action-icon move-note-down" title="Move Down" data-action="move-down">↓</span>`;
                const deleteIconHTML = `<span class="note-action-icon delete-note" title="Delete Note" data-action="delete">🗑️</span>`;

                actionsSpan.innerHTML = renameIconHTML + upIconHTML + downIconHTML + deleteIconHTML;
                listItem.appendChild(actionsSpan);
            } else {
                notesList.classList.remove('edit-mode-active');
            }
            notesList.appendChild(listItem);
        });
        updateNoteMoveIconVisibility();
        notesList.scrollTop = currentScrollTop;
    }

    function updateNoteMoveIconVisibility() {
        if (!notesList || !isNotesEditMode) return;
        const items = notesList.querySelectorAll('li.note-list-item');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-note-up');
            const downIcon = item.querySelector('.move-note-down');

            if (upIcon) upIcon.style.display = (index === 0 || items.length === 1) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1 || items.length === 1) ? 'none' : 'inline-block';
        });
    }

    function handleCreateNewNote() {
        const newNoteId = Date.now();
        let noteCounter = 1;
        let newTitle = `Note ${noteCounter}`;
        while (notesData.some(note => note.title === newTitle)) {
            noteCounter++;
            newTitle = `Note ${noteCounter}`;
        }

        const newNote = {
            id: newNoteId,
            title: newTitle,
            content: `# ${newTitle}\n\nStart writing your notes here.`
        };
        notesData.push(newNote);

        loadNoteIntoEditor(newNoteId);
        if (noteTitleInput) noteTitleInput.focus();
    }

    function loadNoteIntoEditor(noteId) {
        const note = notesData.find(n => n.id === noteId);
        if (!note) {
            console.error("Note not found for ID:", noteId);
            if (selectedNoteId === noteId) {
                 selectedNoteId = null;
                 clearNoteEditor();
                 if (easyMDE && easyMDE.options.autosave) {
                    easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                 }
            }
            renderNotesList();
            return;
        }

        selectedNoteId = note.id;
        if (noteTitleInput) noteTitleInput.value = note.title;

        if (!easyMDE && markdownEditorTextarea) {
            initEasyMDE();
        }

        if (easyMDE) {
            if (easyMDE.options.autosave) {
                if (easyMDE.options.autosave.uniqueId !== `note_${note.id}`) {
                }
                easyMDE.options.autosave.uniqueId = `note_${note.id}`;
            }
            easyMDE.value(note.content);
             if (easyMDE.codemirror && tabNotes.classList.contains('active')) {
                setTimeout(() => easyMDE.codemirror.refresh(), 0);
            }
        } else if (markdownEditorTextarea) {
            markdownEditorTextarea.value = note.content;
        }

        renderNotesList();
    }

    function handleSaveNote() {
        if (!selectedNoteId) {
            alert("No note selected to save.");
            return;
        }
        const note = notesData.find(n => n.id === selectedNoteId);
        if (!note) {
            alert("Error: Selected note not found in data.");
            return;
        }

        const newTitle = noteTitleInput ? noteTitleInput.value.trim() : note.title;
        if (!newTitle) {
            alert("Note title cannot be empty.");
            if (noteTitleInput) noteTitleInput.focus();
            return;
        }

        note.title = newTitle;
        if (easyMDE && typeof easyMDE.value === 'function') {
            note.content = easyMDE.value();
        } else if (markdownEditorTextarea) {
            note.content = markdownEditorTextarea.value;
        }

        renderNotesList();
    }

    function handleRenameNote(noteId) {
        const note = notesData.find(n => n.id === noteId);
        if (!note) return;

        const newTitle = prompt("Enter new name for the note:", note.title);
        if (newTitle && newTitle.trim() !== "" && newTitle.trim() !== note.title) {
            note.title = newTitle.trim();
            renderNotesList();
            if (note.id === selectedNoteId && noteTitleInput) {
                noteTitleInput.value = note.title;
            }
        }
    }

    function handleDeleteNote(noteId) {
        const noteIndex = notesData.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        const note = notesData[noteIndex];
        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {

            if (easyMDE && easyMDE.options.autosave.enabled && selectedNoteId === noteId) {
                const oldUniqueId = easyMDE.options.autosave.uniqueId;
                easyMDE.options.autosave.uniqueId = `deleting_${noteId}_${Date.now()}`;
                easyMDE.clearAutosavedValue();
            }

            notesData.splice(noteIndex, 1);

            if (selectedNoteId === noteId) {
                selectedNoteId = null;
                clearNoteEditor();
                if (easyMDE && easyMDE.options.autosave) {
                    easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                }
            }
            renderNotesList();
        }
    }

    function handleMoveNote(noteId, direction) {
        const index = notesData.findIndex(n => n.id === noteId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [notesData[index - 1], notesData[index]] = [notesData[index], notesData[index - 1]];
        } else if (direction === 'down' && index < notesData.length - 1) {
            [notesData[index], notesData[index + 1]] = [notesData[index + 1], notesData[index]];
        }
        renderNotesList();
    }


    if (createNewNoteButton) {
        createNewNoteButton.addEventListener('click', handleCreateNewNote);
    }

    if (saveNoteButton) {
        saveNoteButton.addEventListener('click', handleSaveNote);
    }
    if (noteTitleInput) {
        noteTitleInput.addEventListener('blur', handleSaveNote);
        noteTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveNote();
                if(easyMDE) easyMDE.codemirror.focus();
            }
        });
    }


    if (editNotesIcon) {
        editNotesIcon.addEventListener('click', () => {
            isNotesEditMode = !isNotesEditMode;
            editNotesIcon.textContent = isNotesEditMode ? '✅' : '✏️';
            renderNotesList();
        });
    }

    if (notesList) {
        notesList.addEventListener('click', (event) => {
            const listItem = event.target.closest('li.note-list-item');
            if (!listItem) return;

            const noteId = parseInt(listItem.dataset.noteId, 10);
            if (isNaN(noteId)) return;

            const actionIcon = event.target.closest('.note-action-icon');

            if (isNotesEditMode && actionIcon) {
                const action = actionIcon.dataset.action;
                if (action === 'rename') {
                    handleRenameNote(noteId);
                } else if (action === 'delete') {
                    handleDeleteNote(noteId);
                } else if (action === 'move-up') {
                    handleMoveNote(noteId, 'up');
                } else if (action === 'move-down') {
                    handleMoveNote(noteId, 'down');
                }
            } else if (!actionIcon) {
                if (linkingNoteForAutomationCard) {
                    const cardElement = linkingNoteForAutomationCard;
                    const linkedNotes = JSON.parse(cardElement.dataset.linkedNotes || '[]');
                    if (!linkedNotes.includes(noteId)) {
                        linkedNotes.push(noteId);
                    }
                    cardElement.dataset.linkedNotes = JSON.stringify(linkedNotes);

                    alert(`Note linked successfully to card ${cardElement.querySelector('.automation-card-label').textContent}.`);

                    linkingNoteForAutomationCard = null;
                    if (automationButton) automationButton.click();
                    displayNoteCardDetails(cardElement);

                } else if (selectedNoteForContextMenu) {
                    const { overlay, parentMapName, source } = selectedNoteForContextMenu;
                    overlay.linkedNoteId = noteId;
                    alert(`Note linked successfully.`);
                    selectedNoteForContextMenu = null;
                    switchTab('tab-dm-controls');
                    displayMapOnCanvas(parentMapName);
                } else {
                    if (selectedNoteId !== noteId) {
                        loadNoteIntoEditor(noteId);
                    }
                }
            }
        });
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId, preserveState = false) {
        // Reset any active map-editing states when switching tabs
        if (!preserveState) {
            resetAllInteractiveStates();
        }

        // Hide all main content containers by default
        if (mapContainer) mapContainer.style.display = 'none';
        if (noteEditorContainer) noteEditorContainer.style.display = 'none';
        if (characterSheetContainer) characterSheetContainer.style.display = 'none';
        if (storyTreeContainer) storyTreeContainer.style.display = 'none';
        if (quoteEditorContainer) quoteEditorContainer.style.display = 'none';
        if (automationContainer) automationContainer.style.display = 'none';

        // Toggle active state for tab buttons and sidebar content
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        // Show the correct container based on the tabId
        if (tabId === 'tab-notes') {
            if (noteEditorContainer) noteEditorContainer.style.display = 'flex';

            if (!easyMDE && markdownEditorTextarea) {
                initEasyMDE();
            }
            if (easyMDE && easyMDE.codemirror) {
                setTimeout(() => easyMDE.codemirror.refresh(), 10);
            }

            if (!selectedNoteId || !notesData.some(n => n.id === selectedNoteId)) {
                if (notesData.length > 0) {
                    loadNoteIntoEditor(notesData[0].id);
                } else {
                    clearNoteEditor();
                    if (easyMDE && easyMDE.options.autosave) {
                        easyMDE.options.autosave.uniqueId = "dndemicube_unsaved_note";
                    }
                    renderNotesList();
                }
            } else {
                 if (easyMDE && easyMDE.codemirror) {
                    setTimeout(() => easyMDE.codemirror.refresh(), 10);
                }
            }
        } else if (tabId === 'tab-characters') {
            if (characterSheetContainer) characterSheetContainer.style.display = 'flex';

            if (!selectedCharacterId || !charactersData.some(c => c.id === selectedCharacterId)) {
                if (charactersData.length > 0) {
                    loadCharacterIntoEditor(charactersData[0].id);
                } else {
                    clearCharacterEditor();
                    renderCharactersList();
                }
            }
        } else if (tabId === 'tab-story-beats') {
            if (storyTreeContainer) {
                storyTreeContainer.style.display = 'flex';
                storyTreeContainer.style.flexGrow = '1';
            }
            initStoryTree();
        } else { // Default to DM Controls tab
            if (mapContainer) mapContainer.style.display = 'flex';
            resizeCanvas(); // Ensure map is resized correctly
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    if (noteContextMenu) {
        noteContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;

            if (action && selectedNoteForContextMenu) {
                const { overlay, index, parentMapName, source } = selectedNoteForContextMenu;

                const parentMapData = detailedMapData.get(parentMapName);

                if (!parentMapData) {
                    console.error(`Parent map data not found for note context menu action. Name: ${parentMapName}, Source: ${source}`);
                    noteContextMenu.style.display = 'none';
                    selectedNoteForContextMenu = null;
                    return;
                }

                switch (action) {
                    case 'link-to-new-note':
                        if (source === 'edit') {
                            if (notesData.length === 0) {
                                alert("No notes available. Please create a new note first in the Notes tab.");
                                selectedNoteForContextMenu = null;
                            } else {
                                alert("Please select a note from the list in the Notes tab to link it.");
                                switchTab('tab-notes', true);
                            }
                        }
                        break;
                    case 'move-note':
                        if (source === 'edit') {
                            isMovingNote = true;
                            noteBeingMoved = {
                                overlayRef: overlay,
                                originalPosition: { ...overlay.position },
                                parentMapName: parentMapName,
                                originalIndex: index
                            };
                            moveStartPoint = null;
                            currentDragOffsets = { x: 0, y: 0 };
                            dmCanvas.style.cursor = 'move';
                            alert(`Move mode activated for note. Click and drag the note icon. Click again to place, or right-click to cancel.`);
                            console.log('Move Note initiated for:', noteBeingMoved);
                        }
                        break;
                    case 'delete-link':
                        if (source === 'edit' && confirm(`Are you sure you want to delete this note link?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Note link deleted from map "${parentMapName}".`);
                            alert(`Note link has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                        break;
                    case 'toggle-player-visibility':
                        if (source === 'view') {
                            if (typeof overlay.playerVisible !== 'boolean') {
                                overlay.playerVisible = true;
                            }
                            overlay.playerVisible = !overlay.playerVisible;
                            console.log(`Note visibility for note link on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                            alert(`Player visibility for this note is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                        selectedNoteForContextMenu = null;
                        break;
                }
            }
            noteContextMenu.style.display = 'none';
        });
    }

    const notePreviewClose = document.getElementById('note-preview-close');
    if (notePreviewClose) {
        notePreviewClose.addEventListener('click', () => {
            const notePreviewOverlay = document.getElementById('note-preview-overlay');
            if (notePreviewOverlay) {
                notePreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideNotePreview' }, '*');
                }
            }
            hasDeviatedFromAutomation = true;
            updatePreviousButtonState();
        });
    }

    function renderCharactersList() {
        if (!charactersList) return;
        const currentScrollTop = charactersList.scrollTop;
        charactersList.innerHTML = '';

        charactersData.forEach(character => {
            const listItem = document.createElement('li');
            listItem.dataset.characterId = character.id;
            listItem.classList.add('character-list-item');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('character-list-item-name');
            nameSpan.textContent = character.name;
            listItem.appendChild(nameSpan);


            if (character.id === selectedCharacterId) {
                listItem.classList.add('selected-character-item');
            }

            if (isCharactersEditMode) {
                charactersList.classList.add('edit-mode-active');
                const actionsSpan = document.createElement('span');
                actionsSpan.classList.add('character-actions');

                const renameIconHTML = `<span class="character-action-icon rename-character" title="Rename Character" data-action="rename">✏️</span>`;
                const upIconHTML = `<span class="character-action-icon move-character-up" title="Move Up" data-action="move-up">↑</span>`;
                const downIconHTML = `<span class="character-action-icon move-character-down" title="Move Down" data-action="move-down">↓</span>`;
                const deleteIconHTML = `<span class="character-action-icon delete-character" title="Delete Character" data-action="delete">🗑️</span>`;

                actionsSpan.innerHTML = renameIconHTML + upIconHTML + downIconHTML + deleteIconHTML;
                listItem.appendChild(actionsSpan);
            } else {
                charactersList.classList.remove('edit-mode-active');
            }
            charactersList.appendChild(listItem);
        });
        updateCharacterMoveIconVisibility();
        charactersList.scrollTop = currentScrollTop;
    }

    function updateCharacterMoveIconVisibility() {
        if (!charactersList || !isCharactersEditMode) return;
        const items = charactersList.querySelectorAll('li.character-list-item');
        items.forEach((item, index) => {
            const upIcon = item.querySelector('.move-character-up');
            const downIcon = item.querySelector('.move-character-down');

            if (upIcon) upIcon.style.display = (index === 0 || items.length === 1) ? 'none' : 'inline-block';
            if (downIcon) downIcon.style.display = (index === items.length - 1 || items.length === 1) ? 'none' : 'inline-block';
        });
    }

    function handleCreateCharacter() {
        const newCharacterId = Date.now();
        let characterCounter = 1;
        let newName = `Character ${characterCounter}`;
        while (charactersData.some(character => character.name === newName)) {
            characterCounter++;
            newName = `Character ${characterCounter}`;
        }

        const newCharacter = {
            id: newCharacterId,
            name: newName,
            sheetData: {},
            notes: "",
            isDetailsVisible: true,
            vision: true
        };
        charactersData.push(newCharacter);

        loadCharacterIntoEditor(newCharacterId);
        if (characterNameInput) characterNameInput.focus();
    }

    function loadCharacterIntoEditor(characterId) {
        const character = charactersData.find(c => c.id === characterId);
        if (!character) {
            console.error("Character not found for ID:", characterId);
            if (selectedCharacterId === characterId) {
                selectedCharacterId = null;
                clearCharacterEditor();
            }
            renderCharactersList();
            return;
        }

        selectedCharacterId = character.id;
        if (characterNameInput) characterNameInput.value = character.name;

        if (characterSheetIframe && characterSheetIframe.contentWindow) {
            const dataToSend = {
                ...(character.sheetData || {}),
                isDetailsVisible: character.isDetailsVisible
            };
            characterSheetIframe.contentWindow.postMessage({ type: 'loadCharacterSheet', data: dataToSend }, '*');
        } else {
            console.warn("Character sheet iframe not ready to receive data.");
        }

        if (pdfViewerIframe.src) {
            URL.revokeObjectURL(pdfViewerIframe.src);
            pdfViewerIframe.src = '';
        }
        characterSheetContent.style.display = 'block';
        pdfViewerContainer.style.display = 'none';
        characterNotesEditorContainer.style.display = 'none';
        viewPdfButton.textContent = 'View PDF';

        if (character.pdfData) {
            viewPdfButton.style.display = 'inline-block';
            deletePdfButton.style.display = 'inline-block';
        } else {
            viewPdfButton.style.display = 'none';
            deletePdfButton.style.display = 'none';
        }

        if (characterEasyMDE) {
            characterEasyMDE.value(character.notes || "");
        }

        renderCharactersList();
    }

    function handleSaveCharacter() {
        if (!selectedCharacterId) {
            alert("No character selected to save.");
            return;
        }
        const character = charactersData.find(c => c.id === selectedCharacterId);
        if (!character) {
            alert("Error: Selected character not found in data.");
            return;
        }

        const newName = characterNameInput ? characterNameInput.value.trim() : character.name;
        if (!newName) {
            alert("Character name cannot be empty.");
            if (characterNameInput) characterNameInput.focus();
            return;
        }

        character.name = newName;
        if (characterSheetIframe && characterSheetIframe.contentWindow) {
            characterSheetIframe.contentWindow.postMessage({ type: 'requestSheetData' }, '*');
        }
        if (characterEasyMDE) {
            character.notes = characterEasyMDE.value();
        }

        renderCharactersList();
    }

    function handleRenameCharacter(characterId) {
        const character = charactersData.find(c => c.id === characterId);
        if (!character) return;

        const newName = prompt("Enter new name for the character:", character.name);
        if (newName && newName.trim() !== "" && newName.trim() !== character.name) {
            character.name = newName.trim();
            renderCharactersList();
            if (character.id === selectedCharacterId && characterNameInput) {
                characterNameInput.value = character.name;
            }
            propagateCharacterUpdate(characterId);
        }
    }

    function handleDeleteCharacter(characterId) {
        const characterIndex = charactersData.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return;

        const character = charactersData[characterIndex];
        if (confirm(`Are you sure you want to delete "${character.name}"?`)) {
            charactersData.splice(characterIndex, 1);

            if (selectedCharacterId === characterId) {
                selectedCharacterId = null;
                clearCharacterEditor();
            }
            renderCharactersList();
        }
    }

    function handleMoveCharacter(characterId, direction) {
        const index = charactersData.findIndex(c => c.id === characterId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [charactersData[index - 1], charactersData[index]] = [charactersData[index], charactersData[index - 1]];
        } else if (direction === 'down' && index < charactersData.length - 1) {
            [charactersData[index], charactersData[index + 1]] = [charactersData[index + 1], charactersData[index]];
        }
        renderCharactersList();
    }

    function clearCharacterEditor() {
        if (characterNameInput) characterNameInput.value = "";
    }

    function initCharacterEasyMDE() {
        if (characterEasyMDE) {
            return;
        }
        if (!characterMarkdownEditor) {
            console.error("Character markdown textarea element not found for EasyMDE.");
            return;
        }
        try {
            characterEasyMDE = new EasyMDE({
                element: characterMarkdownEditor,
                spellChecker: false,
                placeholder: "Type your character notes here...",
                minHeight: "150px",
                autosave: {
                    enabled: true,
                    uniqueId: selectedCharacterId ? `character_note_${selectedCharacterId}` : "dndemicube_unsaved_character_note",
                    delay: 3000,
                },
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "table", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide", "|",
                    {
                        name: "dm-mode",
                        action: function(editor) {
                            const cm = editor.codemirror;
                            const selection = cm.getSelection();
                            cm.replaceSelection(`[dm]${selection}[/dm]`);
                        },
                        className: "fa fa-user-secret",
                        title: "DM Only Content",
                    }
                ],
            });
        } catch (e) {
            console.error("Error initializing Character EasyMDE:", e);
            characterEasyMDE = null;
        }
    }

    if (characterNotesButton) {
        characterNotesButton.addEventListener('click', () => {
            if (characterNotesEditorContainer.style.display === 'none') {
                characterNotesEditorContainer.style.display = 'block';
                characterSheetContent.style.display = 'none';
                pdfViewerContainer.style.display = 'none';
                initCharacterEasyMDE();
                if (characterEasyMDE) {
                    characterEasyMDE.codemirror.refresh();
                }
            } else {
                characterNotesEditorContainer.style.display = 'none';
                characterSheetContent.style.display = 'block';
            }
        });
    }

    if (addCharacterButton) {
        addCharacterButton.addEventListener('click', handleCreateCharacter);
    }

    if (saveCharacterButton) {
        saveCharacterButton.addEventListener('click', handleSaveCharacter);
    }

    if (clearFieldsButton) {
        clearFieldsButton.addEventListener('click', () => {
            if (characterSheetIframe && characterSheetIframe.contentWindow) {
                characterSheetIframe.contentWindow.postMessage({ type: 'clearCharacterSheet' }, '*');
            }
        });
    }

    if (fillFromButton) {
        fillFromButton.addEventListener('click', () => {
            fillFromDropdown.style.display = fillFromDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    if (fillFromPdfOption) {
        fillFromPdfOption.addEventListener('click', (e) => {
            e.preventDefault();
            pdfUploadInput.click();
            fillFromDropdown.style.display = 'none';
        });
    }

    const defaultCharacterJson = {
        "character_name": "", "class_and_level": "", "background": "", "player_name": "", "race_or_species": "", "alignment": "", "experience_points": "",
        "strength": { "score": "", "modifier": "+0" }, "dexterity": { "score": "", "modifier": "+0" }, "constitution": { "score": "", "modifier": "+0" },
        "intelligence": { "score": "", "modifier": "+0" }, "wisdom": { "score": "", "modifier": "+0" }, "charisma": { "score": "", "modifier": "+0" },
        "saving_throws": { "strength": "", "dexterity": "", "constitution": "", "intelligence": "", "wisdom": "", "charisma": "" },
        "skills": {
            "acrobatics_dex": "", "animal_handling_wis": "", "arcana_int": "", "athletics_str": "", "deception_cha": "", "history_int": "", "insight_wis": "", "intimidation_cha": "",
            "investigation_int": "", "medicine_wis": "", "nature_int": "", "perception_wis": "", "performance_cha": "", "persuasion_cha": "", "religion_int": "",
            "sleight_of_hand_dex": "", "stealth_dex": "", "survival_wis": ""
        },
        "armor_class": "", "initiative": "", "speed": "",
        "hit_points": { "maximum": "", "current": "", "temporary": "" },
        "hit_dice": "",
        "death_saves": { "successes": "", "failures": "" },
        "proficiency_bonus": "", "passive_perception": "", "passive_insight": "", "passive_investigation": "",
        "proficiencies": { "armor": "", "weapons": "", "tools": "" },
        "languages": "", "attacks_and_spellcasting": "", "features_and_traits": "", "equipment": "", "character_appearance": "", "character_backstory": "",
        "personality_traits": "", "ideals": "", "bonds": "", "flaws": ""
    };

    function flattenCharacterJson(data) {
        const flattened = {};
        for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                for (const subKey in data[key]) {
                    flattened[`${key}_${subKey}`] = data[key][subKey];
                }
            } else {
                flattened[key] = data[key];
            }
        }
        return flattened;
    }


    window.addEventListener('click', (e) => {
        if (!e.target.matches('.dropdown-toggle')) {
            if (fillFromDropdown.style.display === 'block') {
                fillFromDropdown.style.display = 'none';
            }
        }
    });

    if (pdfUploadInput) {
        pdfUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (!character) {
                    alert("Please select a character before uploading a PDF.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const pdfData = new Uint8Array(e.target.result);
                    character.pdfData = pdfData;
                    character.pdfFileName = file.name;

                    viewPdfButton.style.display = 'inline-block';
                    deletePdfButton.style.display = 'inline-block';
                    alert(`PDF "${file.name}" has been attached to the character.`);
                };
                reader.readAsArrayBuffer(file);
            } else if (!selectedCharacterId) {
                alert("No character selected. Please select a character before uploading a PDF.");
            }
        });
    }

    if (viewPdfButton) {
        viewPdfButton.addEventListener('click', () => {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (!character || !character.pdfData) {
                alert("No PDF found for this character.");
                return;
            }

            if (pdfViewerContainer.style.display === 'none') {
                const pdfUrl = URL.createObjectURL(new Blob([character.pdfData], { type: 'application/pdf' }));
                pdfViewerIframe.src = pdfUrl;
                characterSheetContent.style.display = 'none';
                pdfViewerContainer.style.display = 'block';
                viewPdfButton.textContent = 'Local Character Editor';
            } else {
                if (pdfViewerIframe.src) {
                    URL.revokeObjectURL(pdfViewerIframe.src);
                }
                pdfViewerIframe.src = '';
                characterSheetContent.style.display = 'block';
                pdfViewerContainer.style.display = 'none';
                viewPdfButton.textContent = 'View PDF';
            }
        });
    }

    if (deletePdfButton) {
        deletePdfButton.addEventListener('click', () => {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (character) {
                character.pdfData = null;
                character.pdfFileName = null;
            }

            if (pdfViewerIframe.src) {
                URL.revokeObjectURL(pdfViewerIframe.src);
            }
            pdfViewerIframe.src = '';

            characterSheetContent.style.display = 'block';
            pdfViewerContainer.style.display = 'none';
            viewPdfButton.textContent = 'View PDF';
            viewPdfButton.style.display = 'none';
            deletePdfButton.style.display = 'none';
            alert("PDF has been removed from this character.");
        });
    }

    function parsePdfText(text) {
        const sheetData = {};
        const upperText = text.toUpperCase();

        const extract = (regex) => {
            const match = upperText.match(regex);
            return match ? match[1].trim() : null;
        };

        sheetData.char_name = extract(/CHARACTER NAME\s*([A-Z\s]+)\s*EXPERIENCE POINTS/);
        console.log("Extracted char_name:", sheetData.char_name);
        sheetData.class_level = extract(/CLASS & LEVEL\s*([^\n]+)/);
        sheetData.background = extract(/BACKGROUND\s*([^\n]+)/);
        sheetData.player_name = extract(/PLAYER NAME\s*([^\n]+)/);
        sheetData.race = extract(/RACE\s*([^\n]+)/);
        sheetData.alignment = extract(/ALIGNMENT\s*([^\n]+)/);
        sheetData.xp = extract(/EXPERIENCE POINTS\s*([^\n]+)/);

        sheetData.strength_score = extract(/STRENGTH\s*(\d+)/);
        sheetData.dexterity_score = extract(/DEXTERITY\s*(\d+)/);
        sheetData.constitution_score = extract(/CONSTITUTION\s*(\d+)/);
        sheetData.intelligence_score = extract(/INTELLIGENCE\s*(\d+)/);
        sheetData.wisdom_score = extract(/WISDOM\s*(\d+)/);
        sheetData.charisma_score = extract(/CHARISMA\s*(\d+)/);

        sheetData.ac = extract(/ARMOR CLASS\s*(\d+)/);
        sheetData.initiative = extract(/INITIATIVE\s*([+-]?\d+)/);
        sheetData.speed = extract(/SPEED\s*([^\n]+)/);
        sheetData.hp_max = extract(/HIT POINT MAXIMUM\s*(\d+)/);
        sheetData.hp_current = extract(/CURRENT HIT POINTS\s*(\d*)/);
        sheetData.hp_temp = extract(/TEMPORARY HIT POINTS\s*(\d*)/);
        sheetData.hit_dice_total = extract(/TOTAL\s*([^\n]+)\s*HIT DICE/);
        sheetData.hit_dice_current = extract(/HIT DICE\s*([^\n]+)/);
        sheetData.proficiency_bonus = extract(/PROFICIENCY BONUS\s*([+-]?\d+)/);
        sheetData.passive_perception = extract(/PASSIVE PERCEPTION\s*(\d+)/);
        sheetData.passive_insight = extract(/PASSIVE INSIGHT\s*(\d+)/);
        sheetData.passive_investigation = extract(/PASSIVE INVESTIGATION\s*(\d+)/);

        const extractTextArea = (start, end) => {
            const regex = new RegExp(`${start}\\s*([\\s\\S]*?)\\s*${end}`);
            const match = upperText.match(regex);
            return match ? match[1].trim() : null;
        };
        
        sheetData.attacks_spellcasting = extractTextArea('Attacks & Spellcasting', 'Equipment');
        sheetData.equipment = extractTextArea('Equipment', 'Features & Traits');
        sheetData.features_traits = extractTextArea('Features & Traits', 'Personality Traits');
        sheetData.personality_traits = extractTextArea('Personality Traits', 'Ideals');
        sheetData.ideals = extractTextArea('Ideals', 'Bonds');
        sheetData.bonds = extractTextArea('Bonds', 'Flaws');
        sheetData.flaws = extractTextArea('Flaws', 'Character Appearance');

        return sheetData;
    }

    if (characterNameInput) {
        characterNameInput.addEventListener('blur', handleSaveCharacter);
        characterNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveCharacter();
            }
        });
    }

    if (editCharactersIcon) {
        editCharactersIcon.addEventListener('click', () => {
            isCharactersEditMode = !isCharactersEditMode;
            editCharactersIcon.textContent = isCharactersEditMode ? '✅' : '✏️';
            renderCharactersList();
        });
    }

    if (charactersList) {
        charactersList.addEventListener('click', (event) => {
            const listItem = event.target.closest('li.character-list-item');
            if (!listItem) return;

            const characterId = parseInt(listItem.dataset.characterId, 10);
            if (isNaN(characterId)) return;

            const actionIcon = event.target.closest('.character-action-icon');

            if (isCharactersEditMode && actionIcon) {
                const action = actionIcon.dataset.action;
                if (action === 'rename') {
                    handleRenameCharacter(characterId);
                } else if (action === 'delete') {
                    handleDeleteCharacter(characterId);
                } else if (action === 'move-up') {
                    handleMoveCharacter(characterId, 'up');
                } else if (action === 'move-down') {
                    handleMoveCharacter(characterId, 'down');
                }
            } else if (!actionIcon) {
                if (selectedCharacterForContextMenu) {
                    const { overlay, parentMapName, source } = selectedCharacterForContextMenu;
                    overlay.linkedCharacterId = characterId;
                    alert(`Character linked successfully.`);
                    selectedCharacterForContextMenu = null;
                    switchTab('tab-dm-controls');
                    displayMapOnCanvas(parentMapName);
                } else {
                    if (selectedCharacterId !== characterId) {
                        loadCharacterIntoEditor(characterId);
                    }
                }
            }
        });
    }

    if (characterContextMenu) {
        characterContextMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;

            if (action && selectedCharacterForContextMenu) {
                const { overlay, index, parentMapName, source } = selectedCharacterForContextMenu;

                const parentMapData = detailedMapData.get(parentMapName);
                
                if (!parentMapData) {
                    console.error(`Parent map data not found for character context menu action. Name: ${parentMapName}, Source: ${source}`);
                    characterContextMenu.style.display = 'none';
                    selectedCharacterForContextMenu = null;
                    return;
                }

                switch (action) {
                    case 'link-to-character':
                        if (source === 'edit') {
                            if (charactersData.length === 0) {
                                alert("No characters available. Please create a new character first in the Characters tab.");
                                selectedCharacterForContextMenu = null;
                            } else {
                                alert("Please select a character from the list in the Characters tab to link it.");
                                switchTab('tab-characters', true);
                            }
                        }
                        break;
                    case 'move-character':
                         if (source === 'edit') {
                            isMovingCharacter = true;
                            characterBeingMoved = {
                                overlayRef: overlay,
                                originalPosition: { ...overlay.position },
                                parentMapName: parentMapName,
                                originalIndex: index
                            };
                            moveStartPoint = null;
                            currentDragOffsets = { x: 0, y: 0 };
                            dmCanvas.style.cursor = 'move';
                            alert(`Move mode activated for character. Click and drag the character icon. Click again to place, or right-click to cancel.`);
                            console.log('Move Character initiated for:', characterBeingMoved);
                        }
                        break;
                    case 'delete-link':
                        if (source === 'edit' && confirm(`Are you sure you want to delete this character link?`)) {
                            parentMapData.overlays.splice(index, 1);
                            console.log(`Character link deleted from map "${parentMapName}".`);
                            alert(`Character link has been deleted.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                            }
                        }
                        break;
                    case 'toggle-player-visibility':
                        if (source === 'view') {
                            if (typeof overlay.playerVisible !== 'boolean') {
                                overlay.playerVisible = true;
                            }
                            overlay.playerVisible = !overlay.playerVisible;
                            console.log(`Character visibility for character link on map "${parentMapName}" toggled to: ${overlay.playerVisible}`);
                            alert(`Player visibility for this character is now ${overlay.playerVisible ? 'ON' : 'OFF'}.`);
                            if (selectedMapFileName === parentMapName) {
                                displayMapOnCanvas(parentMapName);
                                sendMapToPlayerView(parentMapName);
                            }
                        }
                        selectedCharacterForContextMenu = null;
                        break;
                }
            }
            characterContextMenu.style.display = 'none';
        });
    }

    const lightSourceContextMenu = document.getElementById('light-source-context-menu');
    if (lightSourceContextMenu) {
        lightSourceContextMenu.addEventListener('change', (event) => {
            if (!selectedLightSourceForContextMenu) return;

            const visionToggle = document.getElementById('light-source-vision-toggle');
            const visionFtInput = document.getElementById('light-source-vision-ft-input');

            selectedLightSourceForContextMenu.vision = visionToggle.checked;
            selectedLightSourceForContextMenu.vision_ft = parseInt(visionFtInput.value, 10) || 0;

            const mapData = detailedMapData.get(selectedMapFileName);
            if (mapData) {
                drawOverlays(mapData.overlays);
            }
            isLightMapDirty = true;
        });
    }

    window.addEventListener('message', (event) => {
        if (event.source !== characterSheetIframe.contentWindow) {
            return;
        }

        if (event.data.type === 'saveCharacterSheet') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.sheetData = event.data.data;
                    character.savedRolls = event.data.data.savedRolls;
                    propagateCharacterUpdate(selectedCharacterId);
                }
            }
        } else if (event.data.type === 'characterVisionFtChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    if (!character.sheetData) character.sheetData = {};
                    character.sheetData.vision_ft = event.data.visionRange;
                    propagateCharacterUpdate(selectedCharacterId);
                }
            }
        } else if (event.data.type === 'characterSheetReady') {
            if (selectedCharacterId) {
                loadCharacterIntoEditor(selectedCharacterId);
            }
        } else if (event.data.type === 'characterDetailsVisibilityChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.isDetailsVisible = event.data.isDetailsVisible;
                    propagateCharacterUpdate(selectedCharacterId);
                }
            }
        } else if (event.data.type === 'characterVisionChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.vision = event.data.vision;
                    propagateCharacterUpdate(selectedCharacterId);
                }
            }
        } else if (event.data.type === 'sheetDataForView') {
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (character) {
                const markdown = generateCharacterMarkdown(event.data.data, character.notes, false, character.isDetailsVisible);
                const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                const characterPreviewBody = document.getElementById('character-preview-body');
                if (characterPreviewOverlay && characterPreviewBody) {
                    characterPreviewBody.innerHTML = markdown;
                    characterPreviewOverlay.style.display = 'flex';
                }
            }
        } else if (event.data.type === 'characterDetailsVisibilityChange') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    character.isDetailsVisible = event.data.isDetailsVisible;
                }
            }
        } else if (event.data.type === 'skillRoll') {
            const { skillName, modifier } = event.data;
            const character = charactersData.find(c => c.id === selectedCharacterId);
            const characterName = character ? character.name : 'Unknown';
            const playerName = character && character.sheetData ? character.sheetData.player_name : 'DM';

            const activeCharacter = activeInitiative.find(c => c.id === selectedCharacterId);

            if (activeCharacter && activeCharacter.targets && activeCharacter.targets.length > 0) {
                // Contested roll
                activeCharacter.targets.forEach(targetId => {
                    const targetCharacter = activeInitiative.find(c => c.uniqueId === targetId);
                    if (targetCharacter) {
                        // Attacker's roll
                        const attackerRoll = Math.floor(Math.random() * 20) + 1;
                        const attackerTotal = attackerRoll + parseInt(modifier);

                        // Target's roll
                        const targetSkill = Object.keys(skills).find(key => key.toLowerCase() === skillName.toLowerCase());
                        const targetAttr = skills[targetSkill];
                        const targetModifier = calculateModifier(parseInt(targetCharacter.sheetData[`${targetAttr}_score`], 10) || 10);
                        const defenderRoll = Math.floor(Math.random() * 20) + 1;
                        const defenderTotal = defenderRoll + parseInt(targetModifier);

                        let resultMessage;
                        if (attackerTotal > defenderTotal) {
                            resultMessage = `${characterName} wins the contested ${skillName} check against ${targetCharacter.name}! (${attackerTotal} to ${defenderTotal})`;
                        } else if (defenderTotal > attackerTotal) {
                            resultMessage = `${targetCharacter.name} wins the contested ${skillName} check against ${characterName}! (${defenderTotal} to ${attackerTotal})`;
                        } else {
                            resultMessage = `It's a tie for the contested ${skillName} check between ${characterName} and ${targetCharacter.name}! (${attackerTotal} to ${defenderTotal})`;
                        }

                        addLogEntry({
                            type: 'system',
                            message: resultMessage
                        });
                    }
                });
            } else {
                // Standard roll
                const d20Roll = Math.floor(Math.random() * 20) + 1;
                const total = d20Roll + parseInt(modifier);

                const rollData = {
                    characterName: characterName,
                    playerName: playerName,
                    roll: `d20(${d20Roll}) + ${parseInt(modifier)} for ${skillName}`,
                    sum: total
                };

                addLogEntry(rollData);
                sendDiceRollToPlayerView([d20Roll], total);
            }
        } else if (event.data.type === 'statRoll') {
            const { rollName, modifier } = event.data;
            const character = charactersData.find(c => c.id === selectedCharacterId);
            const characterName = character ? character.name : 'Unknown';
            const playerName = character && character.sheetData ? character.sheetData.player_name : 'DM';
            const characterPortrait = character && character.sheetData ? character.sheetData.character_portrait : null;
            const characterInitials = getInitials(characterName);

            const d20Roll = Math.floor(Math.random() * 20) + 1;
            const total = d20Roll + parseInt(modifier);

            const rollData = {
                characterId: selectedCharacterId,
                characterName: characterName,
                playerName: playerName,
                roll: `d20(${d20Roll}) + ${parseInt(modifier)} for ${rollName}`,
                sum: total,
                characterPortrait: characterPortrait,
                characterInitials: characterInitials
            };

            addLogEntry(rollData);
            sendDiceRollToPlayerView([d20Roll], total);
        } else if (event.data.type === 'saveCharacterRoll') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character) {
                    if (!character.savedRolls) {
                        character.savedRolls = [];
                    }
                    character.savedRolls.push(event.data.roll);
                    propagateCharacterUpdate(selectedCharacterId);
                    loadCharacterIntoEditor(selectedCharacterId); // Reload to show the new roll
                }
            }
        } else if (event.data.type === 'deleteCharacterRoll') {
            if (selectedCharacterId) {
                const character = charactersData.find(c => c.id === selectedCharacterId);
                if (character && character.savedRolls) {
                    character.savedRolls.splice(event.data.index, 1);
                    loadCharacterIntoEditor(selectedCharacterId); // Reload to show the change
                }
            }
        } else if (event.data.type === 'characterSheetRoll') {
            const { rollData } = event.data;
            const character = charactersData.find(c => c.id === selectedCharacterId);
            if (character) {
                 let allRolls = [];
                let totalSum = 0;
                const rollsByDie = {};
                const modifier = rollData.modifier || 0;

                for (const die in rollData.dice) {
                    const count = rollData.dice[die];
                    if (count === 0) continue;

                    const sides = parseInt(die.substring(1), 10);
                    if (isNaN(sides)) continue;

                    if (!rollsByDie[die]) rollsByDie[die] = [];
                    for (let i = 0; i < count; i++) {
                        const roll = Math.floor(Math.random() * sides) + 1;
                        allRolls.push(roll);
                        totalSum += roll;
                        rollsByDie[die].push(roll);
                    }
                }

                totalSum += modifier;

                const detailsParts = [];
                for (const dieName in rollsByDie) {
                    detailsParts.push(`${rollsByDie[dieName].length}${dieName}[${rollsByDie[dieName].join(',')}]`);
                }
                let detailsMessage = `${rollData.name}: ${detailsParts.join(', ')}`;
                if (modifier !== 0) {
                    detailsMessage += ` ${modifier > 0 ? '+' : ''}${modifier}`;
                }

                addLogEntry({
                    characterId: character.id,
                    characterName: character.name,
                    playerName: character.sheetData.player_name || 'DM',
                    roll: detailsMessage,
                    sum: totalSum,
                    characterPortrait: character.sheetData.character_portrait,
                    characterInitials: getInitials(character.name)
                });
                sendDiceRollToPlayerView(allRolls, totalSum);
            }
        }
    });

function generateCharacterMarkdown(sheetData, notes, forPlayerView = false, isDetailsVisible = true) {
    const playerNotes = forPlayerView ? filterPlayerContent(notes) : notes;

    let md = `${playerNotes || ''}\n\n${sheetData.character_portrait ? `![Character Portrait](${sheetData.character_portrait})` : ''}`;

    if (!forPlayerView || (forPlayerView && isDetailsVisible)) {
        md += `

## **Character Information**
| Field | Value |
| :--- | :--- |
| **Character Name** | ${sheetData.char_name || ''} |
| **Class & Level** | ${sheetData.class_level || ''} |
| **Background** | ${sheetData.background || ''} |
| **Player Name** | ${sheetData.player_name || ''} |
| **Race or Species** | ${sheetData.race || ''} |
| **Alignment** | ${sheetData.alignment || ''} |
| **Experience Points** | ${sheetData.xp || ''} |

***

## **Attributes**
| Ability | Score | Modifier |
| :--- | :---: | :---: |
| **Strength** | ${sheetData['strength_score'] || ''} | ${sheetData['strength_modifier'] || '+0'} |
| **Dexterity** | ${sheetData['dexterity_score'] || ''} | ${sheetData['dexterity_modifier'] || '+0'} |
| **Constitution** | ${sheetData['constitution_score'] || ''} | ${sheetData['constitution_modifier'] || '+0'} |
| **Intelligence**| ${sheetData['intelligence_score'] || ''} | ${sheetData['intelligence_modifier'] || '+0'} |
| **Wisdom** | ${sheetData['wisdom_score'] || ''} | ${sheetData['wisdom_modifier'] || '+0'} |
| **Charisma** | ${sheetData['charisma_score'] || ''} | ${sheetData['charisma_modifier'] || '+0'} |

---

## **Combat**
| Field | Value |
| :--- | :---: |
| **Armor Class** | ${sheetData.ac || ''} |
| **Initiative** | ${sheetData.initiative || ''} |
| **Speed** | ${sheetData.speed || ''} |

### **Hit Points**
| Type | Value |
| :--- | :---: |
| **Maximum** | ${sheetData.hp_max || ''} |
| **Current** | ${sheetData.hp_current || ''} |
| **Temporary** | ${sheetData.hp_temp || ''} |

### **Hit Dice**
| Type | Value |
| :--- | :---: |
| **Hit Dice** | ${sheetData.hit_dice_total || ''} |
| **Death Saves (Successes)** | ${sheetData.death_saves_successes || ''} |
| **Death Saves (Failures)** | ${sheetData.death_saves_failures || ''} |

---

## **Saving Throws**
| Saving Throw | Value |
| :--- | :---: |
| **Strength** | ${sheetData.save_strength_mod || ''} |
| **Dexterity** | ${sheetData.save_dexterity_mod || ''} |
| **Constitution** | ${sheetData.save_constitution_mod || ''} |
| **Intelligence** | ${sheetData.save_intelligence_mod || ''} |
| **Wisdom** | ${sheetData.save_wisdom_mod || ''} |
| **Charisma** | ${sheetData.save_charisma_mod || ''} |

---

## **Skills**
| Skill | Value |
| :--- | :---: |
| Acrobatics (Dex) | ${sheetData.skill_acrobatics_mod || ''} |
| Animal Handling (Wis) | ${sheetData.skill_animal_handling_mod || ''} |
| Arcana (Int) | ${sheetData.skill_arcana_mod || ''} |
| Athletics (Str) | ${sheetData.skill_athletics_mod || ''} |
| Deception (Cha) | ${sheetData.skill_deception_mod || ''} |
| History (Int) | ${sheetData.skill_history_mod || ''} |
| Insight (Wis) | ${sheetData.skill_insight_mod || ''} |
| Intimidation (Cha) | ${sheetData.skill_intimidation_mod || ''} |
| Investigation (Int) | ${sheetData.skill_investigation_mod || ''} |
| Medicine (Wis) | ${sheetData.skill_medicine_mod || ''} |
| Nature (Int) | ${sheetData.skill_nature_mod || ''} |
| Perception (Wis) | ${sheetData.skill_perception_mod || ''} |
| Performance (Cha) | ${sheetData.skill_performance_mod || ''} |
| Persuasion (Cha) | ${sheetData.skill_persuasion_mod || ''} |
| Religion (Int) | ${sheetData.skill_religion_mod || ''} |
| Sleight of Hand (Dex) | ${sheetData.skill_sleight_of_hand_mod || ''} |
| Stealth (Dex) | ${sheetData.skill_stealth_mod || ''} |
| Survival (Wis) | ${sheetData.skill_survival_mod || ''} |

---

## **Character Proficiencies**
| Field | Value |
| :--- | :---: |
| **Proficiency Bonus** | ${sheetData.proficiency_bonus || ''} |
| **Passive Perception** | ${sheetData.passive_perception || ''} |
| **Passive Insight** | ${sheetData.passive_insight || ''} |
| **Passive Investigation** | ${sheetData.passive_investigation || ''} |
| **Armor Proficiencies** | ${sheetData.armor_proficiencies || ''} |
| **Weapon Proficiencies**| ${sheetData.weapon_proficiencies || ''} |
| **Tool Proficiencies** | ${sheetData.tool_proficiencies || ''} |
| **Languages** | ${sheetData.languages || ''} |

---

## **Equipment & Features**
| Field | Value |
| :--- | :--- |
| **Attacks & Spellcasting** | ${sheetData.attacks_spellcasting || ''} |
| **Features & Traits** | ${sheetData.features_traits || ''} |
| **Equipment** | ${sheetData.equipment || ''} |

---

## **Character Background**
| Field | Value |
| :--- | :--- |
| **Character Appearance** | ${sheetData.char_appearance || ''} |
| **Character Backstory** | ${sheetData.backstory || ''} |
| **Personality Traits** | ${sheetData.personality_traits || ''} |
| **Ideals** | ${sheetData.ideals || ''} |
| **Bonds** | ${sheetData.bonds || ''} |
| **Flaws** | ${sheetData.flaws || ''} |
`;
    }

    if (easyMDE && easyMDE.options.previewRender) {
        return easyMDE.options.previewRender(md);
    }

    // Fallback for when the main notes editor hasn't been initialized
    const dummyTextarea = document.createElement('textarea');
    dummyTextarea.style.display = 'none'; // Ensure it's not visible
    document.body.appendChild(dummyTextarea); // Append to DOM temporarily

    let html;
    try {
        const tempMDE = new EasyMDE({ element: dummyTextarea });
        html = tempMDE.options.previewRender(md);
        tempMDE.toTextArea(); // Clean up the instance
    } catch (e) {
        console.error("Failed to create temporary EasyMDE instance for markdown rendering:", e);
        // Basic fallback if EasyMDE fails completely, to prevent app crash
        html = md.replace(/\n/g, '<br>');
    } finally {
        document.body.removeChild(dummyTextarea); // Always remove the dummy element
    }
    return html;
}

function renderMarkdown(markdownText) {
    if (easyMDE && easyMDE.options.previewRender) {
        return easyMDE.options.previewRender(markdownText);
    }

    // Fallback for when the main notes editor hasn't been initialized
    const dummyTextarea = document.createElement('textarea');
    dummyTextarea.style.display = 'none';
    document.body.appendChild(dummyTextarea);

    let html;
    try {
        const tempMDE = new EasyMDE({ element: dummyTextarea, autoDownloadFontAwesome: false });
        html = tempMDE.options.previewRender(markdownText);
        tempMDE.toTextArea();
    } catch (e) {
        console.error("Fallback EasyMDE render failed:", e);
        html = markdownText.replace(/\n/g, '<br>');
    } finally {
        document.body.removeChild(dummyTextarea);
    }
    return html;
}

let activeToastTimers = [];

function clearToasts() {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        toastContainer.innerHTML = '';
    }
    activeToastTimers.forEach(timerId => clearTimeout(timerId));
    activeToastTimers = [];
}

function displayToast(messageElement) {
    const toastContainer = document.getElementById('toast-container');
    // Do not show toasts if the container doesn't exist or if the main log is open
    if (!toastContainer || diceDialogueRecord.classList.contains('persistent-log')) {
        return;
    }

    const toastNode = messageElement.cloneNode(true);
    toastNode.classList.add('toast-message');
    toastContainer.appendChild(toastNode);

    const timerId = setTimeout(() => {
        // Add a fade-out animation before removing for a smoother experience
        toastNode.style.animation = 'toast-fade-out 0.5s ease-out forwards';
        toastNode.addEventListener('animationend', () => {
            toastNode.remove();
            const index = activeToastTimers.indexOf(timerId);
            if (index > -1) {
                activeToastTimers.splice(index, 1);
            }
        });
    }, 4500); // Start fade-out at 4.5s for a 5s total lifespan

    activeToastTimers.push(timerId);
}

    function createLogCard(data) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('dice-dialogue-message');
        messageElement.dataset.id = data.id;

        const cardContent = document.createElement('div');
        cardContent.classList.add('dice-roll-card-content'); // Reuse styles
        messageElement.appendChild(cardContent);

        let detailsPara;

        if (data.type === 'roll') {
            const profilePic = document.createElement('div');
            profilePic.classList.add('dice-roll-profile-pic');
            if (data.characterPortrait) {
                profilePic.style.backgroundImage = `url('${data.characterPortrait}')`;
            } else {
                profilePic.textContent = data.characterInitials || '??';
            }
            cardContent.appendChild(profilePic);

            const textContainer = document.createElement('div');
            textContainer.classList.add('dice-roll-text-container');
            cardContent.appendChild(textContainer);

            const namePara = document.createElement('p');
            namePara.classList.add('dice-roll-name');
            namePara.innerHTML = `<strong>${data.characterName}</strong> played by <strong>${data.playerName}</strong>`;
            textContainer.appendChild(namePara);

            detailsPara = document.createElement('p');
            detailsPara.classList.add('dice-roll-details');
            detailsPara.innerHTML = `<strong class="dice-roll-sum-text">${data.sum}</strong> | ${data.roll}`;
            textContainer.appendChild(detailsPara);

            const timestampPara = document.createElement('p');
            timestampPara.classList.add('dice-roll-timestamp');
            timestampPara.textContent = data.timestamp;
            textContainer.appendChild(timestampPara);

        } else { // System or Note
            detailsPara = document.createElement('p');
            detailsPara.classList.add('dice-roll-details');
             if (data.type === 'dm-note') {
                detailsPara.innerHTML = `<strong>DM Note:</strong> ${data.message}`;
            } else {
                detailsPara.innerHTML = data.message;
            }
            cardContent.appendChild(detailsPara);

            const timestampPara = document.createElement('p');
            timestampPara.classList.add('dice-roll-timestamp');
            timestampPara.textContent = data.timestamp;
            cardContent.appendChild(timestampPara);
        }

        const actionContainer = document.createElement('div');
        actionContainer.classList.add('dice-roll-actions');
        actionContainer.innerHTML = `
            <span class="action-icon edit-log" title="Edit Entry">✏️</span>
            <span class="action-icon save-log" title="Save Entry" style="display: none;">💾</span>
            <span class="action-icon delete-log" title="Delete Entry">🗑️</span>
        `;
        cardContent.appendChild(actionContainer);

        return messageElement;
    }

    function renderActionLog() {
        const logContentContainer = document.getElementById('action-log-content');
        if (!logContentContainer) return;

        logContentContainer.innerHTML = '';
        diceRollHistory.forEach(item => {
            const messageElement = createLogCard(item);
            logContentContainer.prepend(messageElement);
        });
    }

    function addLogEntry(data, automationActionId = null) {
        if (!diceDialogueRecord) return;

        // Add timestamp and ID
        const timestamp = new Date();
        const hours = timestamp.getHours();
        const minutes = timestamp.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        data.timestamp = `${(timestamp.getMonth() + 1).toString().padStart(2, '0')}.${timestamp.getDate().toString().padStart(2, '0')}.${timestamp.getFullYear().toString().slice(-2)} | ${formattedHours}:${formattedMinutes}${ampm}`;
        data.id = timestamp.getTime() + Math.random();
        if (automationActionId) {
            data.automationActionId = automationActionId;
        }

        // Set type if not present
        if (!data.type) {
            data.type = 'roll';
        }

        diceRollHistory.push(data);

        const messageElement = createLogCard(data);

        if (diceDialogueRecord.classList.contains('persistent-log')) {
            const logContentContainer = document.getElementById('action-log-content');
            if (logContentContainer) {
                logContentContainer.prepend(messageElement);
            }
            sendActionLogStateToPlayerView(true);
        }

        displayToast(messageElement);
        sendToastToPlayerView(data);
    }

    function sendDiceMenuStateToPlayerView(isOpen) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({ type: 'diceMenuState', isOpen: isOpen }, '*');
        }
    }

    function sendDiceRollToPlayerView(results, sum) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.postMessage({ type: 'diceRoll', results: results, sum: sum }, '*');
        }
    }

    function renderSavedRolls() {
        if (!savedRollsList) return;
        savedRollsList.innerHTML = '';

        if (savedRolls.length === 0) {
            const placeholder = document.createElement('li');
            placeholder.textContent = 'No rolls saved yet.';
            placeholder.style.color = '#a0b4c9';
            savedRollsList.appendChild(placeholder);
            return;
        }

        savedRolls.forEach((savedRoll, index) => {
            const listItem = document.createElement('li');
            listItem.style.display = 'flex';
            listItem.style.justifyContent = 'space-between';
            listItem.style.alignItems = 'center';
            listItem.style.marginBottom = '10px';
            listItem.dataset.index = index;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = savedRoll.name;
            listItem.appendChild(nameSpan);

            const buttonsDiv = document.createElement('div');
            const rollBtn = document.createElement('button');
            rollBtn.textContent = 'Roll';
            rollBtn.dataset.action = 'roll';
            rollBtn.style.marginRight = '5px';
            buttonsDiv.appendChild(rollBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Del';
            deleteBtn.dataset.action = 'delete';
            buttonsDiv.appendChild(deleteBtn);

            listItem.appendChild(buttonsDiv);
            savedRollsList.appendChild(listItem);
        });
    }

    if (saveRollButton) {
        saveRollButton.addEventListener('click', () => {
            const name = saveRollNameInput.value.trim();
            if (!name) {
                alert('Please enter a name for the roll.');
                return;
            }

            const currentDice = { ...diceCounts };
            const hasDice = Object.values(currentDice).some(count => count > 0);

            if (!hasDice) {
                alert('Please select at least one die to save.');
                return;
            }

            const modifier = parseInt(modifierInput.value, 10) || 0;
            savedRolls.push({ name: name, dice: currentDice, modifier: modifier });
            saveRollNameInput.value = '';
            renderSavedRolls();
        });
    }

    if (savedRollsList) {
        savedRollsList.addEventListener('click', (event) => {
            const target = event.target;
            const action = target.dataset.action;
            const listItem = target.closest('li');
            if (!action || !listItem) return;

            const index = parseInt(listItem.dataset.index, 10);
            if (isNaN(index) || index >= savedRolls.length) return;

            if (action === 'roll') {
                const savedRoll = savedRolls[index];
                let allRolls = [];
                let totalSum = 0;
                const rollsByDie = {};
                const modifier = savedRoll.modifier || 0;

                for (const die in savedRoll.dice) {
                    const count = savedRoll.dice[die];
                    if (count === 0) continue;

                    let sides;
                    let dieName = die;
                    if (die === 'd_custom') {
                        sides = parseInt(customDieInput.value, 10);
                        if (isNaN(sides) || sides < 2 || sides > 1000) continue;
                        dieName = `d${sides}`;
                    } else {
                        sides = parseInt(die.substring(1), 10);
                    }

                    if (!rollsByDie[dieName]) rollsByDie[dieName] = [];
                    for (let i = 0; i < count; i++) {
                        const roll = Math.floor(Math.random() * sides) + 1;
                        allRolls.push(roll);
                        totalSum += roll;
                        rollsByDie[dieName].push(roll);
                    }
                }

                totalSum += modifier;

                const detailsParts = [];
                for (const dieName in rollsByDie) {
                    detailsParts.push(`${dieName}[${rollsByDie[dieName].join(',')}]`);
                }
                let detailsMessage = `${savedRoll.name}: ${detailsParts.join(', ')}`;
                if (modifier !== 0) {
                    detailsMessage += ` ${modifier > 0 ? '+' : ''}${modifier}`;
                }

                diceResultSum.textContent = totalSum;
                diceResultDetails.textContent = detailsMessage;
                addLogEntry({
                    characterName: 'Dice Roller',
                    playerName: 'DM',
                    roll: detailsMessage,
                    sum: totalSum
                });
                sendDiceRollToPlayerView(allRolls, totalSum);

            } else if (action === 'delete') {
                if (confirm(`Are you sure you want to delete the "${savedRolls[index].name}" roll?`)) {
                    savedRolls.splice(index, 1);
                    renderSavedRolls();
                }
            }
        });
    }

    const diceCounts = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, d_custom: 0 };
    const diceButtons = document.querySelectorAll('.dice-button');
    const rollButton = document.getElementById('roll-button');
    const diceResultSum = document.getElementById('dice-result-sum');
    const diceResultDetails = document.getElementById('dice-result-details');
    const customDieInput = document.getElementById('custom-die-input');
    const modifierInput = document.getElementById('dice-roll-modifier-input');

    function updateDiceCountDisplay(die) {
        const count = diceCounts[die];
        const span = document.querySelector(`.dice-button[data-die="${die}"] .dice-count`);
        if (span) {
            span.textContent = count > 0 ? `+${count}` : '';
        } else if (die === 'd_custom') {
            const customSpan = document.querySelector('.dice-count[data-die-custom]');
            if (customSpan) {
                customSpan.textContent = count > 0 ? `+${count}` : '';
            }
        }
    }

    diceButtons.forEach(button => {
        const die = button.dataset.die;
        button.addEventListener('click', () => {
            diceCounts[die]++;
            updateDiceCountDisplay(die);
        });

        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (diceCounts[die] > 0) {
                diceCounts[die]--;
                updateDiceCountDisplay(die);
            }
        });
    });

    if (rollButton) {
        rollButton.addEventListener('click', () => {
            let allRolls = [];
            let totalSum = 0;
            const rollsByDie = {};

            for (const die in diceCounts) {
                const count = diceCounts[die];
                if (count === 0) continue;

                let sides;
                let dieName = die;
                if (die === 'd_custom') {
                    sides = parseInt(customDieInput.value, 10);
                    if (isNaN(sides) || sides < 2 || sides > 1000) {
                        alert("Custom die must have between 2 and 1000 sides.");
                        continue;
                    }
                    dieName = `d${sides}`;
                } else {
                    sides = parseInt(die.substring(1), 10);
                }

                if (!rollsByDie[dieName]) {
                    rollsByDie[dieName] = [];
                }

                for (let i = 0; i < count; i++) {
                    const roll = Math.floor(Math.random() * sides) + 1;
                    allRolls.push(roll);
                    totalSum += roll;
                    rollsByDie[dieName].push(roll);
                }
            }

            const modifier = parseInt(modifierInput.value, 10) || 0;
            totalSum += modifier;
            diceResultSum.textContent = totalSum;

            const detailsParts = [];
            for (const dieName in rollsByDie) {
                detailsParts.push(`${dieName}[${rollsByDie[dieName].join(',')}]`);
            }
            let detailsMessage = `Custom: ${detailsParts.join(', ')}`;
            if (modifier !== 0) {
                detailsMessage += ` ${modifier > 0 ? '+' : ''}${modifier}`;
            }
            diceResultDetails.textContent = detailsMessage;

            addLogEntry({
                characterName: 'Dice Roller',
                playerName: 'DM',
                roll: detailsMessage,
                sum: totalSum
            });

            sendDiceRollToPlayerView(allRolls, totalSum);

            for (const die in diceCounts) {
                diceCounts[die] = 0;
                updateDiceCountDisplay(die);
            }
        });
    }

    function updateFooterControlsVisibility() {
        const isFooterVisible = dmFloatingFooter.classList.contains('visible');

        if (footerInitiativeControls) {
            footerInitiativeControls.style.display = (initiativeTurn !== -1 && !isFooterVisible) ? 'flex' : 'none';
        }
        if (footerWanderControls) {
            footerWanderControls.style.display = (isWandering && !isFooterVisible) ? 'block' : 'none';
        }
    }

    if (diceRollerIcon) {
        diceRollerIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            if (dmFloatingFooter) {
                dmFloatingFooter.classList.toggle('visible');
                updateFooterControlsVisibility();
            }
        });
    }

    if (footerPrevTurnButton && prevTurnButton) {
        footerPrevTurnButton.addEventListener('click', () => prevTurnButton.click());
    }
    if (footerNextTurnButton && nextTurnButton) {
        footerNextTurnButton.addEventListener('click', () => nextTurnButton.click());
    }
    if (footerStopInitiativeButton && startInitiativeButton) {
        footerStopInitiativeButton.addEventListener('click', () => startInitiativeButton.click());
    }
    if (footerStopWanderButton && wanderButton) {
        footerStopWanderButton.addEventListener('click', () => wanderButton.click());
    }

    if (dmToolsList) {
        dmToolsList.addEventListener('click', (event) => {
            const target = event.target.closest('li');
            if (!target) return;

            const action = target.dataset.action;
            if (action) {
                if (dmFloatingFooter) {
                    dmFloatingFooter.classList.remove('visible');
                }
                // sendDiceIconMenuStateToPlayerView(false);

                switch (action) {
                    case 'open-initiative-tracker':
                        if (initiativeTrackerOverlay) {
                            initiativeTrackerOverlay.style.display = 'flex';
                            if (!initiativeTrackerOverlay.querySelector('.overlay-minimize-button')) {
                                const minimizeButton = document.createElement('button');
                                minimizeButton.className = 'overlay-minimize-button';
                                minimizeButton.textContent = '—';
                                minimizeButton.onclick = () => {
                                    initiativeTrackerOverlay.style.display = 'none';
                                    sendInitiativeTrackerStateToPlayerView(false);
                                };
                                initiativeTrackerOverlay.querySelector('.overlay-content').prepend(minimizeButton);
                            }
                            renderInitiativeMasterList();
                            sendInitiativeTrackerStateToPlayerView(true);
                            sendInitiativeDataToPlayerView();
                        }
                        break;
                    case 'open-dice-roller':
                        if (diceRollerOverlay) {
                            diceRollerOverlay.style.display = 'flex';
                             if (!diceRollerOverlay.querySelector('.overlay-minimize-button')) {
                                const minimizeButton = document.createElement('button');
                                minimizeButton.className = 'overlay-minimize-button';
                                minimizeButton.textContent = '—';
                                minimizeButton.onclick = () => {
                                    diceRollerOverlay.style.display = 'none';
                                    sendDiceMenuStateToPlayerView(false);
                                };
                                diceRollerOverlay.querySelector('.overlay-content').prepend(minimizeButton);
                            }
                            sendDiceMenuStateToPlayerView(true);
                        }
                        break;
                    case 'open-action-log':
                        if (diceDialogueRecord) {
                            clearToasts();
                            diceDialogueRecord.classList.add('persistent-log');
                            diceDialogueRecord.style.display = 'flex';

                            // Ensure the structured layout exists
                            if (!document.getElementById('action-log-header')) {
                                diceDialogueRecord.innerHTML = ''; // Clear before structuring

                                // Header
                                const header = document.createElement('div');
                                header.id = 'action-log-header';

                                const noteInput = document.createElement('input');
                                noteInput.type = 'text';
                                noteInput.id = 'action-log-note-input';
                                noteInput.placeholder = 'Add a quick note...';
                                header.appendChild(noteInput);

                                const addNoteBtn = document.createElement('button');
                                addNoteBtn.id = 'action-log-add-note-btn';
                                addNoteBtn.textContent = 'Add';
                                addNoteBtn.addEventListener('click', () => {
                                    if (noteInput.value.trim()) {
                                        createLogEntry(noteInput.value.trim(), 'note');
                                        noteInput.value = '';
                                    }
                                });
                                header.appendChild(addNoteBtn);

                                const minimizeButton = document.createElement('button');
                                minimizeButton.id = 'action-log-minimize-button';
                                minimizeButton.textContent = '—';
                                minimizeButton.onclick = () => {
                                    diceDialogueRecord.classList.remove('persistent-log');
                                    diceDialogueRecord.style.display = 'none';
                                    sendActionLogStateToPlayerView(false);
                                };
                                header.appendChild(minimizeButton);

                                // Content
                                const content = document.createElement('div');
                                content.id = 'action-log-content';

                                diceDialogueRecord.appendChild(header);
                                diceDialogueRecord.appendChild(content);

                                // Re-populate content from history
                                diceRollHistory.forEach(item => {
                                    const messageElement = createLogCard(item);
                                    content.prepend(messageElement);
                                });
                            }
                            sendActionLogStateToPlayerView(true);
                        }
                        break;
                }
            }
        });
    }

    if (diceRollerOverlay) {
        diceRollerOverlay.addEventListener('click', (event) => {
            if (event.target === diceRollerOverlay) {
                diceRollerOverlay.style.display = 'none';
                sendDiceMenuStateToPlayerView(false);
            }
        });
    }

    // --- Initiative Tracker Logic ---

    function rollInitiativeForCharacter(character, newInitiative = null) {
        const initiativeBonus = parseInt(character.sheetData?.initiative || 0, 10);
        let roll;
        let total;

        if (newInitiative !== null) {
            total = newInitiative;
            roll = newInitiative - initiativeBonus;
        } else {
            roll = Math.floor(Math.random() * 20) + 1;
            total = roll + initiativeBonus;
        }

        const characterName = character.name || 'Unknown';
        const playerName = character.sheetData?.player_name || 'DM';
        const characterPortrait = character.sheetData?.character_portrait || null;
        const characterInitials = getInitials(characterName);

        const rollData = {
            characterId: character.id,
            characterName: characterName,
            playerName: playerName,
            roll: `d20(${roll}) + ${initiativeBonus} for Initiative`,
            sum: total,
            characterPortrait: characterPortrait,
            characterInitials: characterInitials
        };

        addLogEntry(rollData);
        sendDiceRollToPlayerView([roll], total);
        return total;
    }

    function addCharacterToInitiative(character) {
        const characterId = character.id;
        const existingInstances = activeInitiative.filter(c => c.id === characterId);
        const count = existingInstances.length;

        if (count === 0) {
            // First instance: shallow copy, linked to the original character sheet.
            const newInitiativeCharacter = { ...character, initiative: null, uniqueId: Date.now(), isTokenCopy: false };
            activeInitiative.push(newInitiativeCharacter);
        } else {
            // Subsequent instances: deep copy, becomes a temporary token.
            const newInitiativeCharacter = JSON.parse(JSON.stringify(character));

            newInitiativeCharacter.uniqueId = Date.now() + Math.random(); // Use random to ensure uniqueness
            newInitiativeCharacter.isTokenCopy = true;

            const firstName = character.name.split(' ')[0];
            newInitiativeCharacter.name = `Token${count} ${firstName}`;

            newInitiativeCharacter.initiative = null; // Reset initiative for the new token

            activeInitiative.push(newInitiativeCharacter);
        }
        renderActiveInitiativeList();
    }

    function renderInitiativeMasterList() {
        if (!masterCharacterList) return;
        masterCharacterList.innerHTML = '';
        charactersData.forEach(character => {
            const card = createInitiativeCharacterCard(character);
            card.dataset.characterId = character.id;
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                addCharacterToInitiative(character);
            });
            masterCharacterList.appendChild(card);
        });
    }

    function getInitials(name) {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
        }
        return name.substring(0, 2);
    }

    function createInitiativeCharacterCard(character) {
        const li = document.createElement('li');
        li.className = 'initiative-character-card';

        if (character.sheetData?.character_portrait) {
            const portrait = document.createElement('img');
            portrait.src = character.sheetData.character_portrait;
            li.appendChild(portrait);
        } else {
            const initials = document.createElement('div');
            initials.className = 'initiative-character-initials';
            initials.textContent = getInitials(character.name);
            li.appendChild(initials);
        }

        const info = document.createElement('div');
        info.className = 'initiative-character-info';

        const name = document.createElement('h4');
        name.textContent = character.name;
        info.appendChild(name);

        const details = document.createElement('p');
        details.textContent = `${character.sheetData?.class_level || 'N/A'} ${character.sheetData?.race || ''} ${character.sheetData?.class_level || ''}`;
        info.appendChild(details);

        li.appendChild(info);

        const hp = document.createElement('div');
        hp.className = 'initiative-character-hp';
        hp.innerHTML = `HP: <input type="number" value="${character.sheetData?.hp_current || ''}" style="width: 50px;" data-character-id="${character.uniqueId}" data-hp-input /> / ${character.sheetData?.hp_max || 'N/A'}`;
        li.appendChild(hp);

        const damageDealt = document.createElement('div');
        damageDealt.className = 'initiative-character-damage';
        damageDealt.innerHTML = `Dmg Dealt: <input type="number" value="0" style="width: 50px;" data-character-id="${character.uniqueId}" data-damage-input />`;
        li.appendChild(damageDealt);

        const initiativeValue = document.createElement('div');
        initiativeValue.className = 'initiative-value';
        initiativeValue.textContent = '-';
        li.appendChild(initiativeValue);

        return li;
    }

    function handleInitiativeDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.characterId);
        e.target.classList.add('dragging');
    }

    if(activeInitiativeList) {
        activeInitiativeList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        activeInitiativeList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            if(draggingElement) {
                draggingElement.classList.remove('dragging');
            }

            const characterId = e.dataTransfer.getData('text/plain');

            const existingCharacter = activeInitiative.find(c => c.uniqueId == characterId);

            if(existingCharacter) {
                const newIndex = Array.from(activeInitiativeList.children).indexOf(e.target.closest('.initiative-character-card'));
                const oldIndex = activeInitiative.indexOf(existingCharacter);
                activeInitiative.splice(oldIndex, 1);
                activeInitiative.splice(newIndex, 0, existingCharacter);
            } else {
                const character = charactersData.find(c => c.id == characterId);
                if (character) {
                    addCharacterToInitiative(character);
                }
            }
        });

        activeInitiativeList.addEventListener('dragenter', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(activeInitiativeList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                activeInitiativeList.appendChild(draggable);
            } else {
                activeInitiativeList.insertBefore(draggable, afterElement);
            }
        });
    }

    function renderActiveInitiativeList() {
        if (!activeInitiativeList) return;
        activeInitiativeList.innerHTML = '';
        activeInitiative.forEach(character => {
            const card = createInitiativeCharacterCard(character);
            card.dataset.uniqueId = character.uniqueId;
            card.draggable = true;

            const initiativeValueDiv = card.querySelector('.initiative-value');
            initiativeValueDiv.textContent = character.initiative ?? '-';
            initiativeValueDiv.contentEditable = true;
            initiativeValueDiv.addEventListener('blur', (e) => {
                const newInitiativeValue = parseInt(e.target.textContent, 10);
                if (!isNaN(newInitiativeValue)) {
                    character.initiative = rollInitiativeForCharacter(character, newInitiativeValue);
                } else {
                    character.initiative = null;
                }
                sortActiveInitiative();
                renderActiveInitiativeList();
            });

            const hpInput = card.querySelector('[data-hp-input]');
            hpInput.addEventListener('change', (e) => {
                const charInInitiative = activeInitiative.find(c => c.uniqueId == e.target.dataset.characterId);
                if (charInInitiative) {
                    const newHp = e.target.value;
                    // Update the character in the active initiative list
                    charInInitiative.sheetData.hp_current = newHp;

                    // Find and update the corresponding character in the master list, but only if it's not a temporary copy.
                    if (!charInInitiative.isTokenCopy) {
                        const mainCharacter = charactersData.find(c => c.id === charInInitiative.id);
                        if (mainCharacter) {
                            if (!mainCharacter.sheetData) mainCharacter.sheetData = {};
                            mainCharacter.sheetData.hp_current = newHp;
                        }
                    }

                    // Let the player view know about the change
                    sendInitiativeDataToPlayerView();
                }
            });

            const damageInput = card.querySelector('[data-damage-input]');
            damageInput.addEventListener('change', (e) => {
                const char = activeInitiative.find(c => c.uniqueId == e.target.dataset.characterId);
                if(char) {
                    char.damageDealt = e.target.value;
                }
            });

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.uniqueId);
                e.target.classList.add('dragging');
            });
            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            activeInitiativeList.appendChild(card);
        });
        sendInitiativeDataToPlayerView();
    }

    function sortActiveInitiative() {
        activeInitiative.sort((a, b) => {
            if (b.initiative === null) return -1;
            if (a.initiative === null) return 1;
            return b.initiative - a.initiative;
        });
    }

    if(initiativeTrackerOverlay) {
        initiativeTrackerOverlay.addEventListener('click', (event) => {
            if (event.target === initiativeTrackerOverlay) {
                initiativeTrackerOverlay.style.display = 'none';
                sendInitiativeTrackerStateToPlayerView(false);
            }
        });
    }

    if(autoInitiativeButton) {
        autoInitiativeButton.addEventListener('click', () => {
            activeInitiative.forEach(character => {
                character.initiative = rollInitiativeForCharacter(character);
            });
            sortActiveInitiative();
            renderActiveInitiativeList();
        });
    }

    if(saveInitiativeButton) {
        saveInitiativeButton.addEventListener('click', () => {
            const name = saveInitiativeNameInput.value.trim();
            if (!name) {
                alert("Please enter a name for the initiative to save it.");
                return;
            }
            savedInitiatives[name] = JSON.parse(JSON.stringify(activeInitiative));
            renderSavedInitiativesList();
        });
    }

    if(loadInitiativeButton) {
        loadInitiativeButton.addEventListener('click', () => {
            const selectedItem = savedInitiativesList.querySelector('.selected');
            if (selectedItem) {
                const name = selectedItem.dataset.name;
                activeInitiative = JSON.parse(JSON.stringify(savedInitiatives[name]));
                initiativeTrackerTitle.textContent = name;
                saveInitiativeNameInput.value = name;
                renderActiveInitiativeList();
            } else {
                alert("Please select a saved initiative to load.");
            }
        });
    }

    function renderSavedInitiativesList() {
        if (!savedInitiativesList) return;
        savedInitiativesList.innerHTML = '';
        Object.keys(savedInitiatives).forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.name = name;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.classList.add('delete-initiative-button');
            deleteButton.style.marginLeft = '10px';
            deleteButton.onclick = (e) => {
                e.stopPropagation(); // prevent the li click event from firing
                if (confirm(`Are you sure you want to delete the initiative "${name}"?`)) {
                    delete savedInitiatives[name];
                    renderSavedInitiativesList();
                }
            };

            li.appendChild(deleteButton);

            li.addEventListener('click', () => {
                const current = savedInitiativesList.querySelector('.selected');
                if (current) current.classList.remove('selected');
                li.classList.add('selected');
            });
            savedInitiativesList.appendChild(li);
        });
    }

    function updateRealTimeTimer() {
        const elapsedSeconds = Math.floor((Date.now() - initiativeStartTime) / 1000);
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        realTimeTimer.textContent =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateGameTimeTimer() {
        gameTimeTimer.textContent = `${gameTime}s`;
    }

    function createLogEntry(message, type = 'system') {
        addLogEntry({
            type: type,
            message: message
        });
    }

    function createSurvivorStatus() {
        let message = '<strong>Survivor Status:</strong><ul>';
        activeInitiative.forEach(char => {
            message += `<li>${char.name}: HP ${char.startingHP} -> ${char.sheetData.hp_current}, Damage Dealt: ${char.damageDealt}</li>`;
        });
        message += '</ul>';
        createLogEntry(message);
    }

    function startInitiativeEncounter(automationActionId = null) {
        if (activeInitiative.length === 0) {
            alert("Please add characters to the initiative before starting.");
            return;
        }
        if (initiativeTurn === -1) { // Starting initiative
            if (isWandering) {
                isWandering = false;
                wanderButton.textContent = 'Wander';
            }

            initiativeTurn = 0;
            initiativeRound = 1;
            gameTime = 0;

            activeInitiative.forEach(character => {
                character.startingHP = character.sheetData.hp_current;
                character.damageDealt = 0;
            });

            initiativeStartTime = Date.now();
            realTimeInterval = setInterval(updateRealTimeTimer, 1000);
            initiativeTimers.style.display = 'flex';
            updateGameTimeTimer();

            createLogEntry({ type: 'system', message: "Combat Started" }, automationActionId);

            startInitiativeButton.textContent = 'Stop Initiative';
            nextTurnButton.style.display = 'inline-block';
            prevTurnButton.style.display = 'inline-block';

            initiativeTokens = [];
            let tokenX = 50;
            let tokenY = 50;
            let tokenPixelSize = (mapIconSize / 100) * (currentMapDisplayData.imgWidth || 1000);

            activeInitiative.forEach(character => {
                const token = {
                    characterId: character.id,
                    uniqueId: character.uniqueId,
                    x: tokenX,
                    y: tokenY,
                    size: mapIconSize,
                    name: character.name,
                    playerName: character.sheetData.player_name,
                    portrait: character.sheetData.character_portrait,
                    initials: getInitials(character.name),
                    isDetailsVisible: character.isDetailsVisible,
                    vision: character.vision
                };
                initiativeTokens.push(token);
                tokenX += tokenPixelSize + 10;
            });

            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            }

            requestFogOfWarUpdate();
            highlightActiveTurn();
            sendInitiativeDataToPlayerView();
        } else { // Stopping initiative
            initiativeTokens = [];
            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            }
            clearInterval(realTimeInterval);
            const elapsedSeconds = Math.floor((Date.now() - initiativeStartTime) / 1000);
            const elapsedFormatted = new Date(elapsedSeconds * 1000).toISOString().substr(11, 8);
            createLogEntry(`Combat Ended. Real Time: ${elapsedFormatted}, Game Time: ${gameTime}s`);
            createSurvivorStatus();

            initiativeTurn = -1;
            initiativeStartTime = null;
            initiativeTimers.style.display = 'none';
            startInitiativeButton.textContent = 'Start Initiative';
            nextTurnButton.style.display = 'none';
            prevTurnButton.style.display = 'none';
            clearTurnHighlight();

            // Hide token stat block on both DM and player views when initiative ends
            if (selectedTokenForStatBlock) {
                tokenStatBlock.style.display = 'none';
                selectedTokenForStatBlock = null;
                sendTokenStatBlockStateToPlayerView(false);
            }

            sendInitiativeDataToPlayerView();
            if (automationActionId === null) { // Manual stop
                hasDeviatedFromAutomation = true;
            }
            updatePreviousButtonState();
        }
        updateFooterControlsVisibility();
    }

    if(startInitiativeButton) {
        startInitiativeButton.addEventListener('click', () => {
            startInitiativeEncounter();
        });
    }

    function startWandering(automationActionId = null) {
        if (isWandering) {
            // Stop Wandering
            isWandering = false;
            wanderButton.textContent = 'Wander';
            initiativeTokens = [];
            createLogEntry({ type: 'system', message: "Stopped Wandering" });

            // Hide token stat block on both DM and player views when wandering ends
            if (selectedTokenForStatBlock) {
                tokenStatBlock.style.display = 'none';
                selectedTokenForStatBlock = null;
                sendTokenStatBlockStateToPlayerView(false);
            }

            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            }
            sendInitiativeDataToPlayerView();
            if (automationActionId === null) { // Manual stop
                hasDeviatedFromAutomation = true;
            }
            updatePreviousButtonState();
        } else {
            // Start Wandering
            if (activeInitiative.length === 0) {
                alert("Please add characters to the initiative list before starting to wander.");
                return;
            }
            // Stop initiative if it's running
            if (initiativeTurn !== -1) {
                clearInterval(realTimeInterval);
                initiativeTurn = -1;
                initiativeStartTime = null;
                initiativeTimers.style.display = 'none';
                startInitiativeButton.textContent = 'Start Initiative';
                nextTurnButton.style.display = 'none';
                prevTurnButton.style.display = 'none';
                clearTurnHighlight();
            }

            isWandering = true;
            wanderButton.textContent = 'Stop Wandering';

            initiativeTokens = [];
            let tokenX = 50;
            let tokenY = 50;
            let tokenPixelSize = (mapIconSize / 100) * (currentMapDisplayData.imgWidth || 1000);

            activeInitiative.forEach(character => {
                const token = {
                    characterId: character.id,
                    uniqueId: character.uniqueId,
                    x: tokenX,
                    y: tokenY,
                    size: mapIconSize,
                    name: character.name,
                    playerName: character.sheetData.player_name,
                    portrait: character.sheetData.character_portrait,
                    initials: getInitials(character.name),
                    isDetailsVisible: character.isDetailsVisible,
                    vision: character.vision
                };
                initiativeTokens.push(token);
                tokenX += tokenPixelSize + 10;
            });

            if (selectedMapFileName) {
                displayMapOnCanvas(selectedMapFileName);
            }

            requestFogOfWarUpdate();
            createLogEntry({ type: 'system', message: "Characters are Wandering" }, automationActionId);
            sendInitiativeDataToPlayerView();
        }
        updateFooterControlsVisibility();
    }

    if (wanderButton) {
        wanderButton.addEventListener('click', () => {
            startWandering();
        });
    }

    if(nextTurnButton) {
        nextTurnButton.addEventListener('click', () => {
            if(initiativeTurn !== -1) {
                initiativeTurn = (initiativeTurn + 1) % activeInitiative.length;
                if (initiativeTurn === 0) {
                    initiativeRound++;
                    gameTime += 6;
                    updateGameTimeTimer();
                    createLogEntry(`Round ${initiativeRound} Started`);
                }
                highlightActiveTurn();
                requestFogOfWarUpdate();
                sendInitiativeDataToPlayerView();
                updateFooterControlsVisibility();
            }
        });
    }

    if(prevTurnButton) {
        prevTurnButton.addEventListener('click', () => {
            if(initiativeTurn !== -1) {
                initiativeTurn = (initiativeTurn - 1 + activeInitiative.length) % activeInitiative.length;
                highlightActiveTurn();
                requestFogOfWarUpdate();
                sendInitiativeDataToPlayerView();
                updateFooterControlsVisibility();
            }
        });
    }

    function highlightActiveTurn() {
        clearTurnHighlight();
        if (activeInitiative.length > 0) {
            const card = activeInitiativeList.querySelector(`[data-unique-id="${activeInitiative[initiativeTurn].uniqueId}"]`);
            if (card) {
                card.classList.add('active-turn');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        if (selectedMapFileName) {
            displayMapOnCanvas(selectedMapFileName);
        }
    }

    function clearTurnHighlight() {
        const highlighted = activeInitiativeList.querySelector('.active-turn');
        if (highlighted) {
            highlighted.classList.remove('active-turn');
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.initiative-character-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    document.body.addEventListener('drop', (e) => {
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement && !activeInitiativeList.contains(e.target) && !masterCharacterList.contains(e.target)) {
            const uniqueId = draggingElement.dataset.uniqueId;
            const index = activeInitiative.findIndex(c => c.uniqueId == uniqueId);
            if (index > -1) {
                activeInitiative.splice(index, 1);
                renderActiveInitiativeList();
            }
        }
    });

    document.body.addEventListener('dragover', e => {
        e.preventDefault();
    });

    if (mapIconSizeSlider && mapIconSizeValue) {
        mapIconSizeSlider.addEventListener('input', (e) => {
            mapIconSize = parseInt(e.target.value, 10);
            mapIconSizeValue.textContent = `${mapIconSize}%`;
            if (initiativeTokens.length > 0) {
                initiativeTokens.forEach(token => {
                    token.size = mapIconSize;
                });
                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
            }
        });
    }

    if (diceDialogueRecord) {
        diceDialogueRecord.addEventListener('click', (event) => {
            const target = event.target;
            const messageElement = target.closest('.dice-dialogue-message');
            if (!messageElement) return;

            const logId = messageElement.dataset.id;
            const historyIndex = diceRollHistory.findIndex(item => String(item.id) === String(logId));
            if (historyIndex === -1) return;

            const detailsPara = messageElement.querySelector('.dice-roll-details');
            const editIcon = messageElement.querySelector('.edit-log');
            const saveIcon = messageElement.querySelector('.save-log');

            if (target.classList.contains('delete-log')) {
                // Handle Delete
                if (confirm('Are you sure you want to delete this log entry?')) {
                    diceRollHistory.splice(historyIndex, 1);
                    messageElement.remove();
                    if (diceDialogueRecord.classList.contains('persistent-log')) {
                       sendActionLogStateToPlayerView(true);
                    }
                }
            } else if (target.classList.contains('edit-log')) {
                // Handle Edit
                detailsPara.contentEditable = true;
                detailsPara.focus();
                editIcon.style.display = 'none';
                saveIcon.style.display = 'inline';
            } else if (target.classList.contains('save-log')) {
                // Handle Save
                detailsPara.contentEditable = false;
                editIcon.style.display = 'inline';
                saveIcon.style.display = 'none';

                const newText = detailsPara.innerText;

                if (diceRollHistory[historyIndex].type === 'roll') {
                    const separatorIndex = newText.indexOf('|');
                    let newSum, newRoll;
                    if (separatorIndex !== -1) {
                        newSum = newText.substring(0, separatorIndex).trim();
                        newRoll = newText.substring(separatorIndex + 1).trim();
                    } else {
                        newSum = '';
                        newRoll = newText;
                    }
                    diceRollHistory[historyIndex].sum = newSum;
                    diceRollHistory[historyIndex].roll = newRoll;
                    detailsPara.innerHTML = `<strong class="dice-roll-sum-text">${newSum}</strong> | ${newRoll}`;
                } else {
                    diceRollHistory[historyIndex].message = newText;
                    detailsPara.innerHTML = newText;
                }

                if (diceDialogueRecord.classList.contains('persistent-log')) {
                   sendActionLogStateToPlayerView(true);
                }
            }
        });
    }

    // --- Campaign Timer Logic ---
    const campaignTimerDisplay = document.getElementById('campaign-timer-display');
    const campaignTimerToggle = document.getElementById('campaign-timer-toggle');

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateCampaignTimerDisplay() {
        if (campaignTimerDisplay) {
            campaignTimerDisplay.textContent = formatTime(campaignTime);
        }
    }

    function toggleCampaignTimer() {
        isCampaignTimerPaused = !isCampaignTimerPaused;
        if (!isCampaignTimerPaused) {
            campaignTimerToggle.textContent = 'Pause Campaign';
            addLogEntry({ type: 'system', message: 'Campaign timer has been resumed.' });
            campaignTimerInterval = setInterval(() => {
                campaignTime++;
                updateCampaignTimerDisplay();
            }, 1000);
            startRecording();
        } else {
            campaignTimerToggle.textContent = 'Resume Campaign';
            addLogEntry({ type: 'system', message: 'Campaign timer has been paused.' });
            clearInterval(campaignTimerInterval);
            stopRecording();
        }
    }

    function requestFogOfWarUpdate() {
        if (fogOfWarUpdateTimeout) {
            clearTimeout(fogOfWarUpdateTimeout);
        }
        fogOfWarUpdateTimeout = setTimeout(updateFogOfWar, 500); // Debounce for 500ms
    }

    function sendFogOfWarToPlayerView() {
        if (playerWindow && !playerWindow.closed && selectedMapFileName) {
            const mapData = detailedMapData.get(selectedMapFileName);
            if (mapData) {
                playerWindow.postMessage({
                    type: 'fogOfWarUpdate',
                    fogOfWarDataUrl: mapData.fogOfWarDataUrl // This could be null if no FOW exists yet
                }, '*');
            }
        }
    }

    function generateVisionMask() {
        const mapData = detailedMapData.get(selectedMapFileName);
        if (!mapData || !currentMapDisplayData.img) return null;

        const visionMaskCanvas = document.createElement('canvas');
        visionMaskCanvas.width = currentMapDisplayData.imgWidth;
        visionMaskCanvas.height = currentMapDisplayData.imgHeight;
        const visionCtx = visionMaskCanvas.getContext('2d');

        const lightSources = initiativeTokens
            .filter(token => {
                const character = charactersData.find(c => c.id === token.characterId);
                return character && character.vision === true;
            })
            .map(token => ({
                position: { x: token.x, y: token.y }
            }));

        if (lightSources.length === 0) return null;

        const walls = mapData.overlays.filter(o => o.type === 'wall');
        const closedDoors = mapData.overlays.filter(o => o.type === 'door' && !o.isOpen);
        const smartObjects = mapData.overlays.filter(o => o.type === 'smart_object');

        const allSegments = [];
        walls.forEach(wall => {
            for (let i = 0; i < wall.points.length - 1; i++) {
                allSegments.push({ p1: wall.points[i], p2: wall.points[i + 1], parent: wall });
            }
        });
        closedDoors.forEach(door => {
            allSegments.push({ p1: door.points[0], p2: door.points[1], parent: door });
        });
        smartObjects.forEach(object => {
            for (let i = 0; i < object.polygon.length - 1; i++) {
                allSegments.push({ p1: object.polygon[i], p2: object.polygon[i + 1], parent: object });
            }
             allSegments.push({ p1: object.polygon[object.polygon.length - 1], p2: object.polygon[0], parent: object });
        });

        const imgWidth = currentMapDisplayData.imgWidth;
        const imgHeight = currentMapDisplayData.imgHeight;
        allSegments.push({ p1: { x: 0, y: 0 }, p2: { x: imgWidth, y: 0 }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: imgWidth, y: 0 }, p2: { x: imgWidth, y: imgHeight }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: imgWidth, y: imgHeight }, p2: { x: 0, y: imgHeight }, parent: { type: 'boundary' } });
        allSegments.push({ p1: { x: 0, y: imgHeight }, p2: { x: 0, y: 0 }, parent: { type: 'boundary' } });

        const allVertices = [];
        allSegments.forEach(seg => {
            allVertices.push(seg.p1, seg.p2);
        });

        visionCtx.fillStyle = 'black';
        visionCtx.beginPath();

        lightSources.forEach(light => {
            const visiblePoints = [];
            const angles = new Set();

            let lightIsInsideObject = false;
            for (const so of smartObjects) {
                if (isPointInPolygon(light.position, so.polygon)) {
                    lightIsInsideObject = true;
                    break;
                }
            }

            allVertices.forEach(vertex => {
                const angle = Math.atan2(vertex.y - light.position.y, vertex.x - light.position.x);
                angles.add(angle - 0.0001);
                angles.add(angle);
                angles.add(angle + 0.0001);
            });

            const sortedAngles = Array.from(angles).sort((a, b) => a - b);

            sortedAngles.forEach(angle => {
                const ray = {
                    x1: light.position.x,
                    y1: light.position.y,
                    x2: light.position.x + (imgWidth + imgHeight) * 2 * Math.cos(angle),
                    y2: light.position.y + (imgWidth + imgHeight) * 2 * Math.sin(angle)
                };

                let closestIntersection = null;
                let minDistance = Infinity;

                allSegments.forEach(segment => {
                    const intersectionPoint = getLineIntersection(ray, { x1: segment.p1.x, y1: segment.p1.y, x2: segment.p2.x, y2: segment.p2.y });
                    if (intersectionPoint) {
                        let ignoreThisIntersection = false;
                        if (segment.parent.type === 'smart_object') {
                            const p1 = segment.p1;
                            const p2 = segment.p2;
                            const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
                            const lightVector = { x: intersectionPoint.x - light.position.x, y: intersectionPoint.y - light.position.y };
                            const dot = (lightVector.x * normal.x) + (lightVector.y * normal.y);
                            if (!lightIsInsideObject && dot > 0) {
                                ignoreThisIntersection = true;
                            }
                        }

                        if (!ignoreThisIntersection) {
                            const distance = Math.sqrt(Math.pow(intersectionPoint.x - light.position.x, 2) + Math.pow(intersectionPoint.y - light.position.y, 2));
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestIntersection = intersectionPoint;
                            }
                        }
                    }
                });

                if (closestIntersection) {
                    visiblePoints.push(closestIntersection);
                } else {
                    visiblePoints.push({ x: ray.x2, y: ray.y2 });
                }
            });

            if (visiblePoints.length > 0) {
                const firstPoint = visiblePoints[0];
                visionCtx.moveTo(firstPoint.x, firstPoint.y);
                visiblePoints.forEach(point => {
                    visionCtx.lineTo(point.x, point.y);
                });
                visionCtx.closePath();
            }
        });
        visionCtx.fill();
        return visionMaskCanvas;
    }


    function updateFogOfWar() {
        if (!selectedMapFileName || !currentMapDisplayData.img) return;

        const mapData = detailedMapData.get(selectedMapFileName);
        const fowCanvas = fogOfWarCanvasCache.get(selectedMapFileName);

        if (!mapData || !fowCanvas) {
            return;
        }

        const visionMaskCanvas = generateVisionMask();

        if (visionMaskCanvas) {
            const fowCtx = fowCanvas.getContext('2d');
            fowCtx.save();
            fowCtx.globalCompositeOperation = 'destination-out';
            fowCtx.drawImage(visionMaskCanvas, 0, 0);
            fowCtx.restore();

            mapData.fogOfWarDataUrl = fowCanvas.toDataURL();
        }

        sendFogOfWarToPlayerView();
    }


    if (campaignTimerToggle) {
        campaignTimerToggle.addEventListener('click', toggleCampaignTimer);
    }
    // --- End Campaign Timer Logic ---

    const dmNotesInput = document.getElementById('dm-notes-input');
    if (dmNotesInput) {
        dmNotesInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && dmNotesInput.value.trim() !== '') {
                event.preventDefault();
                addLogEntry({
                    type: 'dm-note',
                    message: dmNotesInput.value.trim()
                });
                dmNotesInput.value = '';
            }
        });
    }

    // --- Audio Recording Logic ---
    const recordButton = document.getElementById('record-button');
    const testAudioButton = document.getElementById('test-audio-button');
    const audioInputSelect = document.getElementById('audio-input-select');
    const testAudioPlayback = document.getElementById('test-audio-playback');
    let mediaRecorder;
    let recordedChunks = [];
    let audioBlobs = []; // To store multiple recordings

    async function getAudioDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            audioInputSelect.innerHTML = '';
            if (audioDevices.length === 0) {
                audioInputSelect.innerHTML = '<option>No audio input devices found</option>';
                recordButton.disabled = true;
                testAudioButton.disabled = true;
                return;
            }
            audioDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Microphone ${audioInputSelect.options.length + 1}`;
                audioInputSelect.appendChild(option);
            });
            recordButton.disabled = false;
            testAudioButton.disabled = false;
        } catch (error) {
            console.error('Error enumerating audio devices:', error);
            audioInputSelect.innerHTML = '<option>Audio permission denied</option>';
            recordButton.disabled = true;
            testAudioButton.disabled = true;
        }
    }

    async function startRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            console.log("Already recording.");
            return;
        }

        const selectedDeviceId = audioInputSelect.value;
        if (!selectedDeviceId) {
            alert("No audio device selected.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: selectedDeviceId } } });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Use webm for better compression

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                const campaignName = "MyCampaign"; // Placeholder - should be dynamic later
                const sessionDate = new Date().toISOString().slice(0, 19).replace(/T/g, '_').replace(/:/g, "-");
                const fileName = `${campaignName}_Session_${sessionDate}.webm`;
                audioBlobs.push({ name: fileName, blob: blob });
                console.log(`Recording saved: ${fileName}`);
                // Stop all tracks on the stream to release the device
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordButton.textContent = 'Stop';
            recordButton.style.backgroundColor = '#ff4d4d'; // Indicate recording
            console.log("Recording started.");
        } catch (error) {
            console.error('Error starting recording:', error);
            alert("Could not start recording. Check console for errors.");
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordButton.textContent = 'Record';
            recordButton.style.backgroundColor = ''; // Revert to default style
            console.log("Recording stopped.");
        }
    }

    if (recordButton) {
        recordButton.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }

    if (testAudioButton) {
        testAudioButton.addEventListener('click', async () => {
            const selectedDeviceId = audioInputSelect.value;
            if (!selectedDeviceId) {
                alert("No audio device selected for testing.");
                return;
            }
            testAudioButton.disabled = true;
            testAudioButton.textContent = 'Testing...';

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: selectedDeviceId } } });
                const testRecorder = new MediaRecorder(stream);
                const testChunks = [];

                testRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        testChunks.push(event.data);
                    }
                };

                testRecorder.onstop = () => {
                    const blob = new Blob(testChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(blob);
                    testAudioPlayback.src = audioUrl;
                    testAudioPlayback.style.display = 'block';
                    testAudioPlayback.play();
                    // Stop all tracks on the stream to release the device
                    stream.getTracks().forEach(track => track.stop());
                    testAudioButton.disabled = false;
                    testAudioButton.textContent = 'Test Audio';
                };

                testRecorder.start();
                setTimeout(() => {
                    if (testRecorder.state === 'recording') {
                        testRecorder.stop();
                    }
                }, 5000); // 5-second test recording
            } catch (error) {
                console.error('Error during audio test:', error);
                alert("Could not perform audio test. Check console for errors.");
                testAudioButton.disabled = false;
                testAudioButton.textContent = 'Test Audio';
            }
        });
    }

    // Initialize audio devices on load
    getAudioDevices();

    window.addEventListener('message', (event) => {
        // We are only interested in messages from the player window, not iframes
        if (event.source !== playerWindow) {
            return;
        }

        const data = event.data;
        if (data.type === 'slideshowPaused') {
            slideshowCurrentIndex = data.index;
            console.log(`Slideshow paused by player view at index: ${slideshowCurrentIndex}`);
        } else if (data.type === 'slideshowFinished') {
            console.log('Player view finished playlist. Generating a new one for seamless playback.');
            slideshowPlaylist = []; // Clear old playlist
            slideshowCurrentIndex = 0;
            triggerSlideshow(); // This will generate and send a new playlist
        }
    });

    if (modifyQuotesButton) {
        modifyQuotesButton.addEventListener('click', () => {
            mapContainer.style.display = 'none';
            noteEditorContainer.style.display = 'none';
            characterSheetContainer.style.display = 'none';
            storyTreeContainer.style.display = 'none';

            quoteEditorContainer.style.display = 'flex';

            if (quoteMap) {
                quoteJsonEditor.value = JSON.stringify(quoteMap, null, 2);
            } else {
                quoteJsonEditor.value = "Loading quotes...";
                quoteMapPromise.then(data => {
                    if (data) {
                        quoteJsonEditor.value = JSON.stringify(data, null, 2);
                    } else {
                        quoteJsonEditor.value = "Failed to load quote_map.json. Check the console for errors.";
                    }
                });
            }
        });
    }

    if (saveQuotesButton) {
        saveQuotesButton.addEventListener('click', () => {
            try {
                const updatedQuotes = JSON.parse(quoteJsonEditor.value);
                quoteMap = updatedQuotes;
                alert("Quotes updated in memory for this session. They will be saved with the campaign.");
            } catch (e) {
                alert("Invalid JSON format. Please correct the errors before saving.");
                console.error("Error parsing quote JSON:", e);
            }
        });
    }

    if (viewStoryTreeButton) {
        viewStoryTreeButton.addEventListener('click', () => {
            switchTab('tab-story-beats');
        });
    }

    if (automationButton) {
        automationButton.addEventListener('click', () => {
            // Hide all other main content containers
            if (mapContainer) mapContainer.style.display = 'none';
            if (noteEditorContainer) noteEditorContainer.style.display = 'none';
            if (characterSheetContainer) characterSheetContainer.style.display = 'none';
            if (storyTreeContainer) storyTreeContainer.style.display = 'none';
            if (quoteEditorContainer) quoteEditorContainer.style.display = 'none';
            // Show the automation container
            if (automationContainer) automationContainer.style.display = 'flex';
            initializeAutomationSidebar();
        });
    }

    function handleBeginAutomation() {
        beginAutomationButton.style.display = 'none';
        automationActiveControls.style.display = 'flex';
    }

    function handleStopAutomation() {
        beginAutomationButton.style.display = 'block';
        automationActiveControls.style.display = 'none';
        const automationCanvas = document.getElementById('automation-canvas');
        const startLine = document.getElementById('automation-start-line');
        if (automationCanvas && startLine) {
            automationCanvas.prepend(startLine);
        }
        automationHistory = [];
        lastAutomationCard = null;
        hasDeviatedFromAutomation = true; // Stopping is always a deviation
        updatePreviousButtonState();
    }

    function updatePreviousButtonState() {
        const prevButton = document.getElementById('previous-automation-button');
        const footerPrevButton = document.getElementById('footer-previous-automation-button');
        if (!prevButton || !footerPrevButton) return;

        const startLine = document.getElementById('automation-start-line');
        if (hasDeviatedFromAutomation || !startLine || !startLine.previousElementSibling || startLine.previousElementSibling.id === 'automation-start-line') {
            prevButton.disabled = true;
            footerPrevButton.disabled = true;
            return;
        }

        const currentCard = startLine.previousElementSibling;
        if (!currentCard) {
            prevButton.disabled = true;
            footerPrevButton.disabled = true;
            return;
        }

        let isStateCorrect = false;
        const cardType = currentCard.dataset.cardType;

        switch (cardType) {
            case 'note':
                const notePreviewOverlay = document.getElementById('note-preview-overlay');
                isStateCorrect = notePreviewOverlay && notePreviewOverlay.style.display !== 'none';
                break;
            case 'character':
                const charPreviewOverlay = document.getElementById('character-preview-overlay');
                isStateCorrect = charPreviewOverlay && charPreviewOverlay.style.display !== 'none';
                break;
            case 'map':
                const linkedMaps = JSON.parse(currentCard.dataset.linkedMaps || '[]');
                if (linkedMaps.length > 0) {
                    const expectedMap = linkedMaps[linkedMaps.length - 1];
                    isStateCorrect = selectedMapFileName === expectedMap;
                }
                break;
            case 'initiative':
                isStateCorrect = initiativeTurn > -1;
                break;
            case 'wander':
                isStateCorrect = isWandering;
                break;
            case 'story_beat':
                isStateCorrect = true;
                break;
            default:
                isStateCorrect = false;
                break;
        }

        prevButton.disabled = !isStateCorrect;
        footerPrevButton.disabled = !isStateCorrect;
    }

    function handleNextAutomation() {
        const startLine = document.getElementById('automation-start-line');
        if (!startLine) return;

        hasDeviatedFromAutomation = false;

        const cardToActivate = startLine.nextElementSibling;
        if (!cardToActivate || cardToActivate.id === 'automation-start-line') {
            handleStopAutomation();
            return;
        }

        const notePreviewOverlay = document.getElementById('note-preview-overlay');
        const characterPreviewOverlay = document.getElementById('character-preview-overlay');

        const historyEntry = {
            cardId: cardToActivate.dataset.cardId,
            previousState: {
                selectedMapFileName: selectedMapFileName,
                initiativeTurn: initiativeTurn,
                isWandering: isWandering,
                initiativeTokens: JSON.parse(JSON.stringify(initiativeTokens)),
                diceRollHistoryCount: diceRollHistory.length,
                isNotePreviewVisible: notePreviewOverlay ? notePreviewOverlay.style.display !== 'none' : false,
                isCharacterPreviewVisible: characterPreviewOverlay ? characterPreviewOverlay.style.display !== 'none' : false,
            }
        };
        automationHistory.push(historyEntry);

        lastAutomationCard = cardToActivate;

        cardToActivate.after(startLine);
        activateCard(cardToActivate);
        updatePreviousButtonState();
    }

    function deactivateCard(card, stateToRestore) {
        if (!card) {
            console.error("Deactivate card called without a card.");
            return;
        }
        if (!stateToRestore) {
            console.error("Deactivate card called without a state to restore.");
            return;
        }

        const cardType = card.dataset.cardType;
        console.log(`Deactivating card ${card.dataset.cardId} of type: ${cardType}`);

        switch (cardType) {
            case 'note':
                const notePreviewOverlay = document.getElementById('note-preview-overlay');
                if (notePreviewOverlay) notePreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideNotePreview' }, '*');
                }
                break;

            case 'character':
                const charPreviewOverlay = document.getElementById('character-preview-overlay');
                if (charPreviewOverlay) charPreviewOverlay.style.display = 'none';
                if (playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage({ type: 'hideCharacterPreview' }, '*');
                }
                break;

            case 'map':
                if (stateToRestore.selectedMapFileName) {
                    selectedMapFileName = stateToRestore.selectedMapFileName;
                    displayMapOnCanvas(selectedMapFileName);
                    sendMapToPlayerView(selectedMapFileName);
                }
                break;

            case 'initiative':
            case 'wander':
                // Restore the exact previous state
                initiativeTurn = stateToRestore.initiativeTurn;
                isWandering = stateToRestore.isWandering;
                initiativeTokens = stateToRestore.initiativeTokens;

                // Clear any timers if they were running
                clearInterval(realTimeInterval);
                initiativeStartTime = null;

                // Restore UI elements based on restored state
                if (initiativeTurn > -1) {
                    initiativeTimers.style.display = 'flex';
                    startInitiativeButton.textContent = 'Stop Initiative';
                    nextTurnButton.style.display = 'inline-block';
                    prevTurnButton.style.display = 'inline-block';
                    highlightActiveTurn();
                } else if (isWandering) {
                    wanderButton.textContent = 'Stop Wandering';
                } else {
                    initiativeTimers.style.display = 'none';
                    startInitiativeButton.textContent = 'Start Initiative';
                    wanderButton.textContent = 'Wander';
                    nextTurnButton.style.display = 'none';
                    prevTurnButton.style.display = 'none';
                    clearTurnHighlight();
                }

                if (selectedMapFileName) {
                    displayMapOnCanvas(selectedMapFileName);
                }
                sendInitiativeDataToPlayerView();

                // Remove log entries added by the activation
                const logCountToRemove = diceRollHistory.length - stateToRestore.diceRollHistoryCount;
                if (logCountToRemove > 0) {
                    diceRollHistory.splice(stateToRestore.diceRollHistoryCount, logCountToRemove);
                    console.log(`Removed ${logCountToRemove} log entries.`);
                    if (diceDialogueRecord.classList.contains('persistent-log')) {
                        renderActionLog();
                        sendActionLogStateToPlayerView(true);
                    }
                }
                break;

            case 'story_beat':
                const linkedQuestId = parseInt(card.dataset.linkedQuestId, 10);
                const linkedSteps = JSON.parse(card.dataset.linkedSteps || '[]');
                const quest = quests.find(q => q.id === linkedQuestId);

                if (quest && linkedSteps.length > 0) {
                    let wasFirstStepUndone = false;
                    let wasLastStepUndone = false;
                    const lastStepIndex = quest.storySteps.length - 1;

                    linkedSteps.forEach(stepInfo => {
                        const step = quest.storySteps[stepInfo.stepIndex];
                        if (step && step.completed) {
                            step.completed = false;
                            if (stepInfo.stepIndex === 0) wasFirstStepUndone = true;
                            if (stepInfo.stepIndex === lastStepIndex) wasLastStepUndone = true;

                            addLogEntry({
                                type: 'system',
                                message: `Undo: Step "${step.title || 'Unnamed'}" in quest "${quest.name}" marked as not completed.`
                            });
                        }
                    });

                    if (wasFirstStepUndone && quest.questStatus === 'Active') {
                        quest.questStatus = 'Available';
                        addLogEntry({
                            type: 'system',
                            message: `Undo: Quest "${quest.name}" status reverted to Available.`
                        });
                    }

                    if (wasLastStepUndone && quest.questStatus === 'Completed') {
                        quest.questStatus = 'Active';
                         addLogEntry({
                            type: 'system',
                            message: `Undo: Quest "${quest.name}" status reverted to Active.`
                        });
                    }

                    renderCards();
                    drawConnections();
                    renderActiveQuestsInFooter();
                    if(activeOverlayCardId === quest.id) {
                        populateAndShowStoryBeatCard(quest);
                    }
                }
                break;
        }

        updatePreviousButtonState();
    }

    function handlePreviousAutomation() {
        const startLine = document.getElementById('automation-start-line');
        if (!startLine) return;

        const historyEntry = automationHistory.pop();
        if (!historyEntry) {
            console.log("At the beginning of the automation, cannot go back further.");
            return;
        }

        const cardToUndo = Array.from(document.querySelectorAll('.module-card')).find(c => c.dataset.cardId === historyEntry.cardId);

        if (!cardToUndo) {
            console.error(`Could not find card with ID ${historyEntry.cardId} to undo.`);
            return;
        }

        deactivateCard(cardToUndo, historyEntry.previousState);

        // Move the line before the card we are "undoing"
        cardToUndo.before(startLine);

        lastAutomationCard = startLine.previousElementSibling;
        updatePreviousButtonState();
    }

    function activateCard(cardElement) {
        if (!cardElement) return;

        const cardType = cardElement.dataset.cardType;
        let currentLinkIndex = parseInt(cardElement.dataset.currentLinkIndex || '0', 10);

        // Assign a unique ID for this specific activation action, used for undoing logs
        cardElement.dataset.automationActionId = `auto-action-${Date.now()}`;

        switch (cardType) {
            case 'note':
                const linkedNotes = JSON.parse(cardElement.dataset.linkedNotes || '[]');
                if (linkedNotes.length > 0) {
                    const noteId = linkedNotes[currentLinkIndex];
                    const note = notesData.find(n => n.id === noteId);
                    if (note) {
                        const notePreviewOverlay = document.getElementById('note-preview-overlay');
                        const notePreviewBody = document.getElementById('note-preview-body');
                        if (notePreviewOverlay && notePreviewBody) {
                            const renderedHTML = renderMarkdown(note.content);
                            notePreviewBody.innerHTML = renderedHTML;
                            notePreviewOverlay.style.display = 'flex';
                            const interactionMode = cardElement.dataset.interactionMode;
                            if (interactionMode === 'both' && playerWindow && !playerWindow.closed) {
                                const playerNoteContent = filterPlayerContent(note.content);
                                const playerRenderedHTML = renderMarkdown(playerNoteContent);
                                playerWindow.postMessage({
                                    type: 'showNotePreview',
                                    content: playerRenderedHTML
                                }, '*');
                            }
                        }
                    }

                    currentLinkIndex++;
                    if (currentLinkIndex >= linkedNotes.length) {
                        cardElement.dataset.currentLinkIndex = 0;
                    } else {
                        cardElement.dataset.currentLinkIndex = currentLinkIndex;
                        const startLine = document.getElementById('automation-start-line');
                        cardElement.before(startLine);
                    }
                }
                break;

            case 'character':
                const linkedCharacters = JSON.parse(cardElement.dataset.linkedCharacters || '[]');
                if (linkedCharacters.length > 0) {
                    const charId = linkedCharacters[currentLinkIndex];
                    const character = charactersData.find(c => c.id === charId);
                    if (character) {
                        const charPreviewOverlay = document.getElementById('character-preview-overlay');
                        const charPreviewBody = document.getElementById('character-preview-body');
                        const interactionMode = cardElement.dataset.interactionMode;

                        if (charPreviewOverlay && charPreviewBody) {
                            const dmMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, false, character.isDetailsVisible);
                            charPreviewBody.innerHTML = dmMarkdown;
                            charPreviewOverlay.style.display = 'flex';

                            if (interactionMode === 'both' && playerWindow && !playerWindow.closed) {
                                const playerMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, true, character.isDetailsVisible);
                                playerWindow.postMessage({
                                    type: 'showCharacterPreview',
                                    content: playerMarkdown
                                }, '*');
                            }
                        }
                    }

                    currentLinkIndex++;
                    if (currentLinkIndex >= linkedCharacters.length) {
                        cardElement.dataset.currentLinkIndex = 0;
                    } else {
                        cardElement.dataset.currentLinkIndex = currentLinkIndex;
                        const startLine = document.getElementById('automation-start-line');
                        cardElement.before(startLine);
                    }
                }
                break;

            case 'map':
                const linkedMaps = JSON.parse(cardElement.dataset.linkedMaps || '[]');
                if (linkedMaps.length > 0) {
                    const mapName = linkedMaps[currentLinkIndex];
                    const interactionMode = cardElement.dataset.interactionMode || 'dm-only';
                    const targetMapMode = interactionMode === 'both' ? 'view' : 'edit';
                    const targetMapData = detailedMapData.get(mapName);

                    if (targetMapData) {
                        switchTab('tab-dm-controls');
                        selectedMapFileName = mapName;
                        targetMapData.mode = targetMapMode;
                        modeToggleSwitch.checked = targetMapData.mode === 'view';
                        modeToggleSwitch.disabled = false;

                        clearAllSelections();
                        const mapItems = mapsList.querySelectorAll('li');
                        mapItems.forEach(li => {
                            if (li.dataset.fileName === mapName) {
                                li.classList.add('selected-map-item');
                            }
                        });

                        displayMapOnCanvas(mapName);
                        updateButtonStates();
                        if (targetMapData.mode === 'view') {
                            sendMapToPlayerView(mapName);
                        }
                    }

                    currentLinkIndex++;
                    if (currentLinkIndex >= linkedMaps.length) {
                        cardElement.dataset.currentLinkIndex = 0;
                    } else {
                        cardElement.dataset.currentLinkIndex = currentLinkIndex;
                        const startLine = document.getElementById('automation-start-line');
                        cardElement.before(startLine);
                    }
                }
                break;

            case 'initiative':
                startInitiativeEncounter(cardElement.dataset.automationActionId);
                break;
            case 'wander':
                startWandering(cardElement.dataset.automationActionId);
                break;

            case 'story_beat':
                displayCardDetails(cardElement);
                const completeStepsButton = document.getElementById('automation-complete-steps-btn');
                if (completeStepsButton) {
                    completeStepsButton.click();
                }
                break;
        }
    }

    if (beginAutomationButton) {
        beginAutomationButton.addEventListener('click', () => handleBeginAutomation());
    }

    if (stopAutomationButton) {
        stopAutomationButton.addEventListener('click', () => handleStopAutomation());
    }

    if (nextAutomationButton) {
        nextAutomationButton.addEventListener('click', () => handleNextAutomation());
    }

    if (previousAutomationButton) {
        previousAutomationButton.addEventListener('click', () => handlePreviousAutomation());
    }

    function renderAutomationCanvasFromData() {
        const automationCanvas = document.getElementById('automation-canvas');
        if (!automationCanvas) return;
        automationCanvas.innerHTML = '';
        automationCardCounters = {}; // Reset counters

        (automationCanvasData || []).forEach(cardData => {
            const card = document.createElement('div');

            // Handle the special "start-line" card type
            if (cardData.dataset && cardData.dataset.cardType === 'start-line') {
                card.id = 'automation-start-line';
                card.className = 'automation-start-line module-card';
                card.textContent = '--- Start Next ---';
                card.dataset.cardType = 'start-line';

                // Re-apply styles
                card.style.textAlign = 'center';
                card.style.fontWeight = 'bold';
                card.style.color = '#a0b4c9';
                card.style.cursor = 'move';
                card.style.padding = '5px 0';
                card.style.margin = '5px';
                card.style.borderTop = '2px dashed #a0b4c9';
                card.style.borderBottom = '2px dashed #a0b4c9';
                card.style.backgroundColor = '#2d3748';
            } else {
                // Handle regular cards with multiple formats for backward compatibility
                if (typeof cardData === 'string') {
                    // Very old format: just innerHTML string
                    card.innerHTML = cardData;
                    card.classList.add('module-card');
                } else if (cardData && typeof cardData === 'object') {
                    // Standard and new format
                    card.className = cardData.cardClass || 'module-card'; // Default class
                    if (cardData.innerHTML) { // For backward compatibility
                        card.innerHTML = cardData.innerHTML;
                    } else {
                        const cardTitleSpan = document.createElement('span');
                        cardTitleSpan.textContent = cardData.dataset.title;
                        card.appendChild(cardTitleSpan);

                        const label = document.createElement('span');
                        label.className = 'automation-card-label';
                        label.textContent = cardData.labelText;
                        card.appendChild(label);
                    }

                    if (cardData.dataset) {
                        for (const key in cardData.dataset) {
                            card.dataset[key] = cardData.dataset[key];
                        }
                    }
                }
            }


            automationCanvas.appendChild(card);

            // Re-attach listener for all cards after loading
            card.addEventListener('click', () => {
                if (card.dataset.cardType !== 'start-line') {
                    displayCardDetails(card);
                }
            });

            card.draggable = true;
            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // Update counters based on loaded data
            const labelSpan = card.querySelector('.automation-card-label');
            if (labelSpan) {
                const labelText = labelSpan.textContent;
                const match = labelText.match(/^(.*)_(\d+)$/);
                if (match) {
                    const baseName = match[1];
                    const number = parseInt(match[2], 10);
                    if (!automationCardCounters[baseName] || automationCardCounters[baseName] < number) {
                        automationCardCounters[baseName] = number;
                    }
                }
            }
        });
    }

function updateStoryBeatDetails(cardElement, selectedQuestId = null) {
    const questTitleEl = document.getElementById('automation-quest-title');
    const selectedStepsList = document.getElementById('automation-selected-steps-list');
    const availableStepsContainer = document.getElementById('automation-available-steps');
    const availableQuestsContainer = document.getElementById('automation-available-quests');

    if (!questTitleEl || !selectedStepsList || !availableStepsContainer || !availableQuestsContainer) {
        // The UI isn't built yet, so we can't update it.
        return;
    }

    // Get linked data from the card
    const linkedQuestId = parseInt(cardElement.dataset.linkedQuestId, 10);
    let linkedSteps = JSON.parse(cardElement.dataset.linkedSteps || '[]'); // format: {questId, stepIndex}

    const questToDisplayId = selectedQuestId || linkedQuestId;
    const quest = quests.find(q => q.id === questToDisplayId);

    // Render available quests
    availableQuestsContainer.innerHTML = '';
    if (quests.length > 0) {
        quests.forEach(q => {
            const questItem = document.createElement('div');
            questItem.textContent = q.name;
            questItem.className = 'available-note-item';
            if (q.id === questToDisplayId) {
                questItem.classList.add('selected');
            }
            questItem.addEventListener('click', () => {
                // When a new quest is selected from the list, it becomes the linked quest.
                cardElement.dataset.linkedQuestId = q.id;
                // If the quest is different from the previously linked one, clear the selected steps.
                if (q.id !== linkedQuestId) {
                    cardElement.dataset.linkedSteps = '[]';
                }
                updateStoryBeatDetails(cardElement, q.id);
            });
            availableQuestsContainer.appendChild(questItem);
        });
    } else {
        availableQuestsContainer.innerHTML = `<p class="sidebar-placeholder">No quests available.</p>`;
    }

    if (quest) {
        questTitleEl.textContent = quest.name;

        // Render selected steps
        selectedStepsList.innerHTML = '';
        // Filter to only show steps relevant to the currently displayed quest
        const currentlySelectedSteps = linkedSteps.filter(step => step.questId === quest.id);
        if (currentlySelectedSteps.length > 0) {
            currentlySelectedSteps.forEach(linkedStep => {
                const stepData = quest.storySteps[linkedStep.stepIndex];
                if (stepData) {
                    const stepItem = document.createElement('div');
                    stepItem.className = 'encounter-participant-item'; // Reuse style
                    stepItem.textContent = stepData.title || `Step ${linkedStep.stepIndex + 1}`;

                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'remove-participant-btn'; // Reuse style
                    removeBtn.addEventListener('click', () => {
                        let allLinkedSteps = JSON.parse(cardElement.dataset.linkedSteps || '[]');
                        allLinkedSteps = allLinkedSteps.filter(s => !(s.questId === linkedStep.questId && s.stepIndex === linkedStep.stepIndex));
                        cardElement.dataset.linkedSteps = JSON.stringify(allLinkedSteps);
                        updateStoryBeatDetails(cardElement, quest.id);
                    });

                    stepItem.appendChild(removeBtn);
                    selectedStepsList.appendChild(stepItem);
                }
            });
        } else {
            selectedStepsList.innerHTML = `<p class="sidebar-placeholder">Select steps from the list below.</p>`;
        }

        // Render available steps for the selected quest
        availableStepsContainer.innerHTML = '';
        if (quest.storySteps && quest.storySteps.length > 0) {
            quest.storySteps.forEach((step, index) => {
                // Only show if not already selected for this quest
                if (!currentlySelectedSteps.some(s => s.stepIndex === index)) {
                    const stepItem = document.createElement('div');
                    stepItem.textContent = step.title || `Step ${index + 1}`;
                    stepItem.className = 'available-note-item';
                    stepItem.addEventListener('click', () => {
                        let allLinkedSteps = JSON.parse(cardElement.dataset.linkedSteps || '[]');
                        // Add the new step, ensuring it's for the correct quest
                        allLinkedSteps.push({ questId: quest.id, stepIndex: index });
                        cardElement.dataset.linkedSteps = JSON.stringify(allLinkedSteps);
                        updateStoryBeatDetails(cardElement, quest.id);
                    });
                    availableStepsContainer.appendChild(stepItem);
                }
            });
            if (availableStepsContainer.children.length === 0) {
                availableStepsContainer.innerHTML = `<p class="sidebar-placeholder">All steps for this quest have been selected.</p>`;
            }
        } else {
            availableStepsContainer.innerHTML = `<p class="sidebar-placeholder">This quest has no story steps.</p>`;
        }
    } else {
        questTitleEl.textContent = 'No Quest Selected';
        selectedStepsList.innerHTML = `<p class="sidebar-placeholder">Select a quest first.</p>`;
        availableStepsContainer.innerHTML = `<p class="sidebar-placeholder">Select a quest to see its steps.</p>`;
    }
}

function displayCardDetails(cardElement) {
    const detailsSidebar = document.getElementById('details-sidebar');
    detailsSidebar.innerHTML = ''; // Clear previous content

    // Clear previous selection and select the current card
    const automationCanvas = document.getElementById('automation-canvas');
    if (automationCanvas) {
        automationCanvas.querySelectorAll('.module-card').forEach(card => card.classList.remove('automation-card-selected'));
    }
    cardElement.classList.add('automation-card-selected');

    // --- Card Header ---
    const cardId = cardElement.querySelector('.automation-card-label').textContent;
    const cardTitleSpan = cardElement.querySelector('span:not(.automation-card-label)');
    const title = cardElement.dataset.title || (cardTitleSpan ? cardTitleSpan.textContent : 'Card');

    const titleEl = document.createElement('h3');
    titleEl.contentEditable = true;
    titleEl.textContent = title;
    titleEl.addEventListener('blur', () => {
        const newTitle = titleEl.textContent;
        cardElement.dataset.title = newTitle;
        if (cardTitleSpan) {
            cardTitleSpan.textContent = newTitle;
        }
    });

    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = cardId;
    subtitleEl.style.cssText = 'color: #a0b4c9; font-style: italic; margin-top: -5px;';
    detailsSidebar.appendChild(titleEl);
    detailsSidebar.appendChild(subtitleEl);

    // --- Note-specific section ---
    if (cardElement.dataset.cardType === 'note') {
        let linkedNotes = JSON.parse(cardElement.dataset.linkedNotes || '[]');

        // --- 1. Display Linked Notes ---
        const linkedNotesHeader = document.createElement('h4');
        linkedNotesHeader.textContent = 'Linked Notes';
        linkedNotesHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(linkedNotesHeader);

        const linkedNotesList = document.createElement('ol');
        linkedNotesList.className = 'automation-linked-notes-list';
        if (linkedNotes.length > 0) {
            linkedNotes.forEach((noteId, index) => {
                const note = notesData.find(n => n.id === noteId);
                if (note) {
                    const listItem = document.createElement('li');
                    listItem.className = 'linked-note-item';

                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = note.title;
                    link.dataset.noteId = noteId;
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const notePreviewOverlay = document.getElementById('note-preview-overlay');
                        const notePreviewBody = document.getElementById('note-preview-body');
                        const interactionMode = cardElement.dataset.interactionMode;

                        if (notePreviewOverlay && notePreviewBody) {
                            // Use existing EasyMDE if available, otherwise create a temporary one for rendering.
                            const render = (content) => {
                                if (easyMDE && easyMDE.options.previewRender) {
                                    return easyMDE.options.previewRender(content);
                                }
                                // Fallback renderer
                                const dummyTextarea = document.createElement('textarea');
                                let html;
                                try {
                                    const tempMDE = new EasyMDE({ element: dummyTextarea, autoDownloadFontAwesome: false });
                                    html = tempMDE.options.previewRender(content);
                                    tempMDE.toTextArea();
                                } catch (err) {
                                    console.error("Fallback EasyMDE render failed:", err);
                                    html = content.replace(/\n/g, '<br>'); // Basic fallback
                                }
                                return html;
                            };

                            // Show DM preview regardless of mode
                            notePreviewBody.innerHTML = render(note.content);
                            notePreviewOverlay.style.display = 'flex';

                            // If mode is 'both', also send to player
                            if (interactionMode === 'both' && playerWindow && !playerWindow.closed) {
                                const playerNoteContent = filterPlayerContent(note.content);
                                const playerRenderedHTML = render(playerNoteContent);
                                playerWindow.postMessage({
                                    type: 'showNotePreview',
                                    content: playerRenderedHTML
                                }, '*');
                            }
                        }
                    });

                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'remove-note-link-btn';
                    removeBtn.title = 'Remove this note';
                    removeBtn.addEventListener('click', () => {
                        linkedNotes.splice(index, 1);
                        cardElement.dataset.linkedNotes = JSON.stringify(linkedNotes);
                        displayCardDetails(cardElement); // Refresh the sidebar
                    });

                    listItem.appendChild(link);
                    listItem.appendChild(removeBtn);
                    linkedNotesList.appendChild(listItem);
                }
            });
        } else {
            const placeholder = document.createElement('p');
            placeholder.textContent = 'No notes linked yet.';
            placeholder.className = 'sidebar-placeholder';
            linkedNotesList.appendChild(placeholder);
        }
        detailsSidebar.appendChild(linkedNotesList);

        // --- 2. Display Available Notes to Link ---
        const availableNotesHeader = document.createElement('h4');
        availableNotesHeader.textContent = 'Add Note to Link';
        availableNotesHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(availableNotesHeader);

        const availableNotesContainer = document.createElement('div');
        availableNotesContainer.className = 'available-notes-container';

        notesData.forEach(note => {
            // Only show notes that are not already linked
            if (!linkedNotes.includes(note.id)) {
                const noteItem = document.createElement('div');
                noteItem.textContent = note.title;
                noteItem.className = 'available-note-item';
                noteItem.title = `Click to link "${note.title}"`;
                noteItem.addEventListener('click', () => {
                    linkedNotes.push(note.id);
                    cardElement.dataset.linkedNotes = JSON.stringify(linkedNotes);
                    displayCardDetails(cardElement); // Refresh the sidebar
                });
                availableNotesContainer.appendChild(noteItem);
            }
        });

        if (availableNotesContainer.children.length === 0 && notesData.length > 0) {
             const allLinkedPlaceholder = document.createElement('p');
             allLinkedPlaceholder.textContent = 'All available notes are linked.';
             allLinkedPlaceholder.className = 'sidebar-placeholder';
             availableNotesContainer.appendChild(allLinkedPlaceholder);
        } else if (notesData.length === 0) {
            const noNotesPlaceholder = document.createElement('p');
            noNotesPlaceholder.textContent = 'No notes exist. Create one in the Notes tab.';
            noNotesPlaceholder.className = 'sidebar-placeholder';
            availableNotesContainer.appendChild(noNotesPlaceholder);
        }
        detailsSidebar.appendChild(availableNotesContainer);
    } else if (cardElement.dataset.cardType === 'character') {
        let linkedCharacters = JSON.parse(cardElement.dataset.linkedCharacters || '[]');

        // --- 1. Display Linked Characters ---
        const linkedCharsHeader = document.createElement('h4');
        linkedCharsHeader.textContent = 'Linked Characters';
        linkedCharsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(linkedCharsHeader);

        const linkedCharsList = document.createElement('ol');
        linkedCharsList.className = 'automation-linked-notes-list'; // Reuse class
        if (linkedCharacters.length > 0) {
            linkedCharacters.forEach((charId, index) => {
                const character = charactersData.find(c => c.id === charId);
                if (character) {
                    const listItem = document.createElement('li');
                    listItem.className = 'linked-note-item'; // Reuse class

                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = character.name;
                    link.dataset.characterId = charId;
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const charPreviewOverlay = document.getElementById('character-preview-overlay');
                        const charPreviewBody = document.getElementById('character-preview-body');
                        const interactionMode = cardElement.dataset.interactionMode;

                        if (charPreviewOverlay && charPreviewBody) {
                            // Show DM preview regardless of mode
                            const dmMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, false, character.isDetailsVisible);
                            charPreviewBody.innerHTML = dmMarkdown;
                            charPreviewOverlay.style.display = 'flex';

                            // If mode is 'both', also send to player
                            if (interactionMode === 'both' && playerWindow && !playerWindow.closed) {
                                const playerMarkdown = generateCharacterMarkdown(character.sheetData, character.notes, true, character.isDetailsVisible);
                                playerWindow.postMessage({
                                    type: 'showCharacterPreview',
                                    content: playerMarkdown
                                }, '*');
                            }
                        }
                    });

                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'remove-note-link-btn'; // Reuse class
                    removeBtn.title = 'Remove this character';
                    removeBtn.addEventListener('click', () => {
                        linkedCharacters.splice(index, 1);
                        cardElement.dataset.linkedCharacters = JSON.stringify(linkedCharacters);
                        displayCardDetails(cardElement); // Refresh
                    });

                    listItem.appendChild(link);
                    listItem.appendChild(removeBtn);
                    linkedCharsList.appendChild(listItem);
                }
            });
        } else {
            const placeholder = document.createElement('p');
            placeholder.textContent = 'No characters linked yet.';
            placeholder.className = 'sidebar-placeholder';
            linkedCharsList.appendChild(placeholder);
        }
        detailsSidebar.appendChild(linkedCharsList);

        // --- 2. Display Available Characters to Link ---
        const availableCharsHeader = document.createElement('h4');
        availableCharsHeader.textContent = 'Add Character to Link';
        availableCharsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(availableCharsHeader);

        const availableCharsContainer = document.createElement('div');
        availableCharsContainer.className = 'available-notes-container'; // Reuse class

        charactersData.forEach(character => {
            if (!linkedCharacters.includes(character.id)) {
                const charItem = document.createElement('div');
                charItem.textContent = character.name;
                charItem.className = 'available-note-item'; // Reuse class
                charItem.title = `Click to link "${character.name}"`;
                charItem.addEventListener('click', () => {
                    linkedCharacters.push(character.id);
                    cardElement.dataset.linkedCharacters = JSON.stringify(linkedCharacters);
                    displayCardDetails(cardElement); // Refresh
                });
                availableCharsContainer.appendChild(charItem);
            }
        });

        if (availableCharsContainer.children.length === 0 && charactersData.length > 0) {
             const allLinkedPlaceholder = document.createElement('p');
             allLinkedPlaceholder.textContent = 'All available characters are linked.';
             allLinkedPlaceholder.className = 'sidebar-placeholder';
             availableCharsContainer.appendChild(allLinkedPlaceholder);
        } else if (charactersData.length === 0) {
            const noCharsPlaceholder = document.createElement('p');
            noCharsPlaceholder.textContent = 'No characters exist. Create one in the Characters tab.';
            noCharsPlaceholder.className = 'sidebar-placeholder';
            availableCharsContainer.appendChild(noCharsPlaceholder);
        }
        detailsSidebar.appendChild(availableCharsContainer);
    } else if (cardElement.dataset.cardType === 'map') {
        let linkedMapsRaw = JSON.parse(cardElement.dataset.linkedMaps || '[]');

        // --- Backward compatibility check and conversion ---
        const isOldFormat = linkedMapsRaw.length > 0 && typeof linkedMapsRaw[0] === 'object' && linkedMapsRaw[0] !== null && linkedMapsRaw[0].hasOwnProperty('mapName');
        let linkedMaps = isOldFormat ? linkedMapsRaw.map(item => item.mapName) : linkedMapsRaw;

        // If conversion happened, update the dataset to the new format for future saves.
        if (isOldFormat) {
            cardElement.dataset.linkedMaps = JSON.stringify(linkedMaps);
        }

        // --- 1. Display Linked Maps ---
        const linkedMapsHeader = document.createElement('h4');
        linkedMapsHeader.textContent = 'Linked Maps';
        linkedMapsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(linkedMapsHeader);

        const linkedMapsList = document.createElement('ol');
        linkedMapsList.className = 'automation-linked-maps-list';
        if (linkedMaps.length > 0) {
            linkedMaps.forEach((mapName, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'linked-map-item';

                const link = document.createElement('a');
                link.href = '#';
                link.textContent = mapName;
                link.dataset.mapName = mapName;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const mapName = e.target.dataset.mapName;
                    // The card's mode determines behavior. Default to 'dm-only' if not set.
                    const interactionMode = cardElement.dataset.interactionMode || 'dm-only';
                    const targetMapMode = interactionMode === 'both' ? 'view' : 'edit';

                    const targetMapData = detailedMapData.get(mapName);

                    if (targetMapData) {
                        switchTab('tab-dm-controls');
                        selectedMapFileName = mapName;
                        targetMapData.mode = targetMapMode;
                        modeToggleSwitch.checked = targetMapData.mode === 'view';
                        modeToggleSwitch.disabled = false;

                        clearAllSelections();
                        const mapItems = mapsList.querySelectorAll('li');
                        mapItems.forEach(li => {
                            if (li.dataset.fileName === mapName) {
                                li.classList.add('selected-map-item');
                            }
                        });

                        displayMapOnCanvas(mapName);
                        updateButtonStates();
                        if (targetMapData.mode === 'view') {
                            sendMapToPlayerView(mapName);
                        }
                    } else {
                        alert(`Map "${mapName}" not found.`);
                    }
                });

                const removeBtn = document.createElement('button');
                removeBtn.textContent = '×';
                removeBtn.className = 'remove-map-link-btn';
                removeBtn.title = 'Remove this map link';
                removeBtn.addEventListener('click', () => {
                    linkedMaps.splice(index, 1);
                    cardElement.dataset.linkedMaps = JSON.stringify(linkedMaps);
                    displayCardDetails(cardElement);
                });

                listItem.appendChild(link);
                listItem.appendChild(removeBtn);
                linkedMapsList.appendChild(listItem);
            });
        } else {
            const placeholder = document.createElement('p');
            placeholder.textContent = 'No maps linked yet.';
            placeholder.className = 'sidebar-placeholder';
            linkedMapsList.appendChild(placeholder);
        }
        detailsSidebar.appendChild(linkedMapsList);

        // --- 2. Display Available Maps to Link ---
        const availableMapsHeader = document.createElement('h4');
        availableMapsHeader.textContent = 'Add Map to Link';
        availableMapsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(availableMapsHeader);

        const availableMapsContainer = document.createElement('div');
        availableMapsContainer.className = 'available-notes-container';

        Array.from(detailedMapData.keys()).forEach(mapName => {
            if (!linkedMaps.includes(mapName)) {
                const mapItem = document.createElement('div');
                mapItem.textContent = mapName;
                mapItem.className = 'available-note-item';
                mapItem.title = `Click to link "${mapName}"`;
                mapItem.addEventListener('click', () => {
                    linkedMaps.push(mapName);
                    cardElement.dataset.linkedMaps = JSON.stringify(linkedMaps);
                    displayCardDetails(cardElement);
                });
                availableMapsContainer.appendChild(mapItem);
            }
        });

        if (availableMapsContainer.children.length === 0 && detailedMapData.size > 0) {
             const allLinkedPlaceholder = document.createElement('p');
             allLinkedPlaceholder.textContent = 'All available maps are linked.';
             allLinkedPlaceholder.className = 'sidebar-placeholder';
             availableMapsContainer.appendChild(allLinkedPlaceholder);
        } else if (detailedMapData.size === 0) {
            const noMapsPlaceholder = document.createElement('p');
            noMapsPlaceholder.textContent = 'No maps exist. Upload one in the DM Controls tab.';
            noMapsPlaceholder.className = 'sidebar-placeholder';
            availableMapsContainer.appendChild(noMapsPlaceholder);
        }
        detailsSidebar.appendChild(availableMapsContainer);
    } else if (cardElement.dataset.cardType === 'story_beat') {
        // --- 1. Dynamic Quest Title ---
        const questTitleEl = document.createElement('h3');
        questTitleEl.id = 'automation-quest-title';
        questTitleEl.textContent = 'No Quest Selected';
        questTitleEl.style.color = '#e2e8f0';
        detailsSidebar.appendChild(questTitleEl);

        // --- 2. Selected Story Steps (Growing List) ---
        const selectedStepsHeader = document.createElement('h4');
        selectedStepsHeader.textContent = 'Selected Story Steps';
        selectedStepsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(selectedStepsHeader);

        const completeStepsButton = document.createElement('button');
        completeStepsButton.textContent = 'Complete All Selected Steps';
        completeStepsButton.id = 'automation-complete-steps-btn';
        detailsSidebar.appendChild(completeStepsButton);

        const selectedStepsList = document.createElement('div');
        selectedStepsList.id = 'automation-selected-steps-list';
        selectedStepsList.className = 'available-notes-container'; // Reuse style
        selectedStepsList.style.minHeight = '60px';
        selectedStepsList.innerHTML = `<p class="sidebar-placeholder">Select steps from the list below.</p>`;
        detailsSidebar.appendChild(selectedStepsList);

        completeStepsButton.addEventListener('click', () => {
            const linkedQuestId = parseInt(cardElement.dataset.linkedQuestId, 10);
            const linkedSteps = JSON.parse(cardElement.dataset.linkedSteps || '[]');
            const interactionMode = cardElement.dataset.interactionMode;

            if (!linkedQuestId || linkedSteps.length === 0) {
                alert("No quest or steps are linked to this card.");
                return;
            }

            const quest = quests.find(q => q.id === linkedQuestId);
            if (!quest) {
                alert("Linked quest not found!");
                return;
            }

            // Mark all selected steps as complete
            linkedSteps.forEach(linkedStepInfo => {
                const step = quest.storySteps[linkedStepInfo.stepIndex];
                if (step && !step.completed) {
                    step.completed = true;
                    addLogEntry({
                        type: 'system',
                        message: `${quest.name}: ${step.title || 'Unnamed step'} completed.`
                    });
                }
            });

            // Handle quest status automation
            if (interactionMode === 'both') {
                const completedFirstStep = linkedSteps.some(s => s.stepIndex === 0);
                if (completedFirstStep && quest.questStatus === 'Available') {
                    quest.questStatus = 'Active';
                     addLogEntry({
                        type: 'system',
                        message: `${quest.name} is now Active.`
                    });
                }

                // Check if all steps of the entire quest are now complete
                const allStepsAreNowComplete = quest.storySteps.every(s => s.completed);
                if (allStepsAreNowComplete && quest.questStatus !== 'Completed') {
                     quest.questStatus = 'Completed';
                     addLogEntry({
                        type: 'system',
                        message: `${quest.name} has been Completed.`
                    });
                }
            }

            // Refresh UIs
            updateStoryBeatDetails(cardElement, quest.id); // Refresh sidebar
            renderCards();
            drawConnections();
            renderActiveQuestsInFooter();
            // Also refresh the main quest editor if it's open for this quest
            if(activeOverlayCardId === quest.id) {
                populateAndShowStoryBeatCard(quest);
            }
        });

        // --- 3. Available Quests ---
        const availableQuestsHeader = document.createElement('h4');
        availableQuestsHeader.textContent = 'Available Quests';
        availableQuestsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(availableQuestsHeader);

        const availableQuestsContainer = document.createElement('div');
        availableQuestsContainer.id = 'automation-available-quests';
        availableQuestsContainer.className = 'available-notes-container';
        detailsSidebar.appendChild(availableQuestsContainer);

        // --- 4. Available Story Steps ---
        const availableStepsHeader = document.createElement('h4');
        availableStepsHeader.textContent = 'Available Story Steps';
        availableStepsHeader.style.marginTop = '20px';
        detailsSidebar.appendChild(availableStepsHeader);

        const availableStepsContainer = document.createElement('div');
        availableStepsContainer.id = 'automation-available-steps';
        availableStepsContainer.className = 'available-notes-container';
        availableStepsContainer.innerHTML = `<p class="sidebar-placeholder">Select a quest to see its steps.</p>`;
        detailsSidebar.appendChild(availableStepsContainer);

        updateStoryBeatDetails(cardElement);

    } else if (cardElement.dataset.cardType === 'initiative' || cardElement.dataset.cardType === 'wander') {
        detailsSidebar.style.overflowY = 'auto';
        detailsSidebar.style.display = 'flex';
        detailsSidebar.style.flexDirection = 'column';

        // --- Section 1: Encounter Participants (Growing List) ---
        const encounterSection = document.createElement('div');
        encounterSection.className = 'sidebar-section';

        const encounterHeader = document.createElement('div');
        encounterHeader.style.display = 'flex';
        encounterHeader.style.justifyContent = 'space-between';
        encounterHeader.style.alignItems = 'center';

        const growingListHeader = document.createElement('h4');
        growingListHeader.textContent = 'Encounter Participants';
        growingListHeader.style.borderBottom = 'none'; // Remove double border
        encounterHeader.appendChild(growingListHeader);

        const startButton = document.createElement('button');
        startButton.textContent = 'Start';
        startButton.id = 'automation-start-encounter-btn';
        encounterHeader.appendChild(startButton);

        encounterSection.appendChild(encounterHeader);

        const growingList = document.createElement('div');
        growingList.id = 'automation-encounter-list';
        growingList.className = 'available-notes-container'; // Reuse for style
        growingList.style.minHeight = '80px'; // Give it some base height
        encounterSection.appendChild(growingList);
        detailsSidebar.appendChild(encounterSection);

        // --- Section 2: Available Characters ---
        const charsSection = document.createElement('div');
        charsSection.className = 'sidebar-section';
        const availableCharsHeader = document.createElement('h4');
        availableCharsHeader.textContent = 'Add Character';
        charsSection.appendChild(availableCharsHeader);

        const availableCharsContainer = document.createElement('div');
        availableCharsContainer.className = 'available-notes-container';
        charactersData.forEach(character => {
            const charItem = document.createElement('div');
            charItem.textContent = character.name;
            charItem.className = 'available-note-item';
            charItem.dataset.characterId = character.id;
            charItem.dataset.characterName = character.name;
            availableCharsContainer.appendChild(charItem);
        });
        charsSection.appendChild(availableCharsContainer);
        detailsSidebar.appendChild(charsSection);

        // --- Section 3: Available Saved Initiatives ---
        const savedInitSection = document.createElement('div');
        savedInitSection.className = 'sidebar-section';
        const savedInitiativesHeader = document.createElement('h4');
        savedInitiativesHeader.textContent = 'Add Saved Initiative';
        savedInitSection.appendChild(savedInitiativesHeader);

        const savedInitiativesContainer = document.createElement('div');
        savedInitiativesContainer.className = 'available-notes-container';
         Object.keys(savedInitiatives).forEach(name => {
            const initiativeItem = document.createElement('div');
            initiativeItem.textContent = name;
            initiativeItem.className = 'available-note-item';
            initiativeItem.dataset.initiativeName = name;
            savedInitiativesContainer.appendChild(initiativeItem);
        });
        savedInitSection.appendChild(savedInitiativesContainer);
        detailsSidebar.appendChild(savedInitSection);

        // --- Logic for the growing list ---
        const renderEncounterList = () => {
            growingList.innerHTML = '';
            const participants = JSON.parse(cardElement.dataset.participants || '[]');
            if (participants.length === 0) {
                growingList.innerHTML = `<p class="sidebar-placeholder">Add participants below.</p>`;
            } else {
                participants.forEach((participant, index) => {
                    const item = document.createElement('div');
                    item.className = 'encounter-participant-item';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = participant.name;
                    item.appendChild(nameSpan);

                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'remove-participant-btn';
                    removeBtn.addEventListener('click', () => {
                        participants.splice(index, 1);
                        cardElement.dataset.participants = JSON.stringify(participants);
                        renderEncounterList();
                    });
                    item.appendChild(removeBtn);
                    growingList.appendChild(item);
                });
            }
        };

        const addParticipant = (participant) => {
            const participants = JSON.parse(cardElement.dataset.participants || '[]');
            participants.push(participant);
            cardElement.dataset.participants = JSON.stringify(participants);
            renderEncounterList();
        };

        availableCharsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.available-note-item')) {
                addParticipant({
                    type: 'character',
                    id: e.target.dataset.characterId,
                    name: e.target.dataset.characterName
                });
            }
        });

        savedInitiativesContainer.addEventListener('click', (e) => {
            if (e.target.matches('.available-note-item')) {
                addParticipant({
                    type: 'initiative',
                    name: e.target.dataset.initiativeName
                });
            }
        });

        // Initial render
        renderEncounterList();

        startButton.addEventListener('click', () => {
            const participants = JSON.parse(cardElement.dataset.participants || '[]');
            if (participants.length === 0) {
                alert("Please add at least one character or saved initiative to the encounter.");
                return;
            }

            // 1. Clear and populate the active initiative list
            activeInitiative = [];
            participants.forEach(participant => {
                if (participant.type === 'character') {
                    const characterData = charactersData.find(c => c.id == participant.id);
                    if (characterData) {
                        activeInitiative.push({ ...JSON.parse(JSON.stringify(characterData)), initiative: null, uniqueId: Date.now() + Math.random() });
                    }
                } else if (participant.type === 'initiative') {
                    const savedInit = savedInitiatives[participant.name];
                    if (savedInit) {
                        savedInit.forEach(characterData => {
                            activeInitiative.push({ ...JSON.parse(JSON.stringify(characterData)), initiative: null, uniqueId: Date.now() + Math.random() });
                        });
                    }
                }
            });

            // 2. Open the main initiative tracker overlay
            if (initiativeTrackerOverlay) {
                initiativeTrackerOverlay.style.display = 'flex';
                renderActiveInitiativeList(); // Render the new list
                sendInitiativeTrackerStateToPlayerView(true);
            }

            // 3. Set map mode based on card's interaction mode
            const interactionMode = cardElement.dataset.interactionMode || 'dm-only';
            if (modeToggleSwitch) {
                const isPlayerVisible = interactionMode === 'both';
                if (modeToggleSwitch.checked !== isPlayerVisible) {
                    modeToggleSwitch.click();
                } else {
                    if(isPlayerVisible && selectedMapFileName) {
                        sendMapToPlayerView(selectedMapFileName);
                    } else {
                        triggerSlideshow();
                    }
                }
            }

            // 4. Start the encounter
            const cardType = cardElement.dataset.cardType;
            if (cardType === 'wander') {
                if (wanderButton) wanderButton.click();
            } else if (cardType === 'initiative') {
                if (startInitiativeButton) startInitiativeButton.click();
                if (autoInitiativeButton) {
                    setTimeout(() => {
                        autoInitiativeButton.click();
                    }, 100);
                }
            }

            // 5. Switch to the DM Controls tab to see the map
            switchTab('tab-dm-controls');
        });
    } /* else if (cardElement.dataset.cardType === 'roll') {
    detailsSidebar.style.overflowY = 'auto';
    detailsSidebar.style.display = 'flex';
    detailsSidebar.style.flexDirection = 'column';

    let linkedCharacterId = null; // To track the character for the current roll entry

    // --- Section 1: Saved Rolls (Growing List) ---
    const savedRollsSection = document.createElement('div');
    savedRollsSection.className = 'sidebar-section';
    const savedRollsHeader = document.createElement('h4');
    savedRollsHeader.textContent = 'Saved Rolls';
    savedRollsSection.appendChild(savedRollsHeader);
    const savedRollsList = document.createElement('div');
    savedRollsList.id = 'automation-roll-list';
    savedRollsList.className = 'available-notes-container'; // Reuse style
    savedRollsList.style.minHeight = '80px';
    savedRollsSection.appendChild(savedRollsList);
    detailsSidebar.appendChild(savedRollsSection);

    // --- Section 2: Roll Creation Form ---
    const creationSection = document.createElement('div');
    creationSection.className = 'sidebar-section';

    // Character Selection
    const availableCharsHeader = document.createElement('h4');
    availableCharsHeader.textContent = 'Link Character for Roll';
    creationSection.appendChild(availableCharsHeader);
    const availableCharsContainer = document.createElement('div');
    availableCharsContainer.className = 'available-notes-container'; // Reuse style
    availableCharsContainer.id = 'roll-card-char-select';
    creationSection.appendChild(availableCharsContainer);

    // Roll Interface (copied from token-stat-block)
    const rollInterfaceContainer = document.createElement('div');
    rollInterfaceContainer.className = 'stat-block-rolls'; // Reuse class for styling
    rollInterfaceContainer.style.marginTop = '20px';
    rollInterfaceContainer.innerHTML = `
        <div id="roll-card-add-roll-form" class="add-roll-form">
            <input type="text" id="roll-card-add-roll-name" placeholder="Roll Name">
            <select id="roll-card-add-roll-tags">
                <option value="">None</option>
                <option value="Hit">Hit</option>
                <option value="Damage">Damage</option>
                <option value="Healing">Healing</option>
                <option value="Strength">Strength</option>
                <option value="Dexterity">Dexterity</option>
                <option value="Constitution">Constitution</option>
                <option value="Intelligence">Intelligence</option>
                <option value="Wisdom">Wisdom</option>
                <option value="Charisma">Charisma</option>
            </select>
            <div id="roll-card-dice-buttons">
                <button class="dice-button-compact" data-die="d4">d4<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d6">d6<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d8">d8<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d10">d10<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d12">d12<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d20">d20<span class="dice-count"></span></button>
                <button class="dice-button-compact" data-die="d100">d100<span class="dice-count"></span></button>
            </div>
            <div class="modifier-form">
                <label for="roll-card-add-roll-modifier">Modifier:</label>
                <input type="number" id="roll-card-add-roll-modifier" value="0">
            </div>
            <button id="roll-card-save-roll-btn">Save</button>
        </div>
    `;
    creationSection.appendChild(rollInterfaceContainer);
    detailsSidebar.appendChild(creationSection);

    // --- Logic ---
    let rollCardDiceCounts = {};

    const updateRollCardDiceDisplay = () => {
        const buttons = detailsSidebar.querySelectorAll('#roll-card-dice-buttons .dice-button-compact');
        buttons.forEach(button => {
            const die = button.dataset.die;
            const count = rollCardDiceCounts[die] || 0;
            const countSpan = button.querySelector('.dice-count');
            if (countSpan) {
                countSpan.textContent = count > 0 ? `+${count}` : '';
            }
        });
    };

    const renderSavedRollsList = () => {
        savedRollsList.innerHTML = '';
        const allSavedRolls = JSON.parse(cardElement.dataset.savedRolls || '[]');

        if (allSavedRolls.length === 0) {
            savedRollsList.innerHTML = `<p class="sidebar-placeholder">No rolls saved to this card yet.</p>`;
            return;
        }

        allSavedRolls.forEach((roll, index) => {
            const character = charactersData.find(c => c.id === roll.characterId);
            const characterName = character ? character.name : 'Unknown Character';
            const diceString = formatDiceString(roll.dice, roll.modifier);

            const item = document.createElement('div');
            item.className = 'encounter-participant-item'; // Reuse style
            item.innerHTML = `
                <span><strong>${characterName}:</strong> ${roll.name} (${diceString})</span>
                <button class="remove-participant-btn" data-index="${index}">×</button>
            `;
            savedRollsList.appendChild(item);
        });
    };

    const renderCharacterSelectList = () => {
        availableCharsContainer.innerHTML = '';
        if (charactersData.length === 0) {
            availableCharsContainer.innerHTML = `<p class="sidebar-placeholder">No characters exist.</p>`;
            return;
        }
        charactersData.forEach(character => {
            const charItem = document.createElement('div');
            charItem.textContent = character.name;
            charItem.className = 'available-note-item';
            charItem.dataset.characterId = character.id;
            if (character.id === linkedCharacterId) {
                charItem.classList.add('selected');
            }
            availableCharsContainer.appendChild(charItem);
        });
    };

    // Event Listeners
    availableCharsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.available-note-item')) {
            const charId = parseInt(e.target.dataset.characterId, 10);
            if (linkedCharacterId === charId) {
                // Deselect if clicking the same character
                linkedCharacterId = null;
            } else {
                linkedCharacterId = charId;
            }
            renderCharacterSelectList();
        }
    });

    detailsSidebar.querySelector('#roll-card-dice-buttons').addEventListener('click', (event) => {
        const button = event.target.closest('.dice-button-compact');
        if (!button) return;
        const die = button.dataset.die;
        if (die) {
            rollCardDiceCounts[die] = (rollCardDiceCounts[die] || 0) + 1;
            updateRollCardDiceDisplay();
        }
    });

    detailsSidebar.querySelector('#roll-card-dice-buttons').addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const button = event.target.closest('.dice-button-compact');
        if (!button) return;
        const die = button.dataset.die;
        if (die && rollCardDiceCounts[die] > 0) {
            rollCardDiceCounts[die]--;
            updateRollCardDiceDisplay();
        }
    });

    detailsSidebar.querySelector('#roll-card-add-roll-tags').addEventListener('change', (e) => {
        const selectedTag = e.target.value;
        const attributeMatch = selectedTag.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/);

        if (attributeMatch && linkedCharacterId) {
            const character = charactersData.find(c => c.id === linkedCharacterId);
            if (!character || !character.sheetData) return;

            const attribute = attributeMatch[0].toLowerCase();
            const statName = attribute.charAt(0).toUpperCase() + attribute.slice(1);

            detailsSidebar.querySelector('#roll-card-add-roll-name').value = `${statName} Check`;
            rollCardDiceCounts = { 'd20': 1 };
            updateRollCardDiceDisplay();
            const modifierValue = character.sheetData[`${attribute}_modifier`] || '+0';
            detailsSidebar.querySelector('#roll-card-add-roll-modifier').value = parseInt(modifierValue.replace('+', ''), 10) || 0;
        }
    });

    detailsSidebar.querySelector('#roll-card-save-roll-btn').addEventListener('click', () => {
        const rollName = detailsSidebar.querySelector('#roll-card-add-roll-name').value.trim();
        if (!rollName) {
            alert('Please enter a name for the roll.');
            return;
        }
        if (!linkedCharacterId) {
            alert('Please link a character for this roll.');
            return;
        }

        const hasDice = Object.values(rollCardDiceCounts).some(count => count > 0);
        if (!hasDice) {
            alert('Please select at least one die to save.');
            return;
        }

        const newRoll = {
            characterId: linkedCharacterId,
            name: rollName,
            dice: { ...rollCardDiceCounts },
            modifier: parseInt(detailsSidebar.querySelector('#roll-card-add-roll-modifier').value, 10) || 0,
            tags: [detailsSidebar.querySelector('#roll-card-add-roll-tags').value]
        };

        const allSavedRolls = JSON.parse(cardElement.dataset.savedRolls || '[]');
        allSavedRolls.push(newRoll);
        cardElement.dataset.savedRolls = JSON.stringify(allSavedRolls);

        // Reset form and render list
        detailsSidebar.querySelector('#roll-card-add-roll-name').value = '';
        rollCardDiceCounts = {};
        updateRollCardDiceDisplay();
        renderSavedRollsList();
    });

    savedRollsList.addEventListener('click', (e) => {
        if (e.target.matches('.remove-participant-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            const allSavedRolls = JSON.parse(cardElement.dataset.savedRolls || '[]');
            allSavedRolls.splice(index, 1);
            cardElement.dataset.savedRolls = JSON.stringify(allSavedRolls);
            renderSavedRollsList();
        }
    });


    // Initial Renders
    renderSavedRollsList();
    renderCharacterSelectList();
    updateRollCardDiceDisplay();
}*/


    // --- Delete Button (for all cards) ---
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Card';
    deleteButton.style.marginTop = 'auto'; // Pushes to the bottom
    deleteButton.style.backgroundColor = '#992222';
    deleteButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete the card "${cardId}"?`)) {
            cardElement.remove();
            detailsSidebar.innerHTML = '';
        }
    });
    detailsSidebar.appendChild(deleteButton);
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.module-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

    function initializeAutomationSidebar() {
        const moduleCardsContainer = document.getElementById('module-cards-container');
        const automationCanvas = document.getElementById('automation-canvas');
        const toggleSwitch = document.getElementById('automation-mode-toggle-switch');

        const cardButtons = [
            'Story Beat', 'Note', 'Character', 'Map', 'Wander', 'Initiative',// 'Roll'
        ];

        moduleCardsContainer.innerHTML = '';
        automationCardCounters = {}; // Reset counters on initialization

        // Add the "Start Next" line if it doesn't exist
        if (automationCanvas && !automationCanvas.querySelector('#automation-start-line')) {
            const startLine = document.createElement('div');
            startLine.id = 'automation-start-line';
            startLine.className = 'automation-start-line module-card'; // Use module-card for drag/drop compatibility
            startLine.textContent = '--- Start Next ---';
            startLine.draggable = true;
            startLine.dataset.cardType = 'start-line';

            // Styling
            startLine.style.textAlign = 'center';
            startLine.style.fontWeight = 'bold';
            startLine.style.color = '#a0b4c9';
            startLine.style.cursor = 'move';
            startLine.style.padding = '5px 0';
            startLine.style.margin = '5px';
            startLine.style.borderTop = '2px dashed #a0b4c9';
            startLine.style.borderBottom = '2px dashed #a0b4c9';
            startLine.style.backgroundColor = '#2d3748';

            startLine.addEventListener('dragstart', () => {
                startLine.classList.add('dragging');
            });
            startLine.addEventListener('dragend', () => {
                startLine.classList.remove('dragging');
            });

            automationCanvas.prepend(startLine);
        }

        cardButtons.forEach(cardName => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.textContent = cardName;
            card.addEventListener('click', () => {
                const newCard = document.createElement('div');
                // Explicitly copy all classes from the source card to ensure color is transferred.
                card.classList.forEach(c => newCard.classList.add(c));

                const cardTitle = document.createElement('span');
                cardTitle.textContent = card.textContent;
                newCard.appendChild(cardTitle);

                const baseName = cardName.toLowerCase().replace(/\s+/g, '_');
                automationCardCounters[baseName] = (automationCardCounters[baseName] || 0) + 1;
                const labelText = `${baseName}_${automationCardCounters[baseName]}`;

                const label = document.createElement('span');
                label.className = 'automation-card-label';
                label.textContent = labelText;
                newCard.appendChild(label);

                newCard.dataset.cardType = baseName;
                newCard.dataset.cardId = labelText; // Use the unique label as a persistent ID
                newCard.dataset.title = cardName;
                newCard.dataset.interactionMode = toggleSwitch.checked ? 'both' : 'dm-only';
                if (cardName === 'Note') {
                    newCard.dataset.linkedNotes = '[]';
                } else if (cardName === 'Character') {
                    newCard.dataset.linkedCharacters = '[]';
                } else if (cardName === 'Map') {
                    newCard.dataset.linkedMaps = '[]';
                }

                newCard.addEventListener('click', () => {
                    displayCardDetails(newCard);
                });

                newCard.draggable = true;
                newCard.addEventListener('dragstart', () => {
                    newCard.classList.add('dragging');
                });
                newCard.addEventListener('dragend', () => {
                    newCard.classList.remove('dragging');
                });

                automationCanvas.appendChild(newCard);
            });
            moduleCardsContainer.appendChild(card);
        });

        automationCanvas.addEventListener('dragover', event => {
            event.preventDefault();
            const afterElement = getDragAfterElement(automationCanvas, event.clientY);
            const draggingCard = document.querySelector('#automation-canvas .module-card.dragging');
            if (draggingCard) {
                if (afterElement == null) {
                    automationCanvas.appendChild(draggingCard);
                } else {
                    automationCanvas.insertBefore(draggingCard, afterElement);
                }
            }
        });

        updateCardColors(toggleSwitch.checked);

        toggleSwitch.addEventListener('change', () => {
            updateCardColors(toggleSwitch.checked);
        });

        function updateCardColors(isBothMode) {
            const cards = moduleCardsContainer.querySelectorAll('.module-card');
            cards.forEach(card => {
                card.classList.remove('module-card-dm', 'module-card-both');
                if (isBothMode) {
                    card.classList.add('module-card-both');
                } else {
                    card.classList.add('module-card-dm');
                }
            });
        }
    }

    function initializeImportExport() {
        if (isImportExportInitialized) {
            // If already initialized, just refresh the view
            const activeType = document.querySelector('.import-export-controls button.active')?.dataset.type || 'all';
            handleImportExportSelection(activeType);
            if (jsonEditor) {
                setTimeout(() => jsonEditor.refresh(), 1);
            }
            return;
        }

        const editorDiv = document.getElementById('json-editor');
        if (editorDiv) {
            jsonEditor = CodeMirror(editorDiv, {
                value: "Select a category to view JSON data...",
                mode: { name: "javascript", json: true },
                lineNumbers: true,
                theme: "default"
            });
        }

        const controls = document.querySelector('.import-export-controls');
        const allButton = controls.querySelector('button[data-type="all"]');
        if (allButton) {
            allButton.classList.add('active');
        }

        handleImportExportSelection('all');
        isImportExportInitialized = true;

        if (jsonEditor) {
            setTimeout(() => jsonEditor.refresh(), 1);
        }
    }

    const createContextMenu = (e, options) => {
        // Hide all static context menus
        document.querySelectorAll('.context-menu[id]').forEach(menu => menu.style.display = 'none');
        // Remove all dynamic context menus
        document.querySelectorAll('.dynamic-context-menu').forEach(menu => menu.remove());


        const menu = document.createElement('div');
        menu.classList.add('context-menu', 'dynamic-context-menu');
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        const ul = document.createElement('ul');
        menu.appendChild(ul);

        options.forEach(option => {
            const item = document.createElement('li');
            item.textContent = option.label;
            if (option.disabled) {
                item.style.opacity = 0.5;
                item.style.cursor = 'not-allowed';
            } else {
                item.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    option.action();
                    menu.remove();
                });
                }
            ul.appendChild(item);
            });

        document.body.appendChild(menu);
    };

    function initStoryTree() {
    // UI Elements
    const canvas = document.getElementById('quest-canvas');
    if (!canvas) return; // Don't run if the element is not there
        const ctx = canvas.getContext('2d');
    const cardContainer = document.getElementById('card-container');
    const container = document.getElementById('canvas-container');
    const overlay = document.getElementById('story-beat-card-overlay');
    const storyBeatCardBody = document.getElementById('story-beat-card-body');
    const storyBeatCardCloseButton = document.getElementById('story-beat-card-close-button');


    // Pan, Zoom, and Mode state
        let scale = 1.0;
    let originX = container.offsetWidth / 2;
    let originY = container.offsetHeight / 2;
        let isPanning = false;
    let isLinking = false;
    let isMoving = false;
        let panStartX = 0;
        let panStartY = 0;
    let moveStartX = 0;
    let moveStartY = 0;
    let linkSourceId = null;

    // --- Core Functions ---

    /**
     * Draws the lines between parent and child quest cards.
     */
    const drawConnections = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(originX, originY);
            ctx.scale(scale, scale);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

            quests.forEach(quest => {
            if (quest.parentIds && quest.parentIds.length > 0) {
                    quest.parentIds.forEach(parentId => {
                    const parentQuest = quests.find(q => q.id === parentId);
                    if (parentQuest) {
                            ctx.beginPath();
                        ctx.moveTo(parentQuest.x, parentQuest.y);
                            ctx.lineTo(quest.x, quest.y);
                            ctx.stroke();
                        }
                    });
                }
            });
            ctx.restore();
    };

    /**
     * Renders the HTML cards for each quest.
     */
    const renderCards = () => {
        cardContainer.innerHTML = '';

        quests.forEach(quest => {
            const card = document.createElement('div');
            card.classList.add('card');
            if (quest.id === selectedQuestId) {
                card.classList.add('selected');
            }
            if (quest.questStatus) {
                card.classList.add(`status-${quest.questStatus.toLowerCase()}`);
            }
            card.dataset.id = quest.id;

            // Bottom layer (map background)
            const background = document.createElement('div');
            background.classList.add('card-background');

            if (quest.associatedMaps && quest.associatedMaps.length > 0) {
                if (quest.associatedMaps.length === 1) {
                    const mapData = detailedMapData.get(quest.associatedMaps[0]);
                    if (mapData && mapData.url) {
                        background.style.backgroundImage = `url('${mapData.url}')`;
                    }
                } else {
                    background.style.display = 'grid';
                    background.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(quest.associatedMaps.length))}, 1fr)`;
                    quest.associatedMaps.forEach(mapName => {
                        const mapData = detailedMapData.get(mapName);
                        if (mapData && mapData.url) {
                            const mapCell = document.createElement('div');
                            mapCell.style.backgroundImage = `url('${mapData.url}')`;
                            mapCell.style.backgroundSize = 'cover';
                            mapCell.style.backgroundPosition = 'center';
                            background.appendChild(mapCell);
                        }
                    });
                }
            }
            card.appendChild(background);

            // Top layer (text overlay)
            const overlay = document.createElement('div');
            overlay.classList.add('card-overlay');

            // Title
            const nameElement = document.createElement('h3');
            nameElement.textContent = quest.name;
            overlay.appendChild(nameElement);

            // Subtitle (duration and rating)
            const subtitle = document.createElement('div');
            subtitle.classList.add('card-subtitle');

            const duration = document.createElement('span');
            duration.textContent = quest.storyDuration || '';
            subtitle.appendChild(duration);

            const rating = document.createElement('span');
            rating.classList.add('card-rating');
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += i < quest.difficulty ? '★' : '☆';
            }
            rating.textContent = stars;
            subtitle.appendChild(rating);

            overlay.appendChild(subtitle);

            // Linked Characters and Description
            const content = document.createElement('div');
            content.classList.add('card-content');

            const charactersContainer = document.createElement('div');
            charactersContainer.classList.add('card-characters');
            if (quest.associatedNPCs && quest.associatedNPCs.length > 0) {
                quest.associatedNPCs.forEach(npc => {
                    const character = charactersData.find(c => c.id === npc.id);
                    if (character) {
                        const profile = document.createElement('div');
                        profile.classList.add('card-character-profile');
                        if (character.sheetData && character.sheetData.character_portrait) {
                            profile.style.backgroundImage = `url('${character.sheetData.character_portrait}')`;
                        } else {
                            profile.textContent = getInitials(character.name);
                        }
                        charactersContainer.appendChild(profile);
                    }
                });
            }
            content.appendChild(charactersContainer);

            const description = document.createElement('p');
            description.classList.add('card-description');
            const fullDescription = quest.description || '';
            const words = fullDescription.split(/\s+/);
            if (words.length > 15) {
                description.textContent = words.slice(0, 15).join(' ') + '...';
            } else {
                description.textContent = fullDescription;
            }
            content.appendChild(description);

            overlay.appendChild(content);

            // Rewards
            const rewardsContainer = document.createElement('div');
            rewardsContainer.classList.add('card-rewards');
            if (quest.detailedRewards) {
                const rewards = [];
                if (quest.detailedRewards.xp) rewards.push(`XP: ${quest.detailedRewards.xp}`);
                if (quest.detailedRewards.information) {
                    const fullInfo = quest.detailedRewards.information;
                    const infoWords = fullInfo.split(/\s+/);
                    if (infoWords.length > 30) {
                        rewards.push(infoWords.slice(0, 30).join(' ') + '...');
                    } else {
                        rewards.push(fullInfo);
                    }
                }
                rewardsContainer.textContent = rewards.join(', ');
            }
            overlay.appendChild(rewardsContainer);

            card.appendChild(overlay);


            const x = originX + (quest.x * scale);
            const y = originY + (quest.y * scale);
            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            card.style.transform = `translate(-50%, -50%) scale(${scale})`;

            card.addEventListener('click', (e) => {
                e.stopPropagation();

                if (isLinking) {
                    handleLink(quest.id);
                } else {
                    if (activeOverlayCardId === quest.id) {
                        hideOverlay();
                    } else {
                        populateAndShowStoryBeatCard(quest);
                    }
                    selectedQuestId = quest.id;
                    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                }
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedQuestId = quest.id;
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                createCardContextMenu(e, quest);
            });

            cardContainer.appendChild(card);

            // Adjust font size to fit
            const adjustFontSize = (element) => {
                if (!element) return;
                // Reset font size before calculating
                element.style.fontSize = '';
                let baseFontSize = parseFloat(window.getComputedStyle(element).fontSize);
                const minFontSize = 8; // Minimum font size in pixels

                // Use a temporary clone to avoid layout shifts during calculation
                const clone = element.cloneNode(true);
                clone.style.visibility = 'hidden';
                clone.style.position = 'absolute';
                clone.style.width = element.clientWidth + 'px';
                clone.style.height = 'auto'; // Let height grow
                document.body.appendChild(clone);

                while (clone.scrollHeight > element.clientHeight && baseFontSize > minFontSize) {
                    baseFontSize -= 0.5;
                    clone.style.fontSize = baseFontSize + 'px';
                }

                element.style.fontSize = baseFontSize + 'px';
                document.body.removeChild(clone);
            };

            adjustFontSize(description);
            adjustFontSize(rewardsContainer);
        });
    };

    /**
     * Shows the quest details overlay.
     * @param {object} quest The quest object to display.
     */
    const populateAndShowStoryBeatCard = (quest) => {
        if (!quest) return;

        const statusOptions = ['Unavailable', 'Available', 'Active', 'Completed', 'Failed', 'Abandoned'];
        const mapOptions = Array.from(detailedMapData.keys());
        const characterOptions = charactersData.map(c => ({ id: c.id, name: c.name }));

        let finalQuestNote = '';
        if (quest.id === 1) {
            finalQuestNote = `<p style="color: #a0b4c9; font-style: italic; font-size: 0.9em; margin-top: 5px;">This is the final Campaign quest and cannot be deleted.</p>`;
        }

        let parentLinks = quest.parentIds.map(pid => {
            const parent = quests.find(q => q.id === pid);
            return parent ? `<a href="#" class="quest-link" data-quest-id="${pid}">${parent.name}</a>` : 'Unknown';
        }).join('<br>');
        if (!parentLinks) parentLinks = 'None';

        let childrenLinks = quests.filter(q => q.parentIds.includes(quest.id)).map(child => {
            return `<a href="#" class="quest-link" data-quest-id="${child.id}">${child.name}</a>`;
        }).join('<br>');
        if (!childrenLinks) childrenLinks = 'None';

        storyBeatCardBody.innerHTML = `
            <h2 contenteditable="true" id="quest-name">${quest.name}</h2>
            ${finalQuestNote}

            <h3>Description</h3>
            <div contenteditable="true" id="quest-description" class="editable-div">${quest.description || ''}</div>

            <h3>Quest Status</h3>
            <select id="quest-status">
                ${statusOptions.map(s => `<option value="${s}" ${quest.questStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>

            <h3>Quest Type</h3>
            <input type="text" id="quest-type" value="${(quest.questType || []).join(', ')}" placeholder="e.g., Main Story, Side Quest">

            <h3>Story Duration</h3>
            <input type="text" id="quest-story-duration" value="${quest.storyDuration || ''}" placeholder="e.g., 1 Session, 3 Hours">

            <h3>Difficulty</h3>
            <div id="quest-difficulty" class="difficulty-rating">
                ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-value="${i}">${i <= quest.difficulty ? '★' : '☆'}</span>`).join('')}
            </div>

            <h3>Starting Triggers</h3>
            <div id="quest-starting-triggers">
                ${(quest.startingTriggers || []).map((trigger, index) => `
                    <div class="trigger-row" data-index="${index}">
                        <div contenteditable="true" class="editable-div trigger-text">${trigger.text}</div>
                        <button class="remove-trigger-btn">X</button>
                    </div>
                `).join('')}
            </div>
            <button id="add-starting-trigger-btn">+ Add Trigger</button>

            <h3>Associated Maps</h3>
            <select id="quest-associated-maps" multiple size="4">
                ${mapOptions.map(m => `<option value="${m}" ${(quest.associatedMaps || []).includes(m) ? 'selected' : ''}>${m}</option>`).join('')}
            </select>

            <h3>Associated NPCs</h3>
            <div id="quest-associated-npcs">
                ${(quest.associatedNPCs || []).map((npc, index) => `
                    <div class="npc-row" data-index="${index}">
                        <select class="npc-select">
                            <option value="">--Select NPC--</option>
                            ${characterOptions.map(c => `<option value="${c.id}" ${npc.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                        <input type="text" class="npc-role" value="${npc.role}" placeholder="Role (e.g., Quest Giver)">
                        <button class="remove-npc-btn">X</button>
                    </div>
                `).join('')}
            </div>
            <button id="add-npc-btn">+ Add NPC</button>

            <h3>Story Steps</h3>
            <div id="quest-story-steps">
                ${(quest.storySteps || []).map((step, index) => {
                    const title = step.title ?? `Story Step ${index + 1}`;
                    const text = step.text || '';
                    const completed = step.completed || false;
                    return `
                    <div class="story-step-row" data-index="${index}">
                        <input type="checkbox" class="story-step-checkbox" ${completed ? 'checked' : ''}>
                        <div class="story-step-content">
                            <h3 class="story-step-title" placeholder="Step Title">${title}</h3>
                            <div contenteditable="true" class="editable-div story-step-text" placeholder="Step Description...">${text}</div>
                        </div>
                        <button class="remove-step-btn">X</button>
                    </div>
                `}).join('')}
            </div>
            <button id="add-story-step-btn">+ Add Step</button>

            <h3>Success Triggers</h3>
            <div id="quest-success-triggers">
                ${(quest.successTriggers || []).map((trigger, index) => `
                    <div class="trigger-row" data-index="${index}">
                        <div contenteditable="true" class="editable-div trigger-text">${trigger.text}</div>
                        <button class="remove-trigger-btn">X</button>
                    </div>
                `).join('')}
            </div>
            <button id="add-success-trigger-btn">+ Add Trigger</button>

            <h3>Failure Triggers</h3>
            <div id="quest-failure-triggers">
                ${(quest.failureTriggers || []).map((trigger, index) => `
                    <div class="trigger-row" data-index="${index}">
                        <div contenteditable="true" class="editable-div trigger-text">${trigger.text}</div>
                        <button class="remove-trigger-btn">X</button>
                    </div>
                `).join('')}
            </div>
            <button id="add-failure-trigger-btn">+ Add Trigger</button>

            <h3>Rewards</h3>
            <div class="rewards-grid">
                <label for="reward-xp">XP:</label>
                <input type="number" id="reward-xp" value="${quest.detailedRewards.xp || 0}">

                <label for="reward-loot">Loot/Currency:</label>
                <textarea id="reward-loot" rows="2">${quest.detailedRewards.loot || ''}</textarea>

                <label for="reward-magic-items">Magic Items:</label>
                <textarea id="reward-magic-items" rows="2">${quest.detailedRewards.magicItems || ''}</textarea>

                <label for="reward-information">Information/Lore:</label>
                <textarea id="reward-information" rows="2">${quest.detailedRewards.information || ''}</textarea>
            </div>

            <h3>Parent Quests</h3>
            <div>${parentLinks}</div>
            <h3>Child Quests</h3>
            <div>${childrenLinks}</div>

            <button id="save-quest-details-btn">Save All Changes</button>
        `;

        originalQuestState = JSON.parse(JSON.stringify(quest));
        overlay.style.display = 'flex';
        activeOverlayCardId = quest.id;

        // --- Event Listeners for editing ---
        const saveButton = document.getElementById('save-quest-details-btn');
        saveButton.addEventListener('click', () => {
            const questToUpdate = quests.find(q => q.id === quest.id);
            if (!questToUpdate) {
                alert("Fatal Error: Could not find the quest to update. Your changes cannot be saved.");
                return;
            }

            const oldStatus = questToUpdate.questStatus;
            const newStatus = document.getElementById('quest-status').value;
            const questName = document.getElementById('quest-name').innerText;

            // Save all fields to the object from the main quests array
            questToUpdate.name = questName;
            questToUpdate.description = document.getElementById('quest-description').innerText;
            questToUpdate.questStatus = newStatus;
            questToUpdate.questType = document.getElementById('quest-type').value.split(',').map(s => s.trim()).filter(Boolean);
            questToUpdate.storyDuration = document.getElementById('quest-story-duration').value;

            questToUpdate.startingTriggers = Array.from(document.querySelectorAll('#quest-starting-triggers .trigger-text')).map(div => ({ text: div.innerText, linkedQuestId: null }));

            const getUpdatedTriggers = (type) => {
                return Array.from(document.querySelectorAll(`#quest-${type}-triggers .trigger-row`)).map((row, index) => {
                    const existingTrigger = questToUpdate[type + 'Triggers'][index] || {};
                    return {
                        text: row.querySelector('.trigger-text').innerText,
                        linkedQuestId: existingTrigger.linkedQuestId || null
                    };
                });
            };

            questToUpdate.successTriggers = getUpdatedTriggers('success');
            questToUpdate.failureTriggers = getUpdatedTriggers('failure');

            const mapsSelect = document.getElementById('quest-associated-maps');
            questToUpdate.associatedMaps = Array.from(mapsSelect.selectedOptions).map(opt => opt.value);

            const npcRows = document.querySelectorAll('.npc-row');
            questToUpdate.associatedNPCs = Array.from(npcRows).map(row => ({
                id: parseInt(row.querySelector('.npc-select').value, 10),
                role: row.querySelector('.npc-role').value
            })).filter(npc => npc.id);

            const stepRows = document.querySelectorAll('.story-step-row');
            questToUpdate.storySteps = Array.from(stepRows).map(row => ({
                title: row.querySelector('.story-step-title').innerText,
                text: row.querySelector('.story-step-text').innerText,
                completed: row.querySelector('.story-step-checkbox').checked
            }));

            questToUpdate.difficulty = quest.difficulty; // Save difficulty from the temporary quest object
            questToUpdate.detailedRewards = {
                xp: parseInt(document.getElementById('reward-xp').value, 10) || 0,
                loot: document.getElementById('reward-loot').value,
                magicItems: document.getElementById('reward-magic-items').value,
                information: document.getElementById('reward-information').value,
            };

            if (oldStatus !== newStatus) {
                addLogEntry({
                    type: 'system',
                    message: `${questName} ${newStatus}`
                });
            }

            alert('Quest details saved!');
            renderCards(); // Re-render cards to reflect name change
            drawConnections(); // Redraw connections to reflect parentId changes
            renderActiveQuestsInFooter(); // Update the footer as well
        });

        const addNpcBtn = document.getElementById('add-npc-btn');
        addNpcBtn.addEventListener('click', () => {
            const container = document.getElementById('quest-associated-npcs');
            const newIndex = container.children.length;
            const newRow = document.createElement('div');
            newRow.className = 'npc-row';
            newRow.dataset.index = newIndex;
            newRow.innerHTML = `
                <select class="npc-select">
                    <option value="">--Select NPC--</option>
                    ${characterOptions.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
                <input type="text" class="npc-role" placeholder="Role (e.g., Quest Giver)">
                <button class="remove-npc-btn">X</button>
            `;
            container.appendChild(newRow);
        });

        const npcContainer = document.getElementById('quest-associated-npcs');
        npcContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-npc-btn')) {
                e.target.closest('.npc-row').remove();
            }
        });

        const difficultyContainer = document.getElementById('quest-difficulty');
        difficultyContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                const value = parseInt(e.target.dataset.value, 10);
                quest.difficulty = value;
                const stars = difficultyContainer.querySelectorAll('.star');
                stars.forEach(star => {
                    star.innerHTML = parseInt(star.dataset.value, 10) <= value ? '★' : '☆';
                });
            }
        });

        const addStoryStepBtn = document.getElementById('add-story-step-btn');
        addStoryStepBtn.addEventListener('click', () => {
            const container = document.getElementById('quest-story-steps');
            const newIndex = container.children.length;
            const newRow = document.createElement('div');
            newRow.className = 'story-step-row';
            newRow.dataset.index = newIndex;
            newRow.innerHTML = `
                <input type="checkbox" class="story-step-checkbox">
                <div class="story-step-content">
                    <h3 class="story-step-title" placeholder="Step Title">Story Step ${newIndex + 1}</h3>
                    <div contenteditable="true" class="editable-div story-step-text" placeholder="Step Description..."></div>
                </div>
                <button class="remove-step-btn">X</button>
            `;
            container.appendChild(newRow);
        });

        const storyStepsContainer = document.getElementById('quest-story-steps');
        storyStepsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-step-btn')) {
                e.target.closest('.story-step-row').remove();
            }

            const titleEl = e.target.closest('.story-step-title');
            if (titleEl && !titleEl.isContentEditable) {
                titleEl.contentEditable = true;
                titleEl.focus();
                const range = document.createRange();
                range.selectNodeContents(titleEl);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

        storyStepsContainer.addEventListener('blur', (e) => {
            const titleEl = e.target.closest('.story-step-title');
            if (titleEl) {
                titleEl.contentEditable = false;
            }
        }, true);

        storyStepsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('story-step-title')) {
                e.preventDefault(); // Prevent new line
                e.target.blur(); // Trigger the blur event to save and set contentEditable=false
            }
        });

        storyStepsContainer.addEventListener('change', e => {
            if (e.target.classList.contains('story-step-checkbox') && e.target.checked) {
                const quest = quests.find(q => q.id === activeOverlayCardId);
                if (quest && quest.questStatus === 'Active') {
                    const stepRow = e.target.closest('.story-step-row');
                    const stepTitle = stepRow.querySelector('.story-step-title').innerText;
                    addLogEntry({
                        type: 'system',
                        message: `${quest.name} ${stepTitle}`
                    });
                }
            }
        });

        // Add/Remove Triggers
        const setupTriggerList = (containerId, buttonId, triggerType) => {
            const addButton = document.getElementById(buttonId);
            addButton.addEventListener('click', () => {
                const currentQuest = quests.find(q => q.id === activeOverlayCardId);
                if (currentQuest) {
                    if (!currentQuest[triggerType]) {
                        currentQuest[triggerType] = [];
                    }
                    currentQuest[triggerType].push({ text: 'New Trigger', linkedQuestId: null });
                    populateAndShowStoryBeatCard(currentQuest);
                }
            });
        };

        setupTriggerList('quest-starting-triggers', 'add-starting-trigger-btn', 'startingTriggers');
        setupTriggerList('quest-success-triggers', 'add-success-trigger-btn', 'successTriggers');
        setupTriggerList('quest-failure-triggers', 'add-failure-trigger-btn', 'failureTriggers');
    };


    // --- Context Menu Logic ---

    const createCanvasContextMenu = (e) => {
        const options = [{
            label: 'Add Quest',
            action: () => {
                const rect = container.getBoundingClientRect();
                const newX = (e.clientX - rect.left - originX) / scale;
                const newY = (e.clientY - rect.top - originY) / scale;

                const newQuest = {
                    id: nextQuestId++,
                    name: `New Quest ${nextQuestId - 1}`,
                    parentIds: [],
                    x: newX,
                    y: newY,
                    description: '',
                    questStatus: 'Available',
                    questType: [],
                    startingTriggers: [],
                    associatedMaps: [],
                    associatedNPCs: [],
                    failureTriggers: [],
                    successTriggers: [],
                    detailedRewards: { xp: 0, loot: '', magicItems: '', information: '' },
                    storyDuration: '',
                    difficulty: 0,
                    storySteps: [],
                    status: 'active',
                    prerequisites: [],
                    rewards: [],
                    recommendations: [],
                    completionSteps: []
                };
                quests.push(newQuest);
                selectedQuestId = newQuest.id;
                drawConnections();
                renderCards();
            }
        }];
        createContextMenu(e, options);
    };

    const createCardContextMenu = (e, quest) => {
        const options = [
            {
                label: 'Rename',
                action: () => {
                    const newName = prompt('Enter a new name for the quest:', quest.name);
                    if (newName !== null && newName.trim() !== '') {
                        quest.name = newName.trim();
                        renderCards();
                        }
                    }
            },
            {
                label: 'Delete',
                disabled: quest.id === 1,
                action: () => {
                    if (quest.id === 1) return;

                    quests = quests.filter(q => q.id !== quest.id);
                    // Remove from parentIds of other quests
                    quests.forEach(q => {
                        if (q.parentIds) {
                            q.parentIds = q.parentIds.filter(pid => pid !== quest.id);
                        }
                    });

                    selectedQuestId = null;
                    drawConnections();
                    renderCards();
                }
            },
            {
                label: 'Link',
                action: () => {
                    isLinking = true;
                    linkSourceId = quest.id;
                    document.body.classList.add('linking-mode');
                }
            },
            {
                label: 'Move',
                action: () => {
                    isMoving = true;
                    document.body.classList.add('moving-mode');
                    selectedQuestId = quest.id;
                }
            }
        ];
        createContextMenu(e, options);
    };

    const handleLink = (targetId) => {
        const sourceQuest = quests.find(q => q.id === linkSourceId);
        const targetQuest = quests.find(q => q.id === targetId);

        if (!sourceQuest || !targetQuest || sourceQuest.id === targetQuest.id) {
            isLinking = false;
            document.body.classList.remove('linking-mode');
            return;
            }

        // Unlink if already linked
        if (sourceQuest.parentIds.includes(targetId)) {
            sourceQuest.parentIds = sourceQuest.parentIds.filter(id => id !== targetId);
        } else {
            // Check for circular dependencies
            const isCircular = (source, target) => {
                let toVisit = [...target.parentIds];
                const visited = new Set();
                while(toVisit.length > 0) {
                    const currentId = toVisit.pop();
                    if (currentId === source.id) return true;
                    if (!visited.has(currentId)) {
                        visited.add(currentId);
                        const currentQuest = quests.find(q => q.id === currentId);
                        if (currentQuest) {
                            toVisit.push(...currentQuest.parentIds);
                        }
                    }
                }
                return false;
                };

            if (!isCircular(sourceQuest, targetQuest)) {
                 if (!sourceQuest.parentIds.includes(targetId)) {
                    sourceQuest.parentIds.push(targetId);
                }
            } else {
                alert("Cannot create a circular dependency.");
            }
        }

        isLinking = false;
        linkSourceId = null;
        document.body.classList.remove('linking-mode');

        drawConnections();
        renderCards();
    };

    /**
     * Shows the quest details overlay, populating it with a specific quest's data.
     * @param {object} quest The quest object to display.
     */

    // --- Event Listeners and Main Logic ---

    const resizeCanvas = () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        drawConnections();
        renderCards();
    };
    window.addEventListener('resize', resizeCanvas);

    container.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left click
            if (isMoving) {
                const questToMove = quests.find(q => q.id === selectedQuestId);
                if (questToMove) {
                    // No setup needed here as mousemove will handle it
                }
            } else {
                isPanning = true;
                panStartX = e.clientX - originX;
                panStartY = e.clientY - originY;
                container.style.cursor = 'grabbing';
            }
        }
    });

    container.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isPanning = false;
            if (isMoving) {
                isMoving = false;
                document.body.classList.remove('moving-mode');
            }
            container.style.cursor = 'grab';
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (isMoving) {
            const questToMove = quests.find(q => q.id === selectedQuestId);
            if (questToMove) {
                const rect = container.getBoundingClientRect();
                const newX = (e.clientX - rect.left - originX) / scale;
                const newY = (e.clientY - rect.top - originY) / scale;
                questToMove.x = newX;
                questToMove.y = newY;
                drawConnections();
                renderCards();
            }
        } else if (isPanning) {
            originX = e.clientX - panStartX;
            originY = e.clientY - panStartY;
            drawConnections();
            renderCards();
        }
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, scale + zoomAmount), 2.0);

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        originX = originX - (mouseX - originX) * (newScale / scale - 1);
        originY = originY - (mouseY - originY) * (newScale / scale - 1);

        scale = newScale;
        drawConnections();
        renderCards();
    });

    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        createCanvasContextMenu(e);
    });

    // Remove context menu on window click
    window.addEventListener('click', (e) => {
        // The main document click listener now handles closing all context menus.
        // This listener is just for story-tree specific "click outside" logic.

        // If the click was inside any context menu, don't cancel linking mode.
        if (e.target.closest('.context-menu')) {
            return;
        }

        if (isLinking && !e.target.closest('.card')) {
            isLinking = false;
            linkSourceId = null;
            document.body.classList.remove('linking-mode');
        }
    });

    const storyBeatCardBackButton = document.getElementById('story-beat-card-back-button');
    if (storyBeatCardBackButton) {
        storyBeatCardBackButton.addEventListener('click', () => {
            hideOverlay();
        });
    }


    // Initial setup
    resizeCanvas(); // Set initial canvas size
    drawConnections();
    renderCards();

    if (saveJsonButton) {
        saveJsonButton.addEventListener('click', () => {
            try {
                const updatedQuestData = JSON.parse(jsonEditContent.value);
                const questId = updatedQuestData.id;

                if (!questId || !quests.some(q => q.id === questId)) {
                    alert("JSON must have a valid 'id' matching the current quest.");
                    return;
                }

                // This is a temporary object to hold the changes.
                // It will be used to repopulate the overlay.
                const tempQuest = {
                    ...quests.find(q => q.id === questId), // Start with existing data
                    ...updatedQuestData // Overwrite with new data
                };

                // Repopulate the story beat card with the new data
                populateAndShowStoryBeatCard(tempQuest);

                alert("Quest details have been updated on the overlay. Click 'Save All Changes' to apply them to the story tree.");
                jsonEditOverlay.style.display = 'none';

            } catch (e) {
                alert("Invalid JSON format. Please check the syntax and try again.");
                console.error("Error parsing quest JSON:", e);
            }
        });
    }


    if (jsonEditCloseButton) {
        jsonEditCloseButton.addEventListener('click', () => {
            jsonEditOverlay.style.display = 'none';
        });
    }

    if (copyJsonButton) {
        copyJsonButton.addEventListener('click', () => {
            navigator.clipboard.writeText(jsonEditContent.value).then(() => {
                copyJsonButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyJsonButton.textContent = 'Copy to Clipboard';
                }, 2000);
            }, (err) => {
                console.error('Could not copy text: ', err);
                alert('Failed to copy JSON.');
            });
        });
    }
    }

    if (storyBeatCardOverlay) {
        storyBeatCardOverlay.addEventListener('click', (e) => {
            if (e.target === storyBeatCardOverlay) {
                hideOverlay();
            }
        });
    }

    const footerTabsContainer = document.querySelector('.footer-tabs');
    if (footerTabsContainer) {
        footerTabsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('footer-tab-button')) {
                const targetTabId = event.target.dataset.tab;

                // Deactivate all tab buttons and content
                footerTabsContainer.querySelectorAll('.footer-tab-button').forEach(button => {
                    button.classList.remove('active');
                });
                document.querySelectorAll('.footer-tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Activate the clicked tab button and corresponding content
                event.target.classList.add('active');
                const targetContent = document.getElementById(targetTabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                if (targetTabId === 'footer-quests') {
                    renderActiveQuestsInFooter();
                } else if (targetTabId === 'footer-automation') {
                    renderAutomationFooter();
                }
            }
        });
    }

    let selectedFooterQuestId = null;

    function renderAutomationFooterMain(branchName) {
        const mainPane = document.getElementById('footer-automation-main');
        if (!mainPane) return;

        mainPane.innerHTML = ''; // Clear content

        const branchData = automationBranches[branchName];
        if (!branchData) {
            mainPane.innerHTML = '<p class="footer-placeholder">Branch data not found.</p>';
            return;
        }

        const cardList = document.createElement('div');
        cardList.className = 'automation-cards-list';

        const mainAutomationCanvas = document.getElementById('automation-canvas');
        const startLine = mainAutomationCanvas.querySelector('#automation-start-line');
        let startLineRendered = false;

        // Function to render the start line
        const renderStartLine = () => {
            const startLineIndicator = document.createElement('div');
            startLineIndicator.className = 'automation-start-line';
            startLineIndicator.textContent = '--- Start Next ---';
            startLineIndicator.style.cssText = 'text-align: center; font-weight: bold; color: #a0b4c9; border-top: 2px dashed #a0b4c9; border-bottom: 2px dashed #a0b4c9; margin: 5px 0; padding: 5px 0;';
            cardList.appendChild(startLineIndicator);
            startLineRendered = true;
        };

        // If start line is at the very beginning
        if (startLine && !startLine.previousElementSibling) {
            renderStartLine();
        }

        branchData.forEach(cardData => {
            // Check if the start line should be rendered before this card
            if (startLine && !startLineRendered) {
                const nextCardOnCanvas = startLine.nextElementSibling;
                if (nextCardOnCanvas && nextCardOnCanvas.querySelector('.automation-card-label')?.textContent === cardData.labelText) {
                    renderStartLine();
                }
            }

            const card = document.createElement('div');
            card.className = cardData.cardClass.includes('module-card-dm') ? 'quest-footer-card' : 'quest-footer-card selected'; // Simple visual distinction
            card.textContent = cardData.dataset.title || cardData.labelText;
            cardList.appendChild(card);
        });

        // If start line is at the very end
        if (startLine && !startLine.nextElementSibling && !startLineRendered) {
            renderStartLine();
        }

        mainPane.appendChild(cardList);
    }

    function syncAutomationControls() {
        const originalBeginBtn = document.getElementById('begin-automation-button');
        const originalActiveControls = document.getElementById('automation-active-controls');
        const originalBranchList = document.getElementById('automation-branches-list');

        const footerAutomationTab = document.getElementById('footer-automation');
        if (!footerAutomationTab || !footerAutomationTab.classList.contains('active')) {
            return; // Don't sync if the tab isn't visible
        }

        const footerBeginBtn = document.getElementById('footer-begin-automation-button');
        const footerActiveControls = document.getElementById('footer-automation-active-controls');
        const footerBranchList = document.getElementById('footer-automation-branches-list');
        const mainPane = document.getElementById('footer-automation-main');

        if (!originalBeginBtn || !footerBeginBtn) return;

        // Sync button visibility
        footerBeginBtn.style.display = originalBeginBtn.style.display;
        footerActiveControls.style.display = originalActiveControls.style.display;

        // Sync branch list content and selection
        footerBranchList.innerHTML = originalBranchList.innerHTML;
        let selectedBranchName = null;
        const selectedLi = originalBranchList.querySelector('li.selected');

        // Clear previous selections in footer
        footerBranchList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));

        if (selectedLi) {
            selectedBranchName = selectedLi.querySelector('span').textContent;
            const footerSelectedLi = Array.from(footerBranchList.querySelectorAll('li')).find(li => li.querySelector('span')?.textContent === selectedBranchName);
            if (footerSelectedLi) {
                footerSelectedLi.classList.add('selected');
            }
        }

        // Sync main pane content
        if (selectedBranchName) {
            renderAutomationFooterMain(selectedBranchName);
        } else {
            mainPane.innerHTML = '<p class="footer-placeholder">No automation branch selected.</p>';
        }
    }

    function renderAutomationFooter() {
        const leftPane = document.getElementById('footer-automation-left');
        if (!leftPane) return;

        leftPane.innerHTML = `
            <h3>Controls</h3>
            <div id="footer-automation-controls" style="margin-bottom: 10px; display: flex; justify-content: space-around;">
                <button id="footer-begin-automation-button" style="display: none;">Begin</button>
                <div id="footer-automation-active-controls" style="display: flex; justify-content: space-between; width: 100%;">
                    <button id="footer-previous-automation-button">Previous</button>
                    <button id="footer-stop-automation-button">Stop</button>
                    <button id="footer-next-automation-button">Next</button>
                </div>
            </div>
            <h3>Branches</h3>
            <ul id="footer-automation-branches-list" style="list-style-type: none; padding: 0; max-height: 150px; overflow-y: auto;"></ul>
        `;

        // Add event listeners
        document.getElementById('footer-begin-automation-button').addEventListener('click', (e) => {
            e.stopPropagation();
            handleBeginAutomation();
        });
        document.getElementById('footer-previous-automation-button').addEventListener('click', (e) => {
            e.stopPropagation();
            handlePreviousAutomation();
        });
        document.getElementById('footer-stop-automation-button').addEventListener('click', (e) => {
            e.stopPropagation();
            handleStopAutomation();
        });
        document.getElementById('footer-next-automation-button').addEventListener('click', (e) => {
            e.stopPropagation();
            handleNextAutomation();
        });

        document.getElementById('footer-automation-branches-list').addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                const branchName = li.querySelector('span').textContent;
                if (automationBranches[branchName]) {
                    loadAndRenderAutomationBranch(branchName);

                    // Manually update selection in the main list to keep UI in sync
                    const mainList = document.getElementById('automation-branches-list');
                    if (mainList) {
                        const currentSelected = mainList.querySelector('.selected');
                        if (currentSelected) currentSelected.classList.remove('selected');
                        const liToSelect = Array.from(mainList.querySelectorAll('li')).find(item => item.querySelector('span')?.textContent === branchName);
                        if (liToSelect) liToSelect.classList.add('selected');
                    }
                }
            }
        });

        syncAutomationControls(); // Initial sync
    }

    function renderActiveQuestsInFooter() {
        const activeQuestsList = document.getElementById('footer-active-quests-list');
        const activeQuestDetails = document.getElementById('footer-active-quest-details');
        if (!activeQuestsList || !activeQuestDetails) return;

        const activeQuests = quests.filter(q => q.questStatus === 'Active');
        activeQuestsList.innerHTML = '';

        if (activeQuests.length === 0) {
            activeQuestsList.innerHTML = '<p class="footer-placeholder">No active quests.</p>';
            activeQuestDetails.innerHTML = '<p class="footer-placeholder">Select an active quest to see details.</p>';
            selectedFooterQuestId = null;
            return;
        }

        // If no quest is selected, or the selected one is no longer active, select the first one.
        if (!selectedFooterQuestId || !activeQuests.some(q => q.id === selectedFooterQuestId)) {
            selectedFooterQuestId = activeQuests.length > 0 ? activeQuests[0].id : null;
        }

        if (isQuestLogVisible) {
            sendQuestLogData();
        }

        activeQuests.forEach(quest => {
            const card = document.createElement('div');
            card.className = 'quest-footer-card';
            card.dataset.questId = quest.id;
            if (quest.id === selectedFooterQuestId) {
                card.classList.add('selected');
            }

            const difficultyStars = ('★'.repeat(quest.difficulty || 0)) + ('☆'.repeat(5 - (quest.difficulty || 0)));
            card.innerHTML = `
                <h4>${quest.name}</h4>
                <p>Duration: ${quest.storyDuration || 'N/A'}</p>
                <p>Difficulty: ${difficultyStars}</p>
            `;

            card.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the click from bubbling up to the document listener

                const listContainer = event.currentTarget.parentNode;
                // Remove 'selected' from all sibling cards
                listContainer.querySelectorAll('.quest-footer-card').forEach(c => c.classList.remove('selected'));
                // Add 'selected' to the clicked card
                event.currentTarget.classList.add('selected');

                selectedFooterQuestId = quest.id;
                renderActiveQuestDetailsInFooter(quest.id);
            });

            activeQuestsList.appendChild(card);
        });

        renderActiveQuestDetailsInFooter(selectedFooterQuestId);
    }

    function renderActiveQuestDetailsInFooter(questId) {
        const detailsContainer = document.getElementById('footer-active-quest-details');
        if (!detailsContainer) return;

        const quest = quests.find(q => q.id === questId);

        if (!quest) {
            detailsContainer.innerHTML = '<p class="footer-placeholder">Select an active quest to see details.</p>';
            return;
        }

        let html = ``;

        // Starting Triggers
        html += `<h4>Starting Triggers</h4>`;
        if (quest.startingTriggers && quest.startingTriggers.length > 0) {
            html += `<ul class="quest-triggers-list">`;
            quest.startingTriggers.forEach(trigger => {
                html += `<li>${trigger.text}</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="footer-placeholder">None</p>`;
        }

        // Description
        html += `<h4>Description</h4>`;
        html += `<p style="font-size: 0.9em;">${quest.description || 'No description provided.'}</p>`;

        // Story Steps
        html += `<h4>Story Steps</h4>`;
        if (quest.storySteps && quest.storySteps.length > 0) {
            html += `<ul class="quest-steps-list">`;
            quest.storySteps.forEach((step, index) => {
                const description = step.text || (step.title ?? (typeof step === 'string' ? step : ''));
                html += `
                    <li>
                        <input type="checkbox" id="footer-step-${quest.id}-${index}" data-quest-id="${quest.id}" data-step-index="${index}" ${step.completed ? 'checked' : ''}>
                        <label for="footer-step-${quest.id}-${index}" class="${step.completed ? 'completed' : ''}">${description}</label>
                    </li>
                `;
            });
            html += `</ul>`;
        } else {
            html += `<p class="footer-placeholder">No story steps defined.</p>`;
        }

        // Success Triggers
        html += `<h4>Success Triggers</h4>`;
        if (quest.successTriggers && quest.successTriggers.length > 0) {
            html += `<ul class="quest-triggers-list">`;
            quest.successTriggers.forEach(trigger => {
                html += `<li>${trigger.text}</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="footer-placeholder">None</p>`;
        }

        // Failure Triggers
        html += `<h4>Failure Triggers</h4>`;
        if (quest.failureTriggers && quest.failureTriggers.length > 0) {
            html += `<ul class="quest-triggers-list">`;
            quest.failureTriggers.forEach(trigger => {
                html += `<li>${trigger.text}</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="footer-placeholder">None</p>`;
        }

        detailsContainer.innerHTML = html;

        if (isQuestLogVisible) {
            sendQuestLogData();
        }

        // Add event listeners for the checkboxes to ensure data synchronization
        detailsContainer.querySelectorAll('.quest-steps-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const questIdToUpdate = parseInt(event.target.dataset.questId, 10);
                const stepIndex = parseInt(event.target.dataset.stepIndex, 10);
                const isChecked = event.target.checked;

                const questToUpdate = quests.find(q => q.id === questIdToUpdate);
                if (questToUpdate && questToUpdate.storySteps[stepIndex]) {
                    questToUpdate.storySteps[stepIndex].completed = isChecked;

                    if (isChecked && questToUpdate.questStatus === 'Active') {
                        const step = questToUpdate.storySteps[stepIndex];
                        const stepTitle = step.title || 'Unnamed step';
                        addLogEntry({
                            type: 'system',
                            message: `${questToUpdate.name}: ${stepTitle} completed.`
                        });
                    }

                    // Re-render the details to update the UI (e.g., strikethrough)
                    renderActiveQuestDetailsInFooter(questIdToUpdate);

                    // If the main story beat card is open for this quest, we should update it too.
                    if (activeOverlayCardId === questIdToUpdate) {
                        populateAndShowStoryBeatCard(questToUpdate);
                    }
                }
            });
        });

        // --- Parent Quests Logic ---
        const parentQuestsContainer = document.createElement('div');
        parentQuestsContainer.className = 'successor-quests-container'; // Keep class for styling

        let parentHtml = `<h4>Parent Quests</h4>`;
        // Find quests that are parents of the current quest
        const parentQuests = quests.filter(p => quest.parentIds.includes(p.id));

        if (parentQuests.length > 0) {
            parentQuests.forEach(pQuest => {
                const difficultyStars = ('★'.repeat(pQuest.difficulty || 0)) + ('☆'.repeat(5 - (pQuest.difficulty || 0)));
                const startingTriggerText = pQuest.startingTriggers && pQuest.startingTriggers.length > 0 ? pQuest.startingTriggers[0].text : 'No trigger specified';
                parentHtml += `
                    <div class="quest-footer-card parent-quest-card" data-parent-quest-id="${pQuest.id}">
                        <h4>${pQuest.name}</h4>
                        <p>Duration: ${pQuest.storyDuration || 'N/A'} | Difficulty: ${difficultyStars}</p>
                        <p style="font-size: 0.8em; font-style: italic;">Trigger: ${startingTriggerText}</p>
                    </div>
                `;
            });
        } else {
            parentHtml += `<p class="footer-placeholder">No parent quests defined.</p>`;
        }
        parentQuestsContainer.innerHTML = parentHtml;
        detailsContainer.appendChild(parentQuestsContainer);

        // Add event listeners for parent quest cards
        detailsContainer.querySelectorAll('.parent-quest-card').forEach(card => {
            card.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the click from bubbling up and closing the footer
                const clickedParentQuestId = parseInt(event.currentTarget.dataset.parentQuestId, 10);
                const currentQuestId = quest.id;

                const clickedParentQuest = quests.find(q => q.id === clickedParentQuestId);
                const currentQuest = quests.find(q => q.id === currentQuestId);

                if (clickedParentQuest && currentQuest) {
                    // Update statuses as per user's logic
                    currentQuest.questStatus = 'Completed';
                    clickedParentQuest.questStatus = 'Active';

                    // Make parents of the new active quest ("Available")
                    if (clickedParentQuest.parentIds && clickedParentQuest.parentIds.length > 0) {
                        clickedParentQuest.parentIds.forEach(parentId => {
                            const parentOfNewActive = quests.find(q => q.id === parentId);
                            if (parentOfNewActive) {
                                parentOfNewActive.questStatus = 'Available';
                            }
                        });
                    }

                    // Set the new quest as selected and re-render everything
                    selectedFooterQuestId = clickedParentQuest.id;
                    renderActiveQuestsInFooter();
                }
            });
        });
    }

    // Initial call to populate footer
    renderActiveQuestsInFooter();

    function renderAutomationBranches() {
        if (!automationBranchesList) return;
        automationBranchesList.innerHTML = '';

        if (Object.keys(automationBranches).length === 0) {
            const placeholder = document.createElement('li');
            placeholder.textContent = 'No branches saved yet.';
            placeholder.className = 'sidebar-placeholder';
            automationBranchesList.appendChild(placeholder);
            return;
        }

        for (const branchName in automationBranches) {
            const listItem = document.createElement('li');
            listItem.className = 'automation-branch-item';
            listItem.style.display = 'flex';
            listItem.style.justifyContent = 'space-between';
            listItem.style.alignItems = 'center';
            listItem.style.padding = '5px';
            listItem.style.cursor = 'pointer';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = branchName;
            listItem.appendChild(nameSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-automation-branch-btn';
            deleteBtn.title = 'Delete this branch';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the automation branch "${branchName}"?`)) {
                    delete automationBranches[branchName];
                    renderAutomationBranches();
                }
            });

            listItem.appendChild(deleteBtn);

            listItem.addEventListener('click', () => {
                // Add selection logic here
                const currentSelected = automationBranchesList.querySelector('.selected');
                if (currentSelected) currentSelected.classList.remove('selected');
                listItem.classList.add('selected');

                if (confirm(`This will replace the current automation canvas. Are you sure you want to load the "${branchName}" branch?`)) {
                    loadAndRenderAutomationBranch(branchName);
                } else {
                    // Revert selection on cancel
                    listItem.classList.remove('selected');
                }
            });

            automationBranchesList.appendChild(listItem);
        }
    }

function loadAndRenderAutomationBranch(branchName) {
    if (!automationBranches[branchName]) return;
    automationCanvasData = JSON.parse(JSON.stringify(automationBranches[branchName]));
    renderAutomationCanvasFromData();
}

    if (saveAutomationBranchButton) {
        saveAutomationBranchButton.addEventListener('click', () => {
            const branchName = automationBranchNameInput.value.trim();
            if (!branchName) {
                alert('Please enter a name for the automation branch.');
                return;
            }

            const automationCanvas = document.getElementById('automation-canvas');
            if (automationCanvas) {
                 const currentCanvasData = Array.from(automationCanvas.children).map(card => {
                    const label = card.querySelector('.automation-card-label');
                    return {
                        cardClass: card.className,
                        dataset: { ...card.dataset },
                        labelText: label ? label.textContent : ''
                    };
                });
                automationBranches[branchName] = JSON.parse(JSON.stringify(currentCanvasData));
                automationBranchNameInput.value = '';
                renderAutomationBranches();
                alert(`Automation branch "${branchName}" saved.`);
            }
        });
    }

    function sendQuestLogData() {
        if (!playerWindow || playerWindow.closed) return;

        const quest = quests.find(q => q.id === selectedFooterQuestId);
        if (!quest) {
            playerWindow.postMessage({ type: 'toggleQuestOverlay', visible: false }, '*');
            return;
        }

        const getPlayerStepDescription = (step) => {
            if (!step) return '';
            if (typeof step === 'string') return step; // Backward compatibility
            return step.title || step.text || '';
        };

        const completedSteps = quest.storySteps.filter(step => step && step.completed).map(getPlayerStepDescription);
        const nextStepObject = quest.storySteps.find(step => step && !step.completed);
        const nextStep = nextStepObject ? getPlayerStepDescription(nextStepObject) : "All steps completed!";

        playerWindow.postMessage({
            type: 'updateQuestOverlay',
            visible: isQuestLogVisible,
            quest: {
                title: quest.name,
                completedSteps: completedSteps, // This is now an array of strings
                nextStep: nextStep // This is now a string
            }
        }, '*');
    }

    const questLogButton = document.getElementById('quest-log-button');
    if (questLogButton) {
        questLogButton.addEventListener('click', () => {
            isQuestLogVisible = !isQuestLogVisible;
            sendQuestLogData();
        });
    }


    const tokenStatBlockDetailsToggle = document.getElementById('token-stat-block-details-toggle');
    if (tokenStatBlockDetailsToggle) {
        tokenStatBlockDetailsToggle.addEventListener('change', (event) => {
            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character) return;

            if (character.isTokenCopy) {
                character.isDetailsVisible = event.target.checked;
            } else {
                const masterCharacter = charactersData.find(c => c.id === character.id);
                if (masterCharacter) {
                    masterCharacter.isDetailsVisible = event.target.checked;
                    propagateCharacterUpdate(masterCharacter.id);

                    // Sync with character sheet if it's the current one
                    if (selectedCharacterId === masterCharacter.id) {
                        characterSheetIframe.contentWindow.postMessage({
                            type: 'characterDetailsVisibilityChange',
                            isDetailsVisible: event.target.checked
                        }, '*');
                    }
                }
            }
        });
    }

    const tokenStatBlockVisionToggle = document.getElementById('token-stat-block-vision-toggle');
    if (tokenStatBlockVisionToggle) {
        tokenStatBlockVisionToggle.addEventListener('change', (event) => {
            if (!selectedTokenForStatBlock) return;
            const character = activeInitiative.find(c => c.uniqueId === selectedTokenForStatBlock.uniqueId);
            if (!character) return;

            if (character.isTokenCopy) {
                character.vision = event.target.checked;
            } else {
                const masterCharacter = charactersData.find(c => c.id === character.id);
                if (masterCharacter) {
                    masterCharacter.vision = event.target.checked;
                    propagateCharacterUpdate(masterCharacter.id);

                    // Sync with character sheet if it's the current one
                    if (selectedCharacterId === masterCharacter.id) {
                        characterSheetIframe.contentWindow.postMessage({
                            type: 'characterVisionChange_from_dm',
                            vision: event.target.checked
                        }, '*');
                    }
                }
            }
        });
    }

    // --- Automation Footer Sync Observer ---
    let syncTimeout;
    const observer = new MutationObserver((mutations) => {
        // Use a timeout to debounce the sync call, as many mutations can fire at once.
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            const footerAutomationTab = document.getElementById('footer-automation');
            if (footerAutomationTab && footerAutomationTab.classList.contains('active')) {
                syncAutomationControls();
            }
        }, 50); // A small delay is usually enough to batch updates.
    });

    const automationControls = document.getElementById('automation-controls');
    const automationCanvas = document.getElementById('automation-canvas');

    const observerConfig = { attributes: true, childList: true, subtree: true };

    if (automationControls) {
        observer.observe(automationControls, observerConfig);
    }
    if (automationBranchesList) {
        observer.observe(automationBranchesList, observerConfig);
    }
    if (automationCanvas) {
        observer.observe(automationCanvas, observerConfig);
    }

    // Settings Overlay Logic
    const settingsButton = document.getElementById('settings-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsWindow = document.getElementById('settings-window');
    const settingsCategoryButtons = document.querySelectorAll('.settings-category-button');
    const settingsCategoryContents = document.querySelectorAll('.settings-category-content');
    const importExportControls = document.querySelector('.import-export-controls');
    const importExportList = document.querySelector('.import-export-list');
    const importExportPreview = document.querySelector('.import-export-preview textarea');
    let isImportExportInitialized = false;
    let importExportIdMaps = {};
    let jsonEditor = null;



    if (settingsButton && settingsOverlay && settingsWindow) {
        settingsButton.addEventListener('click', () => {
            settingsOverlay.style.display = 'flex';
            if (!isImportExportInitialized) {
                initializeImportExport();
            }
        });

        settingsOverlay.addEventListener('click', (event) => {
            // If the click is on the overlay background, not the window itself
            if (event.target === settingsOverlay) {
                settingsOverlay.style.display = 'none';
            }
        });

        settingsCategoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;

                // Update button active state
                settingsCategoryButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === category);
                });

                // Update content active state
                settingsCategoryContents.forEach(content => {
                    content.classList.toggle('active', content.id === `${category}-content`);
                });
            });
        });

        if (importExportControls) {
            importExportControls.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    // Remove active class from all buttons
                    importExportControls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    e.target.classList.add('active');

                    const type = e.target.dataset.type;
                    handleImportExportSelection(type);
                }
            });
        }
    }

    function handleImportExportSelection(type) {
        importExportList.innerHTML = '';
        if (jsonEditor) {
            jsonEditor.setValue("Select an item from the list to view its JSON data.");
            jsonEditor.setOption("readOnly", true);
        }

        let dataToRender, nameKey, idKey, fullDataObject;

        switch(type) {
            case 'all':
                if (jsonEditor) {
                    const allData = {
                        characters: charactersData,
                        notes: notesData,
                        storyBeats: quests,
                        initiatives: savedInitiatives,
                        automation: automationBranches,
                        assets: assetsByPath,
                        assetFavorites: assetFavorites,
                        settings: {
                            dmRenderQuality: dmRenderQuality,
                            playerRenderQuality: playerRenderQuality,
                            mapIconSize: mapIconSize
                        },
                    };
                    jsonEditor.setValue(JSON.stringify(allData, null, 2));
                    jsonEditor.setOption("readOnly", false);
                }
                importExportList.innerHTML = `
                    <p>Characters: ${charactersData.length}</p>
                    <p>Notes: ${notesData.length}</p>
                    <p>Story Beats: ${quests.length}</p>
                    <p>Initiatives: ${Object.keys(savedInitiatives).length}</p>
                    <p>Automation Branches: ${Object.keys(automationBranches).length}</p>
                `;
                return;
            case 'characters':
                dataToRender = charactersData;
                nameKey = 'name';
                idKey = 'id';
                break;
            case 'notes':
                dataToRender = notesData;
                nameKey = 'title';
                idKey = 'id';
                break;
            case 'story-beats':
                dataToRender = quests;
                nameKey = 'name';
                idKey = 'id';
                break;
            case 'initiatives':
                dataToRender = Object.keys(savedInitiatives).map(name => ({ name: name }));
                nameKey = 'name';
                idKey = 'name';
                fullDataObject = savedInitiatives;
                break;
            case 'automation':
                dataToRender = Object.keys(automationBranches).map(name => ({ name: name }));
                nameKey = 'name';
                idKey = 'name';
                fullDataObject = automationBranches;
                break;
        }

        renderItemBrowser(dataToRender, nameKey, idKey, type, fullDataObject);
    }

    function renderItemBrowser(dataArray, nameKey, idKey, type, fullDataObject) {
        const ul = document.createElement('ul');
        importExportList.innerHTML = ''; // Clear previous content

        if (!dataArray || dataArray.length === 0) {
            importExportList.innerHTML = `<p class="sidebar-placeholder">No items found for this category.</p>`;
            if (jsonEditor) {
                jsonEditor.setValue(`{
    "message": "No items in this category. You can add one from the main interface or paste a valid JSON object here and save it."
}`);
                jsonEditor.setOption("readOnly", false);
            }
            return;
        }

        dataArray.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item[nameKey];
            li.dataset.id = item[idKey];
            li.style.cursor = 'pointer';

            li.addEventListener('click', () => {
                const currentSelected = ul.querySelector('.selected');
                if (currentSelected) {
                    currentSelected.classList.remove('selected');
                }
                li.classList.add('selected');

                let itemData;
                if (type === 'initiatives' || type === 'automation') {
                    itemData = fullDataObject[item.name];
                } else {
                    // For arrays of objects, find by the idKey
                    itemData = dataArray.find(d => String(d[idKey]) === String(li.dataset.id));
                }

                if (jsonEditor) {
                    jsonEditor.setValue(JSON.stringify(itemData, null, 2));
                    jsonEditor.setOption("readOnly", false); // Make editor writable when an item is selected
                    setTimeout(() => jsonEditor.refresh(), 1);
                }
            });
            ul.appendChild(li);
        });

        importExportList.appendChild(ul);

        // Select the first item by default
        if (ul.firstChild) {
            ul.firstChild.click();
        }
    }
    const saveExportButton = document.getElementById('save-export-button');
    const copyExportButton = document.getElementById('copy-export-button');

    if (saveExportButton) {
        saveExportButton.addEventListener('click', handleSaveExport);
    }

    if (copyExportButton) {
        copyExportButton.addEventListener('click', () => {
            if (!jsonEditor) return;
            navigator.clipboard.writeText(jsonEditor.getValue()).then(() => {
                alert('Copied to clipboard!');
            }).catch(err => {
                console.error('Could not copy text: ', err);
                alert('Failed to copy to clipboard.');
            });
        });
    }

    function handleSaveExport() {
        if (!jsonEditor) return;

        try {
            const editedJson = JSON.parse(jsonEditor.getValue());
            const selectedButton = document.querySelector('.import-export-controls button.active');
            const saveType = selectedButton ? selectedButton.dataset.type : null;

            if (!saveType) {
                alert("Could not determine data type. Please select a category.");
                return;
            }

            if (saveType === 'all') {
                if (confirm("This will overwrite all campaign data. Are you sure?")) {
                    charactersData = editedJson.characters || [];
                    notesData = editedJson.notes || [];
                    quests = editedJson.storyBeats || [];
                    savedInitiatives = editedJson.initiatives || {};
                    automationBranches = editedJson.automation || {};
                    // Potentially load settings and other data points here as well
                    alert("All campaign data has been overwritten.");
                }
            } else {
                const selectedListItem = importExportList.querySelector('li.selected');
                if (selectedListItem) {
                    // Updating an existing item
                    const itemId = selectedListItem.dataset.id;
                    let dataArray, idKey;

                    switch (saveType) {
                        case 'characters': dataArray = charactersData; idKey = 'id'; break;
                        case 'notes': dataArray = notesData; idKey = 'id'; break;
                        case 'story-beats': dataArray = quests; idKey = 'id'; break;
                        case 'initiatives':
                            savedInitiatives[itemId] = editedJson;
                            alert(`Initiative "${itemId}" has been updated.`);
                            break;
                        case 'automation':
                            automationBranches[itemId] = editedJson;
                             alert(`Automation Branch "${itemId}" has been updated.`);
                            break;
                    }

                    if (dataArray) {
                        const itemIndex = dataArray.findIndex(d => String(d[idKey]) === String(itemId));
                        if (itemIndex !== -1) {
                            dataArray[itemIndex] = editedJson;
                            alert(`Item "${itemId}" has been updated.`);
                        } else {
                             if (confirm(`Item with ID "${itemId}" not found. Save as a new item?`)) {
                                if (!editedJson.id) editedJson.id = Date.now();
                                dataArray.push(editedJson);
                                alert("New item saved.");
                            }
                        }
                    }
                } else {
                    // Adding a new item
                     if (confirm("No item selected. Save as a new item?")) {
                        let dataArray, idKey;
                         switch (saveType) {
                            case 'characters': dataArray = charactersData; idKey = 'id'; break;
                            case 'notes': dataArray = notesData; idKey = 'id'; break;
                            case 'story-beats': dataArray = quests; idKey = 'id'; break;
                            default:
                                alert(`Cannot add a new item of type "${saveType}" from here.`);
                                return;
                        }
                         if (!editedJson[idKey]) {
                             editedJson[idKey] = Date.now() + Math.random(); // Ensure unique ID
                         }
                        dataArray.push(editedJson);
                        alert("New item saved.");
                    }
                }
            }

            // Refresh UI
            renderAllLists();
            renderSavedInitiativesList();
            renderAutomationBranches();
            initStoryTree(); // Re-initializes the story tree visualization
            handleImportExportSelection(saveType); // Refresh the import/export view

        } catch (e) {
            alert('Invalid JSON format. Please correct it and try again.');
            console.error('Error parsing JSON on save:', e);
        }
    }
});
