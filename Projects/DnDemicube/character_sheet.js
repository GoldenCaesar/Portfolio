document.addEventListener('DOMContentLoaded', () => {
    const attributes = {
        strength: document.getElementById('strength-score'),
        dexterity: document.getElementById('dexterity-score'),
        constitution: document.getElementById('constitution-score'),
        intelligence: document.getElementById('intelligence-score'),
        wisdom: document.getElementById('wisdom-score'),
        charisma: document.getElementById('charisma-score')
    };

    const modifiers = {
        strength: document.getElementById('strength-modifier'),
        dexterity: document.getElementById('dexterity-modifier'),
        constitution: document.getElementById('constitution-modifier'),
        intelligence: document.getElementById('intelligence-modifier'),
        wisdom: document.getElementById('wisdom-modifier'),
        charisma: document.getElementById('charisma-modifier')
    };

    const savingThrowsContainer = document.querySelector('.saving-throws');
    const skillsContainer = document.querySelector('.skills');

    const savingThrowAttrs = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
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
        const value = parseInt(score.value, 10);
        if (isNaN(value)) {
            return '+0';
        }
        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    function updateAllModifiers() {
        for (const attr in attributes) {
            modifiers[attr].textContent = calculateModifier(attributes[attr]);
        }
        updateSavingThrows();
        updateSkills();
    }

    function createSavingThrows() {
        savingThrowAttrs.forEach(attr => {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" name="saving_throw_${attr.toLowerCase()}_prof">
                <span>${attr}</span>
                <span class="saving-throw-modifier" id="saving-throw-${attr.toLowerCase()}">+0</span>
            `;
            savingThrowsContainer.appendChild(div);
        });
    }

    function updateSavingThrows() {
        savingThrowAttrs.forEach(attr => {
            const modifierSpan = document.getElementById(`saving-throw-${attr.toLowerCase()}`);
            const proficiencyCheckbox = document.querySelector(`input[name="saving_throw_${attr.toLowerCase()}_prof"]`);
            const attrModifier = parseInt(modifiers[attr.toLowerCase()].textContent, 10);
            const proficiencyBonus = parseInt(document.getElementById('proficiency-bonus').value, 10) || 0;
            const total = attrModifier + (proficiencyCheckbox.checked ? proficiencyBonus : 0);
            modifierSpan.textContent = total >= 0 ? `+${total}` : `${total}`;
        });
    }

    function createSkills() {
        for (const skill in skills) {
            const attr = skills[skill];
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" name="skill_${skill.toLowerCase().replace(/ /g, '_')}_prof">
                <span>${skill} (${attr.substring(0, 3).toUpperCase()})</span>
                <span class="skill-modifier" id="skill-${skill.toLowerCase().replace(/ /g, '_')}">+0</span>
            `;
            skillsContainer.appendChild(div);
        }
    }

    function updateSkills() {
        for (const skill in skills) {
            const attr = skills[skill];
            const modifierSpan = document.getElementById(`skill-${skill.toLowerCase().replace(/ /g, '_')}`);
            const proficiencyCheckbox = document.querySelector(`input[name="skill_${skill.toLowerCase().replace(/ /g, '_')}_prof"]`);
            const attrModifier = parseInt(modifiers[attr].textContent, 10);
            const proficiencyBonus = parseInt(document.getElementById('proficiency-bonus').value, 10) || 0;
            const total = attrModifier + (proficiencyCheckbox.checked ? proficiencyBonus : 0);
            modifierSpan.textContent = total >= 0 ? `+${total}` : `${total}`;
        }
    }

    function saveData() {
        const sheetData = {};
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                sheetData[input.name] = input.checked;
            } else {
                sheetData[input.name] = input.value;
            }
        });
        window.parent.postMessage({ type: 'saveCharacterSheet', data: sheetData }, '*');
    }

    function loadData(data) {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (data[input.name] !== undefined) {
                if (input.type === 'checkbox') {
                    input.checked = data[input.name];
                } else {
                    input.value = data[input.name];
                }
            }
        });
        updateAllModifiers();
    }

    for (const attr in attributes) {
        attributes[attr].addEventListener('input', updateAllModifiers);
    }
    document.getElementById('proficiency-bonus').addEventListener('input', () => {
        updateSavingThrows();
        updateSkills();
    });

    savingThrowsContainer.addEventListener('change', updateSavingThrows);
    skillsContainer.addEventListener('change', updateSkills);

    window.addEventListener('message', (event) => {
        if (event.data.type === 'loadCharacterSheet') {
            loadData(event.data.data);
        }
    });

    document.body.addEventListener('input', saveData);

    createSavingThrows();
    createSkills();
    updateAllModifiers();

    // Request data on load
    window.parent.postMessage({ type: 'characterSheetReady' }, '*');
});
