const playerCanvas = document.getElementById('player-canvas');
const playerMapContainer = document.getElementById('player-map-container');
const pCtx = playerCanvas ? playerCanvas.getContext('2d') : null;

// Dice Roller Elements will be initialized in DOMContentLoaded

// Slideshow elements
const slideshowContainer = document.getElementById('slideshow-container');
const contentContainer = document.getElementById('content-container');
const portraitImg = document.getElementById('portrait-img');
const quoteText = document.getElementById('quote-text');
const authorText = document.getElementById('author-text');

let slideshowActive = false;
let currentSlideIndex = 0;
let shuffledCharacters = [];
let quoteMap = null;

fetch('quote_map.json')
    .then(response => response.json())
    .then(data => {
        quoteMap = data;
    });

function getRandomStat(character) {
    if (!quoteMap) return null;

    const characterStats = Object.keys(character.sheetData);
    const availableQuoteStats = [
        ...Object.keys(quoteMap.ability_scores),
        ...Object.keys(quoteMap.character_details),
        ...Object.keys(quoteMap.combat_stats),
        ...Object.keys(quoteMap.roleplaying_details)
    ];

    const validStats = characterStats.filter(stat => availableQuoteStats.includes(stat) && character.sheetData[stat]);

    if (validStats.length === 0) {
        return null;
    }

    const randomStatName = validStats[Math.floor(Math.random() * validStats.length)];

    return {
        statName: randomStatName,
        statValue: character.sheetData[randomStatName]
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


function updateSlide() {
    if (shuffledCharacters.length === 0) {
        return;
    }
    const character = shuffledCharacters[currentSlideIndex];
    const randomStat = getRandomStat(character);

    if (character.isDetailsVisible) {
        portraitImg.src = character.sheetData.character_portrait || 'https://images.unsplash.com/photo-1549417235-a6e5b5655b3d?w=800';
        authorText.textContent = `${character.name} (${character.sheetData.player_name || 'N/A'})`;
    } else {
        portraitImg.src = 'https://images.unsplash.com/photo-1549417235-a6e5b5655b3d?w=800';
        authorText.textContent = '???';
    }

    if (randomStat) {
        quoteText.textContent = `"${getQuote(randomStat, character)}"`;
    } else {
        quoteText.textContent = '"..."';
    }
}

function animateSlideshow() {
    if (!slideshowActive) return;

    contentContainer.classList.remove("animate-out");
    contentContainer.classList.add("animate-in");

    updateSlide();

    setTimeout(() => {
        if (!slideshowActive) return;
        contentContainer.classList.remove("animate-in");
        contentContainer.classList.add("animate-out");

        setTimeout(() => {
            if (!slideshowActive) return;
            currentSlideIndex = (currentSlideIndex + 1) % shuffledCharacters.length;
            animateSlideshow();
        }, 1000);
    }, 6000);
}


let currentMapImage = null;
let currentOverlays = [];
let currentMapDisplayData = {
    img: null,
    ratio: 1,
    offsetX: 0,
    offsetY: 0,
    imgWidth: 0,
    imgHeight: 0,
    scaledWidth: 0,
    scaledHeight: 0
};

function drawMapAndOverlays() {
    if (!playerCanvas || !pCtx) {
        console.error("Player canvas or context not initialized.");
        return;
    }
    if (!currentMapImage || !currentMapImage.complete) {
        drawPlaceholder("Map image not loaded or incomplete.");
        // console.log("drawMapAndOverlays: currentMapImage not ready or null.");
        return;
    }
    if (!playerMapContainer) {
        console.error("Player map container not found for drawing.");
        return;
    }

    const containerWidth = playerMapContainer.clientWidth;
    const containerHeight = playerMapContainer.clientHeight;

    // Calculate the aspect ratio of the image
    const imgAspectRatio = currentMapImage.width / currentMapImage.height;

    // Calculate the dimensions of the canvas to fit the image within the container
    let canvasWidth = containerWidth;
    let canvasHeight = canvasWidth / imgAspectRatio;

    if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * imgAspectRatio;
    }

    playerCanvas.width = Math.floor(canvasWidth);
    playerCanvas.height = Math.floor(canvasHeight);

    pCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);

    // Recalculate ratio and offsets for drawing the image centered on the (potentially resized) canvas
    const hRatioCanvas = playerCanvas.width / currentMapImage.width;
    const vRatioCanvas = playerCanvas.height / currentMapImage.height;
    const ratioCanvas = Math.min(hRatioCanvas, vRatioCanvas);

    const finalImgScaledWidth = currentMapImage.width * ratioCanvas;
    const finalImgScaledHeight = currentMapImage.height * ratioCanvas;

    const finalCenterShift_x = (playerCanvas.width - finalImgScaledWidth) / 2;
    const finalCenterShift_y = (playerCanvas.height - finalImgScaledHeight) / 2;

    pCtx.drawImage(currentMapImage, 0, 0, currentMapImage.width, currentMapImage.height,
                  finalCenterShift_x, finalCenterShift_y, finalImgScaledWidth, finalImgScaledHeight);

    currentMapDisplayData = {
        img: currentMapImage,
        ratio: ratioCanvas,
        offsetX: finalCenterShift_x,
        offsetY: finalCenterShift_y,
        imgWidth: currentMapImage.width,
        imgHeight: currentMapImage.height,
        scaledWidth: finalImgScaledWidth,
        scaledHeight: finalImgScaledHeight
    };

    drawOverlays_PlayerView(currentOverlays);
}

