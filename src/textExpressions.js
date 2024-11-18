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