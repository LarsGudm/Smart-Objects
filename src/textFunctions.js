// src/textFunctions.js
var TextFunctions = (function() {
    function createSmartText(properties) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.", true);
            return;
        }

        // Merge properties with defaults (if any)
        var config = properties || {};

        // Create a new text layer with default settings
        var textLayer = comp.layers.addText("Smart Text");

        // Apply the Smart Text preset
        addSmartProperties(textLayer);

        // Additional setup or property adjustments can be added here

        Logging.logMessage("Smart Text layer created and preset applied.", false);

        return textLayer;
    }

    function convertToSmartText() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.", true);
            return;
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            Logging.logMessage("Please select at least one text layer.", true);
            return;
        }

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            if (!(layer instanceof TextLayer)) {
                Logging.logMessage("Skipping non-text layer: " + layer.name, false);
                continue;
            }

            Logging.logMessage("Processing layer: " + layer.name, false);

            // Apply the Smart Text preset
            addSmartProperties(layer);
        }
    }

    function addSmartProperties(textLayer) {
        // Path to the FFX file
        var scriptFolder = new File($.fileName).parent;
        var ffxFile = new File(scriptFolder.fsName + "/FFX/SmartTextControl.ffx");

        if (ffxFile.exists) {
            Logging.logMessage("Applying preset: " + ffxFile.fsName, false);
            textLayer.applyPreset(ffxFile);
            Logging.logMessage("Preset applied successfully to " + textLayer.name, false);
        } else {
            Logging.logMessage("Preset file not found: " + ffxFile.fsName, true);
            return null;
        }

        // Extract the Expressions
        try {
            var sourceTextExprString = Utilities.extractExpression(TextExpressions.sourceTextExpression);
            var anchorPointExprString = Utilities.extractExpression(TextExpressions.anchorPointExpression);
            var boundBoxSizeExprString = Utilities.extractExpression(TextExpressions.boundBoxSizeExpression);
            var leftTopValuesExprString = Utilities.extractExpression(TextExpressions.leftTopValuesExpression);
        } catch (e) {
            Logging.logMessage("Error extracting expressions: " + e.toString(),true);
            return null;
        }
        var smartTextControl = textLayer.effect('Smart Text Control');
        // Apply Expressions to properties
        try {
            // Apply Expressions to expression controls
            textLayer.property("ADBE Text Properties").property("ADBE Text Document").expression = sourceTextExprString;
            textLayer.property("Transform").property("Anchor Point").expression = anchorPointExprString;
            smartTextControl.property("Bounding Box Size").expression = boundBoxSizeExprString;
            smartTextControl.property("Left & Top Values").expression = leftTopValuesExprString;
    
        } catch (e) {
            Logging.logMessage("Failed to set smart properties on the text layer: " + e.toString(),true);
            return null;
        }
    }
    // Return the public API
    return {
        createSmartText: createSmartText,
        convertToSmartText: convertToSmartText
    };
})();
