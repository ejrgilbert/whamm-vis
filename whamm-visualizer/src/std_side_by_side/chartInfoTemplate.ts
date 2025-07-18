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

/**
 * A template for how the charts should be accessed
 */
export abstract class ChartInfoTemplate<Payload> {
    
    /**
     * Constructor for the chartInfo classes
     * @param parsedCSV The array of parsed CSV rows
     * @param panel The vscode.WebviewPanel containing everything
     */
    constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string){
        this.parsedCSV = parsedCSV;
        this.panel = panel;
        this.fileName = fileName;
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
    * The file name of the .csv file
    */
    public readonly fileName: string;

    /**
     * The CSV organized to visualization specific format
     */
    protected organizedCSV: any;

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

    /**
     * Generates a chart specific dropdown
     */
    abstract generateDropdown(): string;

    /**
     * What should happen when the chart specific dropdown changes
     */
    abstract onDropdownChange(selectedValue: string): void;
}