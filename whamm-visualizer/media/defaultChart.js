(function () {

    if(!window.chartFunctions){
        window.chartFunctions = new Map();
    }
    window.chartFunctions.set('default', defaultChart);

    let handleResize;


    function defaultChart() {
        // Defer initialization until the DOM is ready and rendered to ensure the
        // container has its dimensions calculated by the browser.
        const timeoutId = setTimeout(function () {
            
            // Initialize ECharts instance
            const chartDom = document.getElementById('chart-container');
            const outerChartDom = document.getElementById('outer-chart-container');
            
            chartDom.style.height = outerChartDom.clientHeight + 'px';
            
            
            window.myChart = echarts.init(chartDom, 'dark');

            handleResize = () => {
                chartDom.style.height = outerChartDom.clientHeight + 'px';
                window.myChart.resize();
            };
            window.addEventListener('resize', handleResize);

            option = {
                // backgroundColor: 'red',
                graphic: {
                    elements: [
                    {
                        type: 'text',
                        left: 'center',
                        top: 'center',
                        style: {
                        text: 'Whamm Vis',
                        fontSize: 80,
                        fontWeight: 'bold',
                        lineDash: [0, 200],
                        lineDashOffset: 0,
                        fill: 'transparent',
                        stroke: '#fff',
                        lineWidth: 1
                        },
                        keyframeAnimation: {
                        duration: 3000,
                        loop: false,
                        keyframes: [
                            {
                            percent: 0.7,
                            style: {
                                fill: 'transparent',
                                lineDashOffset: 200,
                                lineDash: [200, 0]
                            }
                            },
                            {
                            // Stop for a while.
                            percent: 0.8,
                            style: {
                                fill: 'transparent'
                            }
                            },
                            {
                            percent: 1,
                            style: {
                                fill: 'white'
                            }
                            }
                        ]
                        }
                    }
                    ]
                }
            };
            window.myChart.setOption(option);
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
        };
    }
}());