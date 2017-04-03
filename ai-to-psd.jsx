/*****************************************************************************************
* Ai-to-Psd.jsx for Adobe Illustrator
*
* This script may help to prepare vector layers to export from AI to PSD file. 
* After usage of the script you should export the file manually via File > Export (.psd)
*
* Authors:
* Serg Osokin, graphic designer 
* http://sergosokin.ru
* Radmir Kashaev, software developer
*
* NOTICE:
* Tested with Adobe Illustrator CS6, CC (Win/Mac).
* This script is provided "as is" without warranty of any kind.
* Released under the MIT license.
* http://opensource.org/licenses/mit-license.php
* 
* Copyright (C) 2017 Serg Osokin & Radmir Kashaev, All Rights Reserved.
*
* Versions:
*  1.0 Initial version
*  1.1 After start the script unlocks visible layers & objects
*  1.2 Fixed a performance issue
*
******************************************************************************************/

var GRADIENT = "GradientColor";
var PATTERN = "PatternColor";

function start() {
    if (documents.length == 0) return;

    var layers = activeDocument.layers;
    // unlock all visible layers
    for (var i = 0; i < layers.length; i++) {
       if (layers[i].visible) {
          layers[i].locked = false;
       }
    }

    var allPaths = activeDocument.pathItems;    

    // unclok all visible objects  
    for (var i = 0; i < allPaths.length; i++){
        var pi = allPaths[i];
        if (pi.layer.visible && pi.visible) {
            pi.locked = false;
        }
    }

    deselect();
        
    for (var i = 0; i < allPaths.length; ) {
        var cp = allPaths[i];
        try {
            var fillType = cp.fillColor.typename;
            if (cp.closed && cp.filled  && 
              !(cp.stroked || fillType == PATTERN || fillType == GRADIENT)) {
                cp.selected = true;
                app.doScript('Make-CompShape', 'Ai-to-Psd');
                // since PathItem become CompoundShape, allPaths will be reduced
            } else {
            // path didtn' match the condition, so we do group on it
                i++;
                cp = getItemForGroup(cp);
                if (!checkPType(cp, "GroupItem")) {
                    var group = cp.layer.groupItems.add();
                    cp.move(group, ElementPlacement.PLACEATBEGINNING);
                }               
            }
        } catch (err) {
            i++;
        }
        deselect();
        app.redraw();
    }
    alert("Done. Check your document before export to PSD");
}

function deselect() {
    activeDocument.selection = null;
}

function getItemForGroup(pathItem) {
    if (checkPType(pathItem, "CompoundPathItem")) {
        return pathItem.parent;
    }
    return pathItem;
}

function checkPType(item, type) {
    return item != null && item.parent.typename === type;
}

start();