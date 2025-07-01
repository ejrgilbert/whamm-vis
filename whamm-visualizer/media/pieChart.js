// media/pieChart.js
// This script runs inside the webview

(function () {
  // Defer initialization until the DOM is ready and rendered to ensure the
  // container has its dimensions calculated by the browser.
  setTimeout(function () {

    // Initialize ECharts instance
    const chartDom = document.getElementById('chart-container');
    const myChart = echarts.init(chartDom, 'dark');

    // Show a loading animation or placeholder until data arrives
    updateChart([{data: [{name: 'Placeholder', value: 0}], title: 'Placeholder', subtitle: 'Placeholder', dataGroupId: -1}]);

    
    // Caches the option field for the echart so when it focuses on one it can go back
    let cachedOption = myChart.getOption;
    let cachedChartsPerRow = 2;

    // Handle resizing to make the chart responsive
    window.addEventListener('resize', () => {
      updateChart(chartDataFromOption(cachedOption), cachedChartsPerRow);
    });

    // Listen for messages from the extension host
    window.addEventListener('message', event => {
      const message = event.data; // The JSON data sent from the extension host

      const payload = message.payload;
      switch (message.command) {
        case 'updateChartData':
          myChart.hideLoading();
          updateChart(payload.chartData, payload.chartsPerRow);
          cachedOption = myChart.getOption();
          cachedChartsPerRow = payload.chartsPerRow;
          break;
      }
    
    });

    let focused = false;

    // Focuses on target chart when double clicked or returns to base view
    myChart.on('dblclick', function (params) {
      if (!focused){
        cachedOption = myChart.getOption();
        updateChart([{data: cachedOption.series[params.seriesIndex].data,
          title: cachedOption.title[params.seriesIndex].text,
          dataGroupId: cachedOption.series[params.seriesIndex].dataGroupId}], cachedChartsPerRow);
        focused = true;
      } else {
        updateChart(chartDataFromOption(cachedOption), cachedChartsPerRow);
        focused = false;
      }
    });

    function onBackButton(){
      if (focused) {
        updateChart(chartDataFromOption(cachedOption), cachedChartsPerRow);
        focused = false;
      }
    }

    function generateSeriesObject(){
      return ({ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0});
    }

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
        toolbox: {
          feature: {
            myDrag: {
              show: true,
              title: 'Back Button',
              icon: 'image://'+ window.BACK_BUTTON_PATH,
              onclick: onBackButton
            }
          }
        },
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
}());