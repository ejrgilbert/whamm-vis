"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFromFile = parseFromFile;
exports.parseFromString = parseFromString;
const Papa = __importStar(require("papaparse"));
const fs = __importStar(require("fs"));
/**
 *
 * @param {string}  filePath The path to the file
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromFile(filePath) {
    let csvFile = fs.readFileSync(filePath, 'utf8');
    return parseFromString(csvFile);
}
/**
 *
 * @param {string} CSV The CSV to be parsed
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
function parseFromString(CSV) {
    let result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    let data = result.data;
    for (let i = 0; i < data.length; i++) {
        // Splits fid and pc, does leave fid:pc if needed/wanted
        if (data[i]["fid:pc"] && !(data[i]["fid"] && data[i]["pc"])) {
            let fidPc = data[i]["fid:pc"];
            let splitFidPc = fidPc.split(":");
            data[i]["fid"] = parseInt(splitFidPc[0]);
            data[i]["pc"] = parseInt(splitFidPc[1]);
        }
        else if (data[i]["fid"] && data[i]["pc"] && !data[i]["fid:pc"]) {
            data[i]["fid:pc"] = data[i].fid + ":" + data[i].pc;
        }
        // Turns value(s) into a number if it can be
        let value = data[i]["value(s)"];
        if (!Number.isNaN(parseFloat(value))) { // If value is a number
            data[i]["value(s)"] = parseFloat(value);
        }
    }
    return data;
}
// Allows calling from CLI
if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <csv-file-path>");
        process.exit(1);
    }
    const data = parseFromFile(filePath);
    console.log(data);
}
//# sourceMappingURL=parseCSV.js.map