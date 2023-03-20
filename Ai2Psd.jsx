/*
  Ai2Psd.jsx for Adobe Illustrator
  Description: This script may help to prepare vector paths to export from AI to PSD file. 
  Requirements: Adobe Illustrator CS6 and later
  Date: February, 2017
  Modification date: March, 2023
  Author: Sergey Osokin, email: hi@sergosokin.ru
  Thanks to Radmir Kashaev, https://github.com/rkashaev for help in creating version 1.0
            Alexander Ladygin (http://ladygin.pro) for help in creating version 2.3

  More info:
  EN https://medium.com/@creold/how-to-export-a-illustrator-file-into-a-vector-layered-photoshop-file-2dcc274abf66
  RU https://sergosokin.ru/blog/export-vector-ai-to-psd/

  Release notes:
  1.0 Initial version
  1.1 After start the script unlocks visible layers & objects
  1.2 Fixed a performance issue
  1.3 Fixed a Overprint issue
  2.0 The script doesn't need to load the helper Action file
  2.1 Fixed unlock and order of objects issue
  2.2 Added timer & progress bar
  2.3 Minor improvements
  3.0 Algorithm issues fixed. Added saving custom path names and RU localization
  3.1 Minor improvements
  4.0 Added UI with batch export. Minor improvements

  Donate (optional):
  If you find this script helpful, you can buy me a coffee
  - via Buymeacoffee: https://www.buymeacoffee.com/osokin
  - via FanTalks https://fantalks.io/r/sergey
  - via DonatePay https://new.donatepay.ru/en/@osokin
  - via YooMoney https://yoomoney.ru/to/410011149615582

  Released under the MIT license.
  http://opensource.org/licenses/mit-license.php

  Check my other scripts: https://github.com/creold
*/

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false); // Fix drag and drop a .jsx file
$.localize = true; // Enabling automatic localization

