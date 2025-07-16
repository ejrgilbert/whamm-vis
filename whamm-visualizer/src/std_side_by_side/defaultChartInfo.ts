import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";


export class DefaultChartInfo extends ChartInfoTemplate<void>{

    public chartScriptFileName(): string { return 'defaultChart.js';}

    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel){
        super(parsedCSV, panel);
        this.organizedCSV = null;
    }


    protected organizedCSV: null;

    generateUpdateChartDataPayload(): void {
    }

    onCodeSelectedFidPc(selectedFid: number, selectedPc: number): void {
    }
}