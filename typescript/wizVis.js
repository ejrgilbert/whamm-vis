"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizVisFromFile = wizVisFromFile;
exports.wizVisFromString = wizVisFromString;
var parseCSV = require("./parseCSV");
var ct = require("./coloredText");
/**
 * Returns a nicely formated monitor
 * @param filePath
 */
function wizVisFromFile(filePath, colored) {
    if (colored === void 0) { colored = false; }
    var data = parseCSV.parseFromFile(filePath);
    if (colored) {
        return coloredWizVis(data);
    }
    else {
        return wizVis(data);
    }
}
/**
 * Returns a nicely formated monitor
 * @param csv
 * @returns
 */
function wizVisFromString(csv) {
    var data = parseCSV.parseFromString(csv);
    return wizVis(data);
}
/**
 * Formats the csv object
 * @param csv The CSV to format
 * @returns A string of the csv formatted
 */
function wizVis(csv) {
    var _a, _b, _c, _d;
    // Organizes the data by fid then by pc
    var fidToPcToLine = new Map();
    for (var _i = 0, csv_1 = csv; _i < csv_1.length; _i++) {
        var line = csv_1[_i];
        if (!fidToPcToLine.get(line["fid"])) {
            fidToPcToLine.set(line["fid"], new Map());
        }
        if (!((_a = fidToPcToLine.get(line["fid"])) === null || _a === void 0 ? void 0 : _a.get(line["pc"]))) {
            (_b = fidToPcToLine.get(line["fid"])) === null || _b === void 0 ? void 0 : _b.set(line["pc"], []);
        }
        (_d = (_c = fidToPcToLine.get(line["fid"])) === null || _c === void 0 ? void 0 : _c.get(line["pc"])) === null || _d === void 0 ? void 0 : _d.push(line);
    }
    var outputString = "";
    var fids = fidToPcToLine.keys();
    for (var _e = 0, _f = Array.from(fids); _e < _f.length; _e++) {
        var fid = _f[_e];
        outputString += "func #".concat(fid, ":\n");
        var innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {
            continue;
        }
        var pcs = innerMap.keys();
        for (var _g = 0, _h = Array.from(pcs); _g < _h.length; _g++) {
            var pc = _h[_g];
            var lines = innerMap.get(pc);
            if (!lines || (lines === null || lines === void 0 ? void 0 : lines.length) === 0) {
                continue;
            }
            var opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            outputString += "\t +" + pc + " " + opcode + ":\t[";
            outputString += lines.map(function (obj) { return obj['value(s)']; }).join(", ");
            outputString += "]\n";
        }
    }
    return outputString;
}
/**
 * Formats the csv object with colors
 * @param csv The CSV to format
 * @returns A string of the csv formatted
 */
function coloredWizVis(csv) {
    var _a, _b, _c, _d;
    // Organizes the data by fid then by pc
    var fidToPcToLine = new Map();
    for (var _i = 0, csv_2 = csv; _i < csv_2.length; _i++) {
        var line = csv_2[_i];
        if (!fidToPcToLine.get(line["fid"])) {
            fidToPcToLine.set(line["fid"], new Map());
        }
        if (!((_a = fidToPcToLine.get(line["fid"])) === null || _a === void 0 ? void 0 : _a.get(line["pc"]))) {
            (_b = fidToPcToLine.get(line["fid"])) === null || _b === void 0 ? void 0 : _b.set(line["pc"], []);
        }
        (_d = (_c = fidToPcToLine.get(line["fid"])) === null || _c === void 0 ? void 0 : _c.get(line["pc"])) === null || _d === void 0 ? void 0 : _d.push(line);
    }
    var outputString = "";
    var fids = fidToPcToLine.keys();
    for (var _e = 0, _f = Array.from(fids); _e < _f.length; _e++) {
        var fid = _f[_e];
        outputString += "func #".concat(fid, ":\n"); // The function label
        var innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {
            continue;
        }
        var pcs = innerMap.keys();
        for (var _g = 0, _h = Array.from(pcs); _g < _h.length; _g++) {
            var pc = _h[_g];
            var lines = innerMap.get(pc);
            if (!lines || (lines === null || lines === void 0 ? void 0 : lines.length) === 0) {
                continue;
            }
            var opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            outputString += "\t " + ct.cyan("+" + pc) + " " + ct.green(opcode) + ":\t["; // The program counter and opcode
            var values = lines.map(function (obj) { return obj["value(s)"] ?
                ct.magenta(obj.name + ": " + obj['value(s)']) :
                ct.grey(obj.name + ": " + obj['value(s)']); }); // The data
            outputString += values.join(", "); // The data
            outputString += "]\n";
        }
    }
    return outputString;
}
// Allows calling from CLI
if (require.main === module) {
    var filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <csv-file-path>");
        process.exit(1);
    }
    var data = wizVisFromFile(filePath, true);
    console.log(data);
}
