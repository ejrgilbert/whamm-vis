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

import { WebviewPanel } from 'vscode';
import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';

export interface HasScriptName {
    /**
     * The file name of the chart script as a string
     * 
     * Must be in context.extensionUri/media
     */
    readonly chartScriptFileName: string;
}

/**
 * A template for how the charts should be accessed
 */
export abstract class ChartInfoTemplate<Payload> {
    
    /**
     * Constructor for the chartInfo classes
     * @param parsedCSV The array of parsed CSV rows
     * @param panel The vscode.WebviewPanel containing everything
     */
    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel){
        this.parsedCSV = parsedCSV;
        this.panel = panel;
    }

    /**
     * The parsed CSV
     */
    protected parsedCSV: parseCSV.CSVRow[];

    /**
     * The vscode.WebViewPanel containing everything
     */
    protected panel: WebviewPanel;

    /**
     * The CSV organized to visualization specific format
     */
    protected organizedCSV: any;

    /**
     * Must be in context.extensionUri/media
     * 
     * @returns The file name of the chart script as a string
     */
    abstract chartScriptFileName(): string;

    /**
     * Generates what is sent out to the chart
     * @return A payload object, may be different for each chart type
     */
    abstract generateUpdateChartDataPayload(): Payload;

    /**
     * What happens when a Fid and Pc are selected in the code panel
     * @param payload The payload containing the selected fid and pc
     */
    abstract onCodeSelectedFidPc(selectedFid: number, selectedPc: number):  void;

    // /**
    //  * Maps from an Array of parseCSV.CSVRow to relevant chartData type
    //  * @param lines 
    //  * @returns
    //  */
    // abstract dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.chartData;
}