"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coloredText = coloredText;
exports.black = black;
exports.red = red;
exports.green = green;
exports.yellow = yellow;
exports.blue = blue;
exports.magenta = magenta;
exports.cyan = cyan;
exports.white = white;
exports.grey = grey;
exports.printColorCodes = printColorCodes;
function coloredText(text, colorCode) {
    return "\u001B[38;5;".concat(colorCode, "m").concat(String(text), "\u001B[0m");
}
function black(text) {
    return coloredText(text, 0);
}
function red(text) {
    return coloredText(text, 1);
}
function green(text) {
    return coloredText(text, 2);
}
function yellow(text) {
    return coloredText(text, 3);
}
function blue(text) {
    return coloredText(text, 4);
}
function magenta(text) {
    return coloredText(text, 5);
}
function cyan(text) {
    return coloredText(text, 6);
}
function white(text) {
    return coloredText(text, 7);
}
function grey(text) {
    return coloredText(text, 235);
}
function printColorCodes() {
    for (var i = 0; i < 256; i++) {
        process.stdout.write(coloredText(i + " ", i));
    }
    console.log();
}
printColorCodes();
