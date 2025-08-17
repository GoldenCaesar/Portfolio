## Structured Code Narrative Formula 📖

This formula provides a set of rules for making code as easy to read as a story. You can use these rules as a checklist when writing code or when you encounter a new project.

-----

### Rule 1: The Table of Contents (TOC)

Every project begins with a **Table of Contents**. This acts as a map, showing you where everything is located.

  * **How it works**: Each major code section (like an entire HTML document or a group of related functions) gets a number. Any major element within that section receives a sub-number, creating a parent-child path.
  * **Example**: `1.2.1.2` means you're looking at Document 1, the second major section, the first subsection inside that, and the second element within that subsection.

-----

### Rule 2: The Single-Line Header Comment

Above every major section or element in your code, you must add a single-line comment that tells you everything you need to know.

  * **Format**: The header comment has three parts, always in this order: `// [TOC ID] [Link(s)] Description`
  * **TOC ID**: This is the location number from your Table of Contents (e.g., `[1.2.1.2]`). It tells you exactly where this element lives in the project.
  * **Link(s)**: This part shows if the code is connected to another document. Use the format `[{number} {file_name:TOC_ID}]`.
  * **Description**: This is a simple, clear sentence that describes what the code does.

-----

### Rule 3: The Glossary

The **Glossary** is a separate document or a dedicated section at the bottom of your code files. It holds all the detailed explanations.

  * **When to use it**: If your **Description** (from Rule 2) is too long or requires more detail than a single line can hold, you create a Glossary entry for it.
  * **How to link**: In your code's header comment, you simply add a Glossary ID alongside the TOC ID. The format is `[TOC ID] [Glossary ID]`. This tells the reader there is a corresponding entry in the Glossary with that same ID.

-----

### Rule 4: Contextual Naming

This is the most important rule\! Your variable and function names should be so clear that they almost tell a story on their own.

  * **Variables**: Use descriptive, plain-language names. Avoid abbreviations like `btn`, `div`, or `val`. Instead, use `main_action_button` or `page_background_color`. The name should clearly describe what the variable holds. Use **snake\_case** (all lowercase with underscores) for readability.
  * **Functions**: Always start a function name with a verb that describes its action. This immediately tells a reader what the function does. For example: `handle_button_click` or `update_settings`. Like variables, use **snake\_case** for function names.

-----

### Rule 5: Code Legibility

Code must be written to be understood first and to function second. Ensure your code is formatted cleanly and uses simple, logical steps whenever possible.

  * **Readability**: Use consistent indentation and line breaks to visually separate different parts of the code. Avoid writing overly complex lines of code that perform many actions at once.
  * **Clarity**: Write code in a way that minimizes confusion. If a section of code is particularly tricky, break it down into smaller, simpler steps.

-----

### Putting It Into Practice

Let's use an example: a button that opens a complex settings overlay with many options.

#### **Step 1: Table of Contents**

The Table of Contents and glossary for the entire directory will live in their own text document. Each file in the directory is given a number starting with 1. While this file will be the master directory, each file will also have a header and footer comment containing the relevant table of contents and glossary items for that file.

```html
```

#### **Step 2: HTML**

```html
<button id="main-settings-button">
    Settings
</button>

<div id="settings-overlay">
    </div>
```

#### **Step 3: JavaScript**

```javascript
/*
Table of Contents:
2. users/personal/script.js
	1. Log In Splash
	2. Server Establishment
	3. Main Page
		1. Settings
			3.1.3 Event Listener
			3.1.4 Functionality
*/
// [3.1.3 Listener] Event Listener [1 {index.html:1.2.2}]
main_settings_button.addEventListener('click', show_settings_overlay);

// [3.1.4 visibility-overlay] Functionality [2 {index.html:1.2.3}{style.css:7}]
const show_settings_overlay = () => {
    const settings_overlay = document.getElementById('settings-overlay');
    settings_overlay.style.display = 'block';
};
```

#### **Step 4: Glossary**

```text
// [1.2.3 settings-overlay]
// [2 {script.js:3.1.4}{style.css:7}] This is a special `div` element that is hidden by default. It contains a collection of complex form elements, input fields, and other interactive components for the user to change their settings. The unique ID allows our JavaScript code to find it and make it visible when the "Settings" button is clicked. Because it has many nested elements, the details of its functionality are explained here rather than in the code itself.

// [3.1.3 Listener]
// [2 {3.1.4}{index.html:1.2.2}] This line of code is an "event listener." It is constantly watching the `main_settings_button` to see if a specific event, in this case, a 'click', happens. When it does, it immediately calls the `show_settings_overlay` function, triggering its actions.

// [3.1.4 visibility-overlay]
// [3 {3.1.3}{index.html:1.2.3}{style.css:7}] This section demonstrates how we change an element's appearance using JavaScript. It finds the `settings_overlay` element in the HTML and directly changes its `display` style property from its default hidden state to 'block', making it visible on the page.
```