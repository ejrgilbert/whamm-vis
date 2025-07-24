import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as cDFuncs from '../chartDataFunctions';
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";

type memoryHotnessChartPayload = {
    title: string;
    chartData: cDFuncs.memoryHotnessChartData[];
    maxValue: number;
    xSize: number;
    ySize:number;
}

export class MemoryHotnessChartInfo extends ChartInfoTemplate<memoryHotnessChartPayload>{
    
    generateDropdown(): string {
        let output = '<label for="chart-specific-dropdown">Choose Page</label>';
        output += '<select id="chart-specific-dropdown">';
        output += `<option value="all">All</option>\n`;
        let pageNumbers = Array.from(this.organizedCSV.keys()).sort((a, b) => a - b);
        for (let page of pageNumbers){
            output += `<option value="${page}">${page}</option>\n`;
        }
        output += '</select>';
        return output;
    }
    onDropdownChange(selectedValue: string): void {
        this.currentPage = selectedValue;
        const payload = this.generateUpdateChartDataPayload();
        this.panel.webview.postMessage({
            command: 'updateChartData',
            payload: payload
        });
    }

    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string){
        super(parsedCSV, panel, fileName);
        this.organizedCSV = new Map();
        for (let row of parsedCSV){
            let values = row['value(s)'] as [number, number];
            let page = Math.floor(values[0] / 65536);
            if (!this.organizedCSV.has(page)){
                this.organizedCSV.set(page, {data: [], maxAccessed: 0, totalAccessed: 0});
            }
            let pageData = this.organizedCSV.get(page)!;
            pageData.data.push(values);
            pageData.totalAccessed += values[1];
            pageData.maxAccessed = Math.max(pageData.maxAccessed, values[1]);
        }
        this.currentPage = 'all';
    }
       

    protected organizedCSV: Map<number, {data: [number, number][], maxAccessed: number, totalAccessed: number}>;

    private currentPage: string;

    generateUpdateChartDataPayload(): memoryHotnessChartPayload {
        if(this.currentPage === 'all'){
            const chartData: cDFuncs.memoryHotnessChartData[] = [];
            let maxValue = 0;
            let maxPageNumber = 0;
            for (let pageNumber of Array.from(this.organizedCSV.keys())){
                let pageData = this.organizedCSV.get(pageNumber)!;
                chartData.push({
                    memoryHotnessChart: true,
                    location: pageNumber,
                    value: pageData.totalAccessed
                });
                maxValue = Math.max(maxValue, pageData.totalAccessed);
                maxPageNumber = Math.max(maxPageNumber, pageNumber);
                
            }
            const sqrtAmount = Math.sqrt(maxPageNumber + 1);
            const payload: memoryHotnessChartPayload = {
                title: this.fileName,
                chartData: chartData,
                maxValue: maxValue,
                xSize: Math.ceil(sqrtAmount),
                ySize: Math.ceil(sqrtAmount)
            };

            return payload;
        }// else the rest of this function


        const pageInfo = this.organizedCSV.get(parseInt(this.currentPage));
        if (!pageInfo){
            throw new Error('No data for this page');
        }
        const chartData: cDFuncs.memoryHotnessChartData[] = [];
        for (let tuple of pageInfo.data){
            chartData.push({
                memoryHotnessChart: true,
                location: tuple[0] % 65536,
                value: tuple[1]
            });
            
        }
        const payload: memoryHotnessChartPayload = {
            title: this.fileName,
            chartData: chartData,
            maxValue: pageInfo.maxAccessed,
            xSize: 256,
            ySize: 256,
        };

        return payload;
    }
    onCodeSelectedFidPc(selectedFid: number, selectedPc: number): void {
        // Does Nothing
    }

}