const playerCanvas = document.getElementById('player-canvas');
const playerMapContainer = document.getElementById('player-map-container');
const pCtx = playerCanvas ? playerCanvas.getContext('2d') : null;

// Dice Roller Elements
const diceRollerIcon = document.getElementById('dice-roller-icon');
const diceRollerOverlay = document.getElementById('dice-roller-overlay');
const diceRollerCloseButton = document.getElementById('dice-roller-close-button');

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
let initiativeTokens = [];
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
let activeInitiative = [];
let initiativeTurn = -1;

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
    if (!pCtx || (!overlays || overlays.length === 0) && initiativeTokens.length === 0 || !currentMapDisplayData.img) return;

    if(overlays) {
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

    if (initiativeTokens.length > 0) {
        initiativeTokens.forEach(token => {
            drawToken(pCtx, token);
        });
    }
}

window.addEventListener('message', (event) => {
    // Basic security: check origin if DM view is on a different domain in production.
    // Example: if (event.origin !== "https://your-dm-view-domain.com") return;
    const data = event.data;
    console.log('Player view received message:', data);

    if (data && data.type) {
        switch (data.type) {
            case 'loadMap':
                slideshowActive = false;
                slideshowContainer.style.display = 'none';
                playerMapContainer.style.display = 'flex';

                if (data.mapDataUrl) {
                    // console.log(`Player view received loadMap: ${data.mapDataUrl.substring(0,30)}...`);
                    const img = new Image();
                    img.onload = () => {
                        currentMapImage = img;
                        currentOverlays = data.overlays || [];
                        console.log("Player view: Map image loaded, drawing map and overlays. Overlays received:", currentOverlays.length);
                        drawMapAndOverlays();
                    };
                    img.onerror = () => {
                        console.error(`Error loading image for player view (loadMap).`);
                        drawPlaceholder("Error loading map.");
                        currentMapImage = null;
                        currentOverlays = [];
                    };
                    img.src = data.mapDataUrl; // Expecting base64 Data URL
                } else {
                    console.warn("loadMap message received without mapDataUrl.");
                    drawPlaceholder("Received invalid map data from DM.");
                }
                break;
            // Note: 'polygonVisibilityUpdate' from DM is largely superseded by DM sending
            // the full 'loadMap' with the updated set of visible overlays.
            // Handling it here defensively or if DM's strategy changes.
            case 'polygonVisibilityUpdate':
                 if (currentMapImage && data.mapFileName && currentMapDisplayData.img && data.mapFileName === currentMapDisplayData.img.name) {
                    const polygonIdToUpdate = data.polygonIdentifier;
                    let changed = false;
                    if (data.isVisible) {
                        // This case implies DM would need to send the polygon data for it to be added.
                        // Current DM logic resends the whole map.
                        console.log("Player view: 'polygonVisibilityUpdate' (visible:true) received. Expecting DM to have sent full map state.");
                        // If polygonData was included in message:
                        // if (data.polygonData && !currentOverlays.some(ov => JSON.stringify(ov.polygon) === polygonIdToUpdate)) {
                        //    currentOverlays.push(data.polygonData);
                        //    changed = true;
                        // }
                    } else { // isVisible is false
                        const initialOverlayCount = currentOverlays.length;
                        currentOverlays = currentOverlays.filter(ov => JSON.stringify(ov.polygon) !== polygonIdToUpdate);
                        if (currentOverlays.length < initialOverlayCount) {
                            changed = true;
                        }
                    }
                    if (changed) {
                        console.log("Player view: Overlays updated by polygonVisibilityUpdate, redrawing.");
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
            case 'diceIconMenuState':
                const diceIconMenu = document.getElementById('dice-icon-menu');
                if (diceIconMenu) {
                    diceIconMenu.style.display = data.isOpen ? 'block' : 'none';
                }
                break;
            case 'initiativeTrackerState':
                const initiativeTrackerOverlay = document.getElementById('initiative-tracker-overlay');
                if (initiativeTrackerOverlay) {
                    initiativeTrackerOverlay.style.display = data.isOpen ? 'flex' : 'none';
                }
                break;
            case 'actionLogState':
                const diceDialogueRecord = document.getElementById('dice-dialogue-record');
                if (diceDialogueRecord) {
                    diceDialogueRecord.style.display = data.isOpen ? 'flex' : 'none';
                    if(data.isOpen) {
                        diceDialogueRecord.classList.add('persistent-log');
                        diceDialogueRecord.innerHTML = data.content;
                         if (!document.getElementById('action-log-minimize-button')) {
                            const minimizeButton = document.createElement('button');
                            minimizeButton.id = 'action-log-minimize-button';
                            minimizeButton.textContent = '—';
                            minimizeButton.onclick = () => {
                                diceDialogueRecord.classList.remove('persistent-log');
                                diceDialogueRecord.style.display = 'none';
                                const btn = document.getElementById('action-log-minimize-button');
                                if(btn) btn.remove();
                            };
                            diceDialogueRecord.prepend(minimizeButton);
                        }
                    } else {
                        diceDialogueRecord.classList.remove('persistent-log');
                    }
                }
                break;
            case 'toast':
                displayToast(createDiceRollCard(data.rollData));
                break;
            case 'initiativeDataUpdate':
                activeInitiative = data.activeInitiative || [];
                initiativeTurn = data.initiativeTurn ?? -1;
                initiativeTokens = data.initiativeTokens || [];

                const gameTimeTimer = document.getElementById('game-time-timer');
                if(gameTimeTimer) gameTimeTimer.textContent = `${data.gameTime || 0}s`;

                renderInitiativeList();
                drawMapAndOverlays();
                break;
            case 'tokenStatBlockState':
                if (data.show) {
                    populateAndShowStatBlock_Player(data.character, data.position);
                } else {
                    const tokenStatBlock = document.getElementById('token-stat-block');
                    if (tokenStatBlock) {
                        tokenStatBlock.style.display = 'none';
                    }
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

function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.substring(0, 2);
}

function createDiceRollCard(rollData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('dice-dialogue-message');

    const cardContent = document.createElement('div');
    cardContent.classList.add('dice-roll-card-content');
    messageElement.appendChild(cardContent);

    const profilePic = document.createElement('div');
    profilePic.classList.add('dice-roll-profile-pic');
    if (rollData.characterPortrait) {
        profilePic.style.backgroundImage = `url('${rollData.characterPortrait}')`;
    } else {
        profilePic.textContent = rollData.characterInitials || getInitials(rollData.characterName);
    }
    cardContent.appendChild(profilePic);

    const textContainer = document.createElement('div');
    textContainer.classList.add('dice-roll-text-container');
    cardContent.appendChild(textContainer);

    const namePara = document.createElement('p');
    namePara.classList.add('dice-roll-name');
    namePara.innerHTML = `<strong>${rollData.characterName}</strong> played by <strong>${rollData.playerName}</strong>`;
    textContainer.appendChild(namePara);

    const detailsPara = document.createElement('p');
    detailsPara.classList.add('dice-roll-details');
    detailsPara.innerHTML = `<strong class="dice-roll-sum-text">${rollData.sum}</strong> | ${rollData.roll}`;
    textContainer.appendChild(detailsPara);

    return messageElement;
}

let activeToastTimers = [];
function displayToast(messageElement) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer || document.querySelector('.dice-dialogue.persistent-log')) {
        return;
    }

    const toastNode = messageElement.cloneNode(true);
    toastNode.classList.add('toast-message');
    toastContainer.appendChild(toastNode);

    const timerId = setTimeout(() => {
        toastNode.style.animation = 'toast-fade-out 0.5s ease-out forwards';
        toastNode.addEventListener('animationend', () => {
            toastNode.remove();
            const index = activeToastTimers.indexOf(timerId);
            if (index > -1) {
                activeToastTimers.splice(index, 1);
            }
        });
    }, 4500);

    activeToastTimers.push(timerId);
}

function drawToken(ctx, token) {
    const canvasX = (token.x * currentMapDisplayData.ratio) + currentMapDisplayData.offsetX;
    const canvasY = (token.y * currentMapDisplayData.ratio) + currentMapDisplayData.offsetY;

    const percentage = token.size / 100;
    const baseDimension = currentMapDisplayData.imgWidth;
    const pixelSizeOnImage = percentage * baseDimension;
    const size = pixelSizeOnImage * currentMapDisplayData.ratio;

    if (initiativeTurn !== -1 && activeInitiative[initiativeTurn] && activeInitiative[initiativeTurn].uniqueId === token.uniqueId) {
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, (size / 2) + (5 * currentMapDisplayData.ratio), 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fill();
    }

    const characterInInitiative = activeInitiative.find(c => c.uniqueId === token.uniqueId);
    if (characterInInitiative && characterInInitiative.sheetData) {
        const maxHp = parseInt(characterInInitiative.sheetData.hp_max, 10);
        const currentHp = parseInt(characterInInitiative.sheetData.hp_current, 10);

        if (!isNaN(maxHp) && !isNaN(currentHp) && maxHp > 0) {
            const healthPercentage = Math.max(0, currentHp / maxHp);
            const ringRadius = (size / 2) + (8 * currentMapDisplayData.ratio);
            const ringWidth = 3 * currentMapDisplayData.ratio;

            ctx.beginPath();
            ctx.arc(canvasX, canvasY, ringRadius, 0, Math.PI * 2, false);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = ringWidth;
            ctx.stroke();

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
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#4a5f7a';
    ctx.fill();
    ctx.clip();

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
            img.onload = () => drawMapAndOverlays();
        }
    } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = `${size * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.initials, canvasX, canvasY);
    }

    ctx.restore();
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size / 2, 0, Math.PI * 2, true);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2 * currentMapDisplayData.ratio;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2;
    ctx.font = `bold ${12 * currentMapDisplayData.ratio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(token.name, canvasX, canvasY + size / 2 + (14 * currentMapDisplayData.ratio));
    ctx.font = `${10 * currentMapDisplayData.ratio}px sans-serif`;
    ctx.fillText(`(${token.playerName})`, canvasX, canvasY + size / 2 + (26 * currentMapDisplayData.ratio));
    ctx.shadowBlur = 0;
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
    details.textContent = `${character.sheetData?.class_level || 'N/A'} ${character.sheetData?.race || ''}`;
    info.appendChild(details);

    li.appendChild(info);

    const hp = document.createElement('div');
    hp.className = 'initiative-character-hp';
    hp.innerHTML = `HP: <span>${character.sheetData?.hp_current || ''} / ${character.sheetData?.hp_max || 'N/A'}</span>`;
    li.appendChild(hp);

    const initiativeValue = document.createElement('div');
    initiativeValue.className = 'initiative-value';
    initiativeValue.textContent = character.initiative ?? '-';
    li.appendChild(initiativeValue);

    return li;
}

function renderInitiativeList() {
    const activeInitiativeList = document.getElementById('initiative-active-list');
    if (!activeInitiativeList) return;

    activeInitiativeList.innerHTML = '';
    activeInitiative.forEach((character, index) => {
        const card = createInitiativeCharacterCard(character);
        if (index === initiativeTurn) {
            card.classList.add('active-turn');
        }
        activeInitiativeList.appendChild(card);
    });
}

function populateAndShowStatBlock_Player(character, position) {
    const tokenStatBlock = document.getElementById('token-stat-block');
    if (!tokenStatBlock || !character) {
        if(tokenStatBlock) tokenStatBlock.style.display = 'none';
        return;
    }

    document.getElementById('token-stat-block-char-name').textContent = character.name;
    document.getElementById('token-stat-block-player-name').textContent = `(${character.sheetData.player_name || 'N/A'})`;
    document.getElementById('token-stat-block-hp').textContent = character.sheetData.hp_current || 0;
    document.getElementById('token-stat-block-max-hp').textContent = `/ ${character.sheetData.hp_max || 'N/A'}`;

    tokenStatBlock.style.display = 'block'; // Make it visible to measure it

    const canvasRect = playerCanvas.getBoundingClientRect();
    const statBlockRect = tokenStatBlock.getBoundingClientRect();
    const containerRect = playerMapContainer.getBoundingClientRect();

    // The canvas is also inside the container. We need its position relative to the container.
    const canvasTopInContainer = canvasRect.top - containerRect.top;
    const canvasRightInContainer = (canvasRect.left - containerRect.left) + canvasRect.width;

    // Position at the top right of the canvas, with a 10px margin
    const top = canvasTopInContainer + 10;
    const left = canvasRightInContainer - statBlockRect.width - 10;

    tokenStatBlock.style.left = `${left}px`;
    tokenStatBlock.style.top = `${top}px`;
}


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
