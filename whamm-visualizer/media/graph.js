
(function () {
    // Defer initialization until the DOM is ready and rendered to ensure the
    // container has its dimensions calculated by the browser.
    setTimeout(function () {
        // Initialize ECharts instance
        var myChart = echarts.init(document.getElementById('chart-container'));

        window.addEventListener('message', event => {
            const message = event.data; // The JSON data sent from the extension host

            const payload = message.payload;
            switch (message.command) {
                case 'updateChartData':
                myChart.hideLoading();
                updateChart(payload.title, payload.chartData, payload.selfLoopSVG);
                cachedOption = myChart.getOption();
                break;
            }
            
        });

        // Define your graph data with nodes, and custom emphasis for 'self-loop' nodes
        var nodes = [
            {
                id: 'nodeA', name: 'Node A', symbolSize: 30, itemStyle: { color: '#00FFFF', borderColor: 'red', borderWidth: 3 }, // Persistent red border
            }, // Cyan node, red border and red glow on hover
            { id: 'nodeB', name: 'Node B', symbolSize: 30, itemStyle: { color: '#FF00FF', borderColor: '#0f3460', borderWidth: 2 } },  // Magenta node, default border
            {
                id: 'nodeC', name: 'Node C', symbolSize: 30, itemStyle: { color: '#FFFF00', borderColor: 'lime', borderWidth: 3 }, // Persistent lime border
            },  // Yellow node, lime border and lime glow on hover
            {
                id: 'nodeD', name: 'Node D', symbolSize: 30, itemStyle: { color: '#00FF00', borderColor: 'orange', borderWidth: 3 }, // Persistent orange border
            },  // Lime Green node, orange border and orange glow on hover
            { id: 'nodeE', name: 'Node E', symbolSize: 30, itemStyle: { color: '#FF9900', borderColor: '#0f3460', borderWidth: 2 } },  // Orange node, default border
            { id: 'nodeF', name: 'Node F', symbolSize: 30, itemStyle: { color: '#9933FF', borderColor: '#0f3460', borderWidth: 2 } }   // Purple node, default border
        ];

        var links = [];

        // Generate ONE-WAY connections between all distinct pairs of nodes as straight lines
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) { // Start j from i + 1 to ensure one-way connections
                links.push({
                    source: nodes[i].id,
                    target: nodes[j].id,
                    name: `${nodes[i].name} to ${nodes[j].name}`,
                    lineStyle: {
                        color: '#888888', // Standard edge color
                        width: 3,
                        curveness: 0, // Set curveness to 0 for straight lines
                        symbol: ['none', 'arrow'], // Add arrow at the target end
                        symbolSize: 10 // Size of the arrow
                    },
                    emphasis: { // Default emphasis for connecting edges
                        lineStyle: {
                            color: '#e94560',
                            width: 4
                        }
                    }
                });
            }
        }

        // ECharts options
        var option = {
            title: {
                text: 'ECharts Graph: Persistent Border for Conceptual Self-Loop Nodes (Force Layout)',
                left: 'center',
                textStyle: {
                    color: '#e0e0e0'
                }
            },
            tooltip: {
                formatter: function (params) {
                    if (params.dataType === 'node') {
                        let tooltipText = 'Node: ' + params.name;
                        return tooltipText;
                    } else if (params.dataType === 'edge') {
                        return 'Edge: ' + params.name + '<br/>Source: ' + params.data.source + '<br/>Target: ' + params.data.target;
                    }
                    return '';
                },
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderColor: '#e94560',
                textStyle: {
                    color: '#fff'
                }
            },
            animation: false, // Disable all animations for immediate rendering
            series: [
                {
                    type: 'graph',
                    layout: 'force', // Force layout
                    data: nodes,
                    links: links,
                    roam: true, // Enable zooming and panning
                    draggable: true, // Enable dragging nodes
                    // label: {
                    //     show: true,
                    //     position: 'right',
                    //     formatter: '{b}', // Show node name
                    //     color: '#e0e0e0'
                    // },
                    // labelLayout: {
                    //     hideOverlap: true // Keep hideOverlap for force layout
                    // },
                    // edgeLabel: {
                    //     show: true,
                    //     formatter: '{b}', // Show edge name
                    //     color: '#a0a0a0'
                    // },
                    force: { // Force layout specific parameters
                        repulsion: 1000, // Adjust repulsion to spread nodes out
                        edgeLength: 150  // Adjust ideal edge length
                    },
                    // Default emphasis for nodes that don't have a specific emphasis defined in their data
                    emphasis: {
                        itemStyle: {
                            borderColor: '#e94560',
                            borderWidth: 3
                        }
                    }
                }
            ]
        };

        // Set the options to the chart
        myChart.setOption(option);

        function updateChart(title, chartData, selfLoopSVG){
            // Define your graph data with nodes, and custom emphasis for 'self-loop' nodes
            var nodes = [];
            var selfLoopNodes = new Map();
            var links = [];
            const nodeScale = 15;
            for (const data of chartData){
                const edgesMap = new Map(data.edges);
                if (edgesMap.has(data.nodeName)){
                    nodes.push({id: data.nodeName, name: data.nodeName, symbolSize: (1 + edgesMap.size) * nodeScale, symbol: 'path://' + selfLoopSVG});
                    selfLoopNodes.set(data.nodeName, edgesMap.get(data.nodeName));
                } else {
                    nodes.push({id: data.nodeName, name: data.nodeName, symbolSize:  (1 + edgesMap.size) * nodeScale});
                }

                for (const [destination, count] of edgesMap.entries()){
                    links.push({
                        source: data.nodeName,
                        target: destination,
                        name: `${data.nodeName} to ${destination}`,
                        value: count,
                        lineStyle: {
                            curveness: 0.1, // Set curveness to 0 for straight lines
                            symbol: ['none', 'arrow'], // Add arrow at the target end
                            symbolSize: [0, 100] // Size of the arrow
                        },
                        emphasis: { // Default emphasis for connecting edges
                            lineStyle: {
                                color: '#e94560',
                                width: 4
                            }
                        }
                    });
                }
            }


        
            // ECharts options
            var option = {
                title: {
                    text: title,
                    left: 'center',
                    textStyle: {
                        color: '#e0e0e0'
                    }
                },
                tooltip: {
                    formatter: function (params) {
                        if (params.dataType === 'node') {
                            let tooltipText = params.name;
                            if (selfLoopNodes.has(params.data.id)) {
                                tooltipText += '<br/>Self Loop Count: ' + selfLoopNodes.get(params.data.id);
                            }
                            return tooltipText;
                        } else if (params.dataType === 'edge') {
                            return 'Edge: ' + params.name + '<br/>Source: ' + params.data.source + '<br/>Target: ' + params.data.target + '<br/>Count: ' + params.data.value;
                        }
                        return '';
                    },
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderColor: '#e94560',
                    textStyle: {
                        color: '#fff'
                    }
                },
                animation: false, // Disable all animations for immediate rendering
                series: [
                    {
                        type: 'graph',
                        layout: 'force', // Force layout
                        data: nodes,
                        links: links,
                        roam: true, // Enable zooming and panning
                        draggable: true, // Enable dragging nodes
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}', // Show node name
                            color: '#e0e0e0'
                        },
                        labelLayout: {
                            hideOverlap: true // Keep hideOverlap for force layout
                        },
                        // edgeLabel: {
                        //     show: true,
                        //     formatter: '{b}', // Show edge name
                        //     color: '#a0a0a0'
                        // },
                        force: { // Force layout specific parameters
                            repulsion: 1000, // Adjust repulsion to spread nodes out
                            edgeLength: 150  // Adjust ideal edge length
                        },
                        // Default emphasis for nodes that don't have a specific emphasis defined in their data
                        emphasis: {
                            itemStyle: {
                                borderColor: '#e94560',
                                borderWidth: 3
                            }
                        }
                    }
                ]
            };

            // Set the options to the chart
            myChart.setOption(option);
        }
    }, 1);
}());