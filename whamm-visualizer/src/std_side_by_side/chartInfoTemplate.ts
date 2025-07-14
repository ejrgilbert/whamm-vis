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

/**
 * A template for how the charts should be accessed
 */
export abstract class chartInfoTemplate<Payload> {
    
    constructor(parsedCSV: parseCSV.CSVRow[]){
        this.parsedCSV = parsedCSV;
    }

    /**
     * The parsed CSV
     */
    protected parsedCSV: parseCSV.CSVRow[];

    /**
     * The CSV organized to visualization specific format
     */
    protected organizedCSV: any;

    /**
     * The file name of the chart script as a string
     * 
     * Must be in context.extensionUri/media
     */
    abstract readonly chartScriptFileName: string;

    /**
     * Generates what is sent out to the chart
     * @return A payload object, may be different for each chart type
     */
    abstract generateUpdateChartDataPayload(): Payload; 

    /**
     * What happens when a Fid and Pc are selected in the code panel
     * @param payload The payload containing the selected fid and pc
     * @param panel The vscode.WebviewPanel containing everything
     */
    abstract onCodeSelectedFidPc(payload: fidPc, panel: vscode.WebviewPanel):  void;

    // /**
    //  * Maps from an Array of parseCSV.CSVRow to relevant chartData type
    //  * @param lines 
    //  * @returns
    //  */
    // abstract dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.chartData;
}