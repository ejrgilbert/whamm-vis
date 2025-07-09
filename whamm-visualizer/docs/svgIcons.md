## How to Add New .svg Images for echarts

1. Ensure that there is only one path

    For example: Use Inkscape and union/difference all objects together

2. Place .svg file in media/svg_files

3. Get the path data from the svg using svgPathParser.ts. For example:

    `getSVGPath(vscode.Uri.joinPath(context.extensionUri, 'media', 'svg_files', 'selfLoop.svg'))`

4. Use the resulting string wherever echarts accepts svg paths preceded by `"path://"`

    Examples include ends of edges on graph paths, graph nodes, and legend icons. Check echarts doccumentation for more details.