function main() {
  var SCRIPT = {
        name: 'Ai2Psd',
        version: 'v4.0'
      },
      CFG = {
        aa: true, // Anti-Aliasing
        editTxt: true, // Editable text
        embedIcc: false, // Embed ICC profile
        isMac: /mac/i.test($.os),
        aiVers: parseFloat(app.version),
        actSet: 'Ai2Psd',
        actName: 'Make_Compound_Shape',
        actPath: Folder.myDocuments + '/Adobe Scripts/',
        mgns: [10, 15, 10, 10]
      },
      LANG = {
        errApp: { en: 'Wrong application\nRun script from Adobe Illustrator',
                  ru: 'Неправильная программа\nЗапустите скрипт в Adobe Illustrator' },
        errVer: { en: 'Wrong app version\nSorry, script only works in Illustrator CS6 and later',
                  ru: 'Неподходящая версия\nСкрипт работает в Illustrator CS6 и выше' },
        src: { en: 'Source', ru: 'Источник' },
        actDoc: { en: 'Active Document: ', ru: 'Текущий документ: ' },
        allDoc1: { en: 'All ', ru: 'Все ' },
        allDoc2: { en: ' open documents', ru: ' открытых документа' },
        noDoc: { en: 'No open documents', ru: 'Нет открытых документов' },
        fol: { en: 'From Folder:', ru: 'Из папки:' },
        subfol: { en: 'Include Subfolders', ru: 'Включить подпапки' },
        sel: { en: 'Select', ru: 'Выбрать' },
        abs: { en: 'Artboards', ru: 'Артборды' },
        multiAbs: { en: 'Export Multiple Artboards', ru: 'Экспортировать отдельными артбордами' },
        allAbs: { en: 'All Artboards in a Document', ru: 'Все артборды документа' },
        actAb: { en: 'Active: ', ru: 'Активный: ' },
        range: { en: 'Range:', ru: 'Диапазон: ' },
        res: { en: 'Resolution, ppi', ru: 'Разрешение, ppi' },
        low: { en: 'Screen (72)', ru: 'Экранное (72)' },
        mid: { en: 'Medium (150)', ru: 'Среднее (150)' },
        high: { en: 'High (300)', ru: 'Высокое (300)' },
        other: { en: 'Other', ru: 'Другое' },
        rangeTip: { en: 'Range ', ru: 'Диапазон ' },
        model: { en: 'Color Space', ru: 'Цветовая модель' },
        docCol: { en: 'Doc color', ru: 'Документа' },
        of: { en: ' of ', ru: ' из ' },
        cancel: { en: 'Cancel', ru: 'Закрыть' },
        ok: { en: 'Export', ru: 'Экспортировать' },
        copr: { en: 'Sergey Osokin. Visit Github', ru: 'Сергей Осокин. Посетить Github' },
        warnObj: { en: 'Warning\nBitmaps and Graphs can cause errors when exporting them to PSD.',
                  ru: 'Предупреждение\nРастровые изображения и диаграммы могут вызвать ошибки при экспорте в PSD.' },
        hide: { en: 'You can hide them to avoid this.',
              ru: 'Вы можете скрыть их, чтобы избежать этого.' },
        agree: { en: 'Do you want to hide them?', ru: 'Хотите их скрыть?' },
        done: { en: 'Exporting process is complete\n'
              + 'Open documents have been changed. To restore the last save select File > Revert.\n\n'
              + 'Some layers in the PSD could get merged randomly. '
              + "In Illustrator there's still no reliable way to control it.\n\nWe tried!",
              ru: 'Экспорт завершен\n'
              + 'Открытые документы были изменены. Для восстановления последнего сохранения выберите Файл > Восстановить.\n\n'
              + 'Некоторые слои в PSD могут быть случайным образом слиты в один. '
              + 'В Illustrator все еще нет способа починить это.\n\nНо мы попытались.'}
      },
      SETTINGS = {
        name: SCRIPT.name.replace(/\s/g, '_') + '_data.json',
        folder: Folder.myDocuments + '/Adobe Scripts/'
      };

  if (!/illustrator/i.test(app.name)) {
    alert(LANG.errApp, 'Ai2Psd error');
    return false;
  }

  if (CFG.aiVers < 16) {
    alert(LANG.errVer, 'Ai2Psd error');
    return false;
  }

  polyfills();
  var doc = hasOpenDoc() ? app.activeDocument : null;
  var actIdx = 0;
  var aiFiles = []; // Files
  
  // Dialog
  var win = new Window('dialog', SCRIPT.name + ' ' + SCRIPT.version);
      win.orientation = 'column';
      win.alignChildren = ['fill', 'top'];
  
  // Source panel
  var srcPnl = win.add('panel', undefined, LANG.src);
      srcPnl.alignChildren = 'fill';
      srcPnl.margins = CFG.mgns;
  
  var actDocRb = srcPnl.add('radiobutton', undefined, LANG.actDoc);
      actDocRb.text += hasOpenDoc() ? truncate(doc.name, 23) : LANG.noDoc;
      actDocRb.value = true;
  var allDocRb = srcPnl.add('radiobutton', undefined, LANG.allDoc1 + documents.length + LANG.allDoc2);
      allDocRb.text = hasOpenDoc() ? LANG.allDoc1 + documents.length + LANG.allDoc2 : LANG.noDoc;
      allDocRb.enabled = documents.length > 1;
  
  // Folder
  var folGrp = srcPnl.add('group');
      folGrp.alignChildren = ['left', 'center'];
  var folRb = folGrp.add('radiobutton', undefined, LANG.fol);
  var folBtn = folGrp.add('button', undefined, LANG.sel);
      folBtn.preferredSize.height = 24;
  var isSubfol = srcPnl.add('checkbox', undefined, LANG.subfol);
      isSubfol.enabled = folBtn.value;
  var folLbl = srcPnl.add('statictext', undefined, Folder.desktop);
      folLbl.preferredSize.width = 200;
  
  // Artboards panel
  var abPnl = win.add('panel', undefined, LANG.abs);
      abPnl.alignChildren = ['fill', 'center'];
      abPnl.margins = CFG.mgns;
  
  var isSaveAbs = abPnl.add('checkbox', undefined, LANG.multiAbs);
      isSaveAbs.value = true;
  
  var abGrp = abPnl.add('group');
      abGrp.alignChildren = ['fill', 'top'];
      abGrp.orientation = 'column';
  
  var allAbRb = abGrp.add('radiobutton', undefined, LANG.allAbs);
      allAbRb.value = true;
  var actAbRb = abGrp.add('radiobutton', undefined, LANG.actAb);

  // Range
  var rangeGrp = abGrp.add('group');
      rangeGrp.alignChildren = ['left', 'center'];
  
  var rangeAbRb = rangeGrp.add('radiobutton', undefined, LANG.range);
      rangeAbRb.preferredSize.width = /ru/i.test($.locale) ? 85 : 60;
  var rangeInp = rangeGrp.add('edittext', undefined, '1,2');
      rangeInp.characters = 12;
  rangeGrp.add('statictext', undefined, '1,2-5,8'); // Help tip
  
  // Two column layout
  var row = win.add('group');
      row.alignChildren = ['fill', 'fill'];
  
  // Resolution panel
  var resPnl = row.add('panel', undefined, LANG.res);
      resPnl.alignChildren = 'fill';
      resPnl.margins = CFG.mgns;
  
  var ppiList = resPnl.add('dropdownlist', undefined, [LANG.low, LANG.mid, LANG.high, '-', LANG.other]);
      ppiList.selection = 0;
  
  var ppiInp = resPnl.add('edittext', undefined, '96');
      ppiInp.characters = 5;
  resPnl.add('statictext', undefined, LANG.rangeTip + '72 - 2400 ppi');
  
  // Color panel
  var colPnl = row.add('panel', undefined, LANG.model);
      colPnl.alignChildren = 'left';
      colPnl.margins = CFG.mgns;
  
  var origColRb = colPnl.add('radiobutton', undefined, LANG.docCol);
      origColRb.value = true;
  var rgbRb = colPnl.add('radiobutton', undefined, 'RGB');
  var cmykRb = colPnl.add('radiobutton', undefined, 'CMYK');
  
  // Progress bar
  var progGrp = win.add('group');
      progGrp.alignChildren = ['fill', 'center'];
  var progLbl = progGrp.add('statictext', undefined, '1' + LANG.of + '1');
      progLbl.preferredSize.width = 58;
  var progBar = progGrp.add('progressbar', undefined, 0, 100);
      progBar.preferredSize.width = 260;
      progBar.preferredSize.height = 5;

  // Buttons
  var btns = win.add('group');
      btns.alignChildren = ['center', 'center'];

  var cancel, ok;
  if (CFG.isMac) {
    cancel = btns.add('button', undefined, LANG.cancel, { name: 'cancel' });
    ok = btns.add('button', undefined, LANG.ok, { name: 'ok' });
  } else {
    ok = btns.add('button', undefined, LANG.ok, { name: 'ok' });
    cancel = btns.add('button', undefined, LANG.cancel, { name: 'cancel' });
  }
  cancel.preferredSize.width = /ru/i.test($.locale) ? 130 : 100;
  ok.preferredSize.width = /ru/i.test($.locale) ? 130 : 100;

  var copyright = win.add('statictext', undefined, '\u00A9 ' + LANG.copr);
  copyright.justify = 'center';
  
  // Events
  actDocRb.onClick = function () {
    folRb.value = false;
    isSubfol.enabled = false;
    actAbRb.enabled = abGrp.enabled;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, 1);
  }
  
  allDocRb.onClick = function () {
    if (!this.enabled) return;
    if (!rangeAbRb.value) allAbRb.value = true;
    actAbRb.enabled = false;
    folRb.value = false;
    isSubfol.enabled = false;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, documents.length);
  }
  
  folRb.onClick = function () {
    allAbRb.value = true;
    actAbRb.enabled = false;
    isSubfol.enabled = true;
    actDocRb.value = allDocRb.value = false;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, '?');
  }
  
  var folPath = '';
  folBtn.onClick = function () {
    var fol = Folder.selectDialog('Select the source folder...');
    var str = '';
    if (fol !== null) {
      folPath = decodeURI(fol);
      aiFiles = getFolderFiles(folPath, isSubfol.enabled && isSubfol.value);
      progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, aiFiles.length);
      str = '.../' + folPath.substr(folPath.lastIndexOf('/') + 1);
      folLbl.text = truncate(str, 40);
    }
  }

  isSubfol.onClick = function () {
    if (!folPath.length) return;
    aiFiles = getFolderFiles(folPath, isSubfol.enabled && isSubfol.value);
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, aiFiles.length);
  }
  
  isSaveAbs.onClick = function () { 
    abGrp.enabled = this.value;
    actAbRb.enabled = abGrp.enabled && actDocRb.value;
    rangeInp.enabled = rangeAbRb.value;
  }
  
  allAbRb.onClick = actAbRb.onClick = function () {
    if (!this.enabled) return;
    rangeAbRb.value = rangeInp.enabled = false;
  }
  
  rangeAbRb.onClick = function () { 
    allAbRb.value = actAbRb.value = false;
    rangeInp.enabled = true;
  }
  
  ppiList.onChange = function () {
    ppiInp.enabled = (/other|другое/i.test(this.selection.text));
  }

  cancel.onClick = win.close;

  ok.onClick = okClick;

  copyright.addEventListener('mousedown', function () {
    openURL('https://github.com/creold');
  });
  
  // Set options
  loadSettings(SETTINGS);

  function okClick() {
    addMkCompShape(CFG.actSet, CFG.actName, CFG.actPath);

    var docs = [];
    if (folRb.value) {
      docs = aiFiles;
    } else if (allDocRb.value) {
      docs = app.documents;
    } else {
      docs = [app.activeDocument];
    }
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, docs.length);

    try {
      for (var i = 0, len = docs.length; i < len; i++) {
        progLbl.text = progLbl.text.replace(/^\d+/g, i + 1);
        win.update();
        doc = docs[i];
        if (folRb.value) {
          app.open(doc);
          doc = app.activeDocument;
        } else {
          doc.activate();
        }
        process(doc, win, progBar, CFG, LANG);
        var psdOpts = setExportOpts(doc);
        exportAsPsd(doc, psdOpts);
        if (folRb.value) doc.close(SaveOptions.DONOTSAVECHANGES);
      }
    } catch (err) {}

    try {
      app.unloadAction(CFG.actSet, '');
    } catch (err) {}
    alert(LANG.done, 'Ai2Psd');

    saveSettings(SETTINGS);
    win.close();
  }

  // Get export options for document
  function setExportOpts(doc) {
    var ppi = getPPI(ppiList.selection.text, ppiInp.text);
    var range = actAbRb.enabled && actAbRb.value ? actIdx + 1 : '';

    var opts = new ExportOptionsPhotoshop();
    opts.antiAliasing = CFG.aa;
    opts.editableText = CFG.editTxt;
    opts.embedICCProfile = CFG.embedIcc;
    opts.maximumEditability = true;
    opts.resolution = ppi;
    opts.saveMultipleArtboards = isSaveAbs.value;
    opts.warnings = false;
    opts.writeLayers = true;

    var imgCol;
    if (origColRb.value) {
      imgCol = /rgb/i.test(doc.documentColorSpace) ? ImageColorSpace.RGB : ImageColorSpace.CMYK;
    } else if (rgbRb.value) {
      app.executeMenuCommand('doc-color-rgb');
      imgCol = ImageColorSpace.RGB;
    } else {
      app.executeMenuCommand('doc-color-cmyk');
      imgCol = ImageColorSpace.CMYK;
    }
    opts.imageColorSpace = imgCol;

    if (rangeAbRb.value) {
      range = getAbsRange(rangeInp.text, doc, -1).join();
    }
    opts.artboardRange = range; // Only string range

    return opts;
  }

  // Save options to json file
  function saveSettings(f) {
    if(!Folder(f.folder).exists) Folder(f.folder).create();
    f = new File(f.folder + f.name);
    f.encoding = 'UTF-8';
    f.open('w');
    var pref = {};
    pref.src = actDocRb.value ? 0 : (allDocRb.value ? 1 : 2);
    pref.subfol = isSubfol.value;
    pref.multi = isSaveAbs.value;
    pref.abs = allAbRb.value ? 0 : (actAbRb.value ? 1 : 2);
    pref.range = rangeInp.text;
    pref.res = ppiList.selection.index;
    pref.ppi = ppiInp.text;
    pref.color = origColRb.value ? 0 : (rgbRb.value ? 1 : 2);
    var data = pref.toSource();
    f.write(data);
    f.close();
  }

  // Load options from json file
  function loadSettings(f) {
    f = File(f.folder + f.name);
    if (f.exists) {
      try {
        f.encoding = 'UTF-8';
        f.open('r');
        var json = f.readln();
        var pref = new Function('return ' + json)();
        f.close();
        if (typeof pref != 'undefined') {
          if (pref.src == 0) actDocRb.notify('onClick');
          else if (pref.src == 1) allDocRb.notify('onClick');
          else folRb.notify('onClick');
          isSubfol.value = pref.subfol;
          isSaveAbs.value = pref.multi;
          if (pref.abs == 0) allAbRb.notify('onClick');
          else if (pref.abs == 1) actAbRb.notify('onClick');
          else rangeAbRb.notify('onClick');
          rangeInp.text = pref.range;
          ppiList.selection = pref.res;
          ppiInp.text = pref.ppi;
          if (pref.color == 0) origColRb.value = true;
          else if (pref.color == 1) rgbRb.value = true;
          else cmykRb.value = true;
        }
      } catch (e) {}
    }

    if ( hasOpenDoc() ) {
      actIdx = doc.artboards.getActiveArtboardIndex();
      actAbRb.text += '[' + (actIdx + 1) + '] ' + truncate(doc.artboards[actIdx].name, 32);
      if (actDocRb.value && /cmyk/i.test(doc.documentColorSpace)) cmykRb.value = true;
    } else {
      actDocRb.enabled = actDocRb.value = false;
      allDocRb.enabled = allDocRb.value = false;
      folRb.value = true;
      isSubfol.enabled = true;
      progLbl.text = '1' + LANG.of + '?';
      actAbRb.enabled = false;
    }
    
    rangeInp.enabled = rangeAbRb.value;
    abGrp.enabled = isSaveAbs.value;
    actAbRb.enabled = abGrp.enabled && actDocRb.value;
    if (ppiList.selection.text !== 'Other') ppiInp.enabled = false;
  }

  win.center();
  win.show();
}

