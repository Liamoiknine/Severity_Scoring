import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/Plots.css';

//guidance from react-graph-gallery.com/scatter-plot

//TODO: fix tooltip not showing on point hover
export default function D3ScatterPlot({
    data,
    xKey,
    yKey,
    title,
    color = '#8884d8',
    showGrid = true,
    showLegend = true,
    filteredData = []
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [zoomTransform, setZoomTransform] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = 400;
        const margin = { top: 50, right: 120, bottom: 70, left: 80 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xExtent = d3.extent(data, d => d[xKey]);
        const yExtent = d3.extent(data, d => d[yKey]);
        const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([Math.max(0, yExtent[0] - yPadding), yExtent[1] + yPadding])
            .range([height, 0])
            .nice();

        svg.append('defs').append('clipPath')
            .attr('id', 'plot-clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height);

        const plotGroup = mainGroup.append('g')
            .attr('clip-path', 'url(#plot-clip)');

        if (showGrid) {
            mainGroup.append('g')
                .attr('class', 'grid')
                .call(d3.axisLeft(yScale)
                    .ticks(5)
                    .tickSize(-width)
                    .tickFormat('')
                )
                .style('stroke-dasharray', '3,3')
                .style('stroke-opacity', 0.2);

            mainGroup.append('g')
                .attr('class', 'grid')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(xScale)
                    .ticks(5)
                    .tickSize(-height)
                    .tickFormat('')
                )
                .style('stroke-dasharray', '3,3')
                .style('stroke-opacity', 0.2);
        }

        const xAxis = mainGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5));

        const yAxis = mainGroup.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale).ticks(5));

        mainGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(data.length > 0 ? `Age of Onset: ${data[0].manifestation1 || 'Manifestation 1'} (years)` : 'Age of Onset (years)');

        mainGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 20)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(data.length > 0 ? `Age of Onset: ${data[0].manifestation2 || 'Manifestation 2'} (years)` : 'Age of Onset (years)');

        function updatePlot() {
            plotGroup.selectAll('.point').remove();

            const transform = zoomTransform || d3.zoomIdentity;
            const currentXScale = transform.rescaleX(xScale);
            const currentYScale = transform.rescaleY(yScale);

            xAxis.call(d3.axisBottom(currentXScale).ticks(5));
            yAxis.call(d3.axisLeft(currentYScale).ticks(5));

            if (showGrid) {
                mainGroup.selectAll('.grid')
                    .filter((d, i) => i === 0)
                    .call(d3.axisLeft(currentYScale)
                        .ticks(5)
                        .tickSize(-width)
                        .tickFormat('')
                    );

                mainGroup.selectAll('.grid')
                    .filter((d, i) => i === 1)
                    .call(d3.axisBottom(currentXScale)
                        .ticks(5)
                        .tickSize(-height)
                        .tickFormat('')
                    );
            }

            plotGroup.selectAll('.point')
                .data(data)
                .join('circle')
                .attr('class', 'point')
                .attr('cx', d => currentXScale(d[xKey]))
                .attr('cy', d => currentYScale(d[yKey]))
                .attr('r', 5)
                .attr('fill', color)
                .attr('fill-opacity', d => selectedPoint && selectedPoint === d ? 0.8 : 0.6)
                .attr('stroke', d => selectedPoint && selectedPoint === d ? '#ff0000' : 'white')
                .attr('stroke-width', 1)
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('fill-opacity', 0.8)
                        .attr('r', 7);
                })
                .on('mouseout', function (event, d) {
                    d3.select(this)
                        .attr('fill-opacity', selectedPoint && selectedPoint === d ? 0.8 : 0.6)
                        .attr('r', 5);
                })
                .on('click', function (event, d) {
                    setSelectedPoint(selectedPoint === d ? null : d);
                });

                // LINEAR REGRESSION LINE
                if (data.length > 1) {
                    const xMean = d3.mean(data, d => d[xKey]);
                    const yMean = d3.mean(data, d => d[yKey]);
                    const slope = d3.sum(data, d => (d[xKey] - xMean) * (d[yKey] - yMean)) /
                                d3.sum(data, d => Math.pow(d[xKey] - xMean, 2));
                    const intercept = yMean - slope * xMean;

                    const xVals = d3.extent(data, d => d[xKey]);
                    const linePoints = xVals.map(x => ({
                        x,
                        y: slope * x + intercept
                    }));

                    plotGroup.selectAll('.regression-line').remove(); // Remove previous line if zooming
                    plotGroup.append('line')
                        .attr('class', 'regression-line')
                        .attr('x1', currentXScale(linePoints[0].x))
                        .attr('y1', currentYScale(linePoints[0].y))
                        .attr('x2', currentXScale(linePoints[1].x))
                        .attr('y2', currentYScale(linePoints[1].y))
                        .attr('stroke', '#4f46e5')
                        .attr('stroke-width', 2);
                }


            if (filteredData && filteredData.length > 0) {
                filteredData.forEach((item, index) => {
                    let xValue, yValue;

                    const manifestation1 = data.length > 0 ? data[0].manifestation1 : '';
                    const manifestation2 = data.length > 0 ? data[0].manifestation2 : '';

                    switch (manifestation1) {
                        case 'Diabetes Insipidus':
                            xValue = item.di;
                            break;
                        case 'Diabetes Mellitus':
                            xValue = item.dm;
                            break;
                        case 'Optic Atrophy':
                            xValue = item.oa;
                            break;
                        case 'Hearing Loss':
                            xValue = item.hl;
                            break;
                    }

                    switch (manifestation2) {
                        case 'Diabetes Insipidus':
                            yValue = item.di;
                            break;
                        case 'Diabetes Mellitus':
                            yValue = item.dm;
                            break;
                        case 'Optic Atrophy':
                            yValue = item.oa;
                            break;
                        case 'Hearing Loss':
                            yValue = item.hl;
                            break;
                    }

                    if (xValue !== null && xValue !== undefined &&
                        yValue !== null && yValue !== undefined) {
                        plotGroup.append('circle')
                            .attr('class', 'tracked-variant-point')
                            .attr('cx', currentXScale(xValue))
                            .attr('cy', currentYScale(yValue))
                            .attr('r', 5)
                            .attr('fill', 'none')
                            .attr('stroke', '#ff0000')
                            .attr('stroke-width', 2)

                        plotGroup.append('text')
                            .attr('x', currentXScale(xValue) + 10)
                            .attr('y', currentYScale(yValue))
                            .attr('dy', '0.35em')
                            .text(item.name || `Variant (${index + 1})`)
                            .attr('font-size', '10px')
                            .attr('fill', '#ff0000')
                            .each(function () {
                                const bbox = this.getBBox();
                                if (currentXScale(xValue) + bbox.width + 10 > width) {
                                    d3.select(this)
                                        .attr('x', currentXScale(xValue) - bbox.width - 10)
                                        .attr('text-anchor', 'end');
                                }
                            });
                    }
                });
            }
        }

        const zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                setZoomTransform(event.transform);
                updatePlot();
            });

        svg.call(zoom);

        updatePlot();

        const resetButton = d3.select(containerRef.current)
            .append('button')
            .attr('class', 'reset-button')
            .text('Reset View')
            .on('click', () => {
                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity);
                setSelectedPoint(null);
                updatePlot();
            });

        return () => {
            d3.select('body').selectAll('.tooltip').remove();
        };

    }, [data, xKey, yKey, color, showGrid, selectedPoint, zoomTransform, filteredData]);

    return (
        <div className="scatter-plot-container" style={{ position: 'relative' }}>
            {title && <h3 className="plot-title">{title}</h3>}
            {showLegend && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            marginRight: '5px',
                            opacity: 0.6
                        }}></div>
                        <span>Data Point</span>
                        {filteredData && filteredData.length > 0 && (
                            <>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    border: '2px solid #ff0000',
                                    margin: '0 5px 0 10px'
                                }}></div>
                                <span>Tracked Variant</span>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '400px' }}>
                <svg ref={svgRef}></svg>
            </div>
            <div style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
            }}>
                <p>Interactive features: Zoom with mouse wheel, click and drag to pan, click on points to highlight</p>
            </div>
        </div>
    );
} 