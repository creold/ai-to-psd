// Ai2Psd.jsx for Adobe Illustrator
// Description: This script may help to prepare vector paths to export from AI to PSD file. 
//              After usage of the script you should export the file manually via File > Export (.psd)
// More info: https://medium.com/@creold/how-to-export-a-illustrator-file-into-a-vector-layered-photoshop-file-2dcc274abf66
// Requirements: Adobe Illustrator CS6 and above
// Date: October, 2019
// Author: Sergey Osokin, email: hi@sergosokin.ru
// Thanks to Radmir Kashaev, https://github.com/rkashaev for help in creating version 1.0
//           Alexander Ladygin (http://ladygin.pro) for help in creating version 2.3
// ============================================================================
// Versions:
// 1.0 Initial version
// 1.1 After start the script unlocks visible layers & objects
// 1.2 Fixed a performance issue
// 1.3 Fixed a Overprint issue
// 2.0 The script doesn't need to load the helper Action file
// 2.1 Fixed unlock and order of objects issue
// 2.2 Added timer & progress bar
// 2.3 Minor issues fixed
// ============================================================================
// Donate (optional): If you find this script helpful and want to support me 
// by shouting me a cup of coffee, you can by via PayPal http://www.paypal.me/osokin/usd
// ============================================================================
// NOTICE:
// Tested with Adobe Illustrator CS6 (Win), CC 2017, 2018 (Mac).
// This script is provided "as is" without warranty of any kind.
// Free to use, not for sale.
// ============================================================================
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
// ============================================================================
// Check other author's scripts: https://github.com/creold

#target illustrator
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

// Global variables
var scriptName = 'Ai2Psd',
    scriptVersion = '2.3';
var GRADIENT = "GradientColor";
var PATTERN = "PatternColor";

// Generate Action
var setName = 'Ai2Psd',
    actionName = 'Make-CompShape',
    actionPath = Folder.temp;
var actionStr =  [
    '/version 3',
    '/name [' + setName.length,
        ascii2Hex(setName),
    ']',
    '/isOpen 1',
    '/actionCount 1',
    '/action-1 {',
        '/name [' + actionName.length,
            ascii2Hex(actionName),
        ']',
        '/keyIndex 0',
        '/colorIndex 0',
        '/isOpen 1',
        '/eventCount 1',
        '/event-1 {',
            '/useRulersIn1stQuadrant 0',
            '/internalName (ai_make_compound_shape)',
            '/localizedName [ 19',
            '    4d616b6520436f6d706f756e64205368617065',
            ']',
            '/isOpen 0',
            '/isOn 1',
            '/hasDialog 0',
            '/parameterCount 1',
            '/parameter-1 {',
                '/key 1835101029',
                '/showInPalette 4294967295',
                '/type (integer)',
                '/value 0',
            '}',
        '}',
    '}'].join('\n');

function start() {
    var aiVers = parseFloat(app.version.substr(0, 2)) >= 16;
    if (!aiVers) {
        alert('Sorry, the Ai2Psd script only works in versions CS6 (v.16) and above.');
        return;
    }

    createAction(actionStr, setName);
    deselect();

    // Unlock all visible layers and included objects
    var layers = activeDocument.layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].visible) {
            layers[i].locked = false;
            var items = layers[i].pageItems;
            for (var j = 0; j < items.length; j++) {
                if (!items[j].hidden) {
                    items[j].locked = false;
                }
            }
        }
    }

    limitGroupDepth(3);

    var allPaths = activeDocument.pathItems;
    var numPaths = activeDocument.pathItems.length;
    var progressCount = 1;
    // Create progress bar
    var win = new Window('palette', 'ProgressBar', [150, 150, 600, 260]);
    win.pnl = win.add('panel', [10, 10, 440, 100], scriptName + ' Script Progress');
    win.pnl.progBar = win.pnl.add('progressbar', [20, 35, 410, 60], 0, 100);
    win.pnl.progBarLabel = win.pnl.add('statictext', [20, 20, 320, 35], '0%');
    win.show();
    $.hiresTimer; //Start script timer
        
    for (var i = 0; i < allPaths.length;) {
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
                app.doScript(actionName, setName);
                // since PathItem become CompoundShape, allPaths will be reduced
            } else {
            // path didtn' match the condition, so we do group on it
                i++;
                cp = getItemForGroup(cp);
                if (!checkPType(cp, "GroupItem")) {
                    var group = cp.layer.groupItems.add();
                    group.move(cp, ElementPlacement.PLACEBEFORE);
                    cp.move(group, ElementPlacement.PLACEATEND);
                }               
            }
        } catch (err) {
            i++;
        }
        deselect();
        app.redraw();

        win.pnl.progBar.value = parseInt( (progressCount/numPaths)*100 );
        win.pnl.progBarLabel.text = win.pnl.progBar.value + '%';
        win.update();
        progressCount++;
    }

    var time = $.hiresTimer/1000000; // End script timer
    app.unloadAction(setName, '');
    win.pnl.progBar.value = 100;
    win.pnl.progBarLabel.text = win.pnl.progBar.value + '%';
    win.update();
    win.close();
    alert('Done. Prepared in ' + time.toFixed(1) + ' seconds.\n' 
        + 'Export PSD: File \u2192 Export \u2192 Export as...\n' 
        + 'Options: Write Layers, turn on all checkbox');
}

function deselect() {
    activeDocument.selection = null;
}

// Load Action to Adobe Illustrator
function createAction(str, set) {
    var f = new File('' + actionPath + '/' + set + '.aia');
    f.open('w');
    f.write(str);
    f.close();
    app.loadAction(f);
    f.remove();
}

function ascii2Hex(hex) {
    return hex.replace(/./g, function (a) { return a.charCodeAt(0).toString(16) });
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

function moveGroupItems(items, placement) {
    var i = items.length,
        groups = [];
    if (i > 0) {
        while (i--) {
            if (items[i].typename === 'GroupItem') groups.push(items[i]);
            items[i].moveAfter(placement);
        }
        if (!placement.pageItems.length) placement.remove();
    }
    return groups;
}

function groupNormalize(groups, max, counter, placement) {
    var i = groups.length;
    counter = (counter || 0) + 1;
    if (i > 0) {
        while (i--) {
            if (counter > max) {
                try {
                    placement = groups[i];
                } catch (err) {}
                try {
                    moveGroupItems(groups[i].pageItems, placement);
                } catch (err) {}
                groupNormalize(groups, max, counter - 1, placement);
            } else {
                groupNormalize(groups[i].groupItems, max, counter, placement);
            }
        }
    }
}

function limitGroupDepth(depth) {
    depth = (isNaN(parseInt(depth)) ? 5 : parseInt(depth)) + 1;
    for (var j = 0; j < activeDocument.layers.length; j++) {
        groupNormalize(activeDocument.layers[j].groupItems, depth);
    }
}

// Run script
try {
    start();
} catch (err) {
    // alert(err.message, 'Script Alert', true);
}