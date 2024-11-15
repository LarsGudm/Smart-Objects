{
    // Global Variables
    var myScriptPal;
    var pickColorArea;
    var logField;
    var logWindow;
    var separateDimsCheckbox;
    var scriptFolderPath = new File($.fileName).parent.fsName;
    var settingsFilePath = scriptFolderPath + "/SmartShapesSettings.txt";

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
    };

    // Main Function to Initialize the Panel
    function smartShapesPanel(thisObj) {
            // Check if panel already exists
        if (app.smartShapesPanel && app.smartShapesPanel instanceof Window) {
            // Bring existing panel to front
            app.smartShapesPanel.center();
            app.smartShapesPanel.show();
            return;
        }
        
        var myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Smart Shapes v22", undefined);
        myPanel.orientation = "column";

        // Create UI Components
        createButtonGroup(myPanel);
        createColorPicker(myPanel);
        createSeparateDimsCheckbox(myPanel);
        createShowLogButton(myPanel);

        // Load Settings
        loadSettings();

        if (myPanel instanceof Window) {
            myPanel.onShow = function() {
                clearLog();
            };
            myPanel.center();
            myPanel.show();
        } else {
            myPanel.layout.layout(true);
        }
    }

    // Create the Button Group with "Create" and "Convert" Buttons
    function createButtonGroup(parent) {
        var mainGroup = parent.add("group");
        mainGroup.orientation = "column";

        var buttonGroup = mainGroup.add("group");
        buttonGroup.orientation = "row";

        var createShapeBtn = buttonGroup.add("button", undefined, "Create Smart Shape");
        createShapeBtn.onClick = function() {
            app.beginUndoGroup("Create Smart Shape");
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    logMessage("Please select a composition.");
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
        
                createSmartShape({
                    fillColor: getCurrentFillColor(), // Pass the current fill color
                    targetLayer: targetLayer,
                    createMatte: createMatte,
                });
            } catch (err) {
                logMessage("Error in Create Smart Shape: " + err.toString());
            } finally {
                app.endUndoGroup();
            }
        };        

        var convertBtn = buttonGroup.add("button", [0, 0, 28, 28], "C");
        convertBtn.onClick = function() {
            app.beginUndoGroup("Convert to Smart Shape");
            try {
                convertToSmartShape();
            } catch (err) {
                logMessage("Error in Convert Smart Shape: " + err.toString());
            } finally {
                app.endUndoGroup();
            }
        };

        var smartBackgroundButton = mainGroup.add("button", undefined, "Smart Background");
        smartBackgroundButton.graphics.foregroundColor = smartBackgroundButton.graphics.newPen(
            smartBackgroundButton.graphics.PenType.SOLID_COLOR,
            [0.5, 0.3, 0.2],
            1
        );

        smartBackgroundButton.onClick = function() {
            app.beginUndoGroup("Create Smart Background");
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    logMessage("Please select a composition.");
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
        
                var newBackgroundLayer = createSmartShape({
                    isBackground: true,
                    name: newBackgroundName,
                    label: 12,
                    fillColor: getCurrentFillColor()
                });
        
            } catch (err) {
                logMessage("Error in Smart Background button: " + err.toString());
            } finally {
                app.endUndoGroup();
            }
        };        
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
                    normalizeColors(pickColorArea.currentColor)
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
            if (!logWindow || !(logWindow instanceof Window)) {
                createLogWindow();
            }
            logWindow.show();
        };
    }

    // Save Settings to a File
    function saveSettings() {
        var settingsFile = new File(settingsFilePath);
        if (settingsFile.open('w')) {
            settingsFile.writeln("separateDimensions=" + separateDimsCheckbox.value);
            settingsFile.writeln("pickColor=" + pickColorArea.currentColor.toString());
            settingsFile.close();
        } else {
            logMessage("Failed to open settings file for writing.");
        }
    }

