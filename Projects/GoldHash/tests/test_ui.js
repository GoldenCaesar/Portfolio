// Basic Test Runner (conceptual)
const tests = [];
let currentSuiteName = "";

function describe(name, fn) {
    currentSuiteName = name;
    console.log(`\n--- Suite: ${name} ---`);
    fn();
    currentSuiteName = "";
}

function test(name, fn) {
    console.log(`  [TEST] ${currentSuiteName} - ${name}`);
    try {
        setupDOM(); // Ensure clean DOM before each test
        fn();
        console.log(`    [PASS] ${name}`);
    } catch (e) {
        console.error(`    [FAIL] ${name}`, e);
    } finally {
        cleanupDOM(); // Clean up DOM after each test
    }
}

// Mock Function Factory
function createMockFunction(name = "mockFunction") {
    const mock = (...args) => {
        mock.called = true;
        mock.callCount++;
        mock.calls.push(args);
        mock.lastArgs = args;
    };
    mock.called = false;
    mock.callCount = 0;
    mock.calls = [];
    mock.lastArgs = undefined;
    mock.description = name; // For better logging if needed
    mock.reset = () => {
        mock.called = false;
        mock.callCount = 0;
        mock.calls = [];
        mock.lastArgs = undefined;
    };
    return mock;
}

// DOM Helpers
function setupDOM() {
    document.body.innerHTML = '';
}

function cleanupDOM() {
    const overlay = document.querySelector('div[style*="position: fixed"]');
    if (overlay) {
        overlay.remove();
    }
    // Remove any event listeners that might have been added to document
    // This is tricky without knowing exact listeners. showCustomAlert cleans up its own.
}

function getAlertElements() {
    const overlay = document.querySelector('div[style*="position: fixed"]');
    if (!overlay) return null;

    const dialog = overlay.querySelector('div[style*="background-color: rgb(45, 55, 72)"]'); // #2d3748
    if (!dialog) return null;

    const titleElement = dialog.querySelector('h3');
    const messageElement = dialog.querySelector('p');
    const inputField = dialog.querySelector('input[type="text"]');
    const buttons = dialog.querySelectorAll('button');
    const confirmButton = Array.from(buttons).find(b => b.textContent === (window.lastAlertSettings && window.lastAlertSettings.confirmText ? window.lastAlertSettings.confirmText : "OK") || b.style.backgroundColor === 'rgb(0, 123, 255)'); // #007bff
    const cancelButton = Array.from(buttons).find(b => b.textContent === (window.lastAlertSettings && window.lastAlertSettings.cancelText ? window.lastAlertSettings.cancelText : "Cancel"));

    return {
        overlay,
        dialog,
        titleElement,
        messageElement,
        inputField,
        buttons,
        confirmButton,
        cancelButton
    };
}

// Event Simulation
function simulateClick(element) {
    if (!element) throw new Error("Cannot simulate click on null element.");
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
}

function simulateKeydown(element, key, isInput = false) {
    if (!element && !isInput) throw new Error("Cannot simulate keydown on null element if not for document/input.");
    const event = new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true });
    (isInput && element ? element : document).dispatchEvent(event);
}


// Assertion Helpers (very basic)
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function assertNotNull(value, message) {
    assert(value !== null && value !== undefined, message || "Expected value to not be null.");
}

function assertNull(value, message) {
    assert(value === null || value === undefined, message || "Expected value to be null.");
}

function assertEqual(actual, expected, message) {
    assert(actual === expected, message || `Expected ${actual} to equal ${expected}`);
}

function assertIncludes(text, substring, message) {
    assert(text && text.includes(substring), message || `Expected "${text}" to include "${substring}"`);
}

function assertCalled(mockFn, message) {
    assert(mockFn.called, message || `Expected function ${mockFn.description} to be called.`);
}

function assertNotCalled(mockFn, message) {
    assert(!mockFn.called, message || `Expected function ${mockFn.description} not to be called.`);
}

