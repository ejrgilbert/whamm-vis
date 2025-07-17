// media/pieChart.js
// This script runs inside the webview
(function () {

  if(!window.chartFunctions){
      window.chartFunctions = new Map();
  }
  window.chartFunctions.set('pie', pieChart);

  let handleResize;
  let handleMessage;

  function pieChart() {
    // Defer initialization to allow the DOM to render.
    const timeoutId = setTimeout(function () {

      

      // Initialize ECharts instance
      const chartDom = document.getElementById('chart-container');
      const myChart = echarts.init(chartDom, 'dark');
      let focused = false;


      // Show a loading animation or placeholder until data arrives
      updateChart([{data: [], title: 'Placeholder', subtitle: 'Placeholder', dataGroupId: -1}]);

      
      // Caches the option field for the echart so when it focuses on one it can go back
      let cachedOption = myChart.getOption;
      let cachedChartsPerRow = 2;

      // --- Refactor listeners to be removable ---
      handleResize = () => {
        updateChart(chartDataFromOption(cachedOption), cachedChartsPerRow);
      };
      window.addEventListener('resize', handleResize);

      // Listen for messages from the extension host
      handleMessage = event => {
        const message = event.data; // The JSON data sent from the extension host

        const payload = message.payload;
        switch (message.command) {
          /*
            {
                command: 'updateChartData',
                payload: {
                    chartData: { data: { value: number; name: string }[]; title: string; subtitle: string; dataGroupId: string; },
                    //chartsPerRow: 2
                }
            }
          */
          case 'updateChartData':
            myChart.hideLoading();
            updateChart(payload.chartData, payload.chartsPerRow);
            cachedOption = myChart.getOption();
            cachedChartsPerRow = payload.chartsPerRow;
            break;
        }
      };
      window.addEventListener('message', handleMessage);

      // Focuses on target chart when double clicked or returns to base view
      const handleDblClick = function (params) {
        // Hide the tooltip to prevent errors when the chart is re-rendered.
        myChart.dispatchAction({ type: 'hideTip' });

        if (!focused){
          cachedOption = myChart.getOption();
          updateChart([{data: cachedOption.series[params.seriesIndex].data,
            title: cachedOption.title[params.seriesIndex].text,
            subtitle: cachedOption.title[params.seriesIndex].subtext,
            dataGroupId: cachedOption.series[params.seriesIndex].dataGroupId}], cachedChartsPerRow);
          focused = true;
          let fidPc = cachedOption.title[params.seriesIndex].subtext.split(':');
          window.vscode.postMessage({
            command:'chartSelectedFidPc',
            payload: {
              selectedFid: fidPc[0],
              selectedPc: fidPc[1]
            }
          });
        } else {
          updateChart(chartDataFromOption(cachedOption), cachedChartsPerRow);
          focused = false;

          window.vscode.postMessage({
            command:'chartSelectedFidPc',
            payload: {
              selectedFid: -1,
              selectedPc: -1
            }
          });
        }
      };
      myChart.on('dblclick', handleDblClick);

      /** Template Series Object */
      function generateSeriesObject(){
        return ({ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0});
      }

      /** Template Title Object */
      function generateTitleObject(){
        return ({ text: 'Chart', subtext: '', left: 'center', textStyle:{fontSize: 15} });
      }

      /**
       * Updates the chart, extending downwards in rows of chartsPerRow
       * @param {number} chartsPerRow 
       * @param {[{data: [{name: string, value: number}], title: string, subtitle: string, dataGroupId?: number}]} chartData 
       */
      function updateChart(chartData, chartsPerRow = -1){
        // Default options structure (data will be filled by message)
        let chartOption = {
          
          title: [],
          tooltip: { trigger: 'item' },
          legend: { orient: 'horizontal', left: 'center' },
          series: [],
          tooltip: {trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)'},
          color: [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
            '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
            '#bcbd22', '#17becf', '#aec7e8', '#ffbb78',
            '#98df8a', '#ff9896', '#c5b0d5', '#c49c94',
            '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
          ],
        };


        if (chartsPerRow === -1){
          chartsPerRow = Math.ceil(Math.sqrt(chartData.length));
        }

        // Get container dimensions for accurate calculations
        const containerWidth = chartDom.clientWidth;

        // Minimum chart cell width
        const minCellWidth = 250;

        // Ensures the charts aren't too squished
        while(containerWidth / chartsPerRow < minCellWidth && chartsPerRow > 1){
          chartsPerRow--;
        }

        // Calcualtes number of rows and columns
        const numCols = chartsPerRow;
        const numRows = Math.ceil(chartData.length / chartsPerRow);

        // Width of a column-slice of the container in pixels
        const colW = Math.max(containerWidth / numCols, minCellWidth);
            
        // Ratio of height to width of a cell
        const cellRatio = 0.75;
        
        // Height of a row-slice of the container in pixels 
        const rowH = cellRatio * colW;
        
        // Height of top margin (for legend) in pixels
        const legendMargin = 75;

        // Calculate required height for multiple rows
        chartDom.style.height = (legendMargin + (rowH * numRows)) + "px";
        
        // Margins and estimated sizes as percentages of cell dimensions
        const titleMarginCellTopFactor = 0.02; // 2% of cell height
        const assumedTitleHeightFactor = 0.03; // Assume title occupies 3% of cell height
        
        // Assuming chartData contains [{ data: [{name: '', value: number}], title: '', subtitle: '', dataGroupId: number}, ...]
        for (let i = 0; i < chartData.length; i++){
          const col = i % numCols;
          const row = Math.floor(i / numCols);

          // Define cell boundaries (percentages of container)
          const cellLeft = col * colW;
          const cellTop = legendMargin + (row * rowH);

          chartOption.series[i] = generateSeriesObject();
          chartOption.title[i] = generateTitleObject();

          if (chartData[i].dataGroupId !== undefined){
            chartOption.series[i].dataGroupId = chartData[i].dataGroupId;
          } else {
            chartOption.series[i].dataGroupId = i;
          }

          // Adds each line of data
          chartOption.series[i].data = chartData[i].data;

          // Sets the title
          chartOption.title[i].text = chartData[i].title;
          chartOption.title[i].subtext = chartData[i].subtitle;
          chartOption.series[i].name = chartData[i].title + ' at ' + chartData[i].subtitle;
          
          
          // Title positioning
          chartOption.title[i].left = cellLeft + (colW / 2);
          chartOption.title[i].textAlign = 'center';
          chartOption.title[i].top = cellTop + (titleMarginCellTopFactor * rowH);
          chartOption.title[i].textVerticalAlign = 'top';

          // Series (pie) positioning and radius
          const assumedTitleBottom =  (titleMarginCellTopFactor * rowH) + (assumedTitleHeightFactor * rowH);
          const pieCenterHeight = ((rowH - assumedTitleBottom) / 2) + assumedTitleBottom;


          chartOption.series[i].center = [cellLeft + (colW / 2), cellTop + pieCenterHeight];
          chartOption.series[i].radius = colW / 6;
        }
        

        // Add emphasis style if not already part of the base chartOption
        chartOption.series[0].emphasis = {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        };
        myChart.resize(); // Ensure chart adapts to new container height
        myChart.setOption(chartOption, true); // true to not merge with previous options
        focused = false;// TODO
      }

      /**
       * Generates a chartData for updateChart from an existing echarts.option
       * @param {echarts.option} option 
       * @returns {[{data: [{name: string, value: number}], title: string, subtitle: string, dataGroupId?: number}]}
       */
      function chartDataFromOption(option){
        let chartData = [];
        for (let i = 0; i < option.series.length; i++){
          let entry = {
            data: option.series[i].data,
            title: option.title[i].text,
            subtitle: option.title[i].subtext,
            dataGroupId: option.series[i].dataGroupId
          };
          chartData.push(entry);
        }

        return chartData;

      }
    }, 1);

    // --- Return a cleanup function ---
    return function cleanup() {
      clearTimeout(timeoutId);
      const chart = echarts.getInstanceByDom(document.getElementById('chart-container'));
      if (chart) {
        // Event listeners are bound to the chart instance, so disposing the chart should be enough.
        // If they were on `window`, we would need to remove them explicitly.
        // For this implementation, we can just dispose the chart.
        chart.dispose();
      }
       // If you had window listeners set up inside pieChart function, you would remove them here:
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('message', handleMessage);
    };
  }
}());