// Load Settings from a File
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
            normalizeColors(colorValues)
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
    

    // Create Log Window for Messages
    function createLogWindow() {
        if (!logWindow || !(logWindow instanceof Window)) {
            logWindow = new Window("palette", "Smart Shapes Log", undefined);
            logWindow.orientation = "column";

            logField = logWindow.add("edittext", undefined, "", {multiline: true, scrolling: true});
            logField.preferredSize = [400, 200];
        }
    }

    // Log Messages to the Log Window
    function logMessage(message) {
        if (!logWindow || !(logWindow instanceof Window)) {
            createLogWindow();
        }
        if (logField) {
            logField.text += message + "\n";
            if (!logWindow.visible) {
                logWindow.show();
            }
        } else {
            alert(message);
        }
    }

    // Clear the Log Window
    function clearLog() {
        if (logField) {
            logField.text = "";
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
    
//Color helper functions
function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}
    
function getCurrentFillColor() {
    if (isArray(pickColorArea.currentColor)) {
        var normalizedColor = normalizeColors(pickColorArea.currentColor);
        // Debug: Alert the normalized color values
        // logMessage("Normalized Color: " + normalizedColor);
        return normalizedColor;
    } else {
        return [1, 1, 1];
    }
}

function normalizeColors(colors) {
    var normalized = [];
    for (var i = 0; i < colors.length; i++) {
        normalized.push(colors[i] / 255);
    }
    return normalized;
}
    
    

// Unified Shape Creation Function
function createSmartShape(properties) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        logMessage("Please select a composition.");
        return;
    }

    // Merge properties with defaults
    var config = {};
    for (var key in defaultShapeConfig) {
        config[key] = defaultShapeConfig[key];
    }
    for (var key in properties) {
        if (properties[key] !== undefined) { // Only assign if the property is not undefined
            config[key] = properties[key];
        }
    }

    var shapeLayer;

    if (config.targetLayer && !config.createMatte) {
        // If converting an existing layer
        shapeLayer = config.targetLayer.duplicate();
        shapeLayer.moveBefore(config.targetLayer);
        shapeLayer.property("Transform").property("Anchor Point").setValue([0, 0]);
    } else {
        // Create a new shape layer
        shapeLayer = comp.layers.addShape();
        shapeLayer.property("Transform").property("Anchor Point").setValue([0, 0]);
    }    

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
        separateDimsCheckbox.value;
    logMessage("Set dimensionsSeparated to " + separateDimsCheckbox.value);

    var smartShapeControl = shapeLayer.effect('Smart Shape Control');
    
    // Set size values if not a background
    if (!config.isBackground) {
        smartShapeControl.property("Width").setValue(layerInfo.width);
        smartShapeControl.property("Height").setValue(layerInfo.height);
    } else {
        smartShapeControl.property("Width").expression =
            "thisComp.width + effect('Smart Shape Control')('Padding Width').value * 2;";
        smartShapeControl.property("Height").expression =
            "thisComp.height + effect('Smart Shape Control')('Padding Height').value * 2;";
        if (!separateDimsCheckbox){
            shapeLayer.property("Transform").property("Position").expression =
            "[thisComp.width/2, thisComp.height/2];";
        }else{
            shapeLayer.property("Transform").property("X Position").expression = "thisComp.width/2"
            shapeLayer.property("Transform").property("Y Position").expression = "thisComp.height/2"
        }

    };

    // Set Position
    if (config.isBackground) {
        shapeLayer.moveToEnd();
        shapeLayer.shy = true;
        shapeLayer.locked = true;
    } else {
        if (separateDimsCheckbox.value) {
            logMessage("Dimensions are separated. Setting X and Y Position individually.");
            shapeLayer.property("Transform").property("X Position").setValue(layerInfo.center[0]);
            shapeLayer.property("Transform").property("Y Position").setValue(layerInfo.center[1]);
        } else {
            logMessage("Dimensions are not separated. Setting Position.");
            shapeLayer.property("Transform").property("Position").setValue(layerInfo.center);
        }
    }

    // Handle mattes and layer stack
    if (config.targetLayer && config.createMatte) {        // Create a matte
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
        logMessage("Please select a composition.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        logMessage("Please select at least one shape layer.");
        return;
    }

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];

        if (!(layer instanceof ShapeLayer)) {
            logMessage("Skipping non-shape layer: " + layer.name);
            continue;
        }

        logMessage("Processing layer: " + layer.name);

        // Get layer dimensions and center
        var layerInfo = Utilities.getLayerDimensionsAndCenter(layer, comp);
        if (!layerInfo) {
            logMessage("Could not get dimensions for layer: " + layer.name);
            continue;
        }

        // Get fill color from original layer
        var fillColor = Utilities.findFirstFillColor(layer.property("Contents"));
        if (fillColor === null) {
            fillColor = getCurrentFillColor();
            logMessage("No fill color found, using color picker");
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
    function addSmartProperties(shapeLayer, properties, isBackground) {
        var scriptFolder = new File($.fileName).parent;
        var ffxFile = new File(scriptFolder.fsName + "/FFX/SmartShapeControl_V04.ffx");

        // Ensure the shapeLayer is the only selected layer
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            for (var i = 1; i <= comp.numLayers; i++) {
                comp.layer(i).selected = false;
            }
            shapeLayer.selected = true;
        }

        var existingEffect = shapeLayer.effect("Smart Shape Control");
        if (existingEffect) {
            logMessage("'Smart Shape Control' effect already exists on " + shapeLayer.name + ". Removing it.");
            existingEffect.remove();
        }

        // Apply the .ffx preset
        if (ffxFile.exists) {
            logMessage("Applying preset: " + ffxFile.fsName);
            shapeLayer.applyPreset(ffxFile);
            logMessage("Preset applied successfully to " + shapeLayer.name);
        } else {
            logMessage("Preset file not found: " + ffxFile.fsName);
            return null;
        }

        // Verify if the effect exists
        var smartShapeControl = shapeLayer.effect('Smart Shape Control');
        if (!smartShapeControl) {
            logMessage("Error: 'Smart Shape Control' effect not found on the shape layer.");
            return null;
        } else {
            logMessage("'Smart Shape Control' effect found on " + shapeLayer.name);
        }

        // Load External Expressions
        var expressionsFile = new File(scriptFolder.fsName + "/Expressions/rectanglePathExpression_V04.jsx");

        if (!expressionsFile.exists) {
            logMessage("Expression file not found: " + expressionsFile.fsName);
            return null;
        }

        // Load the expression functions
        $.evalFile(expressionsFile);

        // Extract the Expressions
        try {
            var rectShapeExprString = Utilities.extractExpression(rectShapePathExpression);
            var ellipseShapeExprString = Utilities.extractExpression(ellipseShapePathExpression);
            var boundPathExprString = Utilities.extractExpression(boundingBoxPathExpression);
            var innerPathExprString = Utilities.extractExpression(innerPathExpression);
            var anchorGuideExprString = Utilities.extractExpression(anchorPointPathExpression);

            var sizeCalcExprString = Utilities.extractExpression(rectShapeSizeCalculatedExpression);
            var groupPositionExprString = Utilities.extractExpression(groupPositionExpression);
            var boundBoxSizeExprString = Utilities.extractExpression(boundBoxSizeExpression);
            var innerPathSizeExprString = Utilities.extractExpression(innerPathSizeExpression);

        } catch (e) {
            logMessage("Error extracting expressions: " + e.toString());
            return null;
        }

        try {
            var smartShapeControl = shapeLayer.effect('Smart Shape Control');

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
            logMessage("Failed to set smart properties on the shape layer: " + e.toString());
            return null;
        }

        return shapeLayer;
    }

    // Utilities Object
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
            var funcStr = func.toString();
            var match = funcStr.match(/\/\*([\s\S]*?)\*\//);
            if (match && match[1]) {
                var expressionStr = match[1].replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace, trim method
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
        }
    };

    // Initialize the Panel
    smartShapesPanel(this);
}


/*
TO DO
- Adde polygon
- Hadde vært krem med fill farge kjøret. Et forsøk er nå dumpa inn på v19_X. Burde lage egen helt separat script for testing.  
*/