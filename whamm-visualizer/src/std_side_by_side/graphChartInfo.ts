import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as cDFuncs from '../chartDataFunctions';
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";

type graphPayload = {
    chartData: cDFuncs.graphChartData[],
    title: string,
    selfLoopSVG: string;
}

export class GraphChartInfo extends ChartInfoTemplate<graphPayload>{

    public chartScriptFileName(): string { return 'graphChart.js';}

    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string, selfLoopSVG: string){
        super(parsedCSV, panel);
        this.fileName = fileName;
        this.selfLoopSVG = selfLoopSVG;
        this.organizedCSV = cDFuncs.formatCSVMap(parsedCSV);
    }

    /**
     * The file name of the .csv file
     */
    private readonly fileName: string;

    /**
     * The path data of the self loop SVG
     */
    private readonly selfLoopSVG: string;

    protected organizedCSV: Map<[number, number], number>;

    generateUpdateChartDataPayload(): graphPayload {
        let nodeToData: Map<number, cDFuncs.graphChartData> = new Map();
        for (let entry of this.organizedCSV){
            if (!nodeToData.has(entry[0][0])){
                nodeToData.set(entry[0][0], {graphChart: true, nodeName: entry[0][0], edges: [], weight: 0});
            }
            if (!nodeToData.has(entry[0][1])){
                nodeToData.set(entry[0][1], {graphChart: true, nodeName: entry[0][1], edges: [], weight: 0});
            }
            nodeToData.get(entry[0][0])!.edges.push([entry[0][1], entry[1]]);
            nodeToData.get(entry[0][1])!.weight += entry[1];
        }
        const data = Array.from(nodeToData.values());
        const payload: graphPayload = {
            chartData: data,
            title: this.fileName,
            selfLoopSVG: this.selfLoopSVG
        };

        return payload;
    }

    onCodeSelectedFidPc(selectedFid: number, selectedPc: number ): void {
        if (selectedFid !== -1){
            
            this.panel.webview.postMessage({
                command: 'selectNode',
                payload: {
                    selectedNode: selectedFid
                }
            });
        }
    }
}