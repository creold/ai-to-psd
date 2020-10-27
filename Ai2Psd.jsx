/*
  Ai2Psd.jsx for Adobe Illustrator
  Description: This script may help to prepare vector paths to export from AI to PSD file. 
  More info: EN https://medium.com/@creold/how-to-export-a-illustrator-file-into-a-vector-layered-photoshop-file-2dcc274abf66
             RU https://sergosokin.ru/blog/export-vector-ai-to-psd/
  Requirements: Adobe Illustrator CS6 and later
  Date: February 2017 — September 2020
  Author: Sergey Osokin, email: hi@sergosokin.ru
  Thanks to Radmir Kashaev, https://github.com/rkashaev for help in creating version 1.0
            Alexander Ladygin (http://ladygin.pro) for help in creating version 2.3
  ============================================================================
  Versions:
  1.0 Initial version
  1.1 After start the script unlocks visible layers & objects
  1.2 Fixed a performance issue
  1.3 Fixed a Overprint issue
  2.0 The script doesn't need to load the helper Action file
  2.1 Fixed unlock and order of objects issue
  2.2 Added timer & progress bar
  2.3 Minor issues fixed
  3.0 Algorithm issues fixed. Added:
      * Saving custom path names;
      * Russian localization;
  ============================================================================
  Donate (optional): If you find this script helpful, you can buy me a coffee
                     via PayPal http://www.paypal.me/osokin/usd
                     via Yandex.Money https://money.yandex.ru/to/410011149615582
                     via QIWI https://qiwi.com/n/OSOKIN
  ============================================================================
  Released under the MIT license.
  http://opensource.org/licenses/mit-license.php
  ============================================================================
  Check other author's scripts: https://github.com/creold
*/

//@target illustrator
$.localize = true; // Enabling automatic localization

// Global variables
var SCRIPT_NAME = 'Ai2Psd',
    SCRIPT_VERSION = '3.0',
    SCRIPT_AUTHOR = '\u00A9 sergosokin.ru',
    AI_VER = parseInt(app.version),
    ACTION_SET = SCRIPT_NAME,
    ACTION_NAME = 'Make_Compound_Shape',
    ACTION_PATH = Folder.myDocuments + '/Adobe Scripts/',
    PERCENTAGE = '%',
    OVER_ITEMS = 15; // When the number of items >, full-screen mode is enabled;

// EN-RU localized messages
var LANG_ERR_DOC = { en: 'Error\nOpen a document and try again.',
                     ru: 'Ошибка\nОткройте документ и запустите скрипт.'},
    LANG_ERR_VER = { en: 'Error\nSorry, script only works in Illustrator CS6 and later.',
                     ru: 'Ошибка\nСкрипт работает в Illustrator CS6 и выше.'},
    LANG_WARN_OBJ = { en: 'Warning\nBitmaps and Graphs can cause errors when exporting them to PSD.',
                         ru: 'Предупреждение\nРастровые изображения и диаграммы могут вызвать ошибки при экспорте в PSD.'},
    LANG_CONFIRM_HIDE = { en: 'You can hide them to avoid this.',
                          ru: 'Вы можете скрыть их, чтобы избежать этого.'},
    LANG_CONFIRM_AGREE = { en: 'Do you still want to continue?',
                           ru: 'Хотите продолжить?'},
    LANG_STATUS_TITLE = { en: 'Preparing objects', ru: 'Подготовка объектов'},
    LANG_DONE = { en: "What's next\n"
                      + 'In Export dialog select destination folder and format: PSD.\n\n' 
                      + 'In Options: Write Layers and turn on all checkboxes.',
                  ru: "Что дальше\n"
                      + 'В диалоговом окне экспорта выберите папку и тип файла: PSD.\n\n' 
                      + 'В параметрах: Сохранить слои и включите все чекбоксы.'};

if (!Folder(ACTION_PATH).exists) { Folder(ACTION_PATH).create(); }

