/*****************************************************************************************
* Ai-to-Psd.jsx for Adobe Illustrator CS6 and above
*
* This script may help to prepare vector layers to export from AI to PSD file. 
* After usage of the script you should export the file manually via File > Export (.psd)
*
* NOTICE:
* Tested with Adobe Illustrator CS6 (Win), CC 2017 (Mac).
* This script is provided "as is" without warranty of any kind.
* Free to use, not for sale.
*
* Released under the MIT license.
* http://opensource.org/licenses/mit-license.php
* 
* Copyright (C) 2017 Serg Osokin & Radmir Kashaev, All Rights Reserved.
* http://sergosokin.ru
* https://github.com/rkashaev
*
* Versions:
*  1.0 Initial version
*  1.1 After start the script unlocks visible layers & objects
*  1.2 Fixed a performance issue
*  1.3 Fixed a Overprint issue
*  2.0 The script doesn't need to load the helper Action file.
*
******************************************************************************************/

#target illustrator

var GRADIENT = "GradientColor";
var PATTERN = "PatternColor";
var actionPath = Folder.myDocuments;
var actionStr =  
    '''
    /version 3
    /name [ 9
        41692d746f2d507364
    ]
    /isOpen 1
    /actionCount 1
    /action-1 {
        /name [ 14
            4d616b652d436f6d705368617065
        ]
        /keyIndex 0
        /colorIndex 0
        /isOpen 1
        /eventCount 1
        /event-1 {
            /useRulersIn1stQuadrant 0
            /internalName (ai_make_compound_shape)
            /localizedName [ 19
                4d616b6520436f6d706f756e64205368617065
            ]
            /isOpen 0
            /isOn 1
            /hasDialog 0
            /parameterCount 1
            /parameter-1 {
                /key 1835101029
                /showInPalette 4294967295
                /type (integer)
                /value 0
            }
        }
    }
    ''';

function start() {
    if (documents.length == 0) {
        alert('There are no documents open.');
        return;
    }
    if ((app.version.substr(0, 2) * 1) < 16) {
        alert('Sorry, the Ai-to-Psd script only works in versions CS6 (v16) and above.\n' + 'You are using Adobe Illustrator v' + app.version.substr(0, 2));
        return;
    }

    createAction(actionStr, 'Ai-to-Psd');

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
                if(cp.fillOverprint || cp.strokeOverprint) {
                  cp.fillOverprint = false;
                  cp.strokeOverprint = false;
                }
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
    app.unloadAction('Ai-to-Psd', '');
    alert('Done. Check your document\n' + 'Export PSD: File \u2192 Export \u2192 Export as...\n' + 'Options: Write Layers, turn on all checkbox');
}

function deselect() {
    activeDocument.selection = null;
}

function createAction(str, set) { 
    var f = new File(actionPath + "/" + set + '.aia'); 
    f.open('w'); 
    f.write(str); 
    f.close(); 
    app.loadAction(f); 
    f.remove(); 
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