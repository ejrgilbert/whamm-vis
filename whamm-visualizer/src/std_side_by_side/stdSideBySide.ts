import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';
import {FSM} from '../wat_parser/fsm';
import {getSVGPath} from '../graph_chart_display/svgPathParser';
import * as vscode from 'vscode';

import { ChartInfoTemplate } from './chartInfoTemplate';
import { PieChartInfo } from './pieChartInfo';
import { GraphChartInfo } from './graphChartInfo';
import { DefaultChartInfo } from './defaultChartInfo';
import { stringStream } from 'cheerio';


/**
 * Handles the whamm-visualizer.open-side-by-side-generic command
 * @param context
 * @returns A vscode extension command containing a chart alongside a code display
 */
export function stdSideBySideDisplay(context: vscode.ExtensionContext): vscode.Disposable{
    return vscode.commands.registerCommand('whamm-visualizer.open-side-by-side-generic', async () => {        
        
        const panel = vscode.window.createWebviewPanel(
            'Standard Side by Side',
            'Side by Side Output',
            vscode.ViewColumn.One,
            {
                // Enable scripts in the webview
                enableScripts: true,

                // Restrict the webview to only load resources from the extension's directory
                localResourceRoots: [vscode.Uri.file(context.extensionPath)],
                retainContextWhenHidden: true,
            }
        );

        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }
        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
        let fileUri = editor.document.uri;
        const filePath = fileUri.fsPath;
        const fileExtension = filePath.split('.').pop();
        switch (fileExtension){
            case 'csv':
                currentCSVFileName = filePath.split('/').pop()! || filePath.split('\\').pop()!;
                // Option 1: Use the file path
                parsedCSV = parseCSV.parseFromFile(filePath);
                // Option 2: Use the file content
                // const csvContent = editor.document.getText();
                // parsedCSV = parseCSV.fidPcPidMapFromString(csvContent);

                // Send the initial file name to the webview
                panel.webview.postMessage({
                    command: 'updateCsvFileName',
                    payload: { fileName: currentCSVFileName }
                });

                // Send data to the webview
                const chartInfo = getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context);
                const payload = chartInfo.generateUpdateChartDataPayload();
                console.log(payload);
                panel.webview.postMessage({
                    command: 'updateChartData',
                    payload: payload
                });
                break;
            case 'wat':
                currentWATFileName = filePath.split('/').pop()! || filePath.split('\\').pop()!;

                const newWatContentArray = await vscode.workspace.fs.readFile(fileUri);
                const newWatContent = newWatContentArray.toString();
                panel.webview.postMessage({
                    command: 'updateWatFileName',
                    payload: { fileName: currentWATFileName }
                });
                const lineToFidPc = organizeLineNumbers(newWatContent);
                panel.webview.postMessage({
                    command: 'updateWatContent',
                    payload: {
                        newCode: newWatContent,
                        lineToFidPc: Object.fromEntries(lineToFidPc) // Cannot transmit Maps
                    }
                });
                break;
            default:
                vscode.window.showErrorMessage('Please open with a CSV or WAT file');
                return;
        }
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                // For choosing files
                let options: vscode.OpenDialogOptions;
                let fileUri;

                // For selecting fid and pc
                let chartData: cDFuncs.graphChartData[];
                let selectedFid: number;
                let selectedPc: number;

                switch (message.command) {
                    case 'chooseCsv':
                        options = {
                            canSelectMany: false,
                            openLabel: 'Select CSV',
                            filters: {
                                'CSV files': ['csv']
                            }
                        };

                        fileUri = await vscode.window.showOpenDialog(options);

                        if (fileUri && fileUri[0]) {
                            fileUri = fileUri[0];
                            const filePath = fileUri.fsPath;
                            currentCSVFileName = filePath.split('/').pop()! || filePath.split('\\').pop()!;

                            const newCsvContent = await vscode.workspace.fs.readFile(fileUri);
                            const newParsedCSV = parseCSV.parseFromString(newCsvContent.toString());
                            
                            // Update the global parsedCSV for this panel instance
                            parsedCSV = newParsedCSV;

                            panel.webview.postMessage({
                                command: 'updateCsvFileName',
                                payload: { fileName: currentCSVFileName }
                            });

                            const chartInfo = getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context);
                            const payload = chartInfo.generateUpdateChartDataPayload();
                            panel.webview.postMessage({
                                command: 'updateChartData',
                                payload: payload
                            });
                        }
                        return;
                    case 'chooseWat':
                        options = {
                            canSelectMany: false,
                            openLabel: 'Select Wat',
                            filters: {
                                'Wat files': ['wat']
                            }
                        };

                        fileUri = await vscode.window.showOpenDialog(options);

                        if (fileUri && fileUri[0]) {
                            const newWatContentArray = await vscode.workspace.fs.readFile(fileUri[0]);
                            const newWatContent = newWatContentArray.toString();
                            // Extract the file name from the URI
                            currentWATFileName = fileUri[0].fsPath.split('/').pop()! || fileUri[0].fsPath.split('\\').pop()!;
                            panel.webview.postMessage({
                                command: 'updateWatFileName',
                                payload: { fileName: currentWATFileName }
                            });
                            const lineToFidPc = organizeLineNumbers(newWatContent);
                            panel.webview.postMessage({
                                command: 'updateWatContent',
                                payload: {
                                    newCode: newWatContent,
                                    lineToFidPc: Object.fromEntries(lineToFidPc) //Cannot transmit Maps
                                }
                            });
                        }
                        return;
                    case 'codeSelectedFidPc':
                        if (!parsedCSV) {
                            vscode.window.showInformationMessage('Please choose a CSV file to see visualization data.');
                            return;
                        }
                        selectedFid = message.payload.selectedFid;
                        selectedPc = message.payload.selectedPc;
                        getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context).onCodeSelectedFidPc(selectedFid, selectedPc);

                        return;
                    case 'chartSelectedFidPc':
                        if (!lineToFidPc) {
                            vscode.window.showInformationMessage('Please choose a WAT file to see code data.');
                            return;
                        }

                        selectedFid = Number.parseInt(message.payload.selectedFid);
                        selectedPc = Number.parseInt(message.payload.selectedPc);

                        if (selectedFid === -1 && selectedPc === -1){
                            panel.webview.postMessage({
                                command: 'updateCodeScroll',
                                payload: {
                                    lineNumber: -1
                                }
                            });
                        } else {
                            panel.webview.postMessage({
                                command: 'updateCodeScroll',
                                payload: {
                                    lineNumber: fidPcToLine.get(selectedFid)?.get(selectedPc)
                                }
                            });
                        }
                        return;
                    case 'loadNewChart':
                        currentChartOption = message.payload.newType;
                        const chartInfo = getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context);
                        const payload = chartInfo.generateUpdateChartDataPayload();
                        panel.webview.postMessage({
                            command: 'updateChartData',
                            payload: payload
                        });
                        return;
                    // case 'changeChartType':
                    //     const chartType = message.payload.chartType;

                    //     // Call the loadChart function in the webview
                    //     panel.webview.postMessage({
                    //         command: 'loadChart',
                    //         payload: { chartType: chartType }
                    //     });
                        
                    //     return;
                    case 'resetChart':
                        panel.webview.postMessage({
                            command: 'updateChartData',
                            payload: getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context).generateUpdateChartDataPayload()
                        });
                    return;
                    }
            },
            undefined,
            context.subscriptions
        );

        // Clean up resources if needed when the panel is closed
        panel.onDidDispose(() => {}, null, context.subscriptions);

    });
}