// Generate Action
var actionString =  [
    '/version 3',
    '/name [' + ACTION_SET.length + ' ' + ascii2Hex(ACTION_SET) + ']',
    '/isOpen 1',
    '/actionCount 1',
    '/action-1 {',
        '/name [' + ACTION_NAME.length + ' ' + ascii2Hex(ACTION_NAME) + ']',
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
    '}'].join('');

function main() {
  if (AI_VER < 16) {
    alert(LANG_ERR_VER);
    return;
  }
  
  if (app.documents.length == 0) {
    alert(LANG_ERR_DOC);
    return;
  } else {
    var doc = app.activeDocument,
        userScreen = doc.views[0].screenMode,
        itemsArray = [];
  }

  selection = null;

  // Search for the problematic object types
  var badItems = searchProblemObj(doc);
  if (badItems.length) {
    var isConfirm = confirm(LANG_WARN_OBJ + ' ' + LANG_CONFIRM_HIDE + '\n\n' + LANG_CONFIRM_AGREE);
    if (!isConfirm) {
      selection = badItems;
      return;
    }
  }

  unlockAll(doc);
  limitGroupDepth(doc.layers, 2);
  app.redraw();

  app.executeMenuCommand('selectall');
  getItems(selection, itemsArray);
  selection = null;

  if (itemsArray.length > OVER_ITEMS) { doc.views[0].screenMode = ScreenMode.FULLSCREEN; }

  createAction(actionString, ACTION_SET, ACTION_PATH);
  
  // Create progress bar
  var progMinValue = 0,
      progMaxValue = 100;
  var win = new Window('palette', SCRIPT_NAME + ' ' + SCRIPT_AUTHOR);
      win.opacity = .9;
  var progPnl = win.add('panel', undefined, LANG_STATUS_TITLE);
      progPnl.margins = [10, 20, 10, 10];
      win.alignChildren = ['fill','center'];
  var progBar = progPnl.add('progressbar', [20, 15, 300, 25], progMinValue, progMaxValue);
  var progLabel = progPnl.add('statictext', undefined, progMinValue + PERCENTAGE);
      progLabel.preferredSize.width = 35;

  win.center();
  win.show();

  // Start processing
  for (var i = 0; i < itemsArray.length; i++) {
    var currItem = itemsArray[i];
    if (currItem.typename === 'CompoundPathItem') {
      if (currItem.pathItems.length > 0) {
        currItem = currItem.pathItems[0];
      } else {
        // Trick for Compound path created from groups of paths
        currItem.pathItems.add();
        currItem = currItem.pathItems[0];
      }
    }
    removeOverprint(currItem);
    // Save original path name
    var oldName = transliterate(itemsArray[i].name);
    try {
      if (!isSpecialItem(currItem) && isSolidFill(currItem) && !currItem.stroked) {
        selection = currItem;
        
        // Convert to Compound Shape
        app.doScript(ACTION_NAME, ACTION_SET);
        
        // Restore the name after conversion
        if (!isEmpty(oldName)) { 
          // For fix Adobe Illustrator bug, when selection is lost after run action
          selection = null;
          selection = itemsArray[i];
          selection[0].name = oldName;
        }
        app.redraw();
      } else {
        // Skip text because it is editable in PSD
        if (currItem.typename === 'TextFrame') { continue; }
        if (currItem.parent.typename === 'CompoundPathItem') { 
          currItem = currItem.parent; 
        }
        // Path didn't match the condition, so we do group on it
        var safeGroup = currItem.layer.groupItems.add();
            safeGroup.move(currItem, ElementPlacement.PLACEBEFORE);
            currItem.move(safeGroup, ElementPlacement.PLACEATEND);
        // Restore the name after grouping
        if (!isEmpty(oldName)) { 
          safeGroup.name = oldName; 
        }
      }
    } catch (e) { 
      // showError(e);
    }

    // Update Progress bar
    progBar.value = parseInt((i / itemsArray.length) * 100);
    progLabel.text = progBar.value + PERCENTAGE;
    win.update();
  }
  
  // The final progress bar value
  progBar.value = progMaxValue;
  progLabel.text = progBar.value + PERCENTAGE;
  win.update();
  win.close();

  selection = null;
  app.redraw();

  app.unloadAction(ACTION_SET, '');
  doc.views[0].screenMode = userScreen;
  
  alert(LANG_DONE);
  // Open File > Export > Export As... dialog
  app.executeMenuCommand('export');
}

