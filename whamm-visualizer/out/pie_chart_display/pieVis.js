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
const topBar = __importStar(require("../topBar"));
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
        // const parsedCSV = parseCSV.parseFromFile(csvContent);
        // Option 2: Use the file content
        const csvContent = editor.document.getText();
        parsedCSV = parseCSV.fidPcMapFromString(csvContent);
        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
        // Send data to the webview
        // Adjust the payload structure based on what wizVis.wizVisFromString actually returns
        // and what pieChart.js expects.
        panel.webview.postMessage({
            command: 'updateChartData',
            payload: getChartData(parsedCSV)
        });
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            console.log(parsedCSV);
            switch (message.command) {
                case 'confirmButtonClicked':
                    panel.webview.postMessage({
                        command: 'updateChartData',
                        payload: getChartDataByFid(parsedCSV, Number.parseInt(message.payload.selectedFid))
                    });
                    return;
            }
        }, undefined, context.subscriptions);
        // Clean up resources if needed when the panel is closed
        panel.onDidDispose(() => { }, null, context.subscriptions);
    });
}
let parsedCSV;
function getWebviewContent(webview, extensionUri) {
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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
    </head>
    <body>
        ${topBar.generateTopBar(['Choose an FID:', 'Focus the charts!'], Array.from(parsedCSV.keys()))}
        <div id="chart-container"></div>

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
function getChartData(fidToPcToLine) {
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
                dataGroupId: lines[0]['fid:pc'],
            };
            lines.map(obj => entry.data.push({ value: obj['value(s)'], name: obj.name }));
            output.push(entry);
        }
    }
    return output;
}
function getChartDataByFid(fidToPcToLine, fid) {
    let output = [];
    console.log(fidToPcToLine);
    console.log(fid);
    console.log(fidToPcToLine.get(fid));
    let innerMap = fidToPcToLine.get(fid);
    if (!innerMap) {
        return output;
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
            dataGroupId: lines[0]['fid:pc'],
        };
        lines.map(obj => entry.data.push({ value: obj['value(s)'], name: obj.name }));
        output.push(entry);
    }
    return output;
}
//# sourceMappingURL=pieVis.js.map