// Setup JavaScript Polyfills
function polyfills() {
  Array.prototype.map = function (callback) {
    arr = [];
    for (var i = 0; i < this.length; i++) {
      arr.push(callback(this[i], i, this));
    }
    return arr;
  };
  Array.prototype.indexOf = function (obj, start) {
    for (var i = start || 0, l = this.length; i < l; i++) {
      if (this[i] == obj) return i;
    }
    return -1;
  };
  Array.prototype.unique = function () {
    arr = [];
    for (var i = 0; i < this.length; i++) {
      var cur = this[i];
      if (arr.indexOf(cur) < 0) arr.push(cur);
    }
    return arr;
  };
}

// Check open documents
function hasOpenDoc() {
  return app.documents.length > 0;
}

// Truncate string to specific length
function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

// Get files from a folder and subfolders
function getFolderFiles(path, isIncSubfol) {
  var fol = Folder( decodeURI(path) );
  if (!fol.exists) return;
  var fList = fol.getFiles();
  var out = [];
  for (var i = 0, len = fList.length; i < len; i++) {
    if (isIncSubfol && fList[i] instanceof Folder) {
      out = out.concat(getFolderFiles(fList[i], isIncSubfol));
    } else if (fList[i] instanceof File) {
      // Ignore macOS hidden files
      if ( !/^\._|ds_store/i.test(fList[i].name)
          && (/\.(ai|eps|svg)$/i.test(fList[i].name)) ) {
        out.push(fList[i]);
      }
    }
  }
  return out;
}

