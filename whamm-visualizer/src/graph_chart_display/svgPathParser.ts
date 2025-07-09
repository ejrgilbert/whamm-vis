import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as vscode from 'vscode';

export function getSvgPathData(svgFilePath: string, pathId?: string): string[] {
    try {
        const svgContent = fs.readFileSync(svgFilePath, 'utf8');
        // Load the SVG content with xmlMode: true for proper XML parsing
        const $ = cheerio.load(svgContent, { xmlMode: true });

        const pathData: string[] = [];
        let selector = 'path'; // Default to select all path elements

        if (pathId) {
            selector = `#${pathId}`; // If an ID is provided, select by ID
        }

        $(selector).each((index, element) => {
            const dAttribute = $(element).attr('d');
            if (dAttribute) {
                pathData.push(dAttribute);
            }
        });

        return pathData;
    } catch (error) {
        console.error("Error reading or parsing SVG file with Cheerio:", error);
        return [];
    }
}

export function getSVGPath(svgUri: vscode.Uri) {
    return getSvgPathData(svgUri.fsPath)[0];

}