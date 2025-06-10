"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFromFile = parseFromFile;
exports.parseFromString = parseFromString;
var Papa = require("papaparse");
var fs = require("fs");
/**
 *
 * @param {string}  filePath The path to the file
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromFile(filePath) {
    var csvFile = fs.readFileSync(filePath, 'utf8');
    return parseFromString(csvFile);
}
/**
 *
 * @param {string} CSV The CSV to be parsed
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromString(CSV) {
    var result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    var data = result.data;
    // Splits fid and pc, does leave fid:pc if needed/wanted
    for (var i = 0; i < data.length; i++) {
        var fidPc = data[i]["fid:pc"];
        var splitFidPc = fidPc.split(":");
        data[i]["fid"] = parseInt(splitFidPc[0]);
        data[i]["pc"] = parseInt(splitFidPc[1]);
    }
    return data;
}
// Allows calling from CLI
if (require.main === module) {
    var filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <csv-file-path>");
        process.exit(1);
    }
    var data = parseFromFile(filePath);
    console.log(data);
}
