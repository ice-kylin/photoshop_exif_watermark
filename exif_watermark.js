// noinspection JSUnresolvedReference

var FOCAL_STR = "%E7%84%A6%E8%B7%9D"; // 焦距
var SHUTTER_STR = "%E6%9B%9D%E5%85%89%E6%97%B6%E9%97%B4"; // 曝光时间
var APERTURE_STR = "%E5%85%89%E5%9C%88%E5%A4%A7%E5%B0%8F"; // 光圈大小
var ISO_STR = "ISO%20%E6%84%9F%E5%85%89%E5%BA%A6"; // ISO 感光度
var CROP_FACTOR = 1.61; // 等效焦距换算系数
var NAME = "IceKylin"; // 名字
var NAME_FONT_NAME = "KpSans-Regular";
var NAME_FONT_SIZE = 36;
var NAME_FONT_CAPITALIZATION = TextCase.SMALLCAPS;
var EXIF_FONT_NAME = "KpRoman-Regular";
var EXIF_FONT_SIZE = 18;
var EXIF_FONT_CAPITALIZATION = TextCase.NORMAL;
var FONT_COLOR = "FFFFFF";
var DISTANCE = 36; // 名字水印与 EXIF 水印的距离
var MARGIN = 64; // 水印与边缘的距离

function main() {
    var sourceFolder = Folder.selectDialog("选择要处理的照片文件夹");
    var targetFolder = Folder.selectDialog("选择保存位置");
    var files = sourceFolder.getFiles("*.jpg");

    for (var i = 0; i < files.length; i++) {
        try {
            var doc = app.open(files[i]);
            var exif = parseEXIF(doc);

            var exifWatermarkHeight = createEXIFWatermark(doc, exif);
            createNameWatermark(doc, exifWatermarkHeight);
            saveProcessedFile(doc, targetFolder);

            doc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (e) {
            alert("处理失败: " + files[i].name + "\n" + e);
        }
    }
}

function parseEXIF(doc) {
    var exif = {
        focal: "", shutter: "", aperture: "", iso: ""
    };

    var exifData = doc.info.exif;
    for (var i = 0; i < exifData.length; i++) {
        switch (encodeURIComponent(exifData[i][0])) {
            case FOCAL_STR:
                exif.focal = exifData[i][1];
                break;
            case SHUTTER_STR:
                exif.shutter = exifData[i][1];
                break;
            case APERTURE_STR:
                exif.aperture = exifData[i][1];
                break;
            case ISO_STR:
                exif.iso = exifData[i][1];
        }
    }

    return exif;
}

function createEXIFWatermark(doc, exif) {
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;

    var textItem = textLayer.textItem;
    setTextItem(textItem, getContents(exif), EXIF_FONT_SIZE, FONT_COLOR, EXIF_FONT_NAME, EXIF_FONT_CAPITALIZATION);
    var position = getLayerPosition(textLayer);
    textLayer.translate(new UnitValue(64 - position.topLeftX, "px"), new UnitValue(doc.height.as("px") - position.height - position.topLeftY - MARGIN, "px",),);

    return position.height;
}

function createNameWatermark(doc, exifWatermarkHeight) {
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;

    var textItem = textLayer.textItem;
    setTextItem(textItem, NAME, NAME_FONT_SIZE, FONT_COLOR, NAME_FONT_NAME, NAME_FONT_CAPITALIZATION);

    var position = getLayerPosition(textLayer);
    textLayer.translate(new UnitValue(64 - position.topLeftX, "px"), new UnitValue(doc.height.as("px") - position.height - position.topLeftY - MARGIN - exifWatermarkHeight - DISTANCE, "px",),);
}

function getLayerPosition(textLayer) {
    var topLeftX = textLayer.bounds[0].as("px");
    var topLeftY = textLayer.bounds[1].as("px");
    var bottomRightY = textLayer.bounds[3].as("px");
    var height = bottomRightY - topLeftY;

    return {topLeftX: topLeftX, topLeftY: topLeftY, height: height};
}

function setTextItem(textItem, contents, size, color, font, capitalization) {
    textItem.contents = contents;
    textItem.size = size;
    textItem.color.rgb.hexValue = color;
    textItem.font = font;
    textItem.capitalization = capitalization;
}

function getContents(exif) {
    return [
        getFocalStr(exif.focal), exif.aperture, getShutterStr(exif.shutter), getISOStr(exif.iso)
    ].join("  ");
}

function getFocalStr(aperture) {
    return Math.round(parseInt(aperture.split(" ")[0]) * CROP_FACTOR) + "mm";
}

function getShutterStr(shutter) {
    return shutter.split(" ")[0] + "s";
}

function getISOStr(iso) {
    return "ISO " + iso;
}

function saveProcessedFile(doc, folder) {
    var saveOptions = new JPEGSaveOptions();
    saveOptions.quality = 10;
    saveOptions.embedColorProfile = true;
    var savePath = new File(folder + "/" + doc.name.replace(/\.[^.]+$/, "_watermarked.jpg"));

    doc.saveAs(savePath, saveOptions, true);
}

main();
