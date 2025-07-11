import * as parseCSV from '../parseCSV';
import * as cDFuncs from '../chartDataFunctions';
import * as vscode from 'vscode';
import {getSVGPath} from './svgPathParser';

/**
 * Handles the whamm-visualizer.open-graph-display command
 * @param context
 * @returns A vscode extension command containing a graph
 */
export function graphDisplay(context: vscode.ExtensionContext): vscode.Disposable{
    return vscode.commands.registerCommand('whamm-visualizer.open-graph-display', async () => {
        // The svg path data for the self loop icon
        const selfLoopSVG = getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg'));
        
        const panel = vscode.window.createWebviewPanel(
            'GraphVis',
            'GraphVis Output',
            vscode.ViewColumn.One,
            {
                // Enable scripts in the webview
                enableScripts: true,

                // Restrict the webview to only load resources from the extension's directory
                localResourceRoots: [vscode.Uri.file(context.extensionPath)],
                // Ensures that it does not reset when switching tabs
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
        // const parsedCSV = parseCSV.parseMapFromFile(filePath);


        // Option 2: Use the file content
        const csvContent = editor.document.getText();
        parsedCSV = cDFuncs.organizeCSVByValue(parseCSV.parseFromString(csvContent));

        

        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

        // Send data to the webview
        panel.webview.postMessage({
            command: 'updateChartData',
            payload: {
                chartData: cDFuncs.getGraphChartData(refactorFix(parsedCSV)),
                title: filePath.split('/').pop() || filePath.split('\\').pop(),
                selfLoopSVG: selfLoopSVG
            }
        });


        // Clean up resources if needed when the panel is closed
        panel.onDidDispose(() => {}, null, context.subscriptions);

    });
}

let parsedCSV: Map<any, parseCSV.CSVRow[]>;

/**
 * 
 * @param webview Returns the webview where everything actually happens
 * @param extensionUri 
 * @returns The HTML of the page
 */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Path to the ECharts library within your extension
    const echartsJsPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));

    // Path to your custom script that initializes and renders the chart
    const chartScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'graph.js'));

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
        <div id="chart-container"></div>
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


function refactorFix(parsedCSV: Map<any, parseCSV.CSVRow[]>): Map<[number, number], number>{
    let output: Map<[number, number], number> = new Map();
    for (let key of Array.from(parsedCSV.keys())){
        let rows = parsedCSV.get(key)!;
        for (let row of rows){
            let values: [any, [any, any]] = row["value(s)"];
            output.set(values[1][0], values[1][1]);
        }
    }
    return output;
}