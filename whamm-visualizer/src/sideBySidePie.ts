import * as parseCSV from './parseCSV';
import * as cDFuncs from './chartDataFunctions';
import * as vscode from 'vscode';




export function pieDisplay(context: vscode.ExtensionContext): vscode.Disposable{
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
        const filePath = editor.document.uri.fsPath;
        // Option 1: Use the file path
        // const parsedCSV = parseCSV.parseFromFile(csvContent);


        // Option 2: Use the file content
        const csvContent = editor.document.getText();
        parsedCSV = parseCSV.fidPcPidMapFromString(csvContent);

        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

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
        <div style="display: flex; flex-direction: row; height: 100%; box-sizing: border-box; min-width: 0; flex-wrap: nowrap;">
            <div id="left-panel" class="scrollable-div" style="width: 50%; height: 100%; padding: 0; margin: 0; box-sizing: border-box; border-right: 1px solid var(--vscode-editor-foreground); min-width: 0">
                <p>Hello world</p>
            </div>
            <div class="scrollable-div" style="width: 50%; box-sizing: border-box; min-width: 0;">
                <div id="chart-container"></div>
            </div>
        </div>

        <script nonce="${nonce}"> window.vscode = acquireVsCodeApi(); </script>
        <script nonce="${nonce}"> window.BACK_BUTTON_PATH = '${backButtonPath}'; </script>
        <script type="module" src="${toolkitUri}" nonce="${nonce}"></script>
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
    subtitle: string;
    dataGroupId: string;
}

function getChartData(fidToPcToPidToLine: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>): chartData[]{


    let output: chartData[] = [];

    let fids = fidToPcToPidToLine.keys();
    for (let fid of Array.from(fids)) {
        let innerMap = fidToPcToPidToLine.get(fid);
        if (!innerMap) {continue;}
        let pcs = innerMap.keys();
        for (let pc of Array.from(pcs)) {
            let innerInnerMap = fidToPcToPidToLine.get(fid)?.get(pc);
            if (!innerInnerMap) {continue;}
            let pids = innerInnerMap.keys();
            for (let pid of Array.from(pids)){
                let lines = innerInnerMap.get(pid);
                if (!lines || lines?.length === 0) {continue;}
                let opcode = lines[0].probe_id;
                //let opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
                let entry:chartData = {
                    data: [],
                    title: opcode,
                    subtitle: lines[0]['fid:pc'],
                    dataGroupId: opcode + lines[0]['fid:pc'],
            };
                lines.map(obj => entry.data.push({value: obj['value(s)'], name: obj.name}));
                output.push(entry);
            }
        }
    }
    return output;
}

function getChartDataByFid(fidToPcToPidToLine: Map<number, Map<number, Map<string, parseCSV.CSVRow[]>>>, fid: number): chartData[]{
    let output: chartData[] = [];
    console.log(fidToPcToPidToLine);
    console.log(fid);
    console.log(fidToPcToPidToLine.get(fid));
    let innerMap = fidToPcToPidToLine.get(fid);
    if (!innerMap) {return output;}
    let pcs = innerMap.keys();
    for (let pc of Array.from(pcs)) {
        let innerInnerMap = fidToPcToPidToLine.get(fid)?.get(pc);
        if (!innerInnerMap) {continue;}
        let pids = innerInnerMap.keys();
        for (let pid of Array.from(pids)){
            let lines = innerInnerMap.get(pid);
            if (!lines || lines?.length === 0) {continue;}
            let opcode = lines[0].probe_id;
            //let opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            let entry:chartData = {
                data: [],
                title: opcode,
                subtitle: lines[0]['fid:pc'],
                dataGroupId: opcode + lines[0]['fid:pc'],
            };
            lines.map(obj => entry.data.push({value: obj['value(s)'], name: obj.name}));
            output.push(entry);
        }
        }
    return output;
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