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
exports.testDisplay = testDisplay;
const wizVis = __importStar(require("../wizVis"));
const vscode = __importStar(require("vscode"));
function pieDisplay(context) {
    return vscode.commands.registerCommand('whamm-visualizer.open-pie-display', async () => {
        const panel = vscode.window.createWebviewPanel('PieVis', 'PieVis Output', vscode.ViewColumn.One, {
            enableScripts: true
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
        const output = wizVis.wizVisFromString(csvContent, true);
    });
}
function testDisplay(context) {
    return vscode.commands.registerCommand('whamm-visualizer.open-pie-display', async () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel('echartsChart', // Identifies the type of the webview (internal)
        'ECharts Chart', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            // Enable scripts in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the extension's directory
            localResourceRoots: [vscode.Uri.file(context.extensionPath)]
        });
        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent2(panel.webview, context.extensionUri);
        // Inside activate function, after creating the panel
        panel.onDidDispose(() => {
            // Clean up resources if needed when the panel is closed
        }, null, context.subscriptions);
        // // Example: Update chart data after 5 seconds
        // setTimeout(() => {
        // 	panel.webview.postMessage({ command: 'updateChartData', data: [150, 220, 180, 90, 100, 140, 160] });
        // }, 5000);
        // Example: Listen for messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'chartClicked':
                    vscode.window.showInformationMessage(`Chart element clicked: ${message.data}`);
                    return;
            }
        }, undefined, context.subscriptions);
    });
}
function getWebviewContent2(webview, extensionUri) {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));
    // Path to your custom script that initializes and renders the chart
    const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'chart.js'));
    // Content Security Policy (CSP) to allow only specific scripts
    const nonce = getNonce();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECharts Chart</title>
        <style>
            html, body, #chart-container {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden; /* Prevent scrollbars */
            }
        </style>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
    </head>
    <body>
        <div id="chart-container"></div>

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
//# sourceMappingURL=pieVis.js.map