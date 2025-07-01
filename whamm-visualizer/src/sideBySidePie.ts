import * as parseCSV from './parseCSV';
import * as cDFuncs from './chartDataFunctions';
import {FSM} from './wat_parser/fsm';
import * as vscode from 'vscode';



export function sidebySidePieDisplay(context: vscode.ExtensionContext): vscode.Disposable{
	return vscode.commands.registerCommand('whamm-visualizer.open-side-by-side-pie', async () => {
        const panel = vscode.window.createWebviewPanel(
            'Side by Side Pie',
            'Side by Side Pie Output',
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
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
        switch (fileExtension){
            case 'csv':
                // Option 1: Use the file path
                parsedCSV = parseCSV.fidPcPidMapFromFile(filePath);
                // Option 2: Use the file content
                // const csvContent = editor.document.getText();
                // parsedCSV = parseCSV.fidPcPidMapFromString(csvContent);


                // Send the initial file name to the webview
                panel.webview.postMessage({
                    command: 'updateCsvFileName',
                    payload: { fileName: fileName }
                });

                // Send data to the webview
                // Adjust the payload structure based on what wizVis.wizVisFromString actually returns
                // and what pieChart.js expects.
                panel.webview.postMessage({
                    command: 'updateChartData',
                    payload: {
                        chartData: cDFuncs.getChartData(parsedCSV, dataMapping),
                        //chartsPerRow: 2
                    }
                });
                break;
            case 'wat':
                const newWatContentArray = await vscode.workspace.fs.readFile(fileUri);
                const newWatContent = newWatContentArray.toString();
                panel.webview.postMessage({
                    command: 'updateWatFileName',
                    payload: { fileName: fileName }
                });
                let watParser = new FSM(newWatContent);
                watParser.run();
                let lineToFid = new Map(Array.from(watParser.func_mapping, a => a.reverse() as [number, number]));
                panel.webview.postMessage({
                    command: 'updateWatContent',
                    payload: {
                        newCode: newWatContent,
                        lineToFid: lineToFid
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
                let options: vscode.OpenDialogOptions;
                let fileUri;
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
                            const newCsvContent = await vscode.workspace.fs.readFile(fileUri[0]);
                            const newParsedCSV = parseCSV.fidPcPidMapFromString(newCsvContent.toString());
                            
                            // Update the global parsedCSV for this panel instance
                            parsedCSV = newParsedCSV;

                            // Extract the file name from the URI
                            const fileName = fileUri[0].fsPath.split('/').pop() || fileUri[0].fsPath.split('\\').pop();
                            panel.webview.postMessage({
                                command: 'updateCsvFileName',
                                payload: { fileName: fileName }
                            });

                            panel.webview.postMessage({
                                command: 'updateChartData',
                                payload: {
                                    chartData: cDFuncs.getChartData(parsedCSV, dataMapping),
                                }
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
                            const fileName = fileUri[0].fsPath.split('/').pop() || fileUri[0].fsPath.split('\\').pop();
                            panel.webview.postMessage({
                                command: 'updateWatFileName',
                                payload: { fileName: fileName }
                            });
                            let watParser = new FSM(newWatContent);
                            watParser.run();
                            let lineToFid = new Map(Array.from(watParser.func_mapping, a => a.reverse() as [number, number]));
                            panel.webview.postMessage({
                                command: 'updateWatContent',
                                payload: {
                                    newCode: newWatContent,
                                    lineToFid: lineToFid
                                }
                            });
                        }
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

let parsedCSV: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>;

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));

    // Path to the script that initializes and renders the chart
    const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'pieChart.js'));

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
                    <p id="csv-file-name-display">File name: No file chosen</p>
                </div>
                <div id="chart-container"></div>
            </div>
        </div>

        <script nonce="${nonce}"> window.vscode = acquireVsCodeApi(); </script>
        <script nonce="${nonce}"> window.BACK_BUTTON_PATH = '${backButtonPath}'; </script>
        <script type="module" src="${toolkitUri}" nonce="${nonce}"></script>
        <script nonce="${nonce}" src="${echartsJsPath}"></script>
        <script nonce="${nonce}" src="${chartScriptPath}"></script>
        <script type="module" nonce="${nonce}" src="${codeDisplayScriptPath}"></script>

        <script nonce="${nonce}">
            // Encapsulate to avoid polluting global scope
            (function() {
                const csvChooserButton = document.getElementById('csv-chooser');
                const csvFileNameDisplay = document.getElementById('csv-file-name-display');
                const watChooserButton = document.getElementById('wat-chooser');
                const watFileNameDisplay = document.getElementById('wat-file-name-display');

                if (csvChooserButton) {
                    csvChooserButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command: 'chooseCsv',
                        });
                    });
                }

                if (watChooserButton) {
                    watChooserButton.addEventListener('click', () => {
                        window.vscode.postMessage({
                            command: 'chooseWat',
                        });
                    });
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data that the extension sent
                    if (message.command === 'updateCsvFileName' && csvFileNameDisplay) {
                        csvFileNameDisplay.textContent = \`File name: \${message.payload.fileName}\`;
                    } else if (message.command === 'updateWatContent') {
                        const watEditor = document.getElementById('wat-editor');
                        if (watEditor) { watEditor.value = message.payload.content; }
                        // editor.setValue(message.payload.content); // If you have a CodeMirror instance
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

function dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.chartData{
    let opcode = lines[0].probe_id;
    let entry:cDFuncs.chartData = {
        data: [],
        title: opcode,
        subtitle: lines[0]['fid:pc'],
        dataGroupId: opcode + lines[0]['fid:pc'],
    };
    lines.map(obj => entry.data.push({value: obj['value(s)'], name: obj.name}));
    return entry;
}