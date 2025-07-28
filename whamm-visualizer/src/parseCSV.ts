import * as Papa from "papaparse";
import * as fs from "fs";

export interface CSVRow {
    id?: string;           
    id_type?: string;
    name?: string;
    whamm_type?: string;
    wasm_type?: string;
    script_id?: string;
    probe_id?: string;
    "value(s)": any;
    fid?: number;         
    pc?: number;    
    "fid:pc"?: string;      
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

    let start = CSV.substring(0, 3);
    switch (start){
        case "key": // Is a map
            let properties = Object.getOwnPropertyNames(data[0]);
            let key = properties.find((str: string) => str.startsWith('key'));
            let value: string|undefined = properties.find((str: string) => str.startsWith('val'));
            if(!key){
                throw new Error("No Key Found");
            }
            if(!value){
                throw new Error("No Value Found");
            }
            let mapOutput: CSVRow[] = [];
            if(data[0][key].charAt(0) === "("){// Key is a tuple
                if(data[0][value].charAt(0) === "("){
                    for (let entry of data){
                        let keyArray = entry[key].substring(1, key.length - 2).split(",").map((str: string) => parseFloat(str));
                        let valueArray = entry[value].substring(1, key.length - 2).split(",").map((str: string) => parseFloat(str));
                        // [keys, value]
                        mapOutput.push({"value(s)": [keyArray, valueArray]});
                    }
                } else {
                    for (let entry of data){
                        let keyArray = entry[key].substring(1, key.length - 2).split(",").map((str: string) => parseFloat(str));
                        // [keys, value]
                        mapOutput.push({"value(s)": [keyArray, parseFloat(entry[value])]});
                    }
                }
            } else {
                if(data[0][value].charAt(0) === "("){
                    for (let entry of data){
                        let keyArray = parseFloat(entry[key]);
                        let valueArray = entry[value].substring(1, key.length - 2).split(",").map((str: string) => parseFloat(str));
                        // [keys, value]
                        mapOutput.push({"value(s)": [keyArray, valueArray]});
                    }
                } else {
                    for (let entry of data){
                        let keyArray = parseFloat(entry[key]);
                        // [keys, value]
                        mapOutput.push({"value(s)": [keyArray, parseFloat(entry[value])]});
                    }
                }
            }
            return mapOutput;
        default: // Standard format
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

}

// Allows calling from CLI
if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <csv-file-path>");
        process.exit(1);
    }
    let data = parseFromFile(filePath);
    console.log(data);
}