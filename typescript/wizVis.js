"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizVisFromFile = wizVisFromFile;
var parseCSV = require("./parseCSV");
/**
 * Prints out a a nicely formated br monitor
 * @param {string} filePath
 */
function wizVisFromFile(filePath) {
    var _a, _b, _c, _d;
    var data = parseCSV.parseFromFile(filePath);
    // Organizes the data by fid then by pc
    var fidToPcToLine = new Map();
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var line = data_1[_i];
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
            outputString += "\t +".concat(pc, " ").concat(opcode, ":\t[");
            outputString += lines.map(function (obj) { return obj['value(s)']; }).join(", ");
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
    var data = wizVisFromFile(filePath);
    console.log(data);
}
// func "main":
//   +13 br_if:     [1, 0]
// func "call_target":
//    +5 br_if:     [1, 0]
