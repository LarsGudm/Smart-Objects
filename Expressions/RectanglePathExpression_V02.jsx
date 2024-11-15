// expressions/customShapeExpression.jsx

function rectShapePathExpression() {
/*
// Get the calculated width and height, and roundness
var control = effect("Smart Shape Control");
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
var showGuide = control("Draw Guides").value;
if (!showGuide) {
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
	
	// Offset
	var padOffsetX = anchorPctX * paddingWidth;
	var padOffsetY = anchorPctY * paddingHeight;

    // The position of the anchor point relative to the center
    var anchorPos = [padOffsetX,padOffsetY];

    // Radius of the circle
    var radius = 5; // Adjust the radius as needed

    // Magic number for circle tangents
    var handle = radius * 0.55228475;

    // Define the vertices for a circle using four points
    var vertices = [
        [anchorPos[0], anchorPos[1] - radius], // Top
        [anchorPos[0] + radius, anchorPos[1]], // Right
        [anchorPos[0], anchorPos[1] + radius], // Bottom
        [anchorPos[0] - radius, anchorPos[1]]  // Left
    ];
    // Define the inTangents and outTangents for a smooth circle
    var inTangents = [
        [-handle, 0],
        [0, -handle],
        [handle, 0],
        [0, handle]
    ];
    var outTangents = [
        [handle, 0],
        [0, handle],
        [-handle, 0],
        [0, -handle]
    ];
    createPath(vertices, inTangents, outTangents, true);
}
*/
}    
function rectShapeSizeCalculatedExpression() {
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