// Generate "Make Compound Shape" action
function addMkCompShape(set, name, path) {
  var str = [
    '/version 3',
    '/name [' + set.length + ' ' + ascii2Hex(set) + ']',
    '/isOpen 1',
    '/actionCount 1',
    '/action-1 {',
        '/name [' + name.length + ' ' + ascii2Hex(name) + ']',
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
  try {
    app.unloadAction(set, '');
  } catch (err) {}
  createAction(str, set, path);
}

// Load action
function createAction(str, set, path) {
  if (!Folder(path).exists) Folder(path).create();
  var f = new File('' + path + '/' + set + '.aia');
  f.open('w');
  f.write(str);
  f.close();
  app.loadAction(f);
  f.remove();
}

// Convert string to hex
function ascii2Hex(hex) {
  return hex.replace(/./g, function(a) {
    return a.charCodeAt(0).toString(16)
  });
}

// Get resolution for export
function getPPI(opt, str) {
  var ppi = 72;
  switch (true) {
    case /72/i.test(opt):
      break;
    case /150/i.test(opt):
      ppi = 150;
      break;
    case /300/i.test(opt):
      ppi = 300;
      break;
    case /other|другое/i.test(opt):
      ppi = strToIntNum(str, 72);
      if (ppi < 72) {
        ppi = 72;
      } else if (ppi > 2400) {
        ppi = 2400;
      }
      break;
  }
  return ppi;
}

// Parse numbers and ranges from string
function getAbsRange(str, doc, inc) {
  if (arguments.length == 1 || inc == undefined) inc = 0;
  str = str.replace(/\s/g,'');
  var out = str.split(',').map(function (e) {
    if (!/-/.test(e)) {
      return strToIntNum(e) + inc;
    } else {
      var minmax = e.split('-');
      var range = [];
      for (var i = strToIntNum(minmax[0]), len = strToIntNum(minmax[1]); i <= len; i++) {
        range.push(i + inc);
      }
      return range;
    }
  });
  out = [].concat.apply([], out); // Flatten arrays
  out.sort(function (a, b) { return a - b; });
  out = intersect(doc.artboards, out.unique());
  for (var i = 0; i < out.length; i++) out[i] += 1;
  return out;
}

// Search for common elements in arrays
function intersect(arr1, arr2) {
  var out = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(i) !== -1) out.push(i);
  }
  return out;
}

