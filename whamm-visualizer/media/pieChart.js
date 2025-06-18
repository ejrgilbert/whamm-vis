// media/pieChart.js
// This script runs inside the webview

(function () {

  // Initialize ECharts instance
  const chartDom = document.getElementById('chart-container');
  const myChart = echarts.init(chartDom, 'dark');

  // Show a loading animation or placeholder until data arrives
  myChart.showLoading({ text: 'Loading chart data...' });

  
  // Caches the option field for the echart so when it focuses on one it can go back
  let cachedOption = {};
  let cachedChartsPerRow = 2;

  // Handle resizing to make the chart responsive
  window.addEventListener('resize', () => {
    myChart.resize();
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
    return ({ text: 'Chart', subtext: '', left: 'center', textStyle:{fontSize: 12} });
  }

  /**
   * Updates the chart, extending downwards in rows of chartsPerRow
   * @param {number} chartsPerRow 
   * @param {[{data: [{name: string, value: number}], title: string, dataGroupId?: number}]} chartData 
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
      legend: { orient: 'vertical', left: 'left' },
      series: [],
      tooltip: {trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)'},
    };


    if (chartsPerRow === -1){
      chartsPerRow = Math.ceil(Math.sqrt(chartData.length));
    }

    let requiredHeightPercent = 100;
    if (chartData.length > chartsPerRow * chartsPerRow) {
      // Calculate required height for multiple rows
      requiredHeightPercent = 10 + ((90 / chartsPerRow) * Math.ceil(chartData.length / chartsPerRow));
    }
    chartDom.style.height = `${requiredHeightPercent}%`;


    // Assuming chartData contains [{ data: [{name: '', value: number}], title: '', dataGroupId: number}, ...]
    if (chartData.length > 1){ // Multiple charts will be 2 columns, a single one will fill the whole area
      // Calcualtes number of rows and columns
      const numCols = chartsPerRow;
      const numRows = Math.ceil(chartData.length / chartsPerRow);

      const topMargin = 10;

      const colW = 100 / numCols; // Width of a column-slice of the container
      const rowH = (100 - topMargin) / numRows; // Height of a row-slice of the container

      // Margins and estimated sizes as percentages of cell dimensions
      const titleMarginCellTopFactor = 0.05; // 5% of cell height
      const assumedTitleHeightFactor = 0.15; // Assume title occupies 15% of cell height
      const seriesMarginCellSidesFactor = 0.10; // 10% of cell width as L/R margin for pie
      const seriesMarginCellTopFromTitleFactor = 0.03; // 3% of cell height margin below title area
      const seriesMarginCellBottomFactor = 0.05; // 5% of cell height as bottom margin for pie
      
      for (let i = 0; i < chartData.length; i++){
        const col = i % numCols;
        const row = Math.floor(i / numCols);

        // Define cell boundaries (percentages of container)
        const cellLeft = col * colW;
        const cellTop = topMargin + (row * rowH);

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
        chartOption.series[i].name = chartData[i].title;
        
        
        // Title positioning
        chartOption.title[i].left = `${cellLeft + colW / 2}%`;
        chartOption.title[i].textAlign = 'center';
        chartOption.title[i].top = `${cellTop + (titleMarginCellTopFactor * rowH)}%`;
        chartOption.title[i].textVerticalAlign = 'top';

        // Series (pie) positioning and radius
        const assumedTitleBottom = cellTop + (titleMarginCellTopFactor * rowH) + (assumedTitleHeightFactor * rowH);
        const pieRenderAreaLeft = cellLeft + (seriesMarginCellSidesFactor * colW);
        const pieRenderAreaRight = cellLeft + colW - (seriesMarginCellSidesFactor * colW);
        const pieRenderAreaTop = assumedTitleBottom + (seriesMarginCellTopFromTitleFactor * rowH);
        const pieRenderAreaBottom = cellTop + rowH - (seriesMarginCellBottomFactor * rowH);
        const pieRenderWidth = pieRenderAreaRight - pieRenderAreaLeft;
        const pieRenderHeight = pieRenderAreaBottom - pieRenderAreaTop;

        chartOption.series[i].center = [`${pieRenderAreaLeft + pieRenderWidth / 2}%`, `${pieRenderAreaTop + pieRenderHeight / 2}%`];
        chartOption.series[i].radius = `${Math.max(0, Math.min(pieRenderWidth / 2, pieRenderHeight / 2))}%`; // Ensure radius is not negative
        
        //chartOption.title[i].textstyle.fontsize = chartOption.series[i].label.fontsize * 1.5;
      }
    } else {      
      chartOption.series[0] = generateSeriesObject();
      chartOption.title[0] = generateTitleObject();

      if (chartData[0].dataGroupId !== undefined){
          chartOption.series[0].dataGroupId = chartData[0].dataGroupId;
        } else {
          chartOption.series[0].dataGroupId = 0;
        }

      // Adds the line of data
      chartOption.series[0].data = chartData[0].data;

      // Sets the title
      chartOption.title[0].text = chartData[0].title;
      chartOption.series[0].name = chartData[0].title;
      
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
    console.log(myChart.getOption());
  }

  /**
   * Generates a chartData for updateChart from an existing echarts.option
   * @param {echarts.option} option 
   * @returns {[{data: [{name: string, value: number}], title: string, dataGroupId?: number}]}
   */
  function chartDataFromOption(option){
    let chartData = [];
    for (let i = 0; i < option.series.length; i++){
      let entry = {
        data: option.series[i].data,
        title: option.title[i].text,
        dataGroupId: option.series[i].dataGroupId
      };
      chartData.push(entry);
    }

    return chartData;

  }


}());