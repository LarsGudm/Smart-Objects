// src/logging.js
var Logging = (function() {
    // Private variables
    var logWindow;
    var logField;

    // Create Log Window for Messages
    function createLogWindow() {
        if (!logWindow || !(logWindow instanceof Window)) {
            logWindow = new Window("palette", "Smart Shapes Log", undefined);
            logWindow.orientation = "column";

            logField = logWindow.add("edittext", undefined, "", {multiline: true, scrolling: true});
            logField.preferredSize = [400, 200];
        }
    }

    // Show Log Window
    function showLogWindow() {
        if (!logWindow || !(logWindow instanceof Window)) {
            createLogWindow();
        }
        logWindow.show();
    }

    // Log Messages to the Log Window
    function logMessage(message, isError) {
        if (!logWindow || !(logWindow instanceof Window)) {
            createLogWindow();
        }
        if (logField) {
            logField.text += message + "\n";
            if (isError && !logWindow.visible) {
                logWindow.show();
            }
        } else {
            alert(message);
        }
    }

    // Clear the Log Window
    function clearLog() {
        // Ensure logWindow and logField are initialized
        if (!logWindow || !(logWindow instanceof Window)) {
            createLogWindow();
        }
        if (logField) {
            logField.text = "";
        }
    }

    // Return the public API
    return {
        createLogWindow: createLogWindow,
        showLogWindow: showLogWindow,
        logMessage: logMessage,
        clearLog: clearLog
    };
})();
