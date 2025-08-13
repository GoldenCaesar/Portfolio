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

    function createSavingThrow(attr) {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="save-${attr}-prof" name="save_${attr}_prof">
            <label for="save-${attr}-prof">${attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
            <input type="text" id="save-${attr}-mod" name="save_${attr}_mod" readonly>
        `;
        savingThrowsContainer.appendChild(div);
        document.getElementById(`save-${attr}-prof`).addEventListener('change', updateSavingThrows);
    }

    function createSkill(skill, attr) {
        const skillId = skill.replace(/\s+/g, '-').toLowerCase();
        const div = document.createElement('div');
        div.classList.add('skill-entry', 'clickable');
        div.innerHTML = `
            <input type="checkbox" id="skill-${skillId}-prof" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_prof">
            <label for="skill-${skillId}-prof">${skill} (${attr.slice(0, 3).toUpperCase()})</label>
            <input type="text" id="skill-${skillId}-mod" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_mod" readonly>
        `;
        skillsContainer.appendChild(div);

        document.getElementById(`skill-${skillId}-prof`).addEventListener('change', updateSkills);

        div.addEventListener('click', (event) => {
            if (event.target.type === 'checkbox') return;
            const modInput = document.getElementById(`skill-${skillId}-mod`);
            const modifier = modInput.value;
            window.parent.postMessage({
                type: 'skillRoll',
                skillName: skill,
                modifier: modifier
            }, '*');
        });
    }

    savingThrowAttrs.forEach(createSavingThrow);
    for (const skill in skills) {
        createSkill(skill, skills[skill]);
    }

    for (const attr in attributes) {
        attributes[attr].addEventListener('input', updateAllModifiers);
    }

    // Add click event listeners for stat rolls
    for (const attr in attributes) {
        const attrBox = attributes[attr].closest('.attr-box');
        if (attrBox) {
            // Capitalize the first letter of the attribute for the roll name
            const statName = attr.charAt(0).toUpperCase() + attr.slice(1);

            attrBox.addEventListener('click', (event) => {
                // Avoid triggering a roll when the user is editing the score
                if (event.target.tagName === 'INPUT') {
                    return;
                }

                const modifier = modifiers[attr].textContent;

                // Post a message to the parent window (dm_view.html) to perform the roll
                window.parent.postMessage({
                    type: 'statRoll',
                    rollName: `${statName} Check`,
                    modifier: modifier
                }, '*');
            });
        }
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
