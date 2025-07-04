import * as Papa from "papaparse";
import * as fs from "fs";

export interface CSVRow {
    id: string;           
    id_type: string;
    name: string;
    whamm_type: string;
    wasm_type: string;
    script_id: string;
    probe_id: string;
    "value(s)": any;
    fid: number;         
    pc: number;    
    "fid:pc": string;      
}

/**
 *
 * @param filePath The path to the file
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
export function parseFromFile(filePath: string): CSVRow[] {
    let csvFile = fs.readFileSync(filePath, 'utf8');
    return parseFromString(csvFile);
}
/**
 *
 * @param CSV The CSV to be parsed
 * @returns An array/dictionary/map of header (string) to data (as a string)
 */
export function parseFromString(CSV: string): CSVRow[] {
    let result = Papa.parse(CSV, {
        header: true,
        skipEmptyLines: true,
        delimiter: ", "
    });
    let data = result.data as any[];

    for (let i = 0; i < data.length; i++) {
        // Splits fid and pc, does leave fid:pc if needed/wanted
        if (data[i]["fid:pc"] && !(data[i]["fid"] && data[i]["pc"])){
            let fidPc = data[i]["fid:pc"];
            let splitFidPc = fidPc.split(":");
            data[i]["fid"] = parseInt(splitFidPc[0]);
            data[i]["pc"] = parseInt(splitFidPc[1]);
        } else if (data[i]["fid"] && data[i]["pc"] && !data[i]["fid:pc"]){
            data[i]["fid:pc"] = data[i].fid + ":" + data[i].pc;
        }
        // Turns value(s) into a number if it can be
        let value = data[i]["value(s)"];
        if(!Number.isNaN(parseFloat(value))){ // If value is a number
            data[i]["value(s)"] = parseFloat(value);
        }
    }


    return data;
}

/**
 * 
 * @param filePath The path to the file
 * @returns A Map from fid to a Map from pc to an Array of the data
 */
export function fidPcPidMapFromFile(filePath: string): Map<number, Map<number, Map<string, CSVRow[]>>> {
    let csvFile = fs.readFileSync(filePath, 'utf8');
    return fidPcPidMapFromString(csvFile);
}

/**
 * 
 * @param CSV The CSV to be parsed
 * @returns A Map from fid to a Map from pc to an Array of the data
 */
export function fidPcPidMapFromString(CSV: string): Map<number, Map<number, Map<string, CSVRow[]>>> {
    let csvContent = parseFromString(CSV);
    
    let fidToPcToPidToLine: Map<number, Map<number, Map<string, CSVRow[]>>> = new Map();
    for (let line of csvContent) {
        if (!fidToPcToPidToLine.get(line["fid"])){
            fidToPcToPidToLine.set(line["fid"], new Map());
        }
        if (!fidToPcToPidToLine.get(line["fid"])?.get(line["pc"])) {
            fidToPcToPidToLine.get(line["fid"])?.set(line["pc"], new Map());
        }
        if (!fidToPcToPidToLine.get(line["fid"])?.get(line["pc"])?.get(line["probe_id"])) {
            fidToPcToPidToLine.get(line["fid"])?.get(line["pc"])?.set(line["probe_id"], []);
        }
        fidToPcToPidToLine.get(line["fid"])?.get(line["pc"])?.get(line["probe_id"])?.push(line);
        
    }

    return fidToPcToPidToLine;
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