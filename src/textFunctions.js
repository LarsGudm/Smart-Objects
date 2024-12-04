// src/textFunctions.js
var TextFunctions = (function() {
    function createSmartText(properties) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.", true);
            return;
        }

        // Merge properties with defaults (if any))
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
        // Apply the preset and move the effect to the top using the utility function
        var smartTextControl = Utilities.applyPresetAndMoveEffectToTop(
            textLayer,
            "Smart Text Control",
            "SmartTextControl.ffx"
        );

        if (!smartTextControl) {
            // Error message is already logged in the utility function
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

        try {
            // Check if the Source Text property already has an expression
            var sourceTextProperty = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
            if (sourceTextProperty.expressionEnabled) {
                // Skip adding the expression and log the layer name
                Logging.logMessage("Expression already exists on Source Text for layer: " + textLayer.name + ", skipping sourceTextExpression", false);
                alert("Expression already exists on Source Text for layer: " + textLayer.name + ", skipping sourceTextExpression");
            } else {
                // Apply the expression to the Source Text property
                sourceTextProperty.expression = sourceTextExprString;
            }

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