function ascii2Hex(hex) {
  return hex.replace(/./g, function(a) {
    return a.charCodeAt(0).toString(16)
  });
}

// Search bitmaps and graphs
function searchProblemObj(area) {
  var badItems = [];
  if (area.graphItems.length || area.rasterItems.length) {
    for (var i = 0; i < area.rasterItems.length; i++) {
      if (!area.rasterItems[i].hidden) {
        badItems.push(area.rasterItems[i]);
      }
    }
    for (var j = 0; j < area.graphItems.length; j++) {
      if (!area.graphItems[j].hidden) {
        badItems.push(area.graphItems[j]);
      }
    }
  }
  return badItems;
}

function getItems(area, arr) {
  for (var i = 0; i < area.length; i++) {
    var currItem = area[i];
    try {
      switch (currItem.typename) {
        case 'GroupItem':
          getItems(currItem.pageItems, arr);
          break;
        case 'PathItem':
          if (!currItem.clipping) { arr.push(currItem); }
          break;
        case 'CompoundPathItem':
          if (!currItem.pathItems[0].clipping) { arr.push(currItem); }
          break;
        default:
          if (!currItem.clipping) { arr.push(currItem); }
          break;
      }
    } catch (e) {
        // showError(e);
    }
  }
}

function getChildAll(arr) {
  var childsArr = [];
  for (var i = 0; i < arr.pageItems.length; i++) {
    childsArr.push(arr.pageItems[i]);
  }
  if (arr.layers) {
    for (var j = 0; j < arr.layers.length; j++) {
      childsArr.push(arr.layers[j]);
    }
  }
  return childsArr;
}

// Unlock all layers and included paths
function unlockAll(doc) {
  var childArr = getChildAll(doc);
  for (var i = 0; i < childArr.length; i++) {
    var currItem = childArr[i],
        currType = currItem.typename;
    try {
      currItem.locked = false;
      if (currType === 'GroupItem' || currType === 'Layer') {
        unlockAll(currItem);
      }
    } catch (e) {}
  }
}

// Ungroup array of target objects
function ungroupAll(item) {
  var childArr = getChildAll(item);

  if (childArr.length < 1) {
    item.remove();
    return;
  }

  for (var i = 0; i < childArr.length; i++) {
    var currItem = childArr[i];
    try {
      if (!item.clipped && currItem.parent.typename !== 'Layer') {
        currItem.move(item, ElementPlacement.PLACEBEFORE);
      }
      if (currItem.typename === 'GroupItem' || currItem.typename === 'Layer') {
        ungroupAll(currItem);
      }
    } catch (e) { }
  }
}

function createAction(str, set, path) {
  var f = new File('' + path + '/' + set + '.aia');
  f.open('w');
  f.write(str);
  f.close();
  app.loadAction(f);
  f.remove();
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
  var i = groups.length,
      counter = (counter || 0) + 1;
  if (i > 0) {
    while (i--) {
      if (counter > max) {
        try {
          var placement = groups[i];
        } catch (e) {}
        try {
          if (!groups[i].clipped) { 
            moveGroupItems(groups[i].pageItems, placement);
          } else {
            ungroupAll(groups[i]);
          }
        } catch (e) {}
        groupNormalize(groups, max, counter - 1, placement);
      } else {
        try { 
          groupNormalize(groups[i].groupItems, max, counter, placement);
        } catch (e) {
          // showError(e);
        }
      }
    }
  }
}

