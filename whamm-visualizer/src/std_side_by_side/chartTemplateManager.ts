import { ChartInfoTemplate } from './chartInfoTemplate';
import { PieChartInfo } from './pieChartInfo';
import { GraphChartInfo } from './graphChartInfo';
import { DefaultChartInfo } from './defaultChartInfo';
import { MemoryHotnessChartInfo } from './memoryHotnessChartInfo';

import * as vscode from 'vscode';
import * as parseCSV from '../parseCSV';
import {getSVGPath} from '../graph_chart_display/svgPathParser';

export { ChartInfoTemplate };

export function generateChartOptionsMap(): Map<string, [string, ChartInfoTemplate<any> | undefined]>{
    return new Map<string, [string, ChartInfoTemplate<any> | undefined]>([
        ['default', ['defaultChart.js', undefined]],
        ['pie', ['pieChart.js', undefined]],
        ['graph', ['graphChart.js', undefined]],
        ['memoryHotness', ['memoryHotnessChart.js', undefined]],
        ['3DMemoryHotness', ['3DMemoryHotnessChart.js', undefined]],
    ]);
}


export function getChartInfo(chartTuple: [string, ChartInfoTemplate<any> | undefined], chartType: string, parsedCSV: parseCSV.CSVRow[], fileName: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): ChartInfoTemplate<any>{

    if (!chartTuple[1] || chartTuple[1].fileName !== fileName){
        
        switch (chartType){
            case "pie":
                chartTuple[1] = new PieChartInfo(parsedCSV, panel, fileName);
                break;
            case "graph":
                chartTuple[1] = new GraphChartInfo(parsedCSV, panel, fileName, getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg')));
                break;
            case "memoryHotness":
                chartTuple[1] = new MemoryHotnessChartInfo(parsedCSV, panel, fileName);
                break;
            case "3DMemoryHotness":
                chartTuple[1] = new MemoryHotnessChartInfo(parsedCSV, panel, fileName);
                break;
            case "default":
            default:
                chartTuple[1] = new DefaultChartInfo(parsedCSV, panel, fileName);
        }
    }
    return chartTuple[1];
}