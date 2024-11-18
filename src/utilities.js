// src/utilities.js

// Utilities Module
// Helper functions used across the script

var Utilities = {
    getLayerDimensionsAndCenter: function(layer, comp) {
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
    },

    extractExpression: function(func) {
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
    },    

    findFirstFillColor: function(group) {
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
    },

    // Color Helper Functions
    isArray: function(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    },

    normalizeColors: function(colors) {
        var normalized = [];
        for (var i = 0; i < colors.length; i++) {
            normalized.push(colors[i] / 255);
        }
        return normalized;
    }
};
