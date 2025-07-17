import { ChartInfoTemplate } from "./chartInfoTemplate";
import * as cDFuncs from '../chartDataFunctions';
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";

type pieChartPayload = {
    chartData: cDFuncs.pieChartData[]
}

export class PieChartInfo extends ChartInfoTemplate<pieChartPayload>{
    
    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string){
        super(parsedCSV, panel, fileName);
        this.organizedCSV = cDFuncs.organizeCSVByFidPcPid(this.parsedCSV);
    }
       

    protected organizedCSV: cDFuncs.FidPcPidMap;

    generateUpdateChartDataPayload(): pieChartPayload {
        
        const chartData = this.getChartData(-1, -1);
        return {
            chartData: chartData
        };
    }
    
    onCodeSelectedFidPc(selectedFid: number, selectedPc: number): void {
        const chartData = this.getChartData(selectedFid, selectedPc);

        this.panel.webview.postMessage({
            command: 'updateChartData',
            payload: {
                chartData: chartData,
            }
        });
    }

    private dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.pieChartData {
        const firstLine = lines[0];
        if (!firstLine) {
            // This should ideally not happen if the input CSV is well-formed and organized correctly.
            return {
                pieChart: true,
                data: [],
                title: 'Error',
                subtitle: 'No data',
                dataGroupId: 'error-no-data'
            };
        }
        const opcode = firstLine.probe_id!;
        const entry: cDFuncs.pieChartData = {
            pieChart: true,
            data: [],
            title: opcode,
            subtitle: firstLine['fid:pc']!,
            dataGroupId: opcode + firstLine['fid:pc'],
        };
        lines.map(obj => entry.data.push({ value: obj['value(s)'], name: obj.name! }));
        return entry;
    }

    private getChartData(selectedFid: number, selectedPc: number): cDFuncs.pieChartData[] {
        if (selectedFid === -1) { // No function selected, show all charts
            return cDFuncs.getChartDataFromFidPcPidMap(this.organizedCSV, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        } else if (selectedPc === -1) { // A function is selected, but no specific pc, show all charts for that function
            return cDFuncs.getChartDataByFid(this.organizedCSV, selectedFid, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        } else { // A specific line is selected, show only charts for that fid:pc
            return cDFuncs.getChartDataByFidAndPc(this.organizedCSV, selectedFid, selectedPc, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        }
    }
}