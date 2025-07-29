(function () {

    if(!window.chartFunctions){
        window.chartFunctions = new Map();
    }
    window.chartFunctions.set('graph', graphChart);

    let handleMessage;
    let handleResize;


    function graphChart() {
        // Defer initialization to allow the DOM to render.
        const timeoutId = setTimeout(function () {

            

            // Initialize ECharts instance
            const chartDom = document.getElementById('chart-container');
            const outerChartDom = document.getElementById('outer-chart-container');
            
            chartDom.style.height = outerChartDom.clientHeight + 'px';
            
            window.myChart = echarts.init(chartDom, 'dark');;

            // Chart Constants and Variables Go Here

            // Handles resizing
            handleResize = () => {
                chartDom.style.height = outerChartDom.clientHeight + 'px';
                window.myChart.resize();
            };
            window.addEventListener('resize', handleResize);

            // Recieves the messages
            handleMessage = event => {
                const message = event.data; // The JSON data sent from the extension host

                const payload = message.payload;
                switch (message.command) {
                    case 'updateChartData':
                        window.myChart.hideLoading();
                        updateChart(payload.title, payload.chartData);
                        break;
                }
                
            };
            window.addEventListener('message', handleMessage);

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


            // Placeholder Data
            // Placeholder ECharts options
            var option = {/* Placeholder options goes here */};
            window.myChart.setOption(option);


            /**
             * Updates the chart (fully replaces the data)
             * @param {string} title The new title
             * @param {chartDataFunctions.graphChartData} chartData 
             */
            function updateChart(title, chartData){
                var newOption = {/* Options with data goes here */};
                window.myChart.setOption(newOption);
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
