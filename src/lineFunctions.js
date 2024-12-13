// src/lineFunctions.js

var LineFunctions = (function() {
        // Default Shape Configuration
        var defaultShapeConfig = {
            length: 400,
            strokeColor: [1, 1, 1],
            strokeWidth: 4,
            name: "Smart Line",
            label: 8, // Blue label color
            targetLayer: null,
            separateDimensions: false, // Add default for separate dimensions
        };
    
    function createSmartLine(properties) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.", true);
            return;
        }

        // Merge properties with defaults
        var config = Utilities.mergeProperties(defaultShapeConfig, properties);

        // Create a new text layer with default settings
        var shapeLayer;

        if (config.targetLayer && !config.createMatte) {
            // If converting an existing layer
            shapeLayer = config.targetLayer.duplicate();
            shapeLayer.moveBefore(config.targetLayer);
        } else {
            // Create a new shape layer
            shapeLayer = comp.layers.addShape();
        }

        // Remove existing contents
        var contents = shapeLayer.property("Contents");
        for (var j = contents.numProperties; j >= 1; j--) {
            contents.property(j).remove();
        }

        shapeLayer.property("Transform").property("Anchor Point").setValue([0, 0]);

        shapeLayer.name = config.name;
        shapeLayer.label = config.label;
    
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Group 1";
    
        addShapePaths(group);

        // Add smart properties
        addSmartProperties(shapeLayer, config);

        // Additional setup or property adjustments can be added here

        Logging.logMessage("Smart Text layer created and preset applied.", false);

        return textLayer;
    }

    // Add Paths to the Shape Layer
    function addShapePaths(group) {
        var content = group.property("Contents");
    
        var lineShapePath = content.addProperty("ADBE Vector Shape - Group");
        lineShapePath.name = "Line Shape Path";
    }

    // **Create Smart Line Function**
    function addSmartProperties() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.");
            return;
        }
        // Apply the preset and move the effect to the top using the utility function
        var smartLineControl = Utilities.applyPresetAndMoveEffectToTop(
            shapeLayer,
            "Smart Line Control",
            "SmartLineControl.ffx"
        );

        if (!smartLineControl) {
            // Error message is already logged in the utility function
            return null;
        }

        // Extract the Expressions
        try {
            var positionExprString = Utilities.extractExpression(LineExpressions.positionExpression);
            var lineExprString = Utilities.extractExpression(LineExpressions.lineExpression);
    
        } catch (e) {
            Logging.logMessage("Error extracting expressions: " + e.toString(),true);
            return null;
        }

        var selectedLayers = comp.selectedLayers;

        if (selectedLayers.length == 2) {
            try {

            if (selectedLayers.length !== 2) {
                Logging.logMessage("Please select exactly two layers.");
                return;
            }

            // Store references to selected layers
            var startLayer = selectedLayers[0];
            var endLayer = selectedLayers[1];

            // Get or create the start null
            var startNull = getOrCreateNullForLayer(comp, startLayer);

            // Get or create the end null
            var endNull = getOrCreateNullForLayer(comp, endLayer);

            var lineName = Utilities.createIncrementedName(comp, "Smart Line");

            var shapeLayer = ShapeFactory.createLine(comp, {
                name: lineName,
                strokeColor: [1, 1, 1], // White color
                strokeWidth: 4
            });

            // Determine the index to move the shape layer to
            var layerIndices = selectedLayers.map(function(layer) { return layer.index; });
            var minIndex = Math.min.apply(null, layerIndices);

            // Move the shape layer above the topmost selected layer
            shapeLayer.moveBefore(comp.layer(minIndex));

            // Add Layer Controls to the shape layer
            var effects = shapeLayer.property("Effects");

            var startLayerControl = effects.addProperty("ADBE Layer Control");
            startLayerControl.name = "Start Target";
            startLayerControl.property(1).setValue(startNull.index); // Set to the layer object

            var endLayerControl = effects.addProperty("ADBE Layer Control");
            endLayerControl.name = "End Target";
            endLayerControl.property(1).setValue(endNull.index); // Set to the layer object

            // Apply the expression to the path, referencing the Layer Controls
            var pathExpression = getLineExpression();
            var contents = shapeLayer.property("Contents");
            var group = contents.property("Line Group");
            var linePath = group.property("Contents").property("Line Path");
            linePath.property("Path").expression = pathExpression;

        } catch (err) {
            logMessage("Error in createSmartLine: " + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }


    function getOrCreateNullForLayer(comp, targetLayer) {
        var nullLayer = null;
        var targetLayerIndex = targetLayer.index;

        logMessage("Searching for existing null targeting layer: " + targetLayer.name + " (Index: " + targetLayerIndex + ")");

        // Search for an existing null with the Layer Control referencing the targetLayer
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (!layer.nullLayer) continue;

            var effects = layer.property("Effects");
            if (!effects) continue;

            var layerControl = effects.property("Smart Line Target Layer");
            if (!layerControl) continue;

            // Get the layer index from the Layer Control effect
            var referencedLayerIndex = layerControl.property(1).value;
            if (!referencedLayerIndex) continue;

            // Retrieve the actual layer object using the index
            var referencedLayer = comp.layer(referencedLayerIndex);
            if (!referencedLayer) continue;

            logMessage("Checking null layer: " + layer.name + " (Index: " + layer.index + "), which references layer: " + referencedLayer.name + " (Index: " + referencedLayer.index + ")");

            // Compare the indices to check if the layers are the same
            if (referencedLayer.index === targetLayerIndex) {
                nullLayer = layer;
                logMessage("Found existing null for layer: " + targetLayer.name);
                break;
            }
        }

        if (!nullLayer) {
            logMessage("No existing null found for layer: " + targetLayer.name + ". Creating new null.");

            // No matching null found, create a new one
            nullLayer = comp.layers.addNull();
            nullLayer.moveToEnd();

            // Name it based on targetLayer's name, truncated and with " - SL Target" added
            var baseName = targetLayer.name.substring(0, 15) + " - SL Target";
            nullLayer.name = baseName;
            nullLayer.label = 4; // Use desired label color

            nullLayer.property("Transform").property("Anchor Point").setValue([50, 50]);

            // Add the Layer Control effect and set it to reference the targetLayer
            var effects = nullLayer.property("Effects");
            var layerControl = effects.addProperty("ADBE Layer Control");
            layerControl.name = "Smart Line Target Layer";
            layerControl.property("Layer").setValue(targetLayerIndex);

            // Position the null via expression linked to the Layer Control
            linkNullPositionToLayer(nullLayer);

            // Optionally lock the null
            // nullLayer.locked = true;

            logMessage("Created new null for layer: " + targetLayer.name);
        }

        return nullLayer;
    }