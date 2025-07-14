import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';
import * as vscode from 'vscode';


import * as topBar from '../top_bars/topBar';

/**
 * Handles the whamm-visualizer.open-pie-display command
 * @param context
 * @returns A vscode extension command containing pie charts
 */
export function pieDisplay(context: vscode.ExtensionContext): vscode.Disposable{
	return vscode.commands.registerCommand('whamm-visualizer.open-pie-display', async () => {
        const panel = vscode.window.createWebviewPanel(
            'PieVis',
            'PieVis Output',
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
        const filePath = editor.document.uri.fsPath;
        // Option 1: Use the file path
        // const parsedCSV = parseCSV.parseFromFile(filePath);


        // Option 2: Use the file content
        const csvContent = editor.document.getText();
        parsedCSV = cDFuncs.organizeCSVByFidPcPid(parseCSV.parseFromString(csvContent));

        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

		// Send data to the webview
        // Adjust the payload structure based on what wizVis.wizVisFromString actually returns
        // and what pieChart.js expects.
        panel.webview.postMessage({
            command: 'updateChartData',
            payload: {
                chartData: cDFuncs.getChartDataFromFidPcPidMap(parsedCSV, dataMapping),
                //chartsPerRow: 2
            }
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                console.log(parsedCSV);
                switch (message.command) {
                    case 'confirmButtonClicked':
                        panel.webview.postMessage({
                            command: 'updateChartData',
                            payload: {
                                chartData: cDFuncs.getChartDataByFid(parsedCSV, Number.parseInt(message.payload.selectedFid), dataMapping),
                                //chartsPerRow: 2
                            }
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

let parsedCSV: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>;

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));

    // Path to your custom script that initializes and renders the chart
    const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'pieChart.js'));

    // Path to back button
    const backButtonPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'whamm!_logo.png'));

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
        ${topBar.generateTopBar(['Choose an FID:', 'Focus the charts!'], Array.from(parsedCSV.keys()))}
        <div class="scrollable-div">
            <div id="chart-container"></div>
        </div>
        <script nonce="${nonce}"> window.vscode = acquireVsCodeApi(); </script>
        <script nonce="${nonce}"> window.BACK_BUTTON_PATH = '${backButtonPath}'; </script>
        <script type="module" src="${toolkitUri}" nonce="${nonce}"></script>
        <script nonce="${nonce}" src="${echartsJsPath}"></script>
        <script nonce="${nonce}" src="${chartScriptPath}"></script>

        <script nonce="${nonce}">
            // Encapsulate to avoid polluting global scope
            (function() {
                const confirmButton = document.getElementById('confirm-button');
                const optionsDropdown = document.getElementById('options-dropdown');

                if (confirmButton) {
                    confirmButton.addEventListener('click', () => {
                        let selectedValue = '';
                        if (optionsDropdown) {
                            selectedValue = optionsDropdown.value;
                        }
                        window.vscode.postMessage({
                            command: 'confirmButtonClicked',
                            payload: {
                                selectedFid: selectedValue
                            }
                        });
                    });
                }
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
 * How to map the data from a `parseCSV.CSVRow[]` to a `cDFuncs.pieChartData`
 * @param lines 
 * @returns 
 */
function dataMapping(lines: parseCSV.CSVRow[]): cDFuncs.pieChartData{
    let opcode = lines[0].probe_id!;
    let entry:cDFuncs.pieChartData = {
        pieChart: true,
        data: [],
        title: opcode,
        subtitle: lines[0]['fid:pc']!,
        dataGroupId: opcode + lines[0]['fid:pc'],
    };
    lines.map(obj => entry.data.push({value: obj['value(s)'], name: obj.name!}));
    return entry;
}
