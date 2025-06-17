"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pieDisplay = pieDisplay;
const parseCSV = __importStar(require("../parseCSV"));
const vscode = __importStar(require("vscode"));
function pieDisplay(context) {
    return vscode.commands.registerCommand('whamm-visualizer.open-pie-display', async () => {
        const panel = vscode.window.createWebviewPanel('PieVis', 'PieVis Output', vscode.ViewColumn.One, {
            // Enable scripts in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the extension's directory
            localResourceRoots: [vscode.Uri.file(context.extensionPath)],
            retainContextWhenHidden: true,
        });
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
        panel.onDidDispose(() => { }, null, context.subscriptions);
    });
}
function getWebviewContent(webview, extensionUri) {
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
function getChartData(csvContent) {
    // Organizes the data by fid then by pc
    let fidToPcToLine = new Map();
    for (let line of csvContent) {
        if (!fidToPcToLine.get(line["fid"])) {
            fidToPcToLine.set(line["fid"], new Map());
        }
        if (!fidToPcToLine.get(line["fid"])?.get(line["pc"])) {
            fidToPcToLine.get(line["fid"])?.set(line["pc"], []);
        }
        fidToPcToLine.get(line["fid"])?.get(line["pc"])?.push(line);
    }
    let output = [];
    let fids = fidToPcToLine.keys();
    for (let fid of Array.from(fids)) {
        let innerMap = fidToPcToLine.get(fid);
        if (!innerMap) {
            continue;
        }
        let pcs = innerMap.keys();
        for (let pc of Array.from(pcs)) {
            let lines = innerMap.get(pc);
            if (!lines || lines?.length === 0) {
                continue;
            }
            let opcode = lines[0].probe_id.split(":")[2]; // Gets the opcode (after #_wasm:opcode: and before :mode)
            let entry = {
                data: [],
                title: `${opcode} at ${lines[0]['fid:pc']}`,
            };
            lines.map(obj => entry.data.push({ value: obj['value(s)'], name: obj.name }));
            output.push(entry);
        }
    }
    return output;
}
//# sourceMappingURL=pieVis.js.map