function assertCalledWith(mockFn, expectedArgs, message) {
    assertCalled(mockFn, (message || "") + " (was not called at all)");
    // Basic check for array equality (order and value)
    const lastCallArgs = mockFn.lastArgs;
    assert(Array.isArray(lastCallArgs) && Array.isArray(expectedArgs) &&
           lastCallArgs.length === expectedArgs.length &&
           lastCallArgs.every((val, index) => val === expectedArgs[index]),
           message || `Expected function ${mockFn.description} to be called with ${expectedArgs}, but was called with ${lastCallArgs}.`);
}

// Store last settings for button text checks (since showCustomAlert is global)
// This is a bit of a hack for testing button text without modifying showCustomAlert
window.originalShowCustomAlert = window.showCustomAlert;
window.showCustomAlert = (message, type, options) => {
    window.lastAlertSettings = { ...options }; // Store options
    if (options && options.confirmText) window.lastAlertSettings.confirmText = options.confirmText;
    else window.lastAlertSettings.confirmText = "OK"; // Default
    if (options && options.cancelText) window.lastAlertSettings.cancelText = options.cancelText;
    else window.lastAlertSettings.cancelText = "Cancel"; // Default

    return window.originalShowCustomAlert(message, type, options);
};

// --- Test Suites ---

describe('showCustomAlert Functionality', () => {

    test('should display an info alert with correct elements and default OK button', () => {
        const title = 'Info Test Title';
        const message = 'This is an info message.';
        showCustomAlert(message, 'info', { title: title });

        const alertUI = getAlertElements();
        assertNotNull(alertUI, 'Alert overlay should be present.');
        assertNotNull(alertUI.dialog, 'Alert dialog should be present.');
        assertNotNull(alertUI.titleElement, 'Title element should be present.');
        assertEqual(alertUI.titleElement.textContent, title, 'Title content is incorrect.');
        assertNotNull(alertUI.messageElement, 'Message element should be present.');
        assertEqual(alertUI.messageElement.textContent, message, 'Message content is incorrect.');
        assertNotNull(alertUI.confirmButton, 'OK button should be present.');
        assertEqual(alertUI.confirmButton.textContent, 'OK', 'OK button text is incorrect.');
        assertNull(alertUI.cancelButton, 'Cancel button should not be present for info type.');
        assertNull(alertUI.inputField, 'Input field should not be present for info type.');

        simulateClick(alertUI.confirmButton);
        assertNull(getAlertElements(), 'Alert should be removed after OK click.');
    });

    test('confirm alert: OK button calls onConfirm and closes', () => {
        const onConfirmMock = createMockFunction('onConfirm');
        const onCancelMock = createMockFunction('onCancel');
        showCustomAlert('Confirm this action?', 'confirm', { onConfirm: onConfirmMock, onCancel: onCancelMock, confirmText: 'Yes', cancelText: 'No' });

        const alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert did not render for confirm test (OK)");
        assertNotNull(alertUI.confirmButton, 'Confirm button should be present.');
        assertEqual(alertUI.confirmButton.textContent, 'Yes');
        assertNotNull(alertUI.cancelButton, 'Cancel button should be present.');
        assertEqual(alertUI.cancelButton.textContent, 'No');

        simulateClick(alertUI.confirmButton);
        assertCalled(onConfirmMock, 'onConfirm should have been called.');
        assertNotCalled(onCancelMock, 'onCancel should not have been called.');
        assertNull(getAlertElements(), 'Alert should be removed after confirm.');
    });

    test('confirm alert: Cancel button calls onCancel and closes', () => {
        const onConfirmMock = createMockFunction('onConfirm');
        const onCancelMock = createMockFunction('onCancel');
        showCustomAlert('Confirm this action?', 'confirm', { onConfirm: onConfirmMock, onCancel: onCancelMock });

        let alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert did not render for confirm test (Cancel)");
        assertNotNull(alertUI.cancelButton, 'Cancel button should be present.');

        simulateClick(alertUI.cancelButton);
        assertCalled(onCancelMock, 'onCancel should have been called.');
        assertNotCalled(onConfirmMock, 'onConfirm should not have been called.');
        assertNull(getAlertElements(), 'Alert should be removed after cancel.');
    });

    test('prompt alert: displays input, OK calls onConfirm with value, then closes', () => {
        const onConfirmMock = createMockFunction('onConfirmPrompt');
        const onCancelMock = createMockFunction('onCancelPrompt');
        const placeholderText = 'Enter value here';
        const inputValue = 'Test input value';

        showCustomAlert('Enter your name:', 'prompt', {
            onConfirm: onConfirmMock,
            onCancel: onCancelMock,
            placeholder: placeholderText,
            confirmText: "Submit"
        });

        let alertUI = getAlertElements();
        assertNotNull(alertUI, "Prompt alert did not render");
        assertNotNull(alertUI.inputField, 'Input field should be present for prompt.');
        assertEqual(alertUI.inputField.placeholder, placeholderText, 'Placeholder text is incorrect.');
        assertNotNull(alertUI.confirmButton, 'Confirm button should be present for prompt.');
        assertEqual(alertUI.confirmButton.textContent, "Submit");
        assertNotNull(alertUI.cancelButton, 'Cancel button should be present for prompt.');

        alertUI.inputField.value = inputValue; // Simulate typing
        simulateClick(alertUI.confirmButton);

        assertCalled(onConfirmMock, 'onConfirm for prompt should have been called.');
        assertCalledWith(onConfirmMock, [inputValue], `onConfirm for prompt called with wrong value. Expected: "${inputValue}", Got: "${onConfirmMock.lastArgs ? onConfirmMock.lastArgs[0] : 'undefined'}"`);
        assertNotCalled(onCancelMock, 'onCancel for prompt should not have been called.');
        assertNull(getAlertElements(), 'Prompt alert should be removed after confirm.');
    });

    test('prompt alert: Cancel button calls onCancel and closes', () => {
        const onConfirmMock = createMockFunction('onConfirmPromptCancel');
        const onCancelMock = createMockFunction('onCancelPromptCancel');
        showCustomAlert('Enter your name:', 'prompt', { onConfirm: onConfirmMock, onCancel: onCancelMock });

        let alertUI = getAlertElements();
        assertNotNull(alertUI, "Prompt alert did not render for cancel test");
        assertNotNull(alertUI.cancelButton, 'Cancel button should be present for prompt.');

        simulateClick(alertUI.cancelButton);
        assertCalled(onCancelMock, 'onCancel for prompt should have been called.');
        assertNotCalled(onConfirmMock, 'onConfirm for prompt should not have been called.');
        assertNull(getAlertElements(), 'Prompt alert should be removed after cancel.');
    });

    test('keyboard: Escape key triggers onCancel for confirm type', () => {
        const onConfirmMock = createMockFunction('onConfirmEsc');
        const onCancelMock = createMockFunction('onCancelEsc');
        showCustomAlert('Confirm with Escape?', 'confirm', { onConfirm: onConfirmMock, onCancel: onCancelMock });

        assertNotNull(getAlertElements(), "Alert not present before Esc key sim for confirm.");
        simulateKeydown(document, 'Escape');

        assertCalled(onCancelMock, 'onCancel should be called on Escape for confirm type.');
        assertNotCalled(onConfirmMock, 'onConfirm should not be called on Escape for confirm type.');
        assertNull(getAlertElements(), 'Alert should be removed after Escape on confirm type.');
    });

    test('keyboard: Escape key triggers close (like OK) for info type', () => {
        const onConfirmMock = createMockFunction('onConfirmInfoEsc'); // Though it's just closing
        showCustomAlert('Info, press Escape.', 'info', { onConfirm: onConfirmMock }); // onConfirm is optional here

        assertNotNull(getAlertElements(), "Alert not present before Esc key sim for info.");
        simulateKeydown(document, 'Escape');

        if (onConfirmMock) { // if an onConfirm was provided, it should be called
            assertCalled(onConfirmMock, 'onConfirm (for info type) should be called on Escape.');
        }
        assertNull(getAlertElements(), 'Alert should be removed after Escape on info type.');
    });

    test('keyboard: Enter key in prompt input triggers onConfirm with value', () => {
        const onConfirmMock = createMockFunction('onConfirmEnter');
        const onCancelMock = createMockFunction('onCancelEnter');
        const inputValue = 'Entered value';
        showCustomAlert('Prompt, press Enter.', 'prompt', { onConfirm: onConfirmMock, onCancel: onCancelMock });

        let alertUI = getAlertElements();
        assertNotNull(alertUI, "Prompt alert not present before Enter key sim.");
        assertNotNull(alertUI.inputField, "Input field not present in prompt for Enter key test.");

        alertUI.inputField.value = inputValue;
        simulateKeydown(alertUI.inputField, 'Enter', true); // true indicates event on inputField itself

        assertCalled(onConfirmMock, 'onConfirm should be called on Enter in prompt.');
        assertCalledWith(onConfirmMock, [inputValue], `onConfirm for prompt (Enter) called with wrong value. Expected: "${inputValue}", Got: "${onConfirmMock.lastArgs ? onConfirmMock.lastArgs[0] : 'undefined'}"`);
        assertNotCalled(onCancelMock, 'onCancel should not be called on Enter in prompt.');
        assertNull(getAlertElements(), 'Alert should be removed after Enter in prompt.');
    });

    test('styling: error type should have specific border color', () => {
        showCustomAlert('Error message', 'error');
        const alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert not present for error style test.");
        assertNotNull(alertUI.dialog, "Dialog not present for error style test.");
        assertEqual(alertUI.dialog.style.borderLeft, '5px solid rgb(255, 95, 109)', 'Error alert should have reddish border-left. Got: ' + alertUI.dialog.style.borderLeft); // #ff5f6d
        simulateClick(alertUI.confirmButton); // Close it
    });

    test('styling: success type should have specific border color', () => {
        showCustomAlert('Success message', 'success');
        const alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert not present for success style test.");
        assertNotNull(alertUI.dialog, "Dialog not present for success style test.");
        assertEqual(alertUI.dialog.style.borderLeft, '5px solid rgb(150, 201, 61)', 'Success alert should have greenish border-left. Got: ' + alertUI.dialog.style.borderLeft); // #96c93d
        simulateClick(alertUI.confirmButton); // Close it
    });

    test('styling: warning type should have specific border color', () => {
        showCustomAlert('Warning message', 'warning');
        const alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert not present for warning style test.");
        assertNotNull(alertUI.dialog, "Dialog not present for warning style test.");
        assertEqual(alertUI.dialog.style.borderLeft, '5px solid rgb(247, 151, 30)', 'Warning alert should have orangish border-left. Got: ' + alertUI.dialog.style.borderLeft); // #f7971e
        simulateClick(alertUI.confirmButton); // Close it
    });

    test('styling: info type should have specific border color by default', () => {
        showCustomAlert('Info message', 'info');
        const alertUI = getAlertElements();
        assertNotNull(alertUI, "Alert not present for info style test.");
        assertNotNull(alertUI.dialog, "Dialog not present for info style test.");
        assertEqual(alertUI.dialog.style.borderLeft, '5px solid rgb(0, 123, 255)', 'Info alert should have blueish border-left. Got: ' + alertUI.dialog.style.borderLeft); // #007bff
        simulateClick(alertUI.confirmButton); // Close it
    });

});

// To run these tests, you would typically open an HTML file in a browser that includes:
// 1. The ui.js file (so showCustomAlert is defined)
// 2. This test_ui.js file
// Then open the browser's developer console to see the output.
// Example HTML runner:
/*
<!DOCTYPE html>
<html>
<head>
    <title>showCustomAlert Tests</title>
    <meta charset="utf-f8">
    <script src="../ui.js"></script> // Adjust path as needed
</head>
<body>
    <h1>Running showCustomAlert Tests... Check Console.</h1>
    <script src="test_ui.js"></script>
</body>
</html>
*/

console.log("\n--- Test run finished. Check results above. ---");
