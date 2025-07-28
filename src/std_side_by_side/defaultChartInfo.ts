import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";


export class DefaultChartInfo extends ChartInfoTemplate<void>{
    generateDropdown(): string {
        let output = '<label for="chart-specific-dropdown">Choices Unavailable</label>';
        output += '<select id="chart-specific-dropdown" disabled>';
        output += `<option value="default">Default Option</option>\n`;
        output += '</select>';
        return output;
    }
    onDropdownChange(selectedValue: string): void {
        throw new Error("Something went wrong with DefaultChartInfo.onDropdownChange() as the dropdown cannot change on default");
    }

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