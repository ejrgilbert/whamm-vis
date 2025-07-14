// import * as parseCSV from '../parseCSV';
// import * as cDFuncs from '../chartDataFunctions';
// import {FSM} from '../wat_parser/fsm';
// import * as vscode from 'vscode';
// import {getSVGPath} from '../graph_chart_display/svgPathParser';


// /**
//  * Handles the whamm-visualizer.open-side-by-side-generic command
//  * @param context
//  * @returns A vscode extension command containing a chart alongside a code display
//  */
// export function sideBySideGraphDisplay(context: vscode.ExtensionContext): vscode.Disposable{
//     return vscode.commands.registerCommand('whamm-visualizer.open-side-by-side-generic', async () => {
//         // The svg path data for the self loop icon
//         const selfLoopSVG = getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg'));
        
//         const panel = vscode.window.createWebviewPanel(
//             'Side by Side Graph',
//             'Side by Side Graph Output',
//             vscode.ViewColumn.One,
//             {
//                 // Enable scripts in the webview
//                 enableScripts: true,

//                 // Restrict the webview to only load resources from the extension's directory
//                 localResourceRoots: [vscode.Uri.file(context.extensionPath)],
//                 retainContextWhenHidden: true,
//             }
//         );
        
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found!');
//             return;
//         }
//         // Set the HTML content for the webview
//         panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
//         let fileUri = editor.document.uri;
//         const filePath = fileUri.fsPath;
//         const fileExtension = filePath.split('.').pop();
//         const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
//         switch (fileExtension){
//             case 'csv':
//                 // Option 1: Use the file path
//                 parsedCSV = parseCSV.parseMapFromFile(filePath);
//                 // Option 2: Use the file content
//                 // const csvContent = editor.document.getText();
//                 // parsedCSV = parseCSV.fidPcPidMapFromString(csvContent);


//                 // Send the initial file name to the webview
//                 panel.webview.postMessage({
//                     command: 'updateCsvFileName',
//                     payload: { fileName: fileName }
//                 });

//                 // Send data to the webview
//                 panel.webview.postMessage({
//                             command: 'updateChartData',
//                             payload: {
//                                 chartData: cDFuncs.getGraphChartData(parsedCSV[0]['value(s)']),
//                                 title: filePath.split('/').pop() || filePath.split('\\').pop(),
//                                 selfLoopSVG: selfLoopSVG
//                             }
//                         });
//                 break;
//             case 'wat':
//                 const newWatContentArray = await vscode.workspace.fs.readFile(fileUri);
//                 const newWatContent = newWatContentArray.toString();
//                 panel.webview.postMessage({
//                     command: 'updateWatFileName',
//                     payload: { fileName: fileName }
//                 });
//                 const lineToFidPc = organizeLineNumbers(newWatContent);
//                 panel.webview.postMessage({
//                     command: 'updateWatContent',
//                     payload: {
//                         newCode: newWatContent,
//                         lineToFidPc: Object.fromEntries(lineToFidPc) // Cannot transmit Maps
//                     }
//                 });
//                 break;
//             default:
//                 vscode.window.showErrorMessage('Please open with a CSV or WAT file');
//                 return;
//         }
//         // Handle messages from the webview
//         panel.webview.onDidReceiveMessage(
//             async message => {
//                 // For choosing files
//                 let options: vscode.OpenDialogOptions;
//                 let fileUri;

//                 // For selecting fid and pc
//                 let chartData: cDFuncs.graphChartData[];
//                 let selectedFid: number;
//                 let selectedPc: number;

//                 switch (message.command) {
//                     case 'chooseCsv':
//                         options = {
//                             canSelectMany: false,
//                             openLabel: 'Select CSV',
//                             filters: {
//                                 'CSV files': ['csv']
//                             }
//                         };

//                         fileUri = await vscode.window.showOpenDialog(options);

//                         if (fileUri && fileUri[0]) {
//                             const newCsvContent = await vscode.workspace.fs.readFile(fileUri[0]);
//                             const newParsedCSV = parseCSV.parseMapFromString(newCsvContent.toString());
                            
//                             // Update the global parsedCSV for this panel instance
//                             parsedCSV = newParsedCSV;

//                             // Extract the file name from the URI
//                             const fileName = fileUri[0].fsPath.split('/').pop() || fileUri[0].fsPath.split('\\').pop();
//                             panel.webview.postMessage({
//                                 command: 'updateCsvFileName',
//                                 payload: { fileName: fileName }
//                             });

//                             panel.webview.postMessage({
//                                 command: 'updateChartData',
//                                 payload: {
//                                     chartData: cDFuncs.getGraphChartData(parsedCSV[0]['value(s)']),
//                                     title: filePath.split('/').pop() || filePath.split('\\').pop(),
//                                     selfLoopSVG: selfLoopSVG
//                                 }
//                             });
//                         }
//                         return;
//                     case 'chooseWat':
//                         options = {
//                             canSelectMany: false,
//                             openLabel: 'Select Wat',
//                             filters: {
//                                 'Wat files': ['wat']
//                             }
//                         };