// If the group nesting limit is exceeded, the export will fail
function limitGroupDepth(_layers, depth) {
  depth = (isNaN(parseInt(depth)) ? 4 : parseInt(depth)) + 1;
  for (var i = 0; i < _layers.length; i++) {
    if (_layers[i].layers.length) {
      limitGroupDepth(_layers[i], depth);
    }
    groupNormalize(_layers[i].groupItems, depth);
  }
}

// Fix cyrillic name
function transliterate(name) {
  var newName = '',
      a = {};
  a["Ё"] = "YO"; a["Й"] = "I"; a["Ц"] = "TS"; a["У"] = "U"; a["К"] = "K"; a["Е"] = "E"; a["Н"] = "N"; a["Г"] = "G"; a["Ґ"] = "G"; a["Ш"] = "SH"; a["Щ"] = "SCH"; a["З"] = "Z"; a["Х"] = "H"; a["Ъ"] = "'";
  a["ё"] = "yo"; a["й"] = "i"; a["ц"] = "ts"; a["у"] = "u"; a["к"] = "k"; a["е"] = "e"; a["н"] = "n"; a["г"] = "g"; a["ґ"] = "g"; a["ш"] = "sh"; a["щ"] = "sch"; a["з"] = "z"; a["х"] = "h"; a["ъ"] = "'";
  a["Ф"] = "F"; a["Ы"] = "I"; a["В"] = "V"; a["А"] = "a"; a["П"] = "P"; a["Р"] = "R"; a["О"] = "O"; a["Л"] = "L"; a["Д"] = "D"; a["Ж"] = "ZH"; a["Э"] = "E"; a["Є"] = "Je";
  a["ф"] = "f"; a["ы"] = "i"; a["в"] = "v"; a["а"] = "a"; a["п"] = "p"; a["р"] = "r"; a["о"] = "o"; a["л"] = "l"; a["д"] = "d"; a["ж"] = "zh"; a["э"] = "e"; a["є"] = "je";
  a["Я"] = "Ya"; a["Ч"] = "CH"; a["С"] = "S"; a["М"] = "M"; a["И"] = "I"; a["Ї"] = "ш"; a["Т"] = "T"; a["Ь"] = "'"; a["Б"] = "B"; a["Ю"] = "YU";
  a["я"] = "ya"; a["ч"] = "ch"; a["с"] = "s"; a["м"] = "m"; a["и"] = "i"; a["ї"] = "i"; a["т"] = "t"; a["ь"] = "'"; a["б"] = "b"; a["ю"] = "yu";
  for (var i = 0; i < name.length; i++) {
    newName += a[name[i]] === undefined ? name[i] : a[name[i]];
  }
  return newName;
}

function isEmpty(str) {
  return (typeof str === 'undefined' || str.replace(/\s/g, '').length == 0);
}

function isSolidFill(item) {
  if (!item.filled) { return false; }
  if (item.fillColor.typename == 'RGBColor' ||
      item.fillColor.typename == 'CMYKColor' ||
      item.fillColor.typename == 'GrayColor' ||
      item.fillColor.typename == 'SpotColor')
    { return true; }
  return false;
}

function isSpecialItem(item) {
  var itemType = ['GraphItem', 'GroupItem', 'MeshItem', 'NonNativeItem', 
                  'PlacedItem', 'PluginItem', 'RasterItem', 'SymbolItem'];
  for (var i = 0; i < itemType.length; i++) {
    if (item.typename === itemType[i]) { return true; }
  }
  return false;
}

function removeOverprint(item) {
  item.fillOverprint = false;
  item.strokeOverprint = false;
}

function showError(err) {
  if (confirm(SCRIPT_NAME + ': an unknown error has occurred.\n' +
      'Would you like to see more information?', true, 'Unknown Error')) {
    alert(err + ': on line ' + err.line, 'Script Error', true);
  }
}

// Run script
try {
  main();
} catch (e) {
  // showError(e);
}