// src/utilities.js

// Utilities Module
// Helper functions used across the script

var Utilities =(function() {

    function getLayerDimensionsAndCenter(layer, comp) {
        var time = comp.time;

        if (layer instanceof CameraLayer) {
            return null;
        }

        var bounds, anchorPoint, scale, layerPosition;

        try {
            bounds = layer.sourceRectAtTime(time, false);
        } catch (e) {
            bounds = { left: 0, top: 0, width: 100, height: 100 };
        }

        anchorPoint = layer.anchorPoint.value;
        scale = layer.scale.value;
        layerPosition = layer.position.value;

        var widthScaled = bounds.width * (scale[0] / 100);
        var heightScaled = bounds.height * (scale[1] / 100);

        var offsetX = (bounds.left + bounds.width / 2 - anchorPoint[0]) * (scale[0] / 100);
        var offsetY = (bounds.top + bounds.height / 2 - anchorPoint[1]) * (scale[1] / 100);

        var center = [
            layerPosition[0] + offsetX,
            layerPosition[1] + offsetY
        ];

        return {
            width: widthScaled,
            height: heightScaled,
            center: center
        };
    }

    function extractExpression(func) {
        if (typeof func !== 'function') {
            throw new Error("Utilities.extractExpression expected a function, but got " + typeof func);
        }
        var funcStr = func.toString();
        // Regular expression to match all multi-line comments
        var regex = /\/\*([\s\S]*?)\*\//g;
        var matches = [];
        var match;
        while ((match = regex.exec(funcStr)) !== null) {
            matches.push(match[1]);
        }
        if (matches.length > 0) {
            // If there are multiple matches, select the one that contains your expression.
            // Assuming the longest comment is the expression:
            var expressionStr = matches.reduce(function(a, b) {
                return a.length > b.length ? a : b;
            }).replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace
            return expressionStr;
        } else {
            return '';
        }
    }  

    function findFirstFillColor(group) {
        var fillColor = null;
        function recursiveSearch(group) {
            for (var i = 1; i <= group.numProperties; i++) {
                var property = group.property(i);
                if (property.matchName === "ADBE Vector Graphic - Fill") {
                    fillColor = property.property("Color").value;
                    return true;
                } else if (property.propertyType === PropertyType.PROPERTY_GROUP &&
                           property.name !== "Transform") {
                    if (recursiveSearch(property)) {
                        return true;
                    }
                }
            }
            return false;
        }
        recursiveSearch(group);
        return fillColor;
    }

    // Color Helper Functions
    function isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

    function normalizeColors(colors) {
        var normalized = [];
        for (var i = 0; i < colors.length; i++) {
            normalized.push(colors[i] / 255);
        }
        return normalized;
    }

    // Add the new utility function here
    function applyPresetAndMoveEffectToTop(layer, effectName, presetFileName) {
        var comp = app.project.activeItem;

        // Store the original selection
        var originalSelection = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).selected) {
                originalSelection.push(comp.layer(i));
            }
        }

        // Deselect all layers
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }

        // Select only the target layer
        layer.selected = true;

        // Remove existing effect if it exists
        var existingEffect = layer.effect(effectName);
        if (existingEffect) {
            Logging.logMessage("'" + effectName + "' effect already exists on " + layer.name + ". Removing it.");
            existingEffect.remove();
        }

        // Apply the .ffx preset
        var scriptFolder = new File($.fileName).parent;
        var ffxFile = new File(scriptFolder.fsName + "/FFX/" + presetFileName);

        if (ffxFile.exists) {
            Logging.logMessage("Applying preset: " + ffxFile.fsName);
            layer.applyPreset(ffxFile);
            Logging.logMessage("Preset applied successfully to " + layer.name);
        } else {
            Logging.logMessage("Preset file not found: " + ffxFile.fsName, true);

            // Restore the original selection
            for (var i = 1; i <= comp.numLayers; i++) {
                comp.layer(i).selected = false;
            }
            for (var i = 0; i < originalSelection.length; i++) {
                originalSelection[i].selected = true;
            }

            return null;
        }

        // Restore the original selection
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }
        for (var i = 0; i < originalSelection.length; i++) {
            originalSelection[i].selected = true;
        }

        // Verify if the effect exists and get it as a Property
        var effectsGroup = layer.property("ADBE Effect Parade");
        var appliedEffect = null;
        for (var i = 1; i <= effectsGroup.numProperties; i++) {
            var effect = effectsGroup.property(i);
            if (effect.name === effectName) {
                appliedEffect = effect;
                break;
            }
        }

        if (!appliedEffect) {
            Logging.logMessage("Error: '" + effectName + "' effect not found on the layer.", true);
            return null;
        } else {
            Logging.logMessage("'" + effectName + "' effect found on " + layer.name);
        }

        // Move the effect to the top of the effect stack
        if (appliedEffect.propertyIndex > 1) {
            appliedEffect.moveTo(1);
        }

        return appliedEffect;
    }

    // Return the public API
    return {
        getLayerDimensionsAndCenter: getLayerDimensionsAndCenter,
        extractExpression: extractExpression,
        findFirstFillColor: findFirstFillColor,
        isArray: isArray,
        normalizeColors: normalizeColors,
        applyPresetAndMoveEffectToTop: applyPresetAndMoveEffectToTop
    };

})();
