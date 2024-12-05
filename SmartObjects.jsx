// Version: 1.2.6

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

// src/shapeExpressions.js
var ShapeExpressions = (function() {

function rectShapePathExpression() { //Test
/*
// Define shape type
var control = effect("Smart Shape Control");
var shapeMenu = control("Shape Type").value;
if (shapeMenu != 1){
    value;
} else {
    // Get the calculated width and height
    var sizeCalculated = control("Calculated Size").value;
    var boundingBox = control("Bounding Box Size").value;
    var roundness = control("Roundness").value;
    var boundingBoxSize = control("Bounding Box Size");
        
    // Adjusted width and height
    var width = sizeCalculated[0];
    var height = sizeCalculated[1];
    var halfWidth = width / 2;
    var halfHeight = height / 2;
        
    // Anchor controls
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
        
    // Padding
    var padWidth = control("Padding Width");
    var padHeight = control("Padding Height");
    var uniformPadding = control("Uniform Padding").value;
    if(uniformPadding==1){
        padHeight=padWidth;
    };

    var padWidthLim = clamp(padWidth,0,-boundingBox[0]/2);
    var padHeightLim = clamp(padHeight,0,-boundingBox[1]/2);
    
    // Calculate the anchor offset in pixels
    var anchorOffsetX = anchorPctX * (halfWidth - padWidthLim * anchorPctX);
    var anchorOffsetY = anchorPctY * (halfHeight - padHeightLim * anchorPctY);
        
    // Get roundness percentage for each corner (0 to 100)
    var roundPct_TL = Math.max(control("Top Left %").value, 0);
    var roundPct_TR = Math.max(control("Top Right %").value, 0);
    var roundPct_BR = Math.max(control("Bottom Right %").value, 0);
    var roundPct_BL = Math.max(control("Bottom Left %").value, 0);

	// Adjusted corner positions based on anchor offsets
	var c_TL = [-halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
	var c_TR = [halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
	var c_BR = [halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
	var c_BL = [-halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];

    // Conditional check to skip rounding calculations if necessary
    if (roundness == 0 || (roundPct_TL == 0 && roundPct_TR == 0 && roundPct_BR == 0 && roundPct_BL == 0)) {
        // Create rectangle without rounded corners
        // Define vertices in order
        var vertices = [
            c_TL,
            c_TR,
            c_BR,
            c_BL
        ];

        // Set inTangents and outTangents to zero
        var inTangents = [
            [0,0],
            [0,0],
            [0,0],
            [0,0]
        ];

        var outTangents = [
            [0,0],
            [0,0],
            [0,0],
            [0,0]
        ];

        // Create the shape path
        var closed = true;
        createPath(vertices, inTangents, outTangents, closed);

    } else {
        // Create rectangle with rounded corners
        // Initial radii based on 'roundness' and percentages
        var radius_TL = (roundPct_TL / 100) * roundness;
        var radius_TR = (roundPct_TR / 100) * roundness;
        var radius_BR = (roundPct_BR / 100) * roundness;
        var radius_BL = (roundPct_BL / 100) * roundness;
            
        // Ensure radii do not exceed dimensions
        // Sum of radii along each edge
        var sumRadii_Top = radius_TL + radius_TR;
        var sumRadii_Bottom = radius_BL + radius_BR;
        var sumRadii_Left = radius_TL + radius_BL;
        var sumRadii_Right = radius_TR + radius_BR;
            
        // Scales to prevent corners from overlapping along each edge
        var scale_Top = sumRadii_Top > width ? width / sumRadii_Top : 1;
        var scale_Bottom = sumRadii_Bottom > width ? width / sumRadii_Bottom : 1;
        var scale_Left = sumRadii_Left > height ? height / sumRadii_Left : 1;
        var scale_Right = sumRadii_Right > height ? height / sumRadii_Right : 1;
            
        // Minimum scales affecting each corner
        var scale_TL = Math.min(scale_Top, scale_Left, 1);
        var scale_TR = Math.min(scale_Top, scale_Right, 1);
        var scale_BR = Math.min(scale_Bottom, scale_Right, 1);
        var scale_BL = Math.min(scale_Bottom, scale_Left, 1);
            
        // Adjusted radii after scaling
        radius_TL *= scale_TL;
        radius_TR *= scale_TR;
        radius_BR *= scale_BR;
        radius_BL *= scale_BL;
        
        // Calculate handles for Bezier curves
        var k = 0.55228475; // Kappa
        var handle_TL = radius_TL * k;
        var handle_TR = radius_TR * k;
        var handle_BR = radius_BR * k;
        var handle_BL = radius_BL * k;
            
        // Calculate points where arcs meet edges
        var p1_TL = [c_TL[0], c_TL[1] + radius_TL];
        var p2_TL = [c_TL[0] + radius_TL, c_TL[1]];
        var p3_TR = [c_TR[0] - radius_TR, c_TR[1]];
        var p4_TR = [c_TR[0], c_TR[1] + radius_TR];
        var p5_BR = [c_BR[0], c_BR[1] - radius_BR];
        var p6_BR = [c_BR[0] - radius_BR, c_BR[1]];
        var p7_BL = [c_BL[0] + radius_BL, c_BL[1]];
        var p8_BL = [c_BL[0], c_BL[1] - radius_BL];
            
        // Define vertices in order
        var vertices = [
            p1_TL,
            p2_TL,
            p3_TR,
            p4_TR,
            p5_BR,
            p6_BR,
            p7_BL,
            p8_BL
        ];
            
        // For each vertex, define tangents
        var p1_TL_In = [0, 0];
        var p1_TL_Out = [0, -handle_TL];
        var p2_TL_In = [-handle_TL, 0];
        var p2_TL_Out = [0, 0];
        var p3_TR_In = [0, 0];
        var p3_TR_Out = [handle_TR, 0];
        var p4_TR_In = [0, -handle_TR];
        var p4_TR_Out = [0, 0];
        var p5_BR_In = [0, 0];
        var p5_BR_Out = [0, handle_BR];
        var p6_BR_In = [handle_BR, 0];
        var p6_BR_Out = [0, 0];
        var p7_BL_In = [0, 0];
        var p7_BL_Out = [-handle_BL, 0];
        var p8_BL_In = [0, handle_BL];
        var p8_BL_Out = [0, 0];
            
        // Calculate inTangents and outTangents
        var inTangents = [
            p1_TL_In,
            p2_TL_In,
            p3_TR_In,
            p4_TR_In,
            p5_BR_In,
            p6_BR_In,
            p7_BL_In,
            p8_BL_In
        ];
            
        var outTangents = [
            p1_TL_Out,
            p2_TL_Out,
            p3_TR_Out,
            p4_TR_Out,
            p5_BR_Out,
            p6_BR_Out,
            p7_BL_Out,
            p8_BL_Out
        ];
            
        // Create the shape path
        var closed = true;
        createPath(vertices, inTangents, outTangents, closed);
    }
}
*/

}
    
function ellipseShapePathExpression() { 
/*
    // Define shape type
    var control = effect("Smart Shape Control");
    var shapeMenu = control("Shape Type").value;
    if (shapeMenu!=2){
        value;
    }else{
    // Get the calculated width and height
    var sizeCalculated = control("Calculated Size").value;
	var boundingBoxSize = control("Bounding Box Size").value;
		
    // Padding
	var padWidth = control("Padding Width");
	var padHeight = control("Padding Height");
	var uniformPadding = control("Uniform Padding").value;
	if(uniformPadding==1){
		padHeight=padWidth;
	};
	var padWidthLim = clamp(padWidth,0,-boundingBoxSize[0]/2);
	var padHeightLim = clamp(padHeight,0,-boundingBoxSize[1]/2);
    
    // Calculate adjusted dimensions considering padding
    var adjustedWidth = sizeCalculated[0];
    var adjustedHeight = sizeCalculated[1];
    
    // Calculate anchor offsets
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
    var anchorOffsetX = anchorPctX * adjustedWidth / 2 - (padWidthLim*anchorPctX);
    var anchorOffsetY = anchorPctY * adjustedHeight / 2 - (padHeightLim*anchorPctY);
    
    // Define the center of the ellipse
    var center = [-anchorOffsetX, -anchorOffsetY];
    
    // Calculate the radii for the ellipse
    var radiusX = adjustedWidth / 2;
    var radiusY = adjustedHeight / 2;
    
    // Bezier handle lengths for ellipse approximation
    var c = 0.5522847498;
    var handleX = (radiusX) * c;
    var handleY = (radiusY) * c;
    
    // Define the four key points of the ellipse
    var top = [center[0], center[1] - radiusY];
    var right = [center[0] + radiusX, center[1]];
    var bottom = [center[0], center[1] + radiusY];
    var left = [center[0] - radiusX, center[1]];
    
    // Collect the vertices
    var vertices = [top, right, bottom, left];
    
    // Define the in and out tangents for smooth curves
    var inTangents = [
        [-handleX, 0],    // Top point
        [0, -handleY],    // Right point
        [handleX, 0],     // Bottom point
        [0, handleY]      // Left point
    ];
    
    var outTangents = [
        [handleX, 0],     // Top point
        [0, handleY],     // Right point
        [-handleX, 0],    // Bottom point
        [0, -handleY]     // Left point
    ];
    
    // Create the closed elliptical path
    createPath(vertices, inTangents, outTangents, true);
    }
    */
}
    
function boundingBoxPathExpression() {
/*
// Check if the expression should be disabled
var control = effect("Smart Shape Control");
var disableExpression = control("Draw Guides").value;
if (!disableExpression) {
    value;
} else {
    // Get parameters
    var boundingBoxSize = control("Bounding Box Size")
	
    // Get half dimensions
    var halfWidth = boundingBoxSize[0] / 2;
    var halfHeight = boundingBoxSize[1] / 2;
	
    // Anchor controls
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
	
    // Calculate the anchor offset in pixels
    var anchorOffsetX = anchorPctX * boundingBoxSize[0] / 2;
    var anchorOffsetY = anchorPctY * boundingBoxSize[1] / 2;
	
    // Adjusted corner positions based on anchor offsets
    var c_TL = [-halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_TR = [halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_BR = [halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
    var c_BL = [-halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
	
    // Define vertices in order
    var vertices = [
        c_TL,
        c_TR,
        c_BR,
        c_BL
    ];
	
    // InTangents and OutTangents remain zero
    var inTangents = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
    ];
	
    var outTangents = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
    ];
	
    // Create the shape path
    var closed = true;
    createPath(vertices, inTangents, outTangents, closed);
}
*/
}
    
function innerPathExpression() {
/*
    // Check if the expression should be disabled
    var control = effect("Smart Shape Control");
    var disableExpression = control("Draw Guides").value;
    if (!disableExpression) {
        value;
    } else {
        // Get parameters
        var shapeMenu = control("Shape Type").value;
        var innerPathSize = control("Inner Path Size").value;
        var boundingBoxSize = control("Bounding Box Size").value;
        // Get half dimensions
        var halfWidth = innerPathSize[0] / 2;
        var halfHeight = innerPathSize[1] / 2;
        // Anchor controls
        var anchorPctX = control("Align X Anchor %").value / 100;
        var anchorPctY = control("Align Y Anchor %").value / 100;
        // Calculate the anchor offset in pixels
        var anchorOffsetX = anchorPctX * boundingBoxSize[0] / 2;
        var anchorOffsetY = anchorPctY * boundingBoxSize[1] / 2;
        // Adjusted center position based on anchor offsets
        var centerX = -anchorOffsetX;
        var centerY = -anchorOffsetY;

        if (shapeMenu == 1) {
            // Rectangle vertices
            var c_TL = [centerX - halfWidth, centerY - halfHeight];
            var c_TR = [centerX + halfWidth, centerY - halfHeight];
            var c_BR = [centerX + halfWidth, centerY + halfHeight];
            var c_BL = [centerX - halfWidth, centerY + halfHeight];
            var vertices = [c_TL, c_TR, c_BR, c_BL];
            var inTangents = [[0,0],[0,0],[0,0],[0,0]];
            var outTangents = [[0,0],[0,0],[0,0],[0,0]];
        } else if (shapeMenu == 2) {
            // Ellipse approximation using 4 points
            var c = 0.552284749831; // Control point offset
            var vertices = [
                [centerX + halfWidth, centerY],
                [centerX, centerY + halfHeight],
                [centerX - halfWidth, centerY],
                [centerX, centerY - halfHeight]
            ];
            var inTangents = [
                [0, -halfHeight * c],
                [halfWidth * c, 0],
                [0, halfHeight * c],
                [-halfWidth * c, 0]
            ];
            var outTangents = [
                [0, halfHeight * c],
                [-halfWidth * c, 0],
                [0, -halfHeight * c],
                [halfWidth * c, 0]
            ];
        }

        // Close the path and create it
        var closed = true;
        createPath(vertices, inTangents, outTangents, closed);
    }
*/
}
    
function anchorPointPathExpression() {
/*
var control = effect("Smart Shape Control");
var drawGuides = control("Draw Guides").value;
var anchorFixed = control("Fix Anchor Point in Center").value;

if (!drawGuides || anchorFixed) {
    value;
} else {
    // Get parameters
    var boundingBoxSize = control("Bounding Box Size")

    // Get half dimensions
    var halfWidth = boundingBoxSize[0] / 2;
    var halfHeight = boundingBoxSize[1] / 2;

    // Anchor controls
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;

    // Calculate the anchor offset in pixels
    var anchorOffsetX = anchorPctX * halfWidth;
    var anchorOffsetY = anchorPctY * halfHeight;

    // Base size off
    var minBounds = Math.min(halfWidth,halfHeight);

    // Cross parameters
    var radius = Math.max(minBounds/25,5); 
    var armWidth = radius/1.7; // Width of the cross arms
    var armLength = radius * 2; // Length of the cross arms

    var halfArmWidth = armWidth / 2;
    var halfArmLength = armLength / 2;

    // Define the cross's vertices
    var vertices = [
        [- halfArmWidth, - halfArmLength], // Top-left corner of vertical arm
        [halfArmWidth, - halfArmLength], // Top-right corner of vertical arm
        [halfArmWidth, - halfArmWidth],  // Transition to horizontal arm
        [halfArmLength, - halfArmWidth], // Rightmost point of horizontal arm (top side)
        [halfArmLength, halfArmWidth], // Bottom side of horizontal arm
        [halfArmWidth, halfArmWidth],  // Transition back to vertical arm
        [halfArmWidth, halfArmLength], // Bottom-right corner of vertical arm
        [- halfArmWidth, halfArmLength], // Bottom-left corner of vertical arm
        [- halfArmWidth, halfArmWidth],  // Transition to horizontal arm
        [- halfArmLength, halfArmWidth], // Leftmost point of horizontal arm (bottom side)
        [- halfArmLength, - halfArmWidth], // Top side of horizontal arm
        [- halfArmWidth, - halfArmWidth]   // Close the path
    ];


	//Padding
	var uniformPadding = control("Uniform Padding");
	var padWidth = control("Padding Width");
	var padHeight = control("Padding Height");
	
	if(uniformPadding==1){
	padHeight=padWidth;
	};

	var padX = anchorPctX * clamp(padWidth,0,-boundingBoxSize[0]/2);
	var padY = anchorPctY * clamp(padHeight,0,-boundingBoxSize[1]/2);
	
	// Function to limit values within specified ranges
	function adjustVertices(vertices) {
	  var adjustVertices = [];
	  for (var i = 0; i < vertices.length; i++) {
		var posX = vertices[i][0]+anchorOffsetX+padX;
		var posY = vertices[i][1]+anchorOffsetY+padY;
		var limitX = clamp(posX,-halfWidth,halfWidth)-anchorOffsetX;
		var limitY = clamp(posY,-halfHeight,halfHeight)-anchorOffsetY;
		adjustVertices.push([limitX, limitY]);
	  }
	  return adjustVertices;
	}

    // Apply the limits
    vertices = adjustVertices(vertices);

    // Since all edges are straight lines, inTangents and outTangents are zeros
    var inTangents = [];
    var outTangents = [];
    for (var i = 0; i < vertices.length; i++) {
        inTangents.push([0, 0]);
        outTangents.push([0, 0]);
    }

    // Create the cross path
    createPath(vertices, inTangents, outTangents, true);
    }
*/
}    

function sizeCalculatedExpression() {
/*
    // Expression to calculate sizes
    var control = effect("Smart Shape Control");
	var targetLayer = control("Get size of Layer");
	
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = control("Padding Height").value;
    var uniformPadding = control("Uniform Padding").value;
    if (uniformPadding == 1) {
        paddingHeight = paddingWidth;
    }
    
    var widthValue = control('Width').value;
    var heightValue = control('Height').value;
    var uniformSize = control("Uniform Size").value;
    if (uniformSize == 1) {
        heightValue = widthValue;
    }

    var widthPercentage = control('Width %').value/100;
    var heightPercentage = control('Height %').value/100;
    var uniformScale = control("Uniform Scale").value;
	if (uniformScale == 1) {
		heightPercentage = widthPercentage;
    }

    // Get size and scale values
    if (targetLayer == null || targetLayer.index == thisLayer.index) {
        sizeValue = [widthValue, heightValue];
    } else {
        var layer = thisComp.layer(targetLayer.index);
        var layerWidth = layer.sourceRectAtTime(time).width;
        var layerHeight = layer.sourceRectAtTime(time).height;
        var layerScale = layer.transform.scale.value/100;
        sizeValue = [layerWidth*layerScale[0], layerHeight*layerScale[1]];
    }
	var sizeXScaled = (sizeValue[0] + paddingWidth*2)*widthPercentage;
	var sizeYScaled = (sizeValue[1] + paddingHeight*2)*heightPercentage;

    // Limit negative padding
    var maxNegativePadding = sizeXScaled / 2;
    if (paddingWidth < 0) {
        paddingWidth = Math.max(paddingWidth, -maxNegativePadding);
    }
    var maxNegativePadding = sizeYScaled / 2;
    if (paddingHeight < 0) {
        paddingHeight = Math.max(paddingHeight, -maxNegativePadding);
    }
    
    // Ensure calculated dimension is not negative
    widthCalculated = Math.max(0, sizeXScaled);
    heightCalculated = Math.max(0, sizeYScaled);
    
    [widthCalculated,heightCalculated];
*/
    
}
    
function boundBoxSizeExpression() {
/*
    var control = effect("Smart Shape Control");
    var targetLayer = control('Get size of Layer');
    var uniformSize = control("Uniform Size").value;
    var widthValue = Math.max(control('Width').value,0);
    var heightValue = Math.max(control('Height').value,0);

    //Padding
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = control("Padding Height").value;
    var uniformPadding = control("Uniform Padding").value;
    if (!uniformPadding) {
        padding = [Math.max(0,paddingWidth), Math.max(0,paddingHeight)];
    }else{
        padding = [Math.max(0,paddingWidth), Math.max(0,paddingWidth)];
    }

    // Get size values
    if (targetLayer == null || targetLayer.index == thisLayer.index) {
        size = [widthValue,(uniformSize == 1) ? widthValue : heightValue];
    } else {
        var layer = thisComp.layer(targetLayer.index);
        var layerWidth = layer.sourceRectAtTime(time).width;
        var layerHeight = layer.sourceRectAtTime(time).height;
        size = [layerWidth, (uniformSize == 1) ? layerWidth : layerHeight];
    }
    var width = (size[0] + padding[0] * 2);
    var height = (size[1] + padding[1] * 2);
    [width , height];
*/
}

    
    
function innerPathSizeExpression() {
/*
    var control = effect("Smart Shape Control");
    var targetLayer = control('Get size of Layer');
    var uniformSize = control("Uniform Size").value;
    var widthValue = control('Width').value;
    var heightValue = control('Height').value;

    //Padding
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = control("Padding Height").value;
    var uniformPadding = control("Uniform Padding").value;
    if (!uniformPadding) {
        padding = [Math.min(0,paddingWidth), Math.min(0,paddingHeight)];
    }else{
        padding = [Math.min(0,paddingWidth), Math.min(0,paddingWidth)];
    }

    // Get size values
    var sizeX, sizeY;
    if (targetLayer == null || targetLayer.index == thisLayer.index) {
        sizeX = widthValue;
        sizeY = (uniformSize == 1) ? widthValue : heightValue;
    } else {
        var layer = thisComp.layer(targetLayer.index);
        var layerWidth = layer.sourceRectAtTime(time).width;
        var layerHeight = layer.sourceRectAtTime(time).height;
        sizeX = layerWidth;
        sizeY = (uniformSize == 1) ? layerWidth : layerHeight;
    }
    // Get half dimensions
    var width = Math.max(0,sizeX + padding[0]*2);
    var height = Math.max(0,sizeY + padding[1]*2);
    [width , height];
*/
}
    
    
    
function groupPositionExpression() {
/*
var control = effect("Smart Shape Control");
var anchorFixed = control("Fix Anchor Point in Center").value;
if (anchorFixed) {
[0,0]
}else{
var boundingBox = control("Bounding Box Size");
var anchorPctX = control("Align X Anchor %").value / 100;
var anchorPctY = control("Align Y Anchor %").value / 100;
var x = boundingBox[0]/2 * anchorPctX;
var y = boundingBox[1]/2 * anchorPctY;
[x,y]
}
*/
}
    
    return {
    rectShapePathExpression: rectShapePathExpression,
    ellipseShapePathExpression: ellipseShapePathExpression,
    boundingBoxPathExpression: boundingBoxPathExpression,
    innerPathExpression: innerPathExpression,
    anchorPointPathExpression: anchorPointPathExpression,
    sizeCalculatedExpression: sizeCalculatedExpression,
	boundBoxSizeExpression: boundBoxSizeExpression,
	innerPathSizeExpression: innerPathSizeExpression,
    groupPositionExpression: groupPositionExpression
};

})();
// src/shapeFunctions.js
var ShapeFunctions = (function() {
    // Default Shape Configuration
    var defaultShapeConfig = {
        width: 400,
        height: 400,
        fillColor: [1, 1, 1],
        strokeColor: [1, 1, 1],
        strokeWidth: 0,
        name: "Smart Shape",
        label: 8, // Blue label color
        targetLayer: null,
        separateDimensions: false, // Add default for separate dimensions
    };

    function mergeProperties(defaults, properties) {
        var result = {};
        for (var key in defaults) {
            result[key] = defaults[key];
        }
        for (var key in properties) {
            if (properties[key] !== undefined) {
                result[key] = properties[key];
            }
        }
        return result;
    }

    function createSmartShape(properties) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.");
            return;
        }

        // Merge properties with defaults
        var config = mergeProperties(defaultShapeConfig, properties);

        var shapeLayer;
    
        if (config.targetLayer && !config.createMatte) {
            // If converting an existing layer
            shapeLayer = config.targetLayer.duplicate();
            shapeLayer.moveBefore(config.targetLayer);
        } else {
            // Create a new shape layer
            shapeLayer = comp.layers.addShape();
        }

        shapeLayer.property("Transform").property("Anchor Point").setValue([0, 0]);

        shapeLayer.name = config.name;
        shapeLayer.label = config.label;
    
        // Remove existing contents
        var contents = shapeLayer.property("Contents");
        for (var j = contents.numProperties; j >= 1; j--) {
            contents.property(j).remove();
        }
    
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Group 1";
    
        addShapePaths(group);
    
        // Add fill
        var fill = group.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(config.fillColor);
    
        // Add stroke
        var stroke = group.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(config.strokeColor);
        stroke.property("Stroke Width").setValue(config.strokeWidth);
    
        // Add guide paths
        addGuidePaths(group);
    
        // Add smart properties
        addSmartProperties(shapeLayer, config);
    
        // Set Position and Dimensions
        var layerInfo = null;
        if (config.targetLayer) {
            layerInfo = Utilities.getLayerDimensionsAndCenter(config.targetLayer, comp);
        } else {
            layerInfo = {
                width: config.width,
                height: config.height,
                center: [comp.width / 2, comp.height / 2]
            };
        }
    
        // Separate Dimensions if needed
        shapeLayer.property("Transform").property("Position").dimensionsSeparated =
            config.separateDimensions;
        Logging.logMessage("Set dimensionsSeparated to " + config.separateDimensions);
    
        var smartShapeControl = shapeLayer.effect('Smart Shape Control');
        
        // Shape settings
        if (!config.isBackground) {
            smartShapeControl.property("Width").setValue(layerInfo.width);
            smartShapeControl.property("Height").setValue(layerInfo.height);
            if (config.separateDimensions) {
                Logging.logMessage("Dimensions are separated. Setting X and Y Position individually.");
                shapeLayer.property("Transform").property("X Position").setValue(layerInfo.center[0]);
                shapeLayer.property("Transform").property("Y Position").setValue(layerInfo.center[1]);
            } else {
                Logging.logMessage("Dimensions are not separated. Setting Position.");
                shapeLayer.property("Transform").property("Position").setValue(layerInfo.center);
            }
            
        //Background settings
        } else {
            smartShapeControl.property("Width").expression =
            "thisComp.width + effect('Smart Shape Control')('Padding Width').value * 2;";
            smartShapeControl.property("Height").expression =
                "thisComp.height + effect('Smart Shape Control')('Padding Height').value * 2;";
            if (!config.separateDimensions) {
                shapeLayer.property("Transform").property("Position").expression =
                    "[thisComp.width/2, thisComp.height/2];";
            } else {
                shapeLayer.property("Transform").property("X Position").expression = "thisComp.width/2";
                shapeLayer.property("Transform").property("Y Position").expression = "thisComp.height/2";
            }
            smartShapeControl.property("Draw Guides").setValue(false);

            shapeLayer.moveToEnd();
            shapeLayer.shy = true;
            shapeLayer.locked = true;
        }
    
        // Handle mattes and layer stack
        if (config.targetLayer && config.createMatte) {
            // Create a matte
            config.targetLayer.parent = shapeLayer;
            config.targetLayer.trackMatteType = TrackMatteType.ALPHA;
            shapeLayer.moveAfter(config.targetLayer);
            shapeLayer.enabled = true;
        } else if (config.targetLayer) {
            shapeLayer.moveAfter(config.targetLayer);
        }
    
        return shapeLayer;
    }
    
    // Function to Convert Selected Shapes to Smart Shapes
    function convertToSmartShape(config) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            Logging.logMessage("Please select a composition.");
            return;
        }
    
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            Logging.logMessage("Please select at least one shape layer.");
            return;
        }
    
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
    
            if (!(layer instanceof ShapeLayer)) {
                Logging.logMessage("Skipping non-shape layer: " + layer.name);
                continue;
            }
    
            Logging.logMessage("Converting layer: " + layer.name);
    
            // Get layer dimensions and center
            var layerInfo = Utilities.getLayerDimensionsAndCenter(layer, comp);
            if (!layerInfo) {
                logMessage("Could not get dimensions for layer: " + layer.name);
                continue;
            }
    
            // Get fill color from original layer
            var fillColor = Utilities.findFirstFillColor(layer.property("Contents"));
            if (fillColor === null) {
                fillColor = UI.getCurrentFillColor();
                Logging.logMessage("No fill color found, using color picker");
            }
    
            var properties = {
                name: layer.name,
                fillColor: fillColor,
                targetLayer: layer,
                separateDimensions: config.separateDimensions
            };
    
            createSmartShape(properties);
        }
    }
    
    // Add Paths to the Shape Layer
    function addShapePaths(group) {
        var content = group.property("Contents");
    
        var rectangleShapePath = content.addProperty("ADBE Vector Shape - Group");
        rectangleShapePath.name = "Rectangle Shape Path";
    
        var ellipseShapePath = content.addProperty("ADBE Vector Shape - Group");
        ellipseShapePath.name = "Ellipse Shape Path";
    }
    
    function addGuidePaths(group) {
        var content = group.property("Contents");
    
        var boundingBoxPath = content.addProperty("ADBE Vector Shape - Group");
        boundingBoxPath.name = "Bounding Box Path";
    
        var innerPath = content.addProperty("ADBE Vector Shape - Group");
        innerPath.name = "Inner Path";
    
        var anchorPointPath = content.addProperty("ADBE Vector Shape - Group");
        anchorPointPath.name = "Anchor Point Path";
    }
    
    // Add Smart Properties and Expressions to the Shape Layer
    function addSmartProperties(shapeLayer, config) {
        // Since we're incorporating expressions directly, we can remove external file loading
    
        // Ensure the shapeLayer is the only selected layer
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            for (var i = 1; i <= comp.numLayers; i++) {
                comp.layer(i).selected = false;
            }
            shapeLayer.selected = true;
        }
    
        // Apply the preset and move the effect to the top using the utility function
        var smartShapeControl = Utilities.applyPresetAndMoveEffectToTop(
            shapeLayer,
            "Smart Shape Control",
            "SmartShapeControl.ffx"
        );

        if (!smartShapeControl) {
            // Error message is already logged in the utility function
            return null;
        }

        // Extract the Expressions
        try {
            var rectShapeExprString = Utilities.extractExpression(ShapeExpressions.rectShapePathExpression);
            var ellipseShapeExprString = Utilities.extractExpression(ShapeExpressions.ellipseShapePathExpression);
            var boundPathExprString = Utilities.extractExpression(ShapeExpressions.boundingBoxPathExpression);
            var innerPathExprString = Utilities.extractExpression(ShapeExpressions.innerPathExpression);
            var anchorGuideExprString = Utilities.extractExpression(ShapeExpressions.anchorPointPathExpression);
    
            var sizeCalcExprString = Utilities.extractExpression(ShapeExpressions.sizeCalculatedExpression);
            var groupPositionExprString = Utilities.extractExpression(ShapeExpressions.groupPositionExpression);
            var boundBoxSizeExprString = Utilities.extractExpression(ShapeExpressions.boundBoxSizeExpression);
            var innerPathSizeExprString = Utilities.extractExpression(ShapeExpressions.innerPathSizeExpression);
    
        } catch (e) {
            Logging.logMessage("Error extracting expressions: " + e.toString(),true);
            return null;
        }
    
        // Apply Expressions to properties
        try {
            // Apply Expressions to expression controls
            smartShapeControl.property("Calculated Size").expression = sizeCalcExprString;
            smartShapeControl.property("Bounding Box Size").expression = boundBoxSizeExprString;
            smartShapeControl.property("Inner Path Size").expression = innerPathSizeExprString;
    
            // Apply Expressions to Shape Paths
            var group = shapeLayer.property("Contents").property("Group 1");
            var content = group.property("Contents");
            var rectangleShapePath = content.property("Rectangle Shape Path");
            var ellipseShapePath = content.property("Ellipse Shape Path");
            var boundingBoxPath = content.property("Bounding Box Path");
            var innerPath = content.property("Inner Path");
            var anchorPointPath = content.property("Anchor Point Path");
    
            rectangleShapePath.property("Path").expression = rectShapeExprString;
            ellipseShapePath.property("Path").expression = ellipseShapeExprString;
            boundingBoxPath.property("Path").expression = boundPathExprString;
            innerPath.property("Path").expression = innerPathExprString;
            anchorPointPath.property("Path").expression = anchorGuideExprString;
    
            // Apply the expression to the group's position
            group.property("Transform").property("Position").expression = groupPositionExprString;
    
        } catch (e) {
            Logging.logMessage("Failed to set smart properties on the shape layer: " + e.toString(),true);
            return null;
        }
    
        return shapeLayer;
    }    

    // Return the public API
    return {
        createSmartShape: createSmartShape,
        convertToSmartShape: convertToSmartShape,
        addShapePaths: addShapePaths,
        addGuidePaths: addGuidePaths,
        addSmartProperties: addSmartProperties,
        // Include any other functions you need to expose
    };
})();

