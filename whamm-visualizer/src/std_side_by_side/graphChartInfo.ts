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
    generateDropdown(): string {
        let output = '<label for="chart-specific-dropdown">Choose FID</label>';
        output += '<select id="chart-specific-dropdown">';
        for (let fid of this.fids){
            output += `<option value="${fid}">${fid}</option>\n`;
        }
        output += '</select>';
        return output;
    }
    onDropdownChange(selectedValue: string): void {
        this.onCodeSelectedFidPc(Number.parseInt(selectedValue), -1);
    }

    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string, selfLoopSVG: string){
        super(parsedCSV, panel, fileName);
        this.selfLoopSVG = selfLoopSVG;

        const csvContent = cDFuncs.formatCSVMap(parsedCSV);
        this.organizedCSV = new Map();
        for (let entry of csvContent){
            if (!this.organizedCSV.has(entry[0][0])){
                this.organizedCSV.set(entry[0][0], {graphChart: true, nodeName: entry[0][0], edges: [], weight: 0});
            }
            if (!this.organizedCSV.has(entry[0][1])){
                this.organizedCSV.set(entry[0][1], {graphChart: true, nodeName: entry[0][1], edges: [], weight: 0});
            }
            this.organizedCSV.get(entry[0][0])!.edges.push([entry[0][1], entry[1]]);
            this.organizedCSV.get(entry[0][1])!.weight += entry[1];
        }

        this.fids = Array.from(this.organizedCSV.keys()).sort((a, b) => a - b);
    }

    /**
     * The path data of the self loop SVG
     */
    private readonly selfLoopSVG: string;

    protected organizedCSV: Map<number, cDFuncs.graphChartData>;

    /**
     * List of all fids in the chart
     */
    private fids: number[];

    generateUpdateChartDataPayload(): graphPayload {
        
        const data = Array.from(this.organizedCSV.values());

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