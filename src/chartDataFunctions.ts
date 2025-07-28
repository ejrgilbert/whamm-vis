import {CSVRow} from './parseCSV';

/**
 * The format that the pie chart displayers can read
 */
export type pieChartData = {
    pieChart: true;
    data: { value: number; name: string }[];
    title: string;
    subtitle: string;
    dataGroupId: string;
}

/**
 * Checks if a `chartData` object is a `pieChartData` object
 * @param data Data to check
 * @returns If data is a `pieChartData`
 */
export function isPieChartData(data: chartData): data is pieChartData {
    return "pieChart" in data;
}

/**
 * The format that the graph display can read
 */
export type graphChartData = {
    graphChart: true;
    nodeName: string | number;
    edges: [string | number, number][];
    weight: number;
}

/**
 * Checks if a `chartData` object is a `graphChartData` object
 * @param data Data to check
 * @returns If data is a `graphChartData`
 */
export function isGraphChartData(data: chartData): data is graphChartData {
    return "graphChart" in data;
}

/**
 * the format that the memory hotness display can read
 */
export type memoryHotnessChartData = {
    memoryHotnessChart: true;
    location: number,
    value: number
}

/**
 * Checks if a `chartData` object is a `memoryHotnessChartData` object
 * @param data Data to check
 * @returns If data is a `memoryHotnessChartData`
 */
export function isMemoryHotnessChartData(data: chartData): data is memoryHotnessChartData {
    return "memoryHotnessChart" in data;
}

export type chartData = pieChartData | graphChartData | memoryHotnessChartData;

/**
 * A map from `fid` to a map from `pc` to a map from `probe_id` to a CSVRow[]
 */
export type FidPcPidMap = Map<number, Map<number, Map<string, CSVRow[]>>>;

/**
 * Formats the data in the map to a format usable by the chart displayers 
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link chartData}
 * @returns A {@link chartData} array
 */
export function getChartDataFromFidPcPidMap(fidToPcToPidToLine: FidPcPidMap, mapping: (lines: CSVRow[]) => chartData): chartData[]{

    let output: chartData[] = [];

    let fids = fidToPcToPidToLine.keys();
    for (let fid of Array.from(fids)) {
        output = output.concat(getChartDataByFid(fidToPcToPidToLine, fid, mapping));
    }
    return output;
}

/**
 * Formats the data in the map to a format usable by the chart displayers, filtered by *Function ID* 
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param fid The *Function ID* to filter by
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link chartData}
 * @returns A {@link chartData} array
 */
export function getChartDataByFid(fidToPcToPidToLine: FidPcPidMap, fid: number, mapping: (lines: CSVRow[]) => chartData): chartData[]{
    let output: chartData[] = [];
    let innerMap = fidToPcToPidToLine.get(fid);
    if (!innerMap) {return output;}
    let pcs = innerMap.keys();
    for (let pc of Array.from(pcs)) {
        output = output.concat(getChartDataByFidAndPc(fidToPcToPidToLine, fid, pc, mapping));
    }
    return output;
}

/**
 * Formats the data in the map to a format usable by the chart displayers, filtered by *Function ID* and *Program Counter*
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param fid The *Function ID* to filter by
 * @param pc The *Program Counter* to filter by
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link chartData}
 * @returns A {@link chartData} array
 */
export function getChartDataByFidAndPc(fidToPcToPidToLine: FidPcPidMap, fid: number, pc: number, mapping: (lines: CSVRow[]) => chartData): chartData[]{
    let output: chartData[] = [];
    let innerMap = fidToPcToPidToLine.get(fid);
    if (!innerMap) {return output;}
    let innerInnerMap = fidToPcToPidToLine.get(fid)?.get(pc);
    if (!innerInnerMap) {return output;}

    let pids = innerInnerMap.keys();
    for (let pid of Array.from(pids)){
        let lines = innerInnerMap.get(pid);
        if (!lines || lines?.length === 0) {continue;}
        let entry:chartData = mapping(lines);
        output.push(entry);
    }
    return output;
}

/**
 * Organizes CSVRow[] into a map from `fid` to a map from `pc` to a map from `probe_id` to a CSVRow[]
 * @param csvContent The CSV content
 * @returns A map from `fid` to a map from `pc` to a map from `probe_id` to a CSVRow[]
 */
export function organizeCSVByFidPcPid(csvContent: CSVRow[]): FidPcPidMap{
    const fidToPcToPidToLine: FidPcPidMap = new Map();
        for (const line of csvContent) {
            // Ensure the keys we need for grouping exist and are valid.
            if (line.fid === undefined || line.pc === undefined || line.probe_id === undefined) {
                continue;
            }
    
            // Get or create the map for the fid
            let pcToPidToLine = fidToPcToPidToLine.get(line.fid);
            if (!pcToPidToLine) {
                pcToPidToLine = new Map<number, Map<string, CSVRow[]>>();
                fidToPcToPidToLine.set(line.fid, pcToPidToLine);
            }
    
            // Get or create the map for the pc
            let pidToLine = pcToPidToLine.get(line.pc);
            if (!pidToLine) {
                pidToLine = new Map<string, CSVRow[]>();
                pcToPidToLine.set(line.pc, pidToLine);
            }
    
            // Get or create the array for the probe_id
            let lines = pidToLine.get(line.probe_id);
            if (!lines) {
                lines = [];
                pidToLine.set(line.probe_id, lines);
            }
    
            lines.push(line);
        }
    
        return fidToPcToPidToLine;
}

/**
 * Organizes the CSVRow[] by the first key of the map
 * @param csvContent An array of CSVRow where "value(s)" is of the format [[key 1, key 2], value]
 * @returns A map from the the keys to the value
 */
export function formatCSVMap(rows: CSVRow[]): Map<any, any>{
    let output: Map<[number, number], number> = new Map();
    for (let row of rows){
        let values: [any, any] = row["value(s)"];
        output.set(values[0], values[1]);
    }
    return output;
}

/**
 * Formats a map into a format usable by the graph displayer
 * @param chartMap A map from [number, number] to another number
 * @returns a {@link graphChartData} array
 */
export function getGraphChartData(chartMap: Map<[number,number], number>): graphChartData[]{
    let nodeToData: Map<number, graphChartData> = new Map();
    for (let entry of chartMap){
        if (!nodeToData.has(entry[0][0])){
            nodeToData.set(entry[0][0], {graphChart: true, nodeName: entry[0][0], edges: [], weight: 0});
        }
        if (!nodeToData.has(entry[0][1])){
            nodeToData.set(entry[0][1], {graphChart: true, nodeName: entry[0][1], edges: [], weight: 0});
        }
        nodeToData.get(entry[0][0])!.edges.push([entry[0][1], entry[1]]);
        nodeToData.get(entry[0][1])!.weight += entry[1];
    }
    return Array.from(nodeToData.values());
}