function process(doc, w, pb, cfg, msg) {
  pb.value = 0;

  unlockAll(doc);
  limitGroupDepth(doc.layers, 2);

  // Search for the problematic object types
  cfg.isHide = searchProblemObj(doc, msg, cfg.isHide);

  app.redraw();
  app.executeMenuCommand('selectall');
  var docItems = getItems(selection);

  // Start processing
  for (var len = docItems.length, i = len - 1; i >= 0; i--) {
    selection = null;
    app.redraw();
    var item = docItems[i];
    convertItem(item, cfg.actName, cfg.actSet);
    // Update Progress bar
    pb.value = parseInt(100 * ((len - i) / len));
    // Update progress for Windows OS
    w.update();
  }

  pb.value = 100;
  docItems = [];
  reopenLayerPanel();
  selection = null;
  app.redraw();
}

// Unlock layers and included paths
function unlockAll(doc) {
  unlockLayers(doc.layers);
  app.executeMenuCommand('unlockAll');
  selection = null;
  app.redraw();
}

// Unlock all Layers & Sublayers
function unlockLayers(lyrs) {
  for (var i = 0, len = lyrs.length; i < len; i++) {
    lyrs[i].locked = false;
    if (lyrs[i].layers.length) unlockLayers(lyrs[i].layers);
  }
}

