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
        paddingHeight = paddingWidth;
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