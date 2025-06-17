import * as parseCSV from '../parseCSV';
import * as vscode from 'vscode';


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
        // const output = wizVis.wizVisFromFile(filePath, true);

        // Option 2: Use the file content
        const csvContent = editor.document.getText();
        const parsedCSV = parseCSV.parseFromString(csvContent);

        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

		// Send data to the webview
        // Adjust the payload structure based on what wizVis.wizVisFromString actually returns
        // and what pieChart.js expects.
        panel.webview.postMessage({
            command: 'updateChartData',
            payload: getChartData(parsedCSV)
        });

        // Clean up resources if needed when the panel is closed
		panel.onDidDispose(() => {}, null, context.subscriptions);

	});
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));

    // Path to your custom script that initializes and renders the chart
    const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'pieChart.js'));

    // Path to back button
    const backButtonPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'whamm!_logo.png'));

    // Content Security Policy (CSP) to allow only specific scripts
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECharts Chart</title>
        <style>
            html {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden; /* Prevent scrollbars on the html element */
            }
            body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow-y: auto; /* Allow body to scroll vertically if content overflows */
                overflow-x: hidden; /* Prevent horizontal scroll on body unless necessary */
            }
            #chart-container {
                width: 100%;
                margin: 0;
                padding: 0;
            }
        </style>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
    </head>
    <body>
        <div id="chart-container"></div>

        <script nonce="${nonce}"> window.BACK_BUTTON_PATH = '${backButtonPath}'; </script>
        <script nonce="${nonce}" src="${echartsJsPath}"></script>
        <script nonce="${nonce}" src="${chartScriptPath}"></script>
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

type chartData = {
    data: { value: number; name: string }[];
    title: string;
}

function getChartData(csvContent: parseCSV.CSVRow[]): chartData[]{
    // Organizes the data by fid then by pc

    let fidToPcToLine: Map<number, Map<number, parseCSV.CSVRow[]>> = new Map();
    for (let line of csvContent) {
        if (!fidToPcToLine.get(line["fid"])){
            fidToPcToLine.set(line["fid"], new Map());
        }
        if (!fidToPcToLine.get(line["fid"])?.get(line["pc"])) {
            fidToPcToLine.get(line["fid"])?.set(line["pc"], []);
        }
        fidToPcToLine.get(line["fid"])?.get(line["pc"])?.push(line);
        
    }

    let output: chartData[] = [];

    let fids = fidToPcToLine.keys();
    for (let fid of Array.from(fids)) {
        let innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {continue;}
        let pcs = innerMap.keys();
        for (let pc of Array.from(pcs)) {
            let lines = innerMap.get(pc);
            if (!lines || lines?.length === 0) {continue;}
            let opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            let entry:chartData = {
                data: [],
                title: `${opcode} at ${lines[0]['fid:pc']}`,
            };
            lines.map(obj => entry.data.push({value: obj['value(s)'], name: obj.name}));
            output.push(entry);
        }
    }
    return output;
}