// If the group nesting limit is exceeded, the export to PSD will fail
function limitGroupDepth(lyrs, depth) {
  depth = (isNaN(parseInt(depth)) ? 4 : parseInt(depth)) + 1;
  for (var i = 0; i < lyrs.length; i++) {
    groupNormalize(lyrs[i].groupItems, depth);
    if (lyrs[i].layers.length) {
      limitGroupDepth(lyrs[i], depth);
    }
  }
}

// Reduce amount of groups
function groupNormalize(groups, max, counter, dest) {
  var i = groups.length;
  var counter = (counter || 0) + 1;
  if (i > 0) {
    while (i--) {
      if (counter > max) {
        try {
          var dest = groups[i];
        } catch (err) {}
        try {
          if (!groups[i].clipped) {
            moveItems(groups[i].pageItems, dest);
          } else {
            ungroupAll(groups[i]);
          }
        } catch (err) {}
        groupNormalize(groups, max, counter - 1, dest);
      } else {
        try {
          groupNormalize(groups[i].groupItems, max, counter, dest);
        } catch (err) {}
      }
    }
  }
}

// Move items to another container
function moveItems(items, dest) {
  if (dest == undefined) return;
  var i = items.length;
  var groups = [];
  if (i > 0) {
    while (i--) {
      if ( isType(items[i], 'group') ) groups.push(items[i]);
      items[i].move(dest, ElementPlacement.PLACEAFTER);
    }
    if (!dest.pageItems.length) dest.remove();
  }
  return groups;
}

// Ungroup array of target objects
function ungroupAll(obj) {
  var childs = getGroupChilds(obj);
  if (!childs.length) obj.remove();
  for (var i = 0, len = childs.length; i < len; i++) {
    var item = childs[i];
    try {
      if (!obj.clipped && isType(item.parent, 'layer')) {
        item.move(obj, ElementPlacement.PLACEBEFORE);
      }
      if (isType(item, 'group|layer')) {
        ungroupAll(item);
      }
    } catch (err) {}
  }
}

