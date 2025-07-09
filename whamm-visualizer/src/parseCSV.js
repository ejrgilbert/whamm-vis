"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFromFile = parseFromFile;
exports.parseFromString = parseFromString;
exports.fidPcPidMapFromFile = fidPcPidMapFromFile;
exports.fidPcPidMapFromString = fidPcPidMapFromString;
exports.parseMapFromFile = parseMapFromFile;
exports.parseMapFromString = parseMapFromString;
var Papa = require("papaparse");
var fs = require("fs");
/**
 *
 * @param filePath The path to the file
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromFile(filePath) {
    var csvFile = fs.readFileSync(filePath, 'utf8');
    return parseFromString(csvFile);
}
/**
 *
 * @param CSV The CSV to be parsed
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromString(CSV) {
    var result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    var data = result.data;
    for (var i = 0; i < data.length; i++) {
        // Splits fid and pc, does leave fid:pc if needed/wanted
        if (data[i]["fid:pc"] && !(data[i]["fid"] && data[i]["pc"])) {
            var fidPc = data[i]["fid:pc"];
            var splitFidPc = fidPc.split(":");
            data[i]["fid"] = parseInt(splitFidPc[0]);
            data[i]["pc"] = parseInt(splitFidPc[1]);
        }
        else if (data[i]["fid"] && data[i]["pc"] && !data[i]["fid:pc"]) {
            data[i]["fid:pc"] = data[i].fid + ":" + data[i].pc;
        }
        // Turns value(s) into a number if it can be
        var value = data[i]["value(s)"];
        if (!Number.isNaN(parseFloat(value))) { // If value is a number
            data[i]["value(s)"] = parseFloat(value);
        }
        else {
            var entries = data[i]["value(s)"].split(";");
            var valueMap = new Map();
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                var pair = entry.split('->');
                var key = pair[0].substring(1, pair[0].length - 2).split(",").map(function (str) { return parseFloat(str); });
                valueMap.set(key, parseFloat(pair[1]));
            }
            data[i]["value(s)"] = valueMap;
        }
    }
    return data;
}
/**
 *
 * @param filePath The path to the file
 * @returns A Map from fid to a Map from pc to an Array of the data
 */
function fidPcPidMapFromFile(filePath) {
    var csvFile = fs.readFileSync(filePath, 'utf8');
    return fidPcPidMapFromString(csvFile);
}
/**
 *
 * @param CSV The CSV to be parsed
 * @returns A Map from fid to a Map from pc to an Array of the data
 */
function fidPcPidMapFromString(CSV) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var csvContent = parseFromString(CSV);
    var fidToPcToPidToLine = new Map();
    for (var _i = 0, csvContent_1 = csvContent; _i < csvContent_1.length; _i++) {
        var line = csvContent_1[_i];
        if (!fidToPcToPidToLine.get(line["fid"])) {
            fidToPcToPidToLine.set(line["fid"], new Map());
        }
        if (!((_a = fidToPcToPidToLine.get(line["fid"])) === null || _a === void 0 ? void 0 : _a.get(line["pc"]))) {
            (_b = fidToPcToPidToLine.get(line["fid"])) === null || _b === void 0 ? void 0 : _b.set(line["pc"], new Map());
        }
        if (!((_d = (_c = fidToPcToPidToLine.get(line["fid"])) === null || _c === void 0 ? void 0 : _c.get(line["pc"])) === null || _d === void 0 ? void 0 : _d.get(line["probe_id"]))) {
            (_f = (_e = fidToPcToPidToLine.get(line["fid"])) === null || _e === void 0 ? void 0 : _e.get(line["pc"])) === null || _f === void 0 ? void 0 : _f.set(line["probe_id"], []);
        }
        (_j = (_h = (_g = fidToPcToPidToLine.get(line["fid"])) === null || _g === void 0 ? void 0 : _g.get(line["pc"])) === null || _h === void 0 ? void 0 : _h.get(line["probe_id"])) === null || _j === void 0 ? void 0 : _j.push(line);
    }
    return fidToPcToPidToLine;
}
function parseMapFromFile(filePath) {
    var csvFile = fs.readFileSync(filePath, 'utf8');
    return parseMapFromString(csvFile);
}
function parseMapFromString(CSV) {
    var result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    var data = result.data;
    var properties = Object.getOwnPropertyNames(data[0]);
    var key = properties.find(function (str) { return str.startsWith('key'); });
    var value = properties.find(function (str) { return str.startsWith('val'); });
    if (!key) {
        console.log("No key");
        console.log(data[0]);
        return new Map();
    }
    if (!value) {
        console.log("No value");
        return new Map();
    }
    var output = new Map();
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var entry = data_1[_i];
        output.set(entry[key].substring(1, key.length - 2).split(",").map(function (str) { return parseFloat(str); }), parseFloat(entry[value]));
    }
    return output;
}
// Allows calling from CLI
if (require.main === module) {
    var type = process.argv[2];
    var filePath = process.argv[3];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <std or map> <csv-file-path>");
        process.exit(1);
    }
    var data = void 0;
    switch (type) {
        case "std":
            data = parseFromFile(filePath);
            break;
        case "map":
            data = parseMapFromFile(filePath);
            break;
    }
    console.log(data);
}
