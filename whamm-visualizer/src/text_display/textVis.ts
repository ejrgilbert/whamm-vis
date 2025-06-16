import * as wizVis from '../wizVis';

import AnsiToHtml from 'ansi-to-html';
const ansiToHtml = new AnsiToHtml();

import * as vscode from 'vscode';

export function textDisplay(): vscode.Disposable{
    return vscode.commands.registerCommand('whamm-visualizer.open-text-display', async () => {
        const panel = vscode.window.createWebviewPanel(
            'wizVis',
            'WizVis Output',
            vscode.ViewColumn.One,
            {}
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


        panel.webview.html = getWebviewContent(csvContent);
    });
}

export function getWebviewContent(csvContent: string){
      return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Output</title>  
        </head>
        <body>
            <pre>${ansiToHtml.toHtml(wizVis.wizVisFromString(csvContent, true))}</pre>   
        </body>
        </html>`;
}