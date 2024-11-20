// src/main.js
(function main(thisObj) {
    // Initialize the panel
    function smartShapesPanel(thisObj) {
        var myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Smart Shapes v1.1.2", undefined);

        // Use UI module functions
        UI.createShapeButtonGroup(myPanel);
        UI.createTextButtonGroup(myPanel);
        UI.createBackgroundButtonGroup(myPanel);
        UI.createColorPicker(myPanel);
        UI.createSeparateDimsCheckbox(myPanel);
        UI.createShowLogButton(myPanel);

        // Clear the log when the UI is initialized
        Logging.clearLog();

        // Load settings
        UI.loadSettings();
        
        if (myPanel instanceof Window) {
            myPanel.center();
            myPanel.show();
        } else {
            myPanel.layout.layout(true);
        }
    }

    // Start the panel
    smartShapesPanel(thisObj);
})(this);
