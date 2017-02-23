var GRADIENT = "GradientColor";
var PATTERN = "PatternColor";


if (documents.length > 0 && activeDocument.pathItems.length > 0){
 
    var allPaths = [];
    app.executeMenuCommand('unlockAll');
    app.executeMenuCommand('deselectall');
    app.executeMenuCommand('selectall');
    app.executeMenuCommand('Live Outline Stroke');
    app.executeMenuCommand('expandStyle');
    app.executeMenuCommand('deselectall');
    
    for (var i=0; i < activeDocument.pathItems.length; i++){
        allPaths[i] = activeDocument.pathItems[i];
    }
    
    for (var i=0; i < allPaths.length; i++){
        var cp = allPaths[i];
        cp.selected = false;
        var fillType = cp.fillColor.typename;
        if (cp.closed && cp.filled  && 
          !(cp.stroked || fillType == PATTERN || fillType == GRADIENT)) {
            try {
                cp.selected = true;  
                app.doScript('Psd', 'My');
            } catch (err) {
                alert(err);
            }
            cp.selected = false;
        }
    }
}