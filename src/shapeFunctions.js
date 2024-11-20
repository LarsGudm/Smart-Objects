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
