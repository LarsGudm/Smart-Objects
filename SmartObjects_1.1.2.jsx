
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

function rectShapePathExpression() {
    /*
    // Define shape type
    var control = effect("Smart Shape Control");
    var shapeMenu = control("Shape Type").value;
    if (shapeMenu!=1){
        value;
    }else{
    // Get the calculated width and height, and roundness
    var sizeCalculated = control("Calculated Size").value;
    var boundingBox = control("Bounding Box Size").value;
    var roundness = control("Roundness").value;
    
    // Get half dimensions
    var halfWidth = sizeCalculated[0] / 2;
    var halfHeight = sizeCalculated[1] / 2;
    
    // Padding
    var uniformPadding = control("Uniform Padding").value;
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = uniformPadding ? paddingWidth : control("Padding Height").value;
    
    //Limit Padding
    var boundingBoxSize = control("Bounding Box Size");
    var paddingWidth = Math.max(paddingWidth,-boundingBoxSize[0]/2);
    var paddingHeight = Math.max(paddingHeight,-boundingBoxSize[1]/2);
    
    // Anchor controls
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
    
    // Calculate the anchor offset in pixels
    var anchorOffsetX = anchorPctX * (sizeCalculated[0] - paddingWidth * 2) / 2; 
    var anchorOffsetY = anchorPctY * (sizeCalculated[1] - paddingHeight * 2) / 2;
    
    // Get roundness percentage for each corner (-100 to 100)
    var roundPct_TL = control("Top Left %").value;
    var roundPct_TR = control("Top Right %").value;
    var roundPct_BR = control("Bottom Right %").value;
    var roundPct_BL = control("Bottom Left %").value;
    
    // Calculate maximum possible radius based on half dimensions
    var maxPossibleRadius = Math.min(halfWidth, halfHeight);
    
    // Function to calculate radius and handle length for each corner
    function calcCornerParams(roundPct, roundness, maxRadius) {
        // Ensure roundness doesn't exceed the maximum possible radius
        var effectiveRoundness = Math.min(roundness, maxRadius);
        // Radius is always positive
        var r = (Math.abs(roundPct) / 100) * effectiveRoundness;
        var handleLength = r * 0.55228475;
        // Sign is determined by the rounding percentage
        var sign = Math.sign(roundPct);
        if (sign === 0) sign = 1; // Default to 1 if percentage is zero
        return { radius: r, handle: handleLength, sign: sign };
    }
    
    // Calculate parameters for each corner
    var TL = calcCornerParams(roundPct_TL, roundness, maxPossibleRadius);
    var TR = calcCornerParams(roundPct_TR, roundness, maxPossibleRadius);
    var BR = calcCornerParams(roundPct_BR, roundness, maxPossibleRadius);
    var BL = calcCornerParams(roundPct_BL, roundness, maxPossibleRadius);
    
    // Adjusted corner positions based on anchor offsets
    var c_TL = [-halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_TR = [halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_BR = [halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
    var c_BL = [-halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
    
    // Calculate points where arcs meet edges
    var p1_TL = [c_TL[0], c_TL[1] + TL.radius];
    var p2_TL = [c_TL[0] + TL.radius, c_TL[1]];
    
    var p3_TR = [c_TR[0] - TR.radius, c_TR[1]];
    var p4_TR = [c_TR[0], c_TR[1] + TR.radius];
    
    var p5_BR = [c_BR[0], c_BR[1] - BR.radius];
    var p6_BR = [c_BR[0] - BR.radius, c_BR[1]];
    
    var p7_BL = [c_BL[0] + BL.radius, c_BL[1]];
    var p8_BL = [c_BL[0], c_BL[1] - BL.radius];
    
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
    
    // Helper function to create tangents
    function adjustHandle(handleVec, sign) {
        if (sign >= 0) {
            // Positive sign: use the handle vector as is
            return handleVec;
        } else {
            // Negative sign: rotate the handle vector by -90 degrees (clockwise)
            return [handleVec[1], -handleVec[0]];
        }
    }
    
    // For each vertex, define tangents
    var p1_TL_In = [0, 0];
    var p1_TL_Out = adjustHandle([TL.handle, 0], -TL.sign);
    
    var p2_TL_In = adjustHandle([-TL.handle, 0], TL.sign);
    var p2_TL_Out = [0, 0];
    
    var p3_TR_In = [0, 0];
    var p3_TR_Out = adjustHandle([0, TR.handle], -TR.sign);
    
    var p4_TR_In = adjustHandle([0, -TR.handle], TR.sign);
    var p4_TR_Out = [0, 0];
    
    var p5_BR_In = [0, 0];
    var p5_BR_Out = adjustHandle([-BR.handle, 0], -BR.sign);
    
    var p6_BR_In = adjustHandle([BR.handle, 0], BR.sign);
    var p6_BR_Out = [0, 0];
    
    var p7_BL_In = [0, 0];
    var p7_BL_Out = adjustHandle([0, -BL.handle], -BL.sign);
    
    var p8_BL_In = adjustHandle([0, BL.handle], BL.sign);
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
    
    // Close the path
    var closed = true;
    
    // Create the shape path
    createPath(vertices, inTangents, outTangents, closed);
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
    
    // Padding
    var uniformPadding = control("Uniform Padding").value;
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = uniformPadding ? paddingWidth : control("Padding Height").value;
    
    var boundingBoxSize = control("Bounding Box Size");
    
    var paddingWidth = Math.max(paddingWidth,-boundingBoxSize[0]/2);
    var paddingHeight = Math.max(paddingHeight,-boundingBoxSize[1]/2);
    
    // Calculate adjusted dimensions considering padding
    var adjustedWidth = sizeCalculated[0] - paddingWidth * 2;
    var adjustedHeight = sizeCalculated[1] - paddingHeight * 2;
    
    // Calculate anchor offsets
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
    var anchorOffsetX = anchorPctX * adjustedWidth / 2;
    var anchorOffsetY = anchorPctY * adjustedHeight / 2;
    
    // Define the center of the ellipse
    var center = [-anchorOffsetX, -anchorOffsetY];
    
    // Calculate the radii for the ellipse
    var radiusX = adjustedWidth / 2;
    var radiusY = adjustedHeight / 2;
    
    // Bezier handle lengths for ellipse approximation
    var c = 0.5522847498;
    var handleX = (radiusX + paddingWidth) * c;
    var handleY = (radiusY + paddingHeight) * c;
    
    // Define the four key points of the ellipse
    var top = [center[0], center[1] - radiusY - paddingHeight];
    var right = [center[0] + radiusX + paddingWidth, center[1]];
    var bottom = [center[0], center[1] + radiusY + paddingHeight];
    var left = [center[0] - radiusX - paddingWidth, center[1]];
    
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
        var size = control("Bounding Box Size")
    
        // Get half dimensions
        var halfWidth = size[0] / 2;
        var halfHeight = size[1] / 2;
    
        // Padding
        var uniformPadding = control("Uniform Padding").value;
        if (!uniformPadding) {
            var paddingWidth = control("Padding Width").value;
            var paddingHeight = control("Padding Height").value;
        }else{
            var paddingWidth = control("Padding Width").value;
            var paddingHeight = control("Padding Width").value;
        }
        var paddingWidth = Math.max(0,paddingWidth);
        var paddingHeight = Math.max(0,paddingHeight);
    
        // Anchor controls
        var anchorPctX = control("Align X Anchor %").value / 100;
        var anchorPctY = control("Align Y Anchor %").value / 100;
    
        // Calculate the anchor offset in pixels
        var anchorOffsetX = anchorPctX * size[0] / 2 - anchorPctX * paddingWidth;
        var anchorOffsetY = anchorPctY * size[1] / 2 - anchorPctY * paddingHeight;
    
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
    
        // Close the path
        var closed = true;
    
        // Create the shape path
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
        var size = control("Inner Path Size")
        var boundingBox = control("Bounding Box Size").value;
    
        // Get half dimensions
        var halfWidth = size[0] / 2;
        var halfHeight = size[1] / 2;
    
        // Padding
        var uniformPadding = control("Uniform Padding").value;
        if (!uniformPadding) {
            var paddingWidth = control("Padding Width").value;
            var paddingHeight = control("Padding Height").value;
        }else{
            var paddingWidth = control("Padding Width").value;
            var paddingHeight = control("Padding Width").value;
        }
        var maxNegativePadding = [boundingBox[0] , boundingBox[1]]
        var paddingWidth = Math.max(-maxNegativePadding[0]/2,paddingWidth);
        var paddingHeight = Math.max(-maxNegativePadding[1]/2,paddingHeight);
        
        // Anchor controls
        var anchorPctX = control("Align X Anchor %").value / 100;
        var anchorPctY = control("Align Y Anchor %").value / 100;
        
        if (paddingWidth<0){
            var padOffsetX = - anchorPctX * paddingWidth;
        }else{
            var padOffsetX = 0
        }
        if (paddingHeight<0){
            var padOffsetY = - anchorPctY * paddingHeight;
        }else{
            var padOffsetY = 0
        }
    
        // Calculate the anchor offset in pixels
        var anchorOffsetX = anchorPctX * size[0] / 2 + padOffsetX;
        var anchorOffsetY = anchorPctY * size[1] / 2 + padOffsetY;
    
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
    
        // Close the path
        var closed = true;
    
        // Create the shape path
        createPath(vertices, inTangents, outTangents, closed);
    }
    */
    }
    
    function anchorPointPathExpression() {
    /*
    var control = effect("Smart Shape Control");
    var drawGuides = control("Draw Guides").value;
    
    if (!drawGuides) {
        value;
    } else {
    // Retrieve parameters
    var innerPathSize = control("Inner Path Size").value;
    var boundingBoxSize = control("Bounding Box Size").value;
    
    // Calculate minimum padding values
    var minPaddingWidth = -boundingBoxSize[0] / 2;
    var minPaddingHeight = -boundingBoxSize[1] / 2;
    
    // Determine padding values, ensuring they are not less than the minimum
    var paddingWidth = Math.max(minPaddingWidth, control("Padding Width").value);
    var paddingHeight = Math.max(minPaddingHeight, control("Padding Height").value);
    
    // Calculate anchor alignment percentages
    var alignXPercent = control("Align X Anchor %").value / 100;
    var alignYPercent = control("Align Y Anchor %").value / 100;
    
    // Compute the anchor position relative to the center
    var anchorPosition = [
        alignXPercent * paddingWidth,
        alignYPercent * paddingHeight
    ];
    
    // Base size off
    var minBounds = Math.min(boundingBoxSize[0],boundingBoxSize[1]);
    
    // Cross parameters
    var radius = Math.max(minBounds/25,5); 
    var armWidth = radius/1.7; // Width of the cross arms
    var armLength = radius * 2; // Length of the cross arms
    
    var halfArmWidth = armWidth / 2;
    var halfArmLength = armLength / 2;
    
    var x = anchorPosition[0];
    var y = anchorPosition[1];
    
    //Limit drawing
    var boundsLeft = -boundingBoxSize[0]/2
    var boundsRight = boundingBoxSize[0]/2
    var boundsTop = -boundingBoxSize[1]/2
    var boundsBottom = boundingBoxSize[1]/2
    
    var pseudoAnchorPosX = boundingBoxSize[0]/2*alignXPercent;
    var pseudoAnchorPosY = boundingBoxSize[1]/2*alignYPercent;
    
    var pushXRadiusLeft = Math.max(boundsLeft + radius - pseudoAnchorPosX,0);
    var pushXWidthLeft = Math.max(boundsLeft + armWidth/2 - pseudoAnchorPosX,0);
    var pushXRadiusRight = Math.max(pseudoAnchorPosX - boundsRight + radius,0);
    var pushXWidthRight = Math.max(pseudoAnchorPosX - boundsRight + armWidth/2,0);
    
    var pushYRadiusTop = Math.max(boundsTop + radius - pseudoAnchorPosY,0);
    var pushYWidthTop = Math.max(boundsTop + armWidth/2 - pseudoAnchorPosY,0);
    var pushYRadiusBottom = Math.max(pseudoAnchorPosY - boundsBottom + radius,0);
    var pushYWidthBottom = Math.max(pseudoAnchorPosY - boundsBottom + armWidth/2,0);
    
    // Define the cross's vertices
    var vertices = [
        [x - halfArmWidth + pushXWidthLeft, y - halfArmLength + pushYRadiusTop], // Top-left corner of vertical arm
        [x + halfArmWidth - pushXWidthRight, y - halfArmLength + pushYRadiusTop], // Top-right corner of vertical arm
        [x + halfArmWidth - pushXWidthRight, y - halfArmWidth + pushYWidthTop],  // Transition to horizontal arm
        [x + halfArmLength - pushXRadiusRight, y - halfArmWidth + pushYWidthTop], // Rightmost point of horizontal arm (top side)
        [x + halfArmLength - pushXRadiusRight, y + halfArmWidth - pushYWidthBottom], // Bottom side of horizontal arm
        [x + halfArmWidth - pushXWidthRight, y + halfArmWidth - pushYWidthBottom],  // Transition back to vertical arm
        [x + halfArmWidth - pushXWidthRight, y + halfArmLength - pushYRadiusBottom], // Bottom-right corner of vertical arm
        [x - halfArmWidth + pushXWidthLeft, y + halfArmLength - pushYRadiusBottom], // Bottom-left corner of vertical arm
        [x - halfArmWidth + pushXWidthLeft, y + halfArmWidth - pushYWidthBottom],  // Transition to horizontal arm
        [x - halfArmLength + pushXRadiusLeft, y + halfArmWidth - pushYWidthBottom], // Leftmost point of horizontal arm (bottom side)
        [x - halfArmLength + pushXRadiusLeft, y - halfArmWidth + pushYWidthTop], // Top side of horizontal arm
        [x - halfArmWidth + pushXWidthLeft, y - halfArmWidth + pushYWidthTop]   // Close the path
    ];
    
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
    // Expression to calculate widthCalculated
    var control = effect("Smart Shape Control");
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = control("Padding Height").value;
    var uniformPadding = control("Uniform Padding").value;
    
    if (uniformPadding == 1) {
        paddingHeight = paddingWidth;
    }
    
    var targetLayer = control("Get size of Layer");
    var uniformScale = control("Uniform Scale").value;
    var uniformSize = control("Uniform Size").value;
    var widthValue = control('Width').value;
    var heightValue = control('Height').value;
    var widthPercentage = control('Width %').value;
    var heightPercentage = control('Height %').value;
     
    // Get size and scale values
    var sizeValue
    var scalePercentage = [widthPercentage, heightPercentage];
    if (targetLayer == null || targetLayer.index == thisLayer.index) {
        sizeValue = [widthValue, heightValue];
    } else {
        var layer = thisComp.layer(targetLayer.index);
        var layerWidth = layer.sourceRectAtTime(time).width;
        var layerHeight = layer.sourceRectAtTime(time).height;
        var layerScale = layer.transform.scale.value/100;
        sizeValue = [layerWidth*layerScale[0], layerHeight*layerScale[1]];
    }
     
    // Determine sizes
    var sizeX = (uniformSize == 1) ? sizeValue[0] : sizeValue[0];
    var sizeY = (uniformSize == 1) ? sizeValue[0] : sizeValue[1];
     
    // Determine scales
    var scaleX = (uniformScale == 1) ? scalePercentage[0] : scalePercentage[0];
    var scaleY = (uniformScale == 1) ? scalePercentage[0] : scalePercentage[1];
     
    // Apply scales to sizes
    var sizeXScaled = (sizeX + paddingWidth * 2) * (scaleX / 100);
    var sizeYScaled = (sizeY + paddingHeight * 2)* (scaleY / 100);
     
    // Limit negative padding
    var maxNegativePadding = sizeXScaled / 2;
    if (paddingWidth < 0) {
        paddingWidth = Math.max(paddingWidth, -maxNegativePadding);
    }
    var maxNegativePadding = sizeYScaled / 2;
    if (paddingHeight < 0) {
        paddingHeight = Math.max(paddingHeight, -maxNegativePadding);
    }
    
    // Calculate calculated dimension
    var widthCalculated = sizeXScaled * (scaleX / 100); ;
    var heightCalculated = sizeYScaled * (scaleY / 100); ;
    
    // Ensure calculated dimension is not negative
    widthCalculated = Math.max(0, widthCalculated);
    heightCalculated = Math.max(0, heightCalculated);
    
    [widthCalculated,heightCalculated];
    */
    
    }
    
    function boundBoxSizeExpression() {
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
    
    if (!anchorFixed) {
        var targetLayer = control("Get size of Layer");
        if (targetLayer == null || targetLayer.index == thisLayer.index) {
            var width = control("Width").value;
            var height = control("Height").value;
        } else {
            var layer = thisComp.layer(targetLayer.index);
            var width = layer.sourceRectAtTime(time).width;
            var height = layer.sourceRectAtTime(time).height;
        }
    
        var anchorPctX = control("Align X Anchor %").value / 100;
        var anchorPctY = control("Align Y Anchor %").value / 100;
        var xOffset = (width * anchorPctX) / 2;
        var yOffset = (height * anchorPctY) / 2;
    
        [xOffset,yOffset]
    }else{
        [0,0]
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
    function convertToSmartShape() {
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
    
            Logging.logMessage("Processing layer: " + layer.name);
    
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
                targetLayer: layer
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
    
        // Apply the .ffx preset
        // Note: If you want to avoid using external files, you need to recreate the effect controls programmatically
        var existingEffect = shapeLayer.effect("Smart Shape Control");
        if (existingEffect) {
            Logging.logMessage("'Smart Shape Control' effect already exists on " + shapeLayer.name + ". Removing it.");
            existingEffect.remove();
        }
    
        // Apply the .ffx preset (requires the .ffx file)
        var scriptFolder = new File($.fileName).parent;
        var ffxFile = new File(scriptFolder.fsName + "/FFX/SmartShapeControl_V04.ffx");
    
        if (ffxFile.exists) {
            Logging.logMessage("Applying preset: " + ffxFile.fsName);
            shapeLayer.applyPreset(ffxFile);
            Logging.logMessage("Preset applied successfully to " + shapeLayer.name);
        } else {
            Logging.logMessage("Preset file not found: " + ffxFile.fsName);
            return null;
        }
    
        // Verify if the effect exists
        var smartShapeControl = shapeLayer.effect('Smart Shape Control');
        if (!smartShapeControl) {
            Logging.logMessage("Error: 'Smart Shape Control' effect not found on the shape layer.",true);
            return null;
        } else {
            Logging.logMessage("'Smart Shape Control' effect found on " + shapeLayer.name);
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
            Logging.logMessage("Failed to set smart properties on the shape layer: " + e.toString());
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

function anchorPointExpression() {
/*
var control =  effect("Smart Text Control")
var boundingBoxSize = control("Bounding Box Size").value;
var anchorPctX = control("Align X Anchor %")/100;
var anchorPctY = control("Align Y Anchor %")/100;
var boundBoxAnchor = control("Bounding Box Anchor").value;
var leftTopValues = control("Left & Top Values").value;
if (boundBoxAnchor==0){
value;
}else{
var x = (boundingBoxSize[0] / 2) * anchorPctX + leftTopValues[0] + (boundingBoxSize[0] / 2);
var y = (boundingBoxSize[1] / 2) * anchorPctY + leftTopValues[1] + (boundingBoxSize[1] / 2);
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
            applySmartTextPreset(layer);
        }
    }

    function addSmartProperties(textLayer) {
        // Path to the FFX file
        var scriptFolder = new File($.fileName).parent;
        var ffxFile = new File(scriptFolder.fsName + "/FFX/SmartTextControl_V01.ffx");

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
                ShapeFunctions.convertToSmartShape();
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