// Get group contents
function getGroupChilds(obj) {
  var out = [];
  var i = 0;
  for (i = 0, pi = obj.pageItems.length; i < pi; i++) {
    out.push(arr.pageItems[i]);
  }
  if (obj.layers) {
    for (i= 0, len = obj.layers.length; i < len; i++) {
      out.push(obj.layers[i]);
    }
  }
  return out;
}

// Get single items
function getItems(coll) {
  var out = [];
  for (var i = 0, len = coll.length; i < len; i++) {
    var item = coll[i];
    if (item.pageItems && item.pageItems.length) {
      out = [].concat(out, getItems(item.pageItems));
    } else if (isType(item, 'compound')) {
      if (item.pathItems.length && item.pathItems[0].clipping) continue;
      out.push(item);
    } else if (!item.clipping) {
      out.push(item);
    }
  }
  return out;
}

// Convert item to compound shape for export
function convertItem(item, actName, actSet) {
  var props = {
      name: transliterate( getName(item) ),
      opa: item.opacity,
      blend: item.blendingMode
    };
  var prnt = item.parent;
  prnt.name = transliterate( getName(prnt) );

  // Save properties for single item group
  if ( isType(prnt, 'group') && prnt.pageItems.length === 1 ) {
    props.opa = prnt.opacity;
    props.blend = prnt.blendingMode;
  }

  // Skip text because it's editable in PSD
  if (isType(item, 'text')) {
    if ( !isEmpty(props.name) ) item.name = props.name;
    return;
  }

  var tmpPath;
  if (isType(item, 'compound')) {
    if (item.pathItems.length) {
      item = item.pathItems[0];
    } else {
      // Fix compound path created from groups
      tmpPath = item.pathItems.add();
      item = tmpPath;
    }
  }
  rmvOverprint(item);

  try {
    if (!isProblemType(item) && isSolidFill(item) && !item.stroked) {
      if (isType(item.parent, 'compound')) {
        item = item.parent;
        if (tmpPath) tmpPath.remove();
      }
      selection = item;
      app.doScript(actName, actSet); // Convert to Compound Shape
      // Fix Adobe Illustrator bug, when selection is lost after run action
      if (!selection.length) {
        try {
          selection = item;
        } catch (err) {}
      }
      // Restore properties
      if (!isEmpty(props.name)) selection[0].name = props.name;
      selection[0].opacity = props.opa;
      selection[0].blendingMode = props.blend;
    } else {
      if (isType(item.parent, 'compound')) {
        item = item.parent;
        tmpPath.remove();
      }
      // Path didn't match the condition, so we do group on it
      var safeGrp = item.layer.groupItems.add();
      safeGrp.move(item, ElementPlacement.PLACEBEFORE);
      item.move(safeGrp, ElementPlacement.PLACEATEND);
      if (!isEmpty(props.name)) safeGrp.name = props.name;
    }
  } catch (err) {}
}

// Remove overprint attributes
function rmvOverprint(item) {
  item.fillOverprint = false;
  item.strokeOverprint = false;
}

// Get item name for differen types
function getName(item) {
  var str = '';
  if (isType(item, 'text') && isEmpty(item.name) && !isEmpty(item.contents)) {
    str = item.contents.slice(0, 100);
  } else if (isType(item, 'symbol') && isEmpty(item.name)) {
    str = item.symbol.name;
  } else {
    str = item.name;
  }
  return str;
}

// Check empty string
function isEmpty(str) {
  return str == undefined || str.replace(/\s/g, '').length == 0;
}

