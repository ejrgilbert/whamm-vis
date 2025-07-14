import { chartInfoTemplate } from "./chartInfoTemplate";
import * as cDFuncs from '../chartDataFunctions';
import * as parseCSV from '../parseCSV';
import { WebviewPanel } from "vscode";

type pieChartPayload = {
    chartData: cDFuncs.pieChartData[]
}

export class pieChartInfo extends chartInfoTemplate<pieChartPayload>{

    readonly chartScriptFileName: string = 'pieChart.js';
    
    constructor(parsedCSV: parseCSV.CSVRow[]){
        super(parsedCSV);
        this.organizedCSV = cDFuncs.organizeCSVByFidPcPid(this.parsedCSV);
    }
       

    protected organizedCSV: cDFuncs.FidPcPidMap;

    generateUpdateChartDataPayload(): pieChartPayload {
        const chartData = cDFuncs.getChartDataFromFidPcPidMap(this.organizedCSV, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        return {
            chartData: chartData
        };
    }
    onCodeSelectedFidPc(payload: { selectedFid: number; selectedPc: number; }, panel: WebviewPanel): void {
        const { selectedFid, selectedPc } = payload;
        let chartData: cDFuncs.pieChartData[];

        
        if (selectedFid === -1) { // No function selected, show all charts
            chartData = cDFuncs.getChartDataFromFidPcPidMap(this.organizedCSV, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        } else if (selectedPc === -1) { // A function is selected, but no specific pc, show all charts for that function
            chartData = cDFuncs.getChartDataByFid(this.organizedCSV, selectedFid, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        } else { // A specific line is selected, show only charts for that fid:pc
            chartData = cDFuncs.getChartDataByFidAndPc(this.organizedCSV, selectedFid, selectedPc, this.dataMapping.bind(this)) as cDFuncs.pieChartData[];
        }

        panel.webview.postMessage({
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
}