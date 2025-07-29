# How to add new visualizations

## Relevant Files

* `src/std_side_by_side/newChartInfo.ts` (new)
* `media/newChart.js` (new)
* `src/std_side_by_side/chartTemplateManager.ts` (modified)

## Chart Info TypeScript

Create a file in `srd/std_side_by_side` 

The Payload type should be an object which is recieved/transmitted with the webview message with the command `'updateChartData'` .

    export abstract class ChartInfoTemplate<Payload> {
        
The constructor should additionally initialize any alternative formats for the data (for example, maps from fid to data).

        /**
        * Constructor for the chartInfo classes
        * @param parsedCSV The array of parsed CSV rows
        * @param panel The vscode.WebviewPanel containing everything
        */
        constructor(parsedCSV: parseCSV.CSVRow[], panel: WebviewPanel, fileName: string){
            this.parsedCSV = parsedCSV;
            this.panel = panel;
            this.fileName = fileName;
        }

This should generate the payload object that should contain any relevent data that the display should need.

        /**
        * Generates what is sent out to the chart
        * @return A payload object, may be different for each chart type
        */
        abstract generateUpdateChartDataPayload(): Payload;

This function is called when a line is selected in the code display of `stdSideBySide.ts`. 
(In the pie chart it sends new data filtered by the fid and pc. In the call graph it sends a message to select the node associated with that fid. In the memory heatmap it does not do anything.)

        /**
        * What happens when a Fid and Pc are selected in the code panel
        * @param payload The payload containing the selected fid and pc
        */
        abstract onCodeSelectedFidPc(selectedFid: number, selectedPc: number):  void;

This should create an HTML string with a label with the for modifier `"chart-specific-dropdown"` and the dropdown (select) with the id `"chart-specific-dropdown"`.

        /**
        * Generates a chart specific dropdown
        */
        abstract generateDropdown(): string;

This is called whenever the dropdown from the previous function is changed. This may do something similar to `onCodeSelectedFidPc` or something entirely different.

        /**
        * What should happen when the chart specific dropdown changes
        */
        abstract onDropdownChange(selectedValue: string): void;

## Echarts Visualization JavaScript

Encapsulate in an Immediately Invoked Function Expression to run when loaded.

        (function () {

Add the funcion containing the display to the map of function.

                if(!window.chartFunctions){
                window.chartFunctions = new Map();
                }
                window.chartFunctions.set('newChart', newChart);

Declare any window listeners.

                let handleResize;
                let handleMessage;

                function newChart() {

Defer initialization to allow the DOM to render.

                        const timeoutId = setTimeout(function () {

Initialize your chart.

                                                        
                                // Initialize ECharts instance
                                const chartDom = document.getElementById('chart-container');
                                const outerChartDom = document.getElementById('outer-chart-container');
                                
                                chartDom.style.height = outerChartDom.clientHeight + 'px';
                                
                                window.myChart = echarts.init(chartDom, 'dark');;

Declare any constants and variables.

                                // Chart Constants and Variables

Create Event handlers:

* The `handleResize` could be based on data, this is the based on the parent height.

                                handleResize = () => {
                                        chartDom.style.height = outerChartDom.clientHeight + 'px';
                                        window.myChart.resize();
                                };
                                window.addEventListener('resize', handleResize);

* The `handleMessage` should handle `updateChartData` and other messages as relevant

                                handleMessage = event => {
                                        const message = event.data; // The JSON data sent from the extension host

                                        const payload = message.payload;
                                        switch (message.command) {
                                        case 'updateChartData':
                                                updateChart(payload.title, payload.chartData);
                                                break;
                                        }
                                        
                                };
                                window.addEventListener('message', handleMessage);

* One may want to add click functionality, this is a how you could do it. The params parameter contains data about the chart and where was clicked (for example the slice of the pie of a pie chart or the bar of a bar graph)

                                // Handle Click
                                const handleClick = function (params) {
                                        window.vscode.postMessage({
                                        command:'chartSelectedFidPc',
                                        payload: {
                                                selectedFid: currentFid,
                                                selectedPc: currentPc
                                        }
                                        });
                                };
                                window.myChart.on('click', handleClick);

There should be placeholder data that is shown on load and if the data is unreadable. A good choice might be very similar to an example from echarts

                                var option = {/* An options object from echarts */};
                                window.myChart.setOption(option);

There should be an `updateChart` function which updates the data shown in the chart. It may do other things too, like change the tile or height.

                                /**
                                * Updates the chart (fully replaces the data)
                                * @param {string} title The new title
                                * @param {chartDataFunctions.graphChartData} chartData 
                                */
                                function updateChart(title, chartData){
                                        var newOption = {/* An options object from echarts, but with the new data */};
                                        window.myChart.setOption(newOption);
                                }

                                


End of setTimeout function.

                        }, 1);

Return a cleanup function that removes all of the listeners.

                return function cleanup() {
                        clearTimeout(timeoutId);
                        const chart = echarts.getInstanceByDom(document.getElementById('chart-container'));
                        if (chart){ // Remove chart listeners
                                chart.dispose();
                        }
                        // Removes window listeners
                        window.removeEventListener('resize', handleResize);
                        window.removeEventListener('message', handleMessage);
                        };
                }

End of IIFE.

        }()); 

## Adding to chartTemplateManager.ts

1. Import the newChartInfo class from newChartInfo.ts
2. Add a new line to generateChartOptionsMap() containing

        ['newChart', ['newChart.js', undefined]],

3. Add a new case in getChartInfo() before 

        case 'newChart': <-- This
                chartTuple[1] = new newChartInfo(parsedCSV, panel, fileName); <-- This
                break; <-- And this
        case 'default':
        default:

## Now you should have a new display implemented