// Fix cyrillic name
function transliterate(str) {
  var tlStr = '',
      a = {};
  a["Ё"] = "YO"; a["Й"] = "I"; a["Ц"] = "TS"; a["У"] = "U"; a["К"] = "K"; a["Е"] = "E"; a["Н"] = "N"; a["Г"] = "G"; a["Ґ"] = "G"; a["Ш"] = "SH"; a["Щ"] = "SCH"; a["З"] = "Z"; a["Х"] = "H"; a["Ъ"] = "'";
  a["ё"] = "yo"; a["й"] = "i"; a["ц"] = "ts"; a["у"] = "u"; a["к"] = "k"; a["е"] = "e"; a["н"] = "n"; a["г"] = "g"; a["ґ"] = "g"; a["ш"] = "sh"; a["щ"] = "sch"; a["з"] = "z"; a["х"] = "h"; a["ъ"] = "'";
  a["Ф"] = "F"; a["Ы"] = "I"; a["В"] = "V"; a["А"] = "a"; a["П"] = "P"; a["Р"] = "R"; a["О"] = "O"; a["Л"] = "L"; a["Д"] = "D"; a["Ж"] = "ZH"; a["Э"] = "E"; a["Є"] = "Je";
  a["ф"] = "f"; a["ы"] = "i"; a["в"] = "v"; a["а"] = "a"; a["п"] = "p"; a["р"] = "r"; a["о"] = "o"; a["л"] = "l"; a["д"] = "d"; a["ж"] = "zh"; a["э"] = "e"; a["є"] = "je";
  a["Я"] = "Ya"; a["Ч"] = "CH"; a["С"] = "S"; a["М"] = "M"; a["И"] = "I"; a["Ї"] = "ш"; a["Т"] = "T"; a["Ь"] = "'"; a["Б"] = "B"; a["Ю"] = "YU";
  a["я"] = "ya"; a["ч"] = "ch"; a["с"] = "s"; a["м"] = "m"; a["и"] = "i"; a["ї"] = "i"; a["т"] = "t"; a["ь"] = "'"; a["б"] = "b"; a["ю"] = "yu";
  for (var i = 0; i < str.length; i++) {
    tlStr += a[str[i]] === undefined ? str[i] : a[str[i]];
  }
  return tlStr;
}

// Check problem types of items
// GraphItem, GroupItem, MeshItem, NonNativeItem,
// PlacedItem, PluginItem, RasterItem, SymbolItem
function isProblemType(item) {
  return isType(item, 'graph|group|mesh|nonnative|placed|plugin|raster|symbol');
}

// Check one color fill
// RGBColor, CMYKColor, GrayColor, SpotColor
function isSolidFill(item) {
  if (!item.filled) return false;
  return isType(item.fillColor, 'rgb|cmyk|gray|spot');
}

// Reopen Layers panel for update names 
function reopenLayerPanel() {
  app.executeMenuCommand('AdobeLayerPalette1');
  app.executeMenuCommand('AdobeLayerPalette1');
}

// Export document as psd
function exportAsPsd(doc, opts) {
  var fol = Folder.desktop;
  if (doc.path != '') fol = doc.path;
  try {
    var name = doc.name.replace(/\.[^\.]+$/, '') + '.psd';
    var f = File(decodeURI(fol) + '/' + name);
    var type = ExportType.PHOTOSHOP;
    doc.exportFile(f, type, opts);
  } catch (err) {}
}

// Search bitmaps and graphs
function searchProblemObj(doc, msg, isHide) {
  var badItems = [];
  var i = 0;

  for (i = 0; i < doc.rasterItems.length; i++) {
    if (!doc.rasterItems[i].hidden) {
      badItems.push(doc.rasterItems[i]);
    }
  }

  for (i = 0; i < doc.graphItems.length; i++) {
    if (!doc.graphItems[i].hidden) {
      badItems.push(doc.graphItems[i]);
    }
  }

  if (badItems.length) {
    if (isHide == undefined) {
      isHide = confirm(msg.warnObj + ' ' + msg.hide + '\n\n' + msg.agree);
    }
    if (isHide) {
      for (i = 0; i < badItems.length; i++) {
        badItems[i].hidden = true;
      }
    }
  }
  return isHide;
}

// Convert string to absolute integer number
function strToIntNum(str, def) {
  if (arguments.length == 1 || def == undefined) def = 0;
  str = str.replace(/,/g, '.').replace(/[^\d.]/g, '');
  str = str.split('.');
  str = str[0] ? str[0] + '.' + str.slice(1).join('') : '';
  if (isNaN(str) || !str.length) {
    return parseInt(def);
  } else {
    return parseInt(str);
  }
}

// Check the item typename by short name
function isType(item, type) {
  var re = new RegExp(type, 'i');
  return re.test(item.typename);
}

// Open link in browser
function openURL(url) {
  var html = new File(Folder.temp.absoluteURI + '/aisLink.html');
  html.open('w');
  var htmlBody = '<html><head><META HTTP-EQUIV=Refresh CONTENT="0; URL=' + url + '"></head><body> <p></body></html>';
  html.write(htmlBody);
  html.close();
  html.execute();
}

// Run script
try {
  main();
} catch (err) {}