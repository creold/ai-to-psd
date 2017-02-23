var GRADIENT = "GradientColor";
var PATTERN = "PatternColor";

if (documents.length > 0) {
 
	app.executeMenuCommand('unlockAll');
	app.executeMenuCommand('deselectall');

	for (var i = 0; i < activeDocument.pathItems.length; i++) {
		var cp = activeDocument.pathItems[i];
		if (isForLiveOutline(cp)) {
			cp.selected = true;
		}
	}
    app.executeMenuCommand('Live Outline Stroke');
    app.executeMenuCommand('expandStyle');
    app.executeMenuCommand('deselectall');
    
    var allPaths = [];
	var allPaths = activeDocument.pathItems;
	
	for (var i = 0; i < allPaths.length; ) {
		var cp = allPaths[i];
		try {
			var fillType = cp.fillColor.typename;
			if (cp.closed && cp.filled  && 
			  !(cp.stroked || fillType == PATTERN || fillType == GRADIENT)) {
				cp.selected = true;
				app.doScript('Psd', 'My');
				cp.selected = false;
// since PathItem become CompoundShape, allPaths will be reduced
			} else {
                i++;
			}
		} catch (err) {
			alert(err);
             i++;
		}
	}
}

//без заливки + есть обводка +  обводка не градиент и не паттерн
function isForLiveOutline(obj) {
    try {
        var strokeType = obj.strokeColor.typename;
        return (!cp.filled && strokeType != GRADIENT && strokeType != PATTERN);
    } catch(e) {}
    return false;    
}