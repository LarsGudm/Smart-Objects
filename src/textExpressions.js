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
var control = effect("Smart Text Control");
var useParagraph = control("Use Paragraph Input").value;
var paragraphOption = [false, true];
var rectWidth = thisLayer.sourceRectAtTime(time, paragraphOption[useParagraph]).width;
var rectHeight = thisLayer.sourceRectAtTime(time, paragraphOption[useParagraph]).height;
[rectWidth, rectHeight];
*/
}

function leftTopValuesExpression() {
/*
var control = effect("Smart Text Control");
var useParagraph = control("Use Paragraph Input").value;
var paragraphOption = [false, true];
var rectLeft = thisLayer.sourceRectAtTime(time, paragraphOption[useParagraph]).left;
var rectTop = thisLayer.sourceRectAtTime(time, paragraphOption[useParagraph]).top;
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