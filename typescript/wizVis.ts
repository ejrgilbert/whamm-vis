import * as parseCSV from './parseCSV'

/**
 * Prints out a a nicely formated br monitor
 * @param {string} filePath 
 */
export function wizVisFromFile(filePath: string): string{
    let data = parseCSV.parseFromFile(filePath)
    // Organizes the data by fid then by pc
    let fidToPcToLine: Map<number, Map<number, parseCSV.CSVRow[]>> = new Map()
    for (let line of data) {
        if (!fidToPcToLine.get(line["fid"])){
            fidToPcToLine.set(line["fid"], new Map())
        }
        if (!fidToPcToLine.get(line["fid"])?.get(line["pc"])) {
            fidToPcToLine.get(line["fid"])?.set(line["pc"], [])
        }
        fidToPcToLine.get(line["fid"])?.get(line["pc"])?.push(line)
        
    }

    let outputString = ""

    let fids = fidToPcToLine.keys()
    for (let fid of Array.from(fids)) {
        outputString += `func #${fid}:\n`
        let innerMap = fidToPcToLine.get(fid)
        if (!innerMap) {continue}
        let pcs = innerMap.keys()
        for (let pc of Array.from(pcs)) {
            let lines = innerMap.get(pc)
            if (!lines || lines?.length === 0) {continue}
            let opcode = lines[0].probe_id.split(":")[2] // Gets the opcode (after #_wasm:opcode: and before :mode)
            outputString += `\t +${pc} ${opcode}:\t[`
            outputString += lines.map(obj => obj['value(s)']).join(", ")
            outputString += "]\n"
        }
    }
    return outputString
}   

// Allows calling from CLI
if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node parseCSV.js <csv-file-path>");
        process.exit(1);
    }
    const data = wizVisFromFile(filePath);
    console.log(data);
}


// func "main":
//   +13 br_if:     [1, 0]
// func "call_target":
//    +5 br_if:     [1, 0]