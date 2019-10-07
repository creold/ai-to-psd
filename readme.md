![header](images/header.png)
![ai-to-psd](images/cover.png)

# Ai2Psd v2.3
[![Behance](https://img.shields.io/badge/Behance-%40creold-0055FF.svg)](https://behance.net/creold) [![Dribbble](https://img.shields.io/badge/Dribbble-%40creold-DF3A7A.svg)](https://dribbble.com/creold) [![Instagram](https://img.shields.io/badge/Instagram-%40serg_osokin-8034B2.svg)](https://www.instagram.com/serg_osokin/)

### News
v2.3 Minor issues fixed. The problem with the number of depth groups is solved. 

## Description
The script may help to prepare vector layers for export from AI to PSD file.  
All solid filled objects remain vector in the PSD.

![ai-to-psd](images/usage.gif)

<a href="https://github.com/creold/ai-to-psd/archive/master.zip ">
  <img width="180" height="55" src="images/download.png" >
</a>


### Donate (optional)
If you find this script helpful, consider shouting me coffee ☕️ via [PayPal] or [Yandex Money] 🙂  

[PayPal]: https://paypal.me/osokin/2usd
[Yandex Money]: https://money.yandex.ru/to/410011149615582
<a href="https://paypal.me/osokin/2usd">
  <img width="160" height="49" src="images/paypal-badge.png" >
</a>  

<a href="https://money.yandex.ru/to/410011149615582">
  <img width="160" height="49" src="images/yandex-badge.png" >
</a>

## System Requirements

Should work with Adobe Illustrator CS6 and above.   
The script has been tested on Illustrator CS6 (Windows 7), Illustrator CC 2017, 2018 (Mac OS High Sierra).

## Installation 

1. [Download archive] and unzip   
2. Place `Ai2Psd.jsx` in the Illustrator Scripts folder:
	- OS X: `/Applications/Adobe Illustrator [vers.]/Presets.localized/en_GB/Scripts`
	- Windows (32 bit): `C:\Program Files (x86)\Adobe\Adobe Illustrator [vers.]\Presets\en_GB\Scripts\`
	- Windows (64 bit): `C:\Program Files\Adobe\Adobe Illustrator [vers.] (64 Bit)\Presets\en_GB\Scripts\`
3. Restart Illustrator

[Download archive]: https://github.com/creold/ai-to-psd/archive/master.zip 


## Usage 

If you want to save the vector stroke in the PSD, then you have to select the object and use `Object → Path → Outline Stroke`. 

If you have a large group of small objects, e.g. hair brush draws, fur or outlined text, it'd be better to combine such elements into the `Compound Path with Object → Compound Path → Make` before the script is executed. 

1. Open document in Adobe Illustrator
2. Choose `File → Scripts → Ai2Psd`
3. Wait for the message of completion
4. Export the file to PSD via `File → Export → Export As...`

### Attention
Meshes, objects with a gradient fill or spot color, pattern, various strokes, Open Path can not be left as vectors after the export, but they are automatically grouped to be separate raster layers in the PSD.

### Article

En: [How to export an Illustrator file into a vector layered Photoshop file](https://medium.com/@creold/how-to-export-a-illustrator-file-into-a-vector-layered-photoshop-file-2dcc274abf66)   
Ru: [Экспортируем векторные слои из AI в PSD](http://sergosokin.ru/blog/export-vector-ai-to-psd/)

## Testimonials   
**Mateusz Nowak:** “Thanks for Ai-to-Psd script!”   
**Dilyana Aleksandrova:** “ai to psd saved my ass at work man, thank you for sharing it!”   
**Weyn Cueva:** “This is amazing! I’ve been looking for something similar because I work more in Photoshop. Thank you.”   
**Maggie Stilwell:** “This is awesome! A great timesaver. Thank you for sharing it.”   
**datenshi_blue:** “It is a great script, i downloaded it to and i love it”   
**Michael Helmrich:** "This is really powerful! Thank you for sharing"


## Changelog 

| Version | Notes |
| --- | --- |
| **v2.3** | Minor issues fixed. |
| **v2.2** | Added progress bar and timer. |
| **v2.1** | Fixed unlock and order of objects issue. |
| **v2.0** | The script doesn't need to load the helper Action file. |
| **v1.3** | Fixed Overprint issue. |
| **v1.2** | Improved preformance. |
| **v1.1** | The script unlocks visible layers & objects before and the do the rest. |
| **v1.0** | Initial Version. | 

## Contribute

This script is in active development.  
Found a bug? Please [submit a new issues](https://github.com/creold/ai-to-psd/issues) on GitHub.

### Contact
Email <hi@sergosokin.ru>  

### Co-author
Radmir Kashaev: [GitHub](https://github.com/rkashaev)  

### License

Ai-to-Psd is licensed under the MIT licence.  
See the included LICENSE file for more details.