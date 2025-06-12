import * as Papa from "papaparse";
import * as fs from "fs";

export interface CSVRow {
    id: string;           // or number, if you want to parseInt
    "id_type": string;
    name: string;
    "whamm_type": string;
    "wasm_type": string;
    "script_id": string;
    "probe_id": string;
    "value(s)": string;
    fid: number;         // added by your code
    pc: number;          // added by your code
}

/**
 *
 * @param {string}  filePath The path to the file
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
export function parseFromFile(filePath: string): CSVRow[] {
    let csvFile = fs.readFileSync(filePath, 'utf8');
    return parseFromString(csvFile)
}
/**
 *
 * @param {string} CSV The CSV to be parsed
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
export function parseFromString(CSV: string): CSVRow[] {
    let result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    let data = result.data as any[]

    for (let i = 0; i < data.length; i++) {
        // Splits fid and pc, does leave fid:pc if needed/wanted
        if (data[i]["fid:pc"]){
            let fidPc = data[i]["fid:pc"]
            let splitFidPc = fidPc.split(":")
            data[i]["fid"] = parseInt(splitFidPc[0])
            data[i]["pc"] = parseInt(splitFidPc[1])
        }
        // Turns value(s) into a number if it can be
        let value = data[i]["value(s)"]
        if(!Number.isNaN(parseInt(value))){ // If value is a number
            data[i]["value(s)"] = parseInt(value)
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