//                         fileUri = await vscode.window.showOpenDialog(options);

//                         if (fileUri && fileUri[0]) {
//                             const newWatContentArray = await vscode.workspace.fs.readFile(fileUri[0]);
//                             const newWatContent = newWatContentArray.toString();
//                             // Extract the file name from the URI
//                             const fileName = fileUri[0].fsPath.split('/').pop() || fileUri[0].fsPath.split('\\').pop();
//                             panel.webview.postMessage({
//                                 command: 'updateWatFileName',
//                                 payload: { fileName: fileName }
//                             });
//                             const lineToFidPc = organizeLineNumbers(newWatContent);
//                             panel.webview.postMessage({
//                                 command: 'updateWatContent',
//                                 payload: {
//                                     newCode: newWatContent,
//                                     lineToFidPc: Object.fromEntries(lineToFidPc) //Cannot transmit Maps
//                                 }
//                             });
//                         }
//                         return;
//                     case 'codeSelectedFidPc':
//                         if (!parsedCSV) {
//                             vscode.window.showInformationMessage('Please choose a CSV file to see visualization data.');
//                             return;
//                         }
//                         selectedFid = message.payload.selectedFid;
//                         selectedPc = message.payload.selectedPc;

//                         if (selectedFid !== -1){
//                             // TODO: Select Node
//                             panel.webview.postMessage({
//                                 command: 'selectNode',
//                                 payload: {
//                                     selectedNode: selectedFid
//                                 }
//                             });
//                         }
//                         return;
//                     case 'chartSelectedFidPc':
//                         if (!lineToFidPc) {
//                             vscode.window.showInformationMessage('Please choose a WAT file to see code data.');
//                             return;
//                         }

//                         selectedFid = Number.parseInt(message.payload.selectedFid);
//                         selectedPc = Number.parseInt(message.payload.selectedPc);

//                         if (selectedFid === -1 && selectedPc === -1){
//                             panel.webview.postMessage({
//                                 command: 'updateCodeScroll',
//                                 payload: {
//                                     lineNumber: -1
//                                 }
//                             });
//                         } else {
//                             panel.webview.postMessage({
//                                 command: 'updateCodeScroll',
//                                 payload: {
//                                     lineNumber: fidPcToLine.get(selectedFid)?.get(selectedPc)
//                                 }
//                             });
//                         }
//                         return;
//                     case 'resetChart':
//                         panel.webview.postMessage({
//                             command: 'updateChartData',
//                             payload: {
//                                 chartData: cDFuncs.getGraphChartData(parsedCSV[0]['value(s)']),
//                                 title: filePath.split('/').pop() || filePath.split('\\').pop(),
//                                 selfLoopSVG: selfLoopSVG
//                             }
//                         });
//                     return;
//                     }
//             },
//             undefined,
//             context.subscriptions
//         );

//         // Clean up resources if needed when the panel is closed
//         panel.onDidDispose(() => {}, null, context.subscriptions);

//     });
// }

// let parsedCSV: parseCSV.CSVRow[];
// let lineToFidPc: Map<number, [number, number]>;
// let fidPcToLine: Map<number, Map<number, number>>;

// function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
//     // Path to the ECharts library within your extension
//     const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));

//     // Path to the script that initializes and renders the chart
//     const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'graph.js'));

//     // Path to back button
//     const backButtonPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'whamm!_logo.png'));

//     // Path to the style sheet
//     const styleSheetPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));

//     // Path to the VS Code Webview UI Toolkit script
//     const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'));

//     // Path to the code display script
//         const codeDisplayScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'codeDisplay.js'));


//     // Content Security Policy (CSP) to allow only specific scripts
//     const nonce = getNonce();


//     return `<!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>ECharts Chart</title>
//                 <link rel="stylesheet" href="${styleSheetPath}">
//         <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
//     </head>
//     <body>
//         <div style="display: flex; flex-direction: row; height: 100%; box-sizing: border-box; min-width: 0; flex-wrap: nowrap;">
//             <div id="left-panel" class="scrollable-div" style="width: 50%; height: 100%; padding: 0; margin: 0; box-sizing: border-box; border-right: 1px solid var(--vscode-editor-foreground); min-width: 0">
//                 <div class='top-bar'>
//                     <vscode-button id="wat-chooser">Choose WAT</vscode-button>
//                     <p id="wat-file-name-display">WAT File: No file chosen</p>
//                 </div>
//                 <div id="wat-editor-container"></div>
//             </div>
//             <div class="scrollable-div" style="width: 50%; box-sizing: border-box; min-width: 0;">
//                 <div class='top-bar'>
//                     <vscode-button id="csv-chooser">Choose CSV</vscode-button>
//                     <vscode-button id="chart-reseter">Reset Charts</vscode-button>
//                     <p id="csv-file-name-display">File name: No file chosen</p>
//                 </div>
//                 <div id="chart-container"></div>
//             </div>
//         </div>