let parsedCSV: parseCSV.CSVRow[];
let lineToFidPc: Map<number, [number, number]>;
let fidPcToLine: Map<number, Map<number, number>>;

let chartOptions: Map<string, [string, ChartInfoTemplate<any> | undefined]>;
let currentChartOption: string = 'default';

let currentCSVFileName: string;
let currentWATFileName: string;

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));
 
    // Path to back button
    const backButtonPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'whamm!_logo.png'));

    // Path to the style sheet
    const styleSheetPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));

    // Path to the VS Code Webview UI Toolkit script
    const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'));

    // Path to the code display script
    const codeDisplayScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'codeDisplay.js'));

    

    // Content Security Policy (CSP) to allow only specific scripts
    const nonce = getNonce();
    // Path to the script that initializes and renders the chart
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECharts Chart</title>
                <link rel="stylesheet" href="${styleSheetPath}">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
    </head>
    <body>
        <div style="display: flex; flex-direction: row; height: 100%; box-sizing: border-box; min-width: 0; flex-wrap: nowrap;">
            <div id="left-panel" class="scrollable-div" style="width: 50%; height: 100%; padding: 0; margin: 0; box-sizing: border-box; border-right: 1px solid var(--vscode-editor-foreground); min-width: 0">
                <div class='top-bar'>
                    <vscode-button id="wat-chooser">Choose WAT</vscode-button>
                    <p id="wat-file-name-display">WAT File: No file chosen</p>
                </div>
                <div id="wat-editor-container"></div>
            </div>
            <div class="scrollable-div" style="width: 50%; box-sizing: border-box; min-width: 0;">
                <div class='top-bar'>
                    <vscode-button id="csv-chooser">Choose CSV</vscode-button>
                    <vscode-button id="chart-reseter">Reset Charts</vscode-button>
                    <p id="csv-file-name-display">File name: No file chosen</p>
                    <label for="chart-type">Choose a chart type:</label>
                    <select name="chart-type" id="chart-type-select">
                        <option value="default">Default</option>
                        <option value="pie">Pie Chart</option>
                        <option value="graph">Graph</option>
                    </select>
                </div>  
                <div id="outer-chart-container" style="flex: 1; min-height: 0;">
                    <div id="chart-container"></div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">  window.vscode = acquireVsCodeApi(); </script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <script nonce="${nonce}" src="${echartsJsPath}"></script>
        <script type="module" nonce="${nonce}" src="${codeDisplayScriptPath}"></script>

        <script nonce ="${nonce}"> window.chartFunctions = new Map() </script>
        ${generateChartScriptElements(nonce, webview, extensionUri)};

        <script nonce="${nonce}">
            // Encapsulate to avoid polluting global scope
            (function() {
                let cleanupCurrentChart = () => {};

                function loadChart(chartType) {
                    // 1. Clean up the old chart and its listeners
                    cleanupCurrentChart();

                    // 2. Load the new chart and get its cleanup function
                    const chartInitializer = window.chartFunctions.get(chartType);
                    if (chartInitializer) {
                        cleanupCurrentChart = chartInitializer() || (() => {});
                    }
                }

                loadChart('default');

                const chartTypeSelect = document.getElementById('chart-type-select');
                if (chartTypeSelect){
                    chartTypeSelect.addEventListener('change', function() {
                        loadChart(this.value);
                        window.vscode.postMessage({
                            command: 'loadNewChart',
                            payload: {
                                newType: this.value
                            }
                        });
                    });
                }
                
                const csvChooserButton = document.getElementById('csv-chooser');
                const csvFileNameDisplay = document.getElementById('csv-file-name-display');
                if (csvChooserButton) {
                    csvChooserButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command: 'chooseCsv',
                        });
                    });
                }

                const watChooserButton = document.getElementById('wat-chooser');
                const watFileNameDisplay = document.getElementById('wat-file-name-display');
                if (watChooserButton) {
                    watChooserButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command: 'chooseWat',
                        });
                    });
                }
                
                const chartReseterButton = document.getElementById('chart-reseter');
                if (chartReseterButton) {
                    chartReseterButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command:'resetChart',
                        });
                    });
                }

                

                // Listen for messages from the extension to update the displayed file name
                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data that the extension sent
                    if (message.command === 'updateCsvFileName' && csvFileNameDisplay) {
                        csvFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
                    } else if (message.command === 'updateWatContent') {
                        const watEditor = document.getElementById('wat-editor');
                        if (watEditor) { watEditor.value = message.payload.content; }
                    } else if (message.command === 'updateWatFileName' && watFileNameDisplay) {
                        watFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
                    }
                });
            }());

        </script>
    </body>
    </html>`;
}

// Function to generate a random nonce for CSP
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Organizes a .wat file into [fid, pc] by line. 
 * 
 * Invalid fid or pc are set to -1
 * @param newWatContent The text from a .wat file in correct format (output of wasm-tools print)
 * @returns A Map from line number to a tuple of [fid, pc]
 */
function organizeLineNumbers(newWatContent: string): Map<number, [number, number]>{
    let lineCount = newWatContent.split('\n').length; // Use this instead of watParser.current_line_number to inclue trailing lines at the end
    let watParser = new FSM(newWatContent);
    watParser.run();
    let lineToFid = new Map(Array.from(watParser.func_mapping, a => a.reverse() as [number, number]));
    let output = new Map<number, [number, number]>();
    fidPcToLine = new Map<number, Map<number, number>>();
    let currentFid = -1;
    let currentPc = -1;
    for (let line: number = 1; line <= lineCount; line++){
        if (lineToFid.has(line)){
            currentFid = lineToFid.get(line)!;
            currentPc = -1;
        } else if (currentFid >= 0){ // Alternatively can be done with line - startLine ... But this works, so ...
            const probeLocation = watParser.probe_mapping.get(currentFid);
            if (probeLocation) {
                const startLine = probeLocation[0];
                const end_line = probeLocation[1];
                if (line >= startLine && line <= end_line) {
                    currentPc++;
                } else {
                    currentPc = -1;
                    if (line > end_line){
                        currentFid = -1;
                    }
                }
            }
        }
        output.set(line, [currentFid, currentPc]);
        if (!fidPcToLine.has(currentFid)){
            fidPcToLine.set(currentFid, new Map<number,number>());
        }
        fidPcToLine.get(currentFid)!.set(currentPc,line);
    }
    lineToFidPc = output;
    return output;
}

// TODO Make this actually useful
function generateChartOptions(): Map<string, [string, ChartInfoTemplate<any> | undefined]>{
    return new Map<string, [string, ChartInfoTemplate<any> | undefined]>([
        ['default', ['defaultChart.js', undefined]],
        ['pie', ['pieChart.js', undefined]],
        ['graph', ['graphChart.js', undefined]]
    ]);
}

function generateChartScriptElements(nonce: string, webview: vscode.Webview, extensionUri: vscode.Uri): string{
    let output: string = '';
    let template: (str: string) => string = (str:string) => `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', str))}"></script>\n`;

    if (!chartOptions){
        chartOptions = generateChartOptions();
    }
    for (let key of Array.from(chartOptions.keys())){
        output += template(chartOptions.get(key)![0]);
    }
    return output;
}

function getChartInfo(chartType: string, parsedCSV: parseCSV.CSVRow[], fileName: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): ChartInfoTemplate<any>{
    if (!chartOptions){
        chartOptions = generateChartOptions();
    }
    
    let chartTuple = chartOptions.get(chartType);

    if (!chartTuple){
        throw new Error("Invalid chartType in getChartInfo");
    }

    if (!chartTuple[1] || chartTuple[1].fileName !== fileName){
        
        switch (chartType){
            case "pie":
                chartTuple[1] = new PieChartInfo(parsedCSV, panel, fileName);
                break;
            case "graph":
                chartTuple[1] = new GraphChartInfo(parsedCSV, panel, fileName, getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg')));
                break;
            case "default":
            default:
                chartTuple[1] = new DefaultChartInfo(parsedCSV, panel, fileName);
        }
    }
    return chartTuple[1];
}