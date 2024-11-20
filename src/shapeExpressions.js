// src/shapeExpressions.js
var ShapeExpressions = (function() {

function rectShapePathExpression() {
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
    
    // Get the 'roundness' value (in pixels)
    var roundness = control("Roundness").value;
        
    // Get dimensions after padding
    var uniformPadding = control("Uniform Padding").value;
    var paddingWidth = control("Padding Width").value;
    var paddingHeight = uniformPadding ? paddingWidth : control("Padding Height").value;
        
    // Limit Padding
    var boundingBoxSize = control("Bounding Box Size");
    paddingWidth = Math.max(paddingWidth, -boundingBoxSize[0]/2);
    paddingHeight = Math.max(paddingHeight, -boundingBoxSize[1]/2);
        
    // Adjusted width and height
    var width = sizeCalculated[0] - 2 * paddingWidth;
    var height = sizeCalculated[1] - 2 * paddingHeight;
    var halfWidth = width / 2;
    var halfHeight = height / 2;
        
    // Anchor controls
    var anchorPctX = control("Align X Anchor %").value / 100;
    var anchorPctY = control("Align Y Anchor %").value / 100;
        
    // Calculate the anchor offset in pixels
    var anchorOffsetX = anchorPctX * width / 2; 
    var anchorOffsetY = anchorPctY * height / 2;
        
    // Get roundness percentage for each corner (0 to 100)
    var roundPct_TL = Math.max(control("Top Left %").value, 0);
    var roundPct_TR = Math.max(control("Top Right %").value, 0);
    var roundPct_BR = Math.max(control("Bottom Right %").value, 0);
    var roundPct_BL = Math.max(control("Bottom Left %").value, 0);
        
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
	var k = 0.55228475; //Kappa
    var handle_TL = radius_TL * k;
    var handle_TR = radius_TR * k;
    var handle_BR = radius_BR * k;
    var handle_BL = radius_BL * k;
        
    // Adjusted corner positions based on anchor offsets
    var c_TL = [-halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_TR = [halfWidth - anchorOffsetX, -halfHeight - anchorOffsetY];
    var c_BR = [halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
    var c_BL = [-halfWidth - anchorOffsetX, halfHeight - anchorOffsetY];
        
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