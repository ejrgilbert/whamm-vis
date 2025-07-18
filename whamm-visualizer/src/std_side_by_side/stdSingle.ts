import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';
import {getSVGPath} from '../graph_chart_display/svgPathParser';
import * as vscode from 'vscode';

// import { ChartInfoTemplate } from './chartInfoTemplate';
// import { PieChartInfo } from './pieChartInfo';
// import { GraphChartInfo } from './graphChartInfo';
// import { DefaultChartInfo } from './defaultChartInfo';

import * as cTM from './chartTemplateManager';

/**
 * Handles the whamm-visualizer.open-side-by-side-generic command
 * @param context
 * @returns A vscode extension command containing a chart alongside a code display
 */
export function stdDisplay(context: vscode.ExtensionContext): vscode.Disposable{
    return vscode.commands.registerCommand('whamm-visualizer.open-display-generic', async () => {        
        
        const panel = vscode.window.createWebviewPanel(
            'Standard Display',
            'Display Output',
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
            default:
                vscode.window.showErrorMessage('Please open with a CSV file');
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
                    case 'codeSelectedFidPc':
                        if (!parsedCSV) {
                            vscode.window.showInformationMessage('Please choose a CSV file to see visualization data.');
                            return;
                        }
                        selectedFid = message.payload.selectedFid;
                        selectedPc = message.payload.selectedPc;
                        getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context).onCodeSelectedFidPc(selectedFid, selectedPc);

                        return;
                    case 'loadNewChart':
                        currentChartOption = message.payload.newType;
                        const chartInfo = getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context);
                        panel.webview.postMessage({
                            command: 'updateChartSpecificDropdown',
                            payload: chartInfo.generateDropdown()
                        });
                        const payload = chartInfo.generateUpdateChartDataPayload();
                        panel.webview.postMessage({
                            command: 'updateChartData',
                            payload: payload
                        });
                        return;
                    case 'chartSpecificDropdownChanged':
                        if (parsedCSV) {
                            const chartInfo = getChartInfo(currentChartOption, parsedCSV, currentCSVFileName, panel, context);
                            chartInfo.onDropdownChange(message.payload.selectedValue);
                        }
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

let chartOptions: Map<string, [string, cTM.ChartInfoTemplate<any> | undefined]>;
let currentChartOption: string = 'default';

let currentCSVFileName: string;

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));
 
    // Path to the style sheet
    const styleSheetPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));

    // Path to the VS Code Webview UI Toolkit script
    const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'));
    

    // Content Security Policy (CSP) to allow only specific scripts
    const nonce = getNonce();
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
            <div class="scrollable-div" style="width: 100%; box-sizing: border-box; min-width: 0;">
                <div class='top-bar'>
                    <div class="stack-div">
                        <vscode-button id="csv-chooser">Choose CSV</vscode-button>
                        <p id="csv-file-name-display">File name: No file chosen</p>
                    </div>
                    <vscode-button id="chart-reseter">Reset Charts</vscode-button>
                    <div class="stack-div">
                        <label for="chart-type">Choose a chart type:</label>
                        ${generateChartDropdown()}
                    </div>
                    <div class="stack-div" id="chart-specific-dropdown-container">
                        <label for="chart-specific-dropdown">Choices Unavailable</label>
                        <select id="chart-specific-dropdown" disabled>
                            <option value="default">Default Option</option>
                        </select>
                    </div>
                </div>  
                <div id="outer-chart-container" style="flex: 1; min-height: 0;">
                    <div id="chart-container"></div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">  window.vscode = acquireVsCodeApi(); </script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <script nonce="${nonce}" src="${echartsJsPath}"></script>

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

                function addChartSpecificDropdownListener() {
                    const chartSpecificDropdown = document.getElementById('chart-specific-dropdown');
                    if (chartSpecificDropdown){
                        chartSpecificDropdown.addEventListener('change', function() {
                            window.vscode.postMessage({
                                command: 'chartSpecificDropdownChanged',
                                payload: {
                                    selectedValue: this.value
                                }
                            });
                        });
                    }
                }
                addChartSpecificDropdownListener();
                
                const csvChooserButton = document.getElementById('csv-chooser');
                const csvFileNameDisplay = document.getElementById('csv-file-name-display');
                if (csvChooserButton) {
                    csvChooserButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command: 'chooseCsv',
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
                    switch (message.command) {
                        case 'updateCsvFileName':
                            if (csvFileNameDisplay) {
                                csvFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
                            }
                            break;
                        case 'updateChartSpecificDropdown':
                            const chartSpecificDropdownContainer = document.getElementById('chart-specific-dropdown-container');
                            if (chartSpecificDropdownContainer) {
                                chartSpecificDropdownContainer.innerHTML = message.payload;
                                addChartSpecificDropdownListener();
                            }
                            break;

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



function generateChartOptionsMap(): Map<string, [string, cTM.ChartInfoTemplate<any> | undefined]>{
    return new Map<string, [string, cTM.ChartInfoTemplate<any> | undefined]>([
        ['default', ['defaultChart.js', undefined]],
        ['pie', ['pieChart.js', undefined]],
        ['graph', ['graphChart.js', undefined]]
    ]);
}

function generateChartScriptElements(nonce: string, webview: vscode.Webview, extensionUri: vscode.Uri): string{
    let output: string = '';
    let template: (str: string) => string = (str:string) => `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', str))}"></script>\n`;

    if (!chartOptions){
        chartOptions = generateChartOptionsMap();
    }
    for (let key of Array.from(chartOptions.keys())){
        output += template(chartOptions.get(key)![0]);
    }
    return output;
}

function generateChartDropdown():string {
    let output: string = '<select name="chart-type" id="chart-type-select">';
    let template: (str: string) => string = (str:string) =>  `<option value="${str}">${str.charAt(0).toUpperCase() + str.substring(1)} Chart</option>\n`;
    if (!chartOptions){
        chartOptions = generateChartOptionsMap();
    }
    for (let key of Array.from(chartOptions.keys())){
        output += template(key);
    }
    output += '</select>';
    return output;
}

function getChartInfo(chartType: string, parsedCSV: parseCSV.CSVRow[], fileName: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): cTM.ChartInfoTemplate<any>{
    if (!chartOptions){
        chartOptions = generateChartOptionsMap();
    }
    
    let chartTuple = chartOptions.get(chartType);

    if (!chartTuple){
        throw new Error("Invalid chartType in getChartInfo");
    }

    if (!chartTuple[1] || chartTuple[1].fileName !== fileName){
        
        switch (chartType){
            case "pie":
                chartTuple[1] = new cTM.PieChartInfo(parsedCSV, panel, fileName);
                break;
            case "graph":
                chartTuple[1] = new cTM.GraphChartInfo(parsedCSV, panel, fileName, getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg')));
                break;
            case "default":
            default:
                chartTuple[1] = new cTM.DefaultChartInfo(parsedCSV, panel, fileName);
        }
    }
    return chartTuple[1];
}