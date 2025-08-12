document.addEventListener('DOMContentLoaded', function() {
    const attributes = {
        'strength': document.getElementById('strength-score'),
        'dexterity': document.getElementById('dexterity-score'),
        'constitution': document.getElementById('constitution-score'),
        'intelligence': document.getElementById('intelligence-score'),
        'wisdom': document.getElementById('wisdom-score'),
        'charisma': document.getElementById('charisma-score')
    };

    const modifiers = {
        'strength': document.getElementById('strength-modifier'),
        'dexterity': document.getElementById('dexterity-modifier'),
        'constitution': document.getElementById('constitution-modifier'),
        'intelligence': document.getElementById('intelligence-modifier'),
        'wisdom': document.getElementById('wisdom-modifier'),
        'charisma': document.getElementById('charisma-modifier')
    };

    const savingThrowsContainer = document.querySelector('.saving-throws');
    const skillsContainer = document.querySelector('.skills');

    const savingThrowAttrs = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
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

    function updateAllModifiers() {
        for (const attr in attributes) {
            let score = parseInt(attributes[attr].value) || 10;
            modifiers[attr].textContent = calculateModifier(score);
        }
        updateSavingThrows();
        updateSkills();
    }

    function getProficiencyBonus() {
        return parseInt(document.getElementById('proficiency-bonus').value) || 0;
    }

    function updateSavingThrows() {
        const profBonus = getProficiencyBonus();
        savingThrowAttrs.forEach(attr => {
            const checkbox = document.getElementById(`save-${attr}-prof`);
            const modInput = document.getElementById(`save-${attr}-mod`);
            const attrMod = parseInt(modifiers[attr].textContent);
            let totalMod = attrMod;
            if (checkbox.checked) {
                totalMod += profBonus;
            }
            modInput.value = totalMod >= 0 ? '+' + totalMod : totalMod;
        });
    }

    function updateSkills() {
        const profBonus = getProficiencyBonus();
        for (const skill in skills) {
            const attr = skills[skill];
            const checkbox = document.getElementById(`skill-${skill.replace(/\s+/g, '-').toLowerCase()}-prof`);
            const modInput = document.getElementById(`skill-${skill.replace(/\s+/g, '-').toLowerCase()}-mod`);
            const attrMod = parseInt(modifiers[attr].textContent);
            let totalMod = attrMod;
            if (checkbox.checked) {
                totalMod += profBonus;
            }
            modInput.value = totalMod >= 0 ? '+' + totalMod : totalMod;
        }
    }

    function rollSkill(skillName, modifier) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const modifierValue = parseInt(modifier) || 0;
        const total = roll + modifierValue;

        const characterName = document.getElementById('char-name-input').value || 'Unknown Character';
        const playerName = document.getElementById('player-name-input').value || 'Unknown Player';
        const portraitPreview = document.getElementById('portrait-preview');
        const characterPortrait = portraitPreview.style.display !== 'none' ? portraitPreview.src : null;


        const rollData = {
            characterName: characterName,
            playerName: playerName,
            roll: `1d20${modifierValue >= 0 ? '+' : ''}${modifierValue} (${skillName})`,
            sum: total,
            characterPortrait: characterPortrait
        };

        window.parent.postMessage({ type: 'characterSkillRoll', data: rollData }, '*');
    }

    function createSavingThrow(attr) {
        const div = document.createElement('div');
        const skillId = `save-${attr}`;
        const profId = `${skillId}-prof`;
        const modId = `${skillId}-mod`;
        const label = attr.charAt(0).toUpperCase() + attr.slice(1);

        div.innerHTML = `
            <input type="checkbox" id="${profId}" name="save_${attr}_prof">
            <a href="#" id="${skillId}-roll" class="skill-roll-link">${label}</a>
            <input type="text" id="${modId}" name="save_${attr}_mod" readonly>
        `;
        savingThrowsContainer.appendChild(div);
        document.getElementById(profId).addEventListener('change', updateSavingThrows);
        document.getElementById(`${skillId}-roll`).addEventListener('click', (event) => {
            event.preventDefault();
            const modifier = document.getElementById(modId).value;
            rollSkill(label, modifier);
        });
    }

    function createSkill(skill, attr) {
        const div = document.createElement('div');
        const skillId = `skill-${skill.replace(/\s+/g, '-').toLowerCase()}`;
        const profId = `${skillId}-prof`;
        const modId = `${skillId}-mod`;

        div.innerHTML = `
            <input type="checkbox" id="${profId}" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_prof">
            <a href="#" id="${skillId}-roll" class="skill-roll-link">${skill} (${attr.slice(0, 3).toUpperCase()})</a>
            <input type="text" id="${modId}" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_mod" readonly>
        `;
        skillsContainer.appendChild(div);
        document.getElementById(profId).addEventListener('change', updateSkills);
        document.getElementById(`${skillId}-roll`).addEventListener('click', (event) => {
            event.preventDefault();
            const modifier = document.getElementById(modId).value;
            rollSkill(skill, modifier);
        });
    }

    savingThrowAttrs.forEach(createSavingThrow);
    for (const skill in skills) {
        createSkill(skill, skills[skill]);
    }

    for (const attr in attributes) {
        attributes[attr].addEventListener('input', updateAllModifiers);
    }

    document.getElementById('proficiency-bonus').addEventListener('input', () => {
        updateSavingThrows();
        updateSkills();
    });

    updateAllModifiers();

    function clearSheetFields() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type !== 'button' && input.type !== 'submit') { // Avoid clearing button text
                input.value = '';
            }
        });
    }

    const detailsVisibilityToggle = document.getElementById('details-visibility-toggle');

    if (detailsVisibilityToggle) {
        detailsVisibilityToggle.addEventListener('change', function() {
            window.parent.postMessage({
                type: 'characterDetailsVisibilityChange',
                isDetailsVisible: this.checked
            }, '*');
        });
    }

    window.addEventListener('message', function(event) {
        if (event.data.type === 'loadCharacterSheet') {
            clearSheetFields();
            const data = event.data.data;
            for (const key in data) {
                const element = document.getElementsByName(key)[0];
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = data[key];
                    } else {
                        element.value = data[key];
                    }
                }
            }
            updateAllModifiers();

            if (data.character_portrait) {
                portraitPreview.src = data.character_portrait;
                portraitPreview.style.display = 'block';
            } else {
                portraitPreview.src = '#';
                portraitPreview.style.display = 'none';
            }

            if (detailsVisibilityToggle) {
                detailsVisibilityToggle.checked = typeof data.isDetailsVisible === 'boolean' ? data.isDetailsVisible : true;
            }
        } else if (event.data.type === 'requestSheetData') {
            const sheetData = {};
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        sheetData[input.name] = input.checked;
                    } else {
                        sheetData[input.name] = input.value;
                    }
                }
            });
            if (portraitPreview.style.display !== 'none') {
                sheetData['character_portrait'] = portraitPreview.src;
            }
            window.parent.postMessage({ type: 'saveCharacterSheet', data: sheetData }, '*');
        } else if (event.data.type === 'clearCharacterSheet') {
            clearSheetFields();
            portraitPreview.src = '#';
            portraitPreview.style.display = 'none';
            updateAllModifiers();
        } else if (event.data.type === 'requestSheetDataForView') {
            const sheetData = {};
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        sheetData[input.name] = input.checked;
                    } else {
                        sheetData[input.name] = input.value;
                    }
                }
            });

            // Manually add modifiers to the sheetData
            for (const attr in modifiers) {
                sheetData[`${attr}_modifier`] = modifiers[attr].textContent;
            }

            if (portraitPreview.style.display !== 'none') {
                sheetData['character_portrait'] = portraitPreview.src;
            }

            window.parent.postMessage({ type: 'sheetDataForView', data: sheetData }, '*');
        }
    });

    window.parent.postMessage({ type: 'characterSheetReady' }, '*');

    const portraitUpload = document.getElementById('portrait-upload');
    const portraitPreview = document.getElementById('portrait-preview');

    portraitUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                portraitPreview.src = e.target.result;
                portraitPreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
});
