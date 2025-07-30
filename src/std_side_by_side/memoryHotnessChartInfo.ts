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
    minAddress: number,
    maxAddress: number;
    prefix: string;
    dropdownSuffix: string;
    navigable: boolean
}

export class MemoryHotnessChartInfo extends ChartInfoTemplate<memoryHotnessChartPayload>{

    readonly pagesPerSuperPage: number = 256;
    
    generateDropdown(): string {
        let output = '<label for="chart-specific-dropdown">Choose Page</label>';
        output += '<select id="chart-specific-dropdown">';
        output += `<option value="all">All</option>\n`;
        if (this.superPageMap.size > 1){
            let superPageNumbers = Array.from(this.superPageMap.keys()).sort((a, b) => a - b);
            for (let superPage of superPageNumbers){
                output += `<option value="${superPage} (Super Page)">${superPage} (Super Page)</option>\n`;
            }
        }
        let pageNumbers = Array.from(this.organizedCSV.keys()).sort((a, b) => a - b);
        for (let page of pageNumbers){
            output += `<option value="${page} (Page)">${page} (Page)</option>\n`;
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
        this.superPageMap = new Map();
        this.highestSuperPage = 0;
        for (let row of parsedCSV){
            let values = row['value(s)'] as [number, number];
            let page = Math.floor(values[0] / 65536);
            const superPage = Math.floor(page / this.pagesPerSuperPage); // Might Supposed to be 65536 // Max per super page
            if (!this.organizedCSV.has(page)){
                this.organizedCSV.set(page, {data: [], maxAccessed: 0, totalAccessed: 0});
                if(!this.superPageMap.get(superPage)){
                    this.superPageMap.set(superPage, {pages: [], totalAccessed: 0});
                    this.highestSuperPage = Math.max(this.highestSuperPage, superPage);
                }
                this.superPageMap.get(superPage)!.pages.push(page);
            }
            let pageData = this.organizedCSV.get(page)!;
            pageData.data.push(values);
            pageData.totalAccessed += values[1];
            this.superPageMap.get(superPage)!.totalAccessed += values[1];
            pageData.maxAccessed = Math.max(pageData.maxAccessed, values[1]);
        }
        this.currentPage = 'all';
    }
       

    protected organizedCSV: Map<number, {data: [number, number][], maxAccessed: number, totalAccessed: number}>;

    private superPageMap: Map<number, {pages: number[], totalAccessed: number}>;

    private currentPage: string;

    private highestSuperPage: number;

    generateUpdateChartDataPayload(): memoryHotnessChartPayload {
        if(this.currentPage === 'all' && this.superPageMap.size > 1){
            const chartData: cDFuncs.memoryHotnessChartData[] = [];
            let maxValue = 0;
            let maxPageNumber = 0;
            for (let superPageNumber of Array.from(this.superPageMap.keys())){
                let pageData = this.superPageMap.get(superPageNumber)!;
                chartData.push({
                    memoryHotnessChart: true,
                    location: superPageNumber,
                    value: pageData.totalAccessed
                });
                maxValue = Math.max(maxValue, pageData.totalAccessed);
                maxPageNumber = Math.max(maxPageNumber, superPageNumber);
                
            }
            const sqrtAmount = Math.sqrt(maxPageNumber + 1);
            const payload: memoryHotnessChartPayload = {
                title: this.fileName,
                chartData: chartData,
                maxValue: maxValue,
                xSize: Math.ceil(sqrtAmount),
                ySize: Math.ceil(sqrtAmount),
                minAddress: 0,
                maxAddress: maxPageNumber + 1,
                prefix: 'Super Page: ',
                dropdownSuffix: ' (Super Page)',
                navigable: true
            };

            return payload;

        } else if(this.currentPage.endsWith(' (Super Page)') || (this.currentPage === 'all' && this.superPageMap.size === 1)){
            let currentSuperPage;
            if (this.superPageMap.size === 1){
                currentSuperPage = this.superPageMap.keys().next().value!;
            } else {
                currentSuperPage = parseInt(this.currentPage);
            }
            const pages = this.superPageMap.get(currentSuperPage)?.pages;
            if (!pages){ throw new Error("Pages of Super Page do not exist"); }
            const chartData: cDFuncs.memoryHotnessChartData[] = [];
            let maxValue = 0;
            let maxPageNumber = 0;
            for (let pageNumber of pages){
                let pageData = this.organizedCSV.get(pageNumber)!;
                chartData.push({
                    memoryHotnessChart: true,
                    location: pageNumber,
                    value: pageData.totalAccessed
                });
                maxValue = Math.max(maxValue, pageData.totalAccessed);
                maxPageNumber = Math.max(maxPageNumber, pageNumber);
                
            }
            const minAddress = this.pagesPerSuperPage * currentSuperPage;
            let maxAddress;
            if (currentSuperPage === this.highestSuperPage){
                maxAddress = maxPageNumber;
            } else {
                maxAddress = this.pagesPerSuperPage * (currentSuperPage + 1) - 1;
            }
            const sqrtAmount = Math.sqrt(maxAddress - minAddress);
            const payload: memoryHotnessChartPayload = {
                title: this.fileName,
                chartData: chartData,
                maxValue: maxValue,
                xSize: Math.ceil(sqrtAmount),
                ySize: Math.ceil(sqrtAmount),
                minAddress: minAddress,
                maxAddress: maxAddress,
                prefix: 'Page: ',
                dropdownSuffix: ' (Page)',
                navigable: true
            };

            return payload;

        } else if(this.currentPage.endsWith(' (Page)')){
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
                minAddress: 0,
                maxAddress: 65536,
                prefix: 'Address: ',
                dropdownSuffix: '',
                navigable: false
            };

            return payload;

        } else {
            throw new Error("currentPage was not 'all' or ending with ' (Super Page)' or ' (Page)'. Instead it was " + this.currentPage);
        }


        
    }
    onCodeSelectedFidPc(selectedFid: number, selectedPc: number): void {
        // Does Nothing
    }

}