import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";


export class DefaultChartInfo extends ChartInfoTemplate<void>{

    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string){
        super(parsedCSV, panel, fileName);
        this.organizedCSV = null;
    }


    protected organizedCSV: null;

    generateUpdateChartDataPayload(): void {
        
    }

    onCodeSelectedFidPc(selectedFid: number, selectedPc: number): void {
    }
}