// src/textExpressions.js

var TextExpressions = (function() {

function sourceTextExpression() {
/*
var control = effect("Smart Text Control");
var textSource = control("Text Source");
if (textSource == null){
	var src = thisLayer;
}else{
	var src = thisComp.layer(textSource.index)
}

var txt=src.text.sourceText;
var newStyle=txt.getStyleAt(0,0);
newStyle.setText(txt)
*/
}

function anchorPointExpression() {
/*
var control =  effect("Smart Text Control")
var boundBoxAnchor = control("Bounding Box Anchor").value;
if (boundBoxAnchor==0){
	value;
}else{
	var boundingBoxSize = control("Bounding Box Size").value;
	var anchorPctX = control("Align X Anchor %")/100;
	var anchorPctY = control("Align Y Anchor %")/100;
	var leftTopValues = control("Left & Top Values").value;
	
	var halfWidth = boundingBoxSize[0] / 2;
	var halfHeight = boundingBoxSize[1] / 2;
	var x = halfWidth * anchorPctX + leftTopValues[0] + halfWidth;
	var y = halfHeight * anchorPctY + leftTopValues[1] + halfHeight;
	[x,y]
}
*/
}

function boundBoxSizeExpression() {
/*
var rectWidth = thisLayer.sourceRectAtTime().width;
var rectHeight = thisLayer.sourceRectAtTime().height;
[rectWidth, rectHeight];
*/
}

function leftTopValuesExpression() {
/*
var rectLeft = thisLayer.sourceRectAtTime().left;
var rectTop = thisLayer.sourceRectAtTime().top;
[rectLeft, rectTop];
*/
}

// Expose the functions via the TextExpressions object
return {
	sourceTextExpression: sourceTextExpression,
	anchorPointExpression: anchorPointExpression,
	boundBoxSizeExpression: boundBoxSizeExpression,
	leftTopValuesExpression: leftTopValuesExpression
};

})();
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