function drawOverlays_PlayerView(overlays) {
    if (!pCtx || !overlays || overlays.length === 0 || !currentMapDisplayData.img) return;

    overlays.forEach(overlay => {
        if (overlay.type === 'childMapLink' && overlay.polygon) {
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(100, 100, 255, 0.4)';
            pCtx.lineWidth = 2;
            overlay.polygon.forEach((point, index) => {
                const canvasX = (point.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const canvasY = (point.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                if (index === 0) {
                    pCtx.moveTo(canvasX, canvasY);
                } else {
                    pCtx.lineTo(canvasX, canvasY);
                }
            });
            if (overlay.polygon.length > 2) {
                const firstPoint = overlay.polygon[0];
                const firstPointCanvasX = (firstPoint.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
                const firstPointCanvasY = (firstPoint.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
                pCtx.lineTo(firstPointCanvasX, firstPointCanvasY);
            }
            pCtx.stroke();
        } else if (overlay.type === 'noteLink' && overlay.position) {
            const iconSize = 20;
            const canvasX = (overlay.position.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
            const canvasY = (overlay.position.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;
            pCtx.fillStyle = 'rgba(102, 255, 102, 0.9)';
            pCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.strokeStyle = 'black';
            pCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.fillStyle = 'black';
            pCtx.font = `${iconSize * 0.8}px sans-serif`;
            pCtx.textAlign = 'center';
            pCtx.textBaseline = 'middle';
            pCtx.fillText('📝', canvasX, canvasY);
        } else if (overlay.type === 'characterLink' && overlay.position) {
            const iconSize = 20; // The size of the icon on the canvas
            const canvasX = (overlay.position.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
            const canvasY = (overlay.position.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;

            let fillStyle = 'rgba(102, 255, 102, 0.9)'; // Greenish if visible to player

            pCtx.fillStyle = fillStyle;
            pCtx.fillRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);
            pCtx.strokeStyle = 'black';
            pCtx.strokeRect(canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

            pCtx.fillStyle = 'black';
            pCtx.font = `${iconSize * 0.8}px sans-serif`;
            pCtx.textAlign = 'center';
            pCtx.textBaseline = 'middle';
            pCtx.fillText('👤', canvasX, canvasY);

            if (overlay.character_portrait) {
                const img = new Image();
                img.onload = function() {
                    pCtx.save();
                    pCtx.beginPath();
                    pCtx.arc(canvasX, canvasY, iconSize / 2, 0, Math.PI * 2, true);
                    pCtx.closePath();
                    pCtx.clip();

                    pCtx.drawImage(img, canvasX - iconSize / 2, canvasY - iconSize / 2, iconSize, iconSize);

                    pCtx.restore();
                };
                img.src = overlay.character_portrait;
            }
        }
    });
}

// Initial DOMContentLoaded setup
document.addEventListener('DOMContentLoaded', () => {
    // Re-check elements as they should be available now.
    const localPlayerCanvas = document.getElementById('player-canvas');
    const localPlayerMapContainer = document.getElementById('player-map-container');
    const localPCtx = localPlayerCanvas ? localPlayerCanvas.getContext('2d') : null;
    const diceRollerOverlay = document.getElementById('dice-roller-overlay');

    window.addEventListener('message', (event) => {
        const data = event.data;
        console.log('Player view received message:', data);

        if (data && data.type) {
            switch (data.type) {
                case 'loadMap':
                    slideshowActive = false;
                    slideshowContainer.style.display = 'none';
                    playerMapContainer.style.display = 'flex';

                    if (data.mapDataUrl) {
                        const img = new Image();
                        img.onload = () => {
                            currentMapImage = img;
                            currentOverlays = data.overlays || [];
                            drawMapAndOverlays();
                        };
                        img.onerror = () => {
                            console.error(`Error loading image for player view (loadMap).`);
                            drawPlaceholder("Error loading map.");
                            currentMapImage = null;
                            currentOverlays = [];
                        };
                        img.src = data.mapDataUrl;
                    } else {
                        console.warn("loadMap message received without mapDataUrl.");
                        drawPlaceholder("Received invalid map data from DM.");
                    }
                    break;
                case 'polygonVisibilityUpdate':
                     if (currentMapImage && data.mapFileName && currentMapDisplayData.img && data.mapFileName === currentMapDisplayData.img.name) {
                        const polygonIdToUpdate = data.polygonIdentifier;
                        let changed = false;
                        if (data.isVisible) {
                            console.log("Player view: 'polygonVisibilityUpdate' (visible:true) received. Expecting DM to have sent full map state.");
                        } else {
                            const initialOverlayCount = currentOverlays.length;
                            currentOverlays = currentOverlays.filter(ov => JSON.stringify(ov.polygon) !== polygonIdToUpdate);
                            if (currentOverlays.length < initialOverlayCount) {
                                changed = true;
                            }
                        }
                        if (changed) {
                            drawMapAndOverlays();
                        }
                    } else {
                         console.warn("Player view: Received polygonVisibilityUpdate for a non-matching/non-loaded map.");
                    }
                    break;
                case 'clearMap':
                    console.log("Player view received clearMap message.");
                    currentMapImage = null;
                    currentOverlays = [];

                    shuffledCharacters = data.characters.sort(() => 0.5 - Math.random());
                    currentSlideIndex = 0;

                    playerMapContainer.style.display = 'none';
                    slideshowContainer.style.display = 'flex';
                    slideshowActive = true;
                    animateSlideshow();
                    break;
                case 'showNotePreview':
                    const notePreviewOverlay = document.getElementById('note-preview-overlay');
                    const notePreviewBody = document.getElementById('note-preview-body');
                    if (notePreviewOverlay && notePreviewBody && data.content) {
                        notePreviewBody.innerHTML = data.content;
                        notePreviewOverlay.style.display = 'flex';
                    }
                    break;
                case 'hideNotePreview':
                    const notePreviewOverlayToHide = document.getElementById('note-preview-overlay');
                    if (notePreviewOverlayToHide) {
                        notePreviewOverlayToHide.style.display = 'none';
                    }
                    break;
                case 'showCharacterPreview':
                    const characterPreviewOverlay = document.getElementById('character-preview-overlay');
                    const characterPreviewBody = document.getElementById('character-preview-body');
                    if (characterPreviewOverlay && characterPreviewBody && data.content) {
                        characterPreviewBody.innerHTML = data.content;
                        characterPreviewOverlay.style.display = 'flex';
                    }
                    break;
                case 'hideCharacterPreview':
                    const characterPreviewOverlayToHide = document.getElementById('character-preview-overlay');
                    if (characterPreviewOverlayToHide) {
                        characterPreviewOverlayToHide.style.display = 'none';
                    }
                    break;
                case 'diceMenuState':
                    if (diceRollerOverlay) {
                        diceRollerOverlay.style.display = data.isOpen ? 'flex' : 'none';
                    }
                    break;
                case 'diceRoll':
                    const diceResultSum = document.getElementById('dice-result-sum');
                    const diceResultDetails = document.getElementById('dice-result-details');
                    if (diceResultSum && diceResultDetails) {
                        diceResultSum.textContent = data.sum;
                        diceResultDetails.textContent = `Rolls: [${data.results.join(', ')}]`;
                    }
                    break;
                default:
                    console.log("Player view received unhandled message type:", data.type);
                    break;
            }
        } else {
            console.log("Player view received non-standard message:", data);
        }
    });

function resizeAndRedraw() {
    if (currentMapImage && currentMapImage.complete) {
        // console.log("Player view: Resizing and redrawing map.");
        drawMapAndOverlays();
    } else {
        // console.log("Player view: Resizing and redrawing placeholder.");
        drawPlaceholder("Waiting for DM to share map...");
    }
}

window.addEventListener('resize', () => {
    // Debounce resize event
    setTimeout(resizeAndRedraw, 50);
});

function drawPlaceholder(message = "Waiting for DM to share map...") {
    if (!playerCanvas || !pCtx || !playerMapContainer) {
        // console.error("drawPlaceholder: Canvas, context, or container not available.");
        return;
    }

    playerCanvas.width = playerMapContainer.clientWidth;
    playerCanvas.height = playerMapContainer.clientHeight;

    pCtx.fillStyle = '#2a3138';
    pCtx.fillRect(0, 0, playerCanvas.width, playerCanvas.height);
    pCtx.fillStyle = '#777';
    pCtx.font = '20px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText(message, playerCanvas.width / 2, playerCanvas.height / 2);
    // console.log("Player view: Placeholder drawn with message - " + message);
}

// Initial DOMContentLoaded setup
document.addEventListener('DOMContentLoaded', () => {
    // Re-check elements as they should be available now.
    const localPlayerCanvas = document.getElementById('player-canvas');
    const localPlayerMapContainer = document.getElementById('player-map-container');
    const localPCtx = localPlayerCanvas ? localPlayerCanvas.getContext('2d') : null;

    if (localPlayerCanvas && localPlayerMapContainer && localPCtx) {
        // console.log("Player view: DOMContentLoaded - Canvas and container found. Drawing initial placeholder.");
        // It's important that global pCtx is also updated if it wasn't available at script parse time.
        // However, playerCanvas, pCtx, playerMapContainer are already assigned globally.
        // This check is more for ensuring they are indeed found before first draw.
        drawPlaceholder();
    } else {
        console.error("Player view: DOMContentLoaded - Critical elements (canvas, container, or context) not found.");
    }

    if (window.opener && !window.opener.closed) {
        setTimeout(() => {
            window.opener.postMessage({ type: 'playerViewReady' }, '*');
            // console.log("Player view sent playerViewReady message to opener.");
        }, 100);
    }

    const characterPreviewClose = document.getElementById('character-preview-close');
    if (characterPreviewClose) {
        characterPreviewClose.addEventListener('click', () => {
            const characterPreviewOverlay = document.getElementById('character-preview-overlay');
            if (characterPreviewOverlay) {
                characterPreviewOverlay.style.display = 'none';
            }
        });
    }

    // Dice Roller Overlay Logic is now controlled by the DM
});

// Fallback if script runs before DOM is fully ready and elements aren't found.
if (!playerCanvas || !playerMapContainer || !pCtx) {
    console.warn("Player view: Script parsed, but canvas/container/context not immediately available. Waiting for DOMContentLoaded.");
}
