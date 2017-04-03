# Ai-to-Psd v1.2

Created by Sergey Osokin and Radmir Kashaev
Email: hi@sergosokin.ru 
© 2017. All rights reserved. 

## DESCRIPTION
The script may help to prepare vector layers for export from AI to PSD file. 
After the script is finished you should export the file manually via `File > Export (.psd)` 

All solid filled objects remain vector in the PSD. Meshes, objects with a gradient fill, pattern, various strokes, Open Path can not be left as vectors after the export, but they are automatically grouped to be separate raster layers in the PSD. 

If you want to save the vector stroke in the PSD, then you have to select the object and use `Object > Path > Outline Stroke`. 

If you have a large group of small objects, e.g. hair brush draws, fur or outlined text, it'd be better to combine such elements into the `Compound Path with Object > Compound Path > Make` before the script is executed. 

## INSTALLATION 
1. To install the script place `Ai-to-Psd.jsx` file into your `C:\Program Files\Adobe\Adobe Illustrator CC (64 Bit)\Presets\en_GB\Scripts\` (Win) or `/Applications/Adobe Illustrator CC/Presets.localized/en_GB/Scripts` directory. 

2. Load `Ai-to-Psd.aia` action file by `Window > Actions > Load Actions… `

3. Restart Illustrator and call this script from the `File > Scripts` menu. 

Should work with Illustrator CS6 and higher. 

## RELEASE NOTES 
### v1.0 
Initial Version 

### v1.1 
The script unlocks visible layers & objects before and the do the rest

### v1.2
Fixed a performance issue