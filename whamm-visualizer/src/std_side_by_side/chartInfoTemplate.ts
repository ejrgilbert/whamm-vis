/* Things to have for each:
    updateChartData payload
    how to handle recieving codeSelectedFidPc
    chartScriptPath
    dataMapping()

    SVG reading? part of dataMapping()?
*/

/* Things that need to be standardized:
    chartData
    parsedCSV
    dataMapping() use

*/

import * as vscode from 'vscode';
import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';

type fidPc ={
    selectedFid: number,
    selectedPc: number
}

export abstract class chartInfoTemplate<Payload> {
    
    /**
     * The path to the chart script as a {@link vscode.Uri}
     */
    abstract chartScriptPath: vscode.Uri;

    /**
     * Generates what is sent out to the chart
     * @param parsedCSV The parsed CSV
     * @param filePath The filePath of the .csv file
     * @return A payload object, may be different for each chart type
     */
    abstract generateUpdateChartDataPayload(parsedCSV: parseCSV.CSVRow[], filePath: string): Payload; 

    /**
     * What happens when a Fid and Pc are selected in the code panel
     * @param payload The payload containing the selected fid and pc
     * @param panel The vscode.WebviewPanel containing everything
     */
    abstract onCodeSelectedFidPc(payload: fidPc, panel: vscode.WebviewPanel):  void;

    /**
     * Maps from an Array of parseCSV.CSVRow to 
     * @param lines 
     * @returns
     */
    abstract dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.chartData;
}