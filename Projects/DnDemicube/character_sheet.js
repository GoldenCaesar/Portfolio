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
    }

    function createSavingThrow(attr) {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="save-${attr}-prof" name="save_${attr}_prof">
            <label for="save-${attr}-prof">${attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
            <input type="text" id="save-${attr}-mod" name="save_${attr}_mod" readonly>
        `;
        savingThrowsContainer.appendChild(div);
    }

    function createSkill(skill, attr) {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="skill-${skill.replace(/\s+/g, '-').toLowerCase()}-prof" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_prof">
            <label for="skill-${skill.replace(/\s+/g, '-').toLowerCase()}-prof">${skill} (${attr.slice(0, 3).toUpperCase()})</label>
            <input type="text" id="skill-${skill.replace(/\s+/g, '-').toLowerCase()}-mod" name="skill_${skill.replace(/\s+/g, '_').toLowerCase()}_mod" readonly>
        `;
        skillsContainer.appendChild(div);
    }

    savingThrowAttrs.forEach(createSavingThrow);
    for (const skill in skills) {
        createSkill(skill, skills[skill]);
    }

    for (const attr in attributes) {
        attributes[attr].addEventListener('input', updateAllModifiers);
    }

    updateAllModifiers();
});