//         <script nonce="${nonce}"> window.vscode = acquireVsCodeApi(); </script>
//         <script nonce="${nonce}"> window.BACK_BUTTON_PATH = '${backButtonPath}'; </script>
//         <script type="module" src="${toolkitUri}" nonce="${nonce}"></script>
//         <script nonce="${nonce}" src="${echartsJsPath}"></script>
//         <script nonce="${nonce}" src="${chartScriptPath}"></script>
//         <script type="module" nonce="${nonce}" src="${codeDisplayScriptPath}"></script>

//         <script nonce="${nonce}">
//             // Encapsulate to avoid polluting global scope
//             (function() {
//                 const csvChooserButton = document.getElementById('csv-chooser');
//                 const csvFileNameDisplay = document.getElementById('csv-file-name-display');
//                 if (csvChooserButton) {
//                     csvChooserButton.addEventListener('click', () => {
//                         window.vscode.postMessage({
//                             command: 'chooseCsv',
//                         });
//                     });
//                 }

//                 const watChooserButton = document.getElementById('wat-chooser');
//                 const watFileNameDisplay = document.getElementById('wat-file-name-display');
//                 if (watChooserButton) {
//                     watChooserButton.addEventListener('click', () => {
//                         window.vscode.postMessage({
//                             command: 'chooseWat',
//                         });
//                     });
//                 }
                
//                 const chartReseterButton = document.getElementById('chart-reseter');
//                 if (chartReseterButton) {
//                     chartReseterButton.addEventListener('click', () => {
//                         window.vscode.postMessage({
//                             command:'resetChart',
//                         });
//                     });
//                 }

//                 // Listen for messages from the extension to update the displayed file name
//                 window.addEventListener('message', event => {
//                     const message = event.data; // The JSON data that the extension sent
//                     if (message.command === 'updateCsvFileName' && csvFileNameDisplay) {
//                         csvFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
//                     } else if (message.command === 'updateWatContent') {
//                         const watEditor = document.getElementById('wat-editor');
//                         if (watEditor) { watEditor.value = message.payload.content; }
//                     } else if (message.command === 'updateWatFileName' && watFileNameDisplay) {
//                         watFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
//                     }
//                 });
//             }());
//         </script>
//     </body>
//     </html>`;
// }

// // Function to generate a random nonce for CSP
// function getNonce() {
//     let text = '';
//     const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     for (let i = 0; i < 32; i++) {
//         text += possible.charAt(Math.floor(Math.random() * possible.length));
//     }
//     return text;
// }

// /**
//  * Organizes a .wat file into [fid, pc] by line. 
//  * 
//  * Invalid fid or pc are set to -1
//  * @param newWatContent The text from a .wat file in correct format (output of wasm-tools print)
//  * @returns A Map from line number to a tuple of [fid, pc]
//  */
// function organizeLineNumbers(newWatContent: string): Map<number, [number, number]>{
//     let lineCount = newWatContent.split('\n').length; // Use this instead of watParser.current_line_number to inclue trailing lines at the end
//     let watParser = new FSM(newWatContent);
//     watParser.run();
//     let lineToFid = new Map(Array.from(watParser.func_mapping, a => a.reverse() as [number, number]));
//     let output = new Map<number, [number, number]>();
//     fidPcToLine = new Map<number, Map<number, number>>();
//     let currentFid = -1;
//     let currentPc = -1;
//     for (let line: number = 1; line <= lineCount; line++){
//         if (lineToFid.has(line)){
//             currentFid = lineToFid.get(line)!;
//             currentPc = -1;
//         } else if (currentFid >= 0){ // Alternatively can be done with line - startLine ... But this works, so ...
//             const probeLocation = watParser.probe_mapping.get(currentFid);
//             if (probeLocation) {
//                 const startLine = probeLocation[0];
//                 const end_line = probeLocation[1];
//                 if (line >= startLine && line <= end_line) {
//                     currentPc++;
//                 } else {
//                     currentPc = -1;
//                     if (line > end_line){
//                         currentFid = -1;
//                     }
//                 }
//             }
//         }
//         output.set(line, [currentFid, currentPc]);
//         if (!fidPcToLine.has(currentFid)){
//             fidPcToLine.set(currentFid, new Map<number,number>());
//         }
//         fidPcToLine.get(currentFid)!.set(currentPc,line);
//     }
//     lineToFidPc = output;
//     return output;
// }