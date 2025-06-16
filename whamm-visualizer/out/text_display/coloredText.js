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
    return `\u001b[38;5;${colorCode}m${String(text)}\u001b[0m`;
}
function black(text) {
    return coloredText(text, 8);
}
function red(text) {
    return coloredText(text, 9);
}
function green(text) {
    return coloredText(text, 10);
}
function yellow(text) {
    return coloredText(text, 11);
}
function blue(text) {
    return coloredText(text, 12);
}
function magenta(text) {
    return coloredText(text, 13);
}
function cyan(text) {
    return coloredText(text, 14);
}
function white(text) {
    return coloredText(text, 15);
}
function grey(text) {
    return coloredText(text, 235);
}
function printColorCodes() {
    for (let i = 0; i < 256; i++) {
        process.stdout.write(coloredText(i + " ", i));
    }
    console.log();
}
//# sourceMappingURL=coloredText.js.map