// src/ui.js

// UI Module
var UI = (function() {
    // Global variables used in UI functions
    var pickColorArea;
    var separateDimsCheckbox;

    // Define settings file path
    var scriptFolderPath = new File($.fileName).parent.fsName;
    var settingsFilePath = scriptFolderPath + "/SmartShapesSettings.txt";

    // Create the Button Group with "Create" and "Convert" Buttons
    // Create the Button Group with "Create Smart Shape" and "Convert" Buttons
    function createShapeButtonGroup(parent) {
        var shapeGroup = parent.add("group");
        shapeGroup.orientation = "column";
        shapeGroup.alignChildren = ["left", "top"];
        shapeGroup.spacing = 10; // Add some spacing between groups

        var buttonGroup = shapeGroup.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignChildren = ["left", "center"];
        buttonGroup.spacing = 10; // Add spacing between buttons

        // Create "Create Smart Shape" Button
        var createShapeBtn = buttonGroup.add("button", undefined, "Create Smart Shape");
        createShapeBtn.onClick = function() {
            app.beginUndoGroup("Create Smart Shape");
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    Logging.logMessage("Please select a composition.", true);
                    return;
                }

                var selectedLayers = comp.selectedLayers;
                var createMatte = false;
                var targetLayer = null;

                if (selectedLayers.length > 0) {
                    // There are selected layers. Ask the user about matte options.
                    var result = showMatteOptionsDialog();
                    if (result === true) {
                        // User chose to create mattes
                        createMatte = true;
                        targetLayer = selectedLayers[0]; // Use the first selected layer
                    } else if (result === false) {
                        // User chose not to create mattes
                        // Proceed without matte
                    } else {
                        // User cancelled
                        return; // Exit the function
                    }
                }

                ShapeFunctions.createSmartShape({
                    fillColor: getCurrentFillColor(), // Pass the current fill color
                    targetLayer: targetLayer,
                    createMatte: createMatte,
                    separateDimensions: separateDimsCheckbox.value // Pass separate dimensions value
                });
            } catch (err) {
                Logging.logMessage("Error in Create Smart Shape: " + err.toString(), true);
            } finally {
                app.endUndoGroup();
            }
        };

        // Create "Convert to Smart Shape" Button
        var convertBtn = buttonGroup.add("button", [0, 0, 28, 28], "C");
        convertBtn.onClick = function() {
            app.beginUndoGroup("Convert to Smart Shape");
            try {
                ShapeFunctions.convertToSmartShape({
                    separateDimensions: separateDimsCheckbox.value // Pass separate dimensions value
                });
            } catch (err) {
                Logging.logMessage("Error in Convert Smart Shape: " + err.toString(), true);
            } finally {
                app.endUndoGroup();
            }
        };
    }

    // Create the Button Group with "Create Smart Text" and "Convert" Buttons
    function createTextButtonGroup(parent) {
        var textGroup = parent.add("group");
        textGroup.orientation = "column";
        textGroup.alignChildren = ["left", "top"];
        textGroup.spacing = 10; // Add some spacing between groups

        var buttonGroup = textGroup.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignChildren = ["left", "center"];
        buttonGroup.spacing = 10; // Add spacing between buttons

        // Create "Create Smart Text" Button
        var createTextBtn = buttonGroup.add("button", undefined, "Create Smart Text");
        createTextBtn.onClick = function() {
            app.beginUndoGroup("Create Smart Text");
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    Logging.logMessage("Please select a composition.", true);
                    return;
                }

                // Create the smart text layer
                TextFunctions.createSmartText({
                    // Pass any necessary configuration properties (if needed)
                    separateDimensions: separateDimsCheckbox.value
                });
            } catch (err) {
                Logging.logMessage("Error in Create Smart Text: " + err.toString(), true);
            } finally {
                app.endUndoGroup();
            }
        };

        // Create "Convert to Smart Text" Button
        var convertTextBtn = buttonGroup.add("button", [0, 0, 28, 28], "C");
        convertTextBtn.onClick = function() {
            app.beginUndoGroup("Convert to Smart Text");
            try {
                TextFunctions.convertToSmartText();
            } catch (err) {
                Logging.logMessage("Error in Convert to Smart Text: " + err.toString(), true);
            } finally {
                app.endUndoGroup();
            }
        };
    }

    // Create the Button Group for Smart Background
    function createBackgroundButtonGroup(parent) {
        var backgroundGroup = parent.add("group");
        backgroundGroup.orientation = "column";
        backgroundGroup.alignChildren = ["left", "top"];
        backgroundGroup.spacing = 10; // Add some spacing between groups

        // Create "Create Smart Background" Button
        var createBackgroundBtn = backgroundGroup.add("button", undefined, "Create Smart Background");
        createBackgroundBtn.graphics.foregroundColor = createBackgroundBtn.graphics.newPen(
            createBackgroundBtn.graphics.PenType.SOLID_COLOR,
            [0.5, 0.3, 0.2],
            1
        );

        createBackgroundBtn.onClick = function() {
            app.beginUndoGroup("Create Smart Background");
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    Logging.logMessage("Please select a composition.", true);
                    return;
                }

                // Check for existing background layers
                var existingBackgroundLayers = [];
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    var name = layer.name;
                    var match = name.match(/^Background(?: (\d+))?$/);
                    if (match) {
                        var number = match[1] ? parseInt(match[1]) : 1;
                        existingBackgroundLayers.push(number);
                    }
                }

                if (existingBackgroundLayers.length > 0) {
                    // Alert the user
                    var result = showBackgroundLayerDialog();
                    if (result === "cancel") {
                        return; // User canceled the operation
                    }
                }

                // Determine the new background layer name
                var newBackgroundNumber = 1;
                if (existingBackgroundLayers.length > 0) {
                    newBackgroundNumber = Math.max.apply(null, existingBackgroundLayers) + 1;
                }

                var newBackgroundName = newBackgroundNumber === 1 ? "Background" : "Background " + newBackgroundNumber;

                var newBackgroundLayer = ShapeFunctions.createSmartShape({
                    isBackground: true,
                    name: newBackgroundName,
                    label: 12,
                    fillColor: getCurrentFillColor(),
                    separateDimensions: separateDimsCheckbox.value // Pass separate dimensions value
                });

            } catch (err) {
                Logging.logMessage("Error in Create Smart Background: " + err.toString(), true);
            } finally {
                app.endUndoGroup();
            }
        };
    }

    // Get the Current Fill Color from the Color Picker
    function getCurrentFillColor() {
        if (pickColorArea && pickColorArea.currentColor) {
            var normalizedColor = Utilities.normalizeColors(pickColorArea.currentColor);
            return normalizedColor;
        } else {
            return [1, 1, 1]; // Default to white
        }
    }

    // Create the Color Picker Component
    function createColorPicker(parent) {
        var colorGroup = parent.add("group");
        colorGroup.orientation = "row";
        colorGroup.add("statictext", undefined, "Fill Color:");

        pickColorArea = colorGroup.add("panel", undefined, "");
        pickColorArea.size = [60, 20];
        pickColorArea.graphics.backgroundColor = pickColorArea.graphics.newBrush(
            pickColorArea.graphics.BrushType.SOLID_COLOR,
            [1, 1, 1]
        );
        pickColorArea.currentColor = [255, 255, 255];

        pickColorArea.addEventListener('mousedown', function() {
            var newColor = $.colorPicker();
            if (newColor !== -1) {
                pickColorArea.currentColor = [
                    ((newColor >> 16) & 0xFF),
                    ((newColor >> 8) & 0xFF),
                    (newColor & 0xFF)
                ];
                pickColorArea.graphics.backgroundColor = pickColorArea.graphics.newBrush(
                    pickColorArea.graphics.BrushType.SOLID_COLOR,
                    Utilities.normalizeColors(pickColorArea.currentColor)
                );
                saveSettings();
            }
        });
    }

    // Create the Separate Dimensions Checkbox
    function createSeparateDimsCheckbox(parent) {
        var separateDimsGroup = parent.add("group");
        separateDimsGroup.orientation = "row";
        separateDimsCheckbox = separateDimsGroup.add("checkbox", undefined, "Separate Dimensions");
        separateDimsCheckbox.value = false;

        separateDimsCheckbox.onClick = function() {
            saveSettings();
        };
    }

    // Create the "Show Log" Button
    function createShowLogButton(parent) {
        var showLogBtn = parent.add("button", undefined, "Show Log");
        showLogBtn.onClick = function() {
            Logging.showLogWindow();
        };
    }

    // Save Settings Function
    function saveSettings() {
        var settingsFile = new File(settingsFilePath);
        if (settingsFile.open('w')) {
            settingsFile.writeln("separateDimensions=" + separateDimsCheckbox.value);
            settingsFile.writeln("pickColor=" + pickColorArea.currentColor.toString());
            settingsFile.close();
        } else {
            Logging.logMessage("Failed to open settings file for writing.");
        }
    }

    // Load Settings Function
    function loadSettings() {
        var settingsFile = new File(settingsFilePath);
        var settings = {};
        if (settingsFile.exists && settingsFile.open('r')) {
            var line;
            while (!settingsFile.eof) {
                line = settingsFile.readln();
                var parts = line.split('=');
                if (parts.length == 2) {
                    var key = parts[0];
                    var value = parts[1];
                    settings[key] = value;
                }
            }
            settingsFile.close();
        }

        // Set default values if settings are missing
        if (settings['separateDimensions'] !== undefined) {
            separateDimsCheckbox.value = (settings['separateDimensions'] === 'true');
        } else {
            separateDimsCheckbox.value = false; // default value
        }

        if (settings['pickColor'] !== undefined && settings['pickColor'].length > 0) {
            var colorStrings = settings['pickColor'].split(',');
            var colorValues = [];
            for (var i = 0; i < colorStrings.length; i++) {
                colorValues.push(parseFloat(colorStrings[i]));
            }
            pickColorArea.currentColor = colorValues;
            pickColorArea.graphics.backgroundColor = pickColorArea.graphics.newBrush(
                pickColorArea.graphics.BrushType.SOLID_COLOR,
                Utilities.normalizeColors(colorValues)
            );
        } else {
            // Set a default color, e.g., white
            pickColorArea.currentColor = [255, 255, 255];
            pickColorArea.graphics.backgroundColor = pickColorArea.graphics.newBrush(
                pickColorArea.graphics.BrushType.SOLID_COLOR,
                [1, 1, 1]
            );
        }
    }

    // Show Matte Options Dialog
    function showMatteOptionsDialog() {
        var dialog = new Window("dialog", "Create Matte Options");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";

        var text = dialog.add("statictext", undefined,
            "Do you want to create mattes for the selected layers?");
        text.alignment = "center";

        var buttonGroup = dialog.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = "center";

        var yesButton = buttonGroup.add("button", undefined, "Yes");
        var noButton = buttonGroup.add("button", undefined, "No");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");

        var result = null;

        yesButton.onClick = function() {
            result = true;
            dialog.close();
        };

        noButton.onClick = function() {
            result = false;
            dialog.close();
        };

        cancelButton.onClick = function() {
            result = "cancel";
            dialog.close();
        };

        dialog.show();

        return result;
    }

    // Show Background Layer Dialog
    function showBackgroundLayerDialog() {
        var dialog = new Window("dialog", "Background Layer Exists");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";

        var text = dialog.add("statictext", undefined,
            "A background layer already exists.\nDo you want to add another?");
        text.alignment = "center";

        var buttonGroup = dialog.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = "center";

        var addButton = buttonGroup.add("button", undefined, "Add Another");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");

        var result = null;

        addButton.onClick = function() {
            result = "add";
            dialog.close();
        };

        cancelButton.onClick = function() {
            result = "cancel";
            dialog.close();
        };

        dialog.show();

        return result;
    }

    // Return the public API
    return {
        createShapeButtonGroup: createShapeButtonGroup,
        createTextButtonGroup: createTextButtonGroup,
        createBackgroundButtonGroup: createBackgroundButtonGroup,
        createColorPicker: createColorPicker,
        createSeparateDimsCheckbox: createSeparateDimsCheckbox,
        getCurrentFillColor: getCurrentFillColor,
        getSeparateDimsValue: function() {
            return separateDimsCheckbox.value;
        },
        createShowLogButton: createShowLogButton,
        showMatteOptionsDialog: showMatteOptionsDialog,
        showBackgroundLayerDialog: showBackgroundLayerDialog,
        loadSettings: loadSettings,
        saveSettings: saveSettings
        // Add any other functions you need to expose
    };
})();
// Other UI-related functions can be added here as needed

// src/main.js
(function main(thisObj) {
    // Initialize the panel
    function smartShapesPanel(thisObj) {
        var myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Smart Shapes v.1.2.6", undefined);

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
