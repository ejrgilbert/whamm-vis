import * as parseCSV from './parseCSV';

/**
 * The format that the pie chart displayers can read
 */
export type pieChartData = {
    data: { value: number; name: string }[];
    title: string;
    subtitle: string;
    dataGroupId: string;
}

/**
 * The format that the graph display can read
 */
export type graphChartData = {
    nodeName: string;
    edges: [string, number][];
    weight: number;
}

type chartData = pieChartData;

/**
 * Formats the data in the map to a format usable by the chart displayers 
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link pieChartData}
 * @returns A {@link pieChartData} array
 */
export function getChartData(fidToPcToPidToLine: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>, mapping: (lines: parseCSV.CSVRow[]) => chartData): chartData[]{

    let output: chartData[] = [];

    let fids = fidToPcToPidToLine.keys();
    for (let fid of Array.from(fids)) {
        // let innerMap = fidToPcToPidToLine.get(fid);
        // if (!innerMap) {continue;}
        // let pcs = innerMap.keys();
        // for (let pc of Array.from(pcs)) {
        //     let innerInnerMap = fidToPcToPidToLine.get(fid)?.get(pc);
        //     if (!innerInnerMap) {continue;}
        //     let pids = innerInnerMap.keys();
        //     for (let pid of Array.from(pids)){
        //         let lines = innerInnerMap.get(pid);
        //         if (!lines || lines?.length === 0) {continue;}
        //         let entry:pieChartData = mapping(lines);
        //         output.push(entry);
        //     }
        // }
        output = output.concat(getChartDataByFid(fidToPcToPidToLine, fid, mapping));
    }
    return output;
}

/**
 * Formats the data in the map to a format usable by the chart displayers, filtered by *Function ID* 
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param fid The *Function ID* to filter by
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link pieChartData}
 * @returns A {@link pieChartData} array
 */
export function getChartDataByFid(fidToPcToPidToLine: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>, fid: number, mapping: (lines: parseCSV.CSVRow[]) => chartData): chartData[]{
    let output: chartData[] = [];
    let innerMap = fidToPcToPidToLine.get(fid);
    if (!innerMap) {return output;}
    let pcs = innerMap.keys();
    for (let pc of Array.from(pcs)) {
        // let innerInnerMap = fidToPcToPidToLine.get(fid)?.get(pc);
        // if (!innerInnerMap) {continue;}
        // let pids = innerInnerMap.keys();
        // for (let pid of Array.from(pids)){
        //     let lines = innerInnerMap.get(pid);
        //     if (!lines || lines?.length === 0) {continue;}
        //     let entry:pieChartData = mapping(lines);
        //     output.push(entry);
        // }
        output = output.concat(getChartDataByFidAndPc(fidToPcToPidToLine, fid, pc, mapping));
    }
    return output;
}

/**
 * Formats the data in the map to a format usable by the chart displayers, filtered by *Function ID* and *Program Counter*
 * @param fidToPcToPidToLine A map from *Function ID* to *Program Counter* to *Probe ID* to an array of {@link parseCSV.CSVRow}
 * @param fid The *Function ID* to filter by
 * @param pc The *Program Counter* to filter by
 * @param mapping A function which takes an array of {@link parseCSV.CSVRow} and maps it to a {@link pieChartData}
 * @returns A {@link pieChartData} array
 */
export function getChartDataByFidAndPc(fidToPcToPidToLine: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>, fid: number, pc: number, mapping: (lines: parseCSV.CSVRow[]) => chartData): chartData[]{
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

export function getGraphChartData(chartMap: Map<[number,number], number>): graphChartData[]{
    let nodeToData: Map<number, graphChartData> = new Map();
    for (let entry of chartMap){
        if (!nodeToData.has(entry[0][0])){
            nodeToData.set(entry[0][0], {nodeName: 'FID: ' + entry[0][0], edges: [], weight: 0});
        }
        if (!nodeToData.has(entry[0][1])){
            nodeToData.set(entry[0][1], {nodeName: 'FID: ' + entry[0][1], edges: [], weight: 0});
        }
        nodeToData.get(entry[0][0])!.edges.push(['FID: ' + entry[0][1], entry[1]]);
        nodeToData.get(entry[0][1])!.weight += entry[1];
    }
    return Array.from(nodeToData.values());
}