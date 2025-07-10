import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * Extracts the path data from an .svg file
 * @param svgFilePath The path to the .svg file
 * @param pathId Optionally, give the pathId to extract
 * @returns All path datas in the file
 */
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

/**
 * Extracts the path data from an .svg file given a Uri
 * @param svgUri Uri of the .svg file
 * @returns The first path data in the file
 */
export function getSVGPath(svgUri: vscode.Uri): string {
    return getSvgPathData(svgUri.fsPath)[0];

}