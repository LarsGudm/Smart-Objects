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
