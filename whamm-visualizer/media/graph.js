
function graphChart() {
    // Defer initialization until the DOM is ready and rendered to ensure the
    // container has its dimensions calculated by the browser.
    setTimeout(function () {
        // Initialize ECharts instance
        var myChart = echarts.init(document.getElementById('chart-container'));

        const nodePrefix = "FID: ";

        // Recieves the messages
        window.addEventListener('message', event => {
            const message = event.data; // The JSON data sent from the extension host

            const payload = message.payload;
            switch (message.command) {
                /*
                    {
                        command: 'updateChartData',
                        payload: {
                            chartData: cDFuncs.getGraphChartData(parsedCSV),
                            title: graphTitle,
                            selfLoopSVG: selfLoopSVG
                        }
                    });
                */
                case 'updateChartData':
                    myChart.hideLoading();
                    updateChart(payload.title, payload.chartData, payload.selfLoopSVG);
                    cachedOption = myChart.getOption();
                    break;
                /*
                    {
                        command: 'selectNode',
                        payload: {
                            selectedNode: selectedFid
                        }
                    }
                */
                case 'selectNode':
                    myChart.dispatchAction({
                        type: 'select',
                        name: nodePrefix + payload.selectedNode
                    });
                    break;
            }
            
        });

        // Placeholder nodes
        var nodes = [
            { id: 'placeholderNodeA', name: 'Placeholder Node A', symbolSize: 30 },
            { id: 'placeholderNodeB', name: 'Placeholder Node B', symbolSize: 30 },
            { id: 'placeholderNodeC', name: 'Placeholder Node C', symbolSize: 30 },
            { id: 'placeholderNodeD', name: 'Placeholder Node D', symbolSize: 30 },
            { id: 'placeholderNodeE', name: 'Placeholder Node E', symbolSize: 30 },
            { id: 'placeholderNodeF', name: 'Placeholder Node F', symbolSize: 30 }
        ];

        // Placeholder Links
        var links = [];
        // Generate ONE-WAY connections between all distinct pairs of nodes as straight lines
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) { // Start j from i + 1 to ensure one-way connections
                links.push({
                    source: nodes[i].id,
                    target: nodes[j].id,
                    name: `${nodes[i].name} to ${nodes[j].name}`,
                });
            }
        }

        // Placeholder ECharts options
        var option = {
            title: {
                text: 'Placeholder',
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
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{b}', // Show node name
                        color: '#e0e0e0'
                    },
                    labelLayout: {
                        hideOverlap: true // Keep hideOverlap for force layout
                    },
                    
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
                    },
                    selectedMode: 'single',

                }
            ]
        };

        // Set the options to the chart
        myChart.setOption(option);

        /**
         * Updates the chart (fully replaces the data)
         * @param {string} title The new title
         * @param {chartDataFunctions.graphChartData} chartData `{ nodeName: string | number; edges: [string | number, number][]; weight: number; }`
         * @param {string} selfLoopSVG The path data from the .svg file
         */
        function updateChart(title, chartData, selfLoopSVG){
            var nodes = [];
            var selfLoopNodes = new Map();
            var links = [];
            /** The function to determine the node size, scales slower as the numnber goes up */
            const nodeScale = x => 20 * Math.log(x/2 + 2);
            for (const data of chartData){
                const edgesMap = new Map(data.edges);
                let newNode = {id: nodePrefix + data.nodeName, name: nodePrefix + data.nodeName, symbolSize: nodeScale(data.weight), _weight: data.weight};
                if (edgesMap.has(data.nodeName)){ // Deals with self loops
                    newNode.symbol = 'path://' + selfLoopSVG;
                    selfLoopNodes.set(data.nodeName, edgesMap.get(data.nodeName));
                }
                if (data.weight === 0){ // If it is called zero times then it is the origin and so labeled orange
                    newNode.itemStyle = {color: '#eb9534'};
                }
                nodes.push(newNode);
                for (const [destination, count] of edgesMap.entries()){
                    links.push({
                        source: nodePrefix + data.nodeName,
                        target: nodePrefix + destination,
                        name: `${nodePrefix + data.nodeName} to ${nodePrefix + destination}`,
                        value: count,
                        symbol: ['none', 'arrow'], // Add arrow at the target end
                        symbolSize: 10, // Size of the arrow
                        lineStyle: {
                            curveness: 0.2
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
                            let tooltipText = params.name + '<br/> Called: ' + params.data._weight;
                            if (selfLoopNodes.has(params.data.id)) {
                                tooltipText += '<br/>Self Loop Count: ' + selfLoopNodes.get(params.data.id);
                            }
                            return tooltipText;
                        } else if (params.dataType === 'edge') {
                            return'Source: ' + params.data.source + '<br/>Target: ' + params.data.target + '<br/>Count: ' + params.data.value;
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
                        },
                        selectedMode: 'single',
                        select: {
                            itemStyle: {
                                borderColor: '#39db54',
                                borderWidth: 3
                            }
                        }
                    }
                ]
            };

            // Set the options to the chart
            myChart.setOption(option);
        }

        let selectedNode = -1;
        myChart.on('click', function (params) {
            // Gets the first number in the name after the nodePrefix, regardless if it is a node or an edge
            const currentNode = parseInt(params.data.name.substring(nodePrefix.length));
            
            window.vscode.postMessage({
                command:'chartSelectedFidPc',
                payload: {
                    selectedFid: currentNode,
                    selectedPc: -1
            }
            });

            // Toggles selection state of the origin of the edge when an ege is clicked
            if(params.dataType === 'edge' && selectedNode !== currentNode){
                myChart.dispatchAction({
                    type: 'select',
                    name: nodePrefix + currentNode
                });
            }
            if (selectedNode !== currentNode){
                selectedNode = currentNode;
            } else {
                selectedNode = -1;
            }
        });

        
    }, 1);
}