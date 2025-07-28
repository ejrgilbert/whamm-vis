import * as parseCSV from './parseCSV';
import * as ct from './coloredText';

/**
 * Returns a nicely formated monitor
 * @param filePath 
 */
export function wizVisFromFile(filePath: string, colored: boolean = false, greyZero:boolean = false): string{
    let data = parseCSV.parseFromFile(filePath);
    if (colored) {
        return coloredWizVis(data, greyZero);
    } else {
        return wizVis(data);
    }
}

/**
 * Returns a nicely formated monitor
 * @param csv 
 * @returns 
 */
export function wizVisFromString(csv:string, colored: boolean = false, greyZero:boolean = false): string{
    let data = parseCSV.parseFromString(csv);
    if (colored) {
        return coloredWizVis(data, greyZero);
    } else {
        return wizVis(data);
    }
}

/**
 * Formats the csv object
 * @param csv The CSV to format
 * @returns A string of the csv formatted
 */
function wizVis(csv: parseCSV.CSVRow[]): string{
    // Organizes the data by fid then by pc
    let fidToPcToLine: Map<number, Map<number, parseCSV.CSVRow[]>> = new Map();
    for (let line of csv) {
        if (!fidToPcToLine.get(line["fid"]!)){
            fidToPcToLine.set(line["fid"]!, new Map());
        }
        if (!fidToPcToLine.get(line["fid"]!)?.get(line["pc"]!)) {
            fidToPcToLine.get(line["fid"]!)?.set(line["pc"]!, []);
        }
        fidToPcToLine.get(line["fid"]!)?.get(line["pc"]!)?.push(line);
        
    }

    let outputString = "";

    let fids = fidToPcToLine.keys();
    for (let fid of Array.from(fids)) {
        outputString += `func #${fid}:\n`;
        let innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {continue;}
        let pcs = innerMap.keys();
        for (let pc of Array.from(pcs)) {
            let lines = innerMap.get(pc);
            if (!lines || lines?.length === 0) {continue;}
            let opcode = lines[0].probe_id!.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            outputString += "\t +" + pc + " " + opcode + ":\t[";
            outputString += lines.map(obj => obj['value(s)']).join(", ");
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
function coloredWizVis(csv: parseCSV.CSVRow[], greyZero: boolean = false): string{
    // Organizes the data by fid then by pc
    let fidToPcToLine: Map<number, Map<number, parseCSV.CSVRow[]>> = new Map();
    for (let line of csv) {
        if (!fidToPcToLine.get(line["fid"]!)){
            fidToPcToLine.set(line["fid"]!, new Map());
        }
        if (!fidToPcToLine.get(line["fid"]!)?.get(line["pc"]!)) {
            fidToPcToLine.get(line["fid"]!)?.set(line["pc"]!, []);
        }
        fidToPcToLine.get(line["fid"]!)?.get(line["pc"]!)?.push(line);
        
    }

    let outputString = "";

    let fids = fidToPcToLine.keys();
    for (let fid of Array.from(fids)) {
        outputString += `func #${fid}:\n`; // The function label
        let innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {continue;}
        let pcs = innerMap.keys();
        for (let pc of Array.from(pcs)) {
            let lines = innerMap.get(pc);
            if (!lines || lines?.length === 0) {continue;}
            let opcode = lines[0].probe_id!.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            outputString += "\t " + ct.cyan("+" + pc) + " " + ct.green(opcode) + ":\t["; // The program counter and opcode
            
            if (greyZero) {
                let values = lines.map(obj => obj["value(s)"] ?
                    ct.magenta(obj.name  + ": " + obj['value(s)']) :
                    ct.grey(obj.name  + ": " + obj['value(s)'])); // The data
                    
                    outputString += values.join(", "); // The data
            } else {
                let values = lines.map(obj => ct.magenta(obj.name  + ": " + obj['value(s)'])); // The data
            
                outputString += values.join(", "); // The data
            }
                    
            outputString += "]\n";
        }
    }
    return outputString;
}

// Allows calling from CLI
if (require.main === module) {
    if (process.argv.length === 3){
        const filePath = process.argv[2];
        if (!filePath) {
            console.error("Usage: node parseCSV.js <csv-file-path>");
            process.exit(1);
        }
        const data = wizVisFromFile(filePath, true);
        console.log(data);
    } else if (process.argv.length === 2) {
        let input = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => input += chunk);
        process.stdin.on('end', () => {
            const csv = input.split("============================= REPORT CSV FLUSH ================================\n")[1];
            const data = wizVisFromString(csv, true);
            console.log(data);
        });
        
        
    }
}


