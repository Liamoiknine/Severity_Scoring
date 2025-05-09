import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/Plots.css';

//guidance from react-graph-gallery.com/violin-plot
export default function D3ViolinPlot({
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
    const [selectedViolin, setSelectedViolin] = useState(null);
    const [zoomTransform, setZoomTransform] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const groupedData = d3.group(data, d => d[xKey]);

        const violinData = Array.from(groupedData.entries()).map(([manifestation, values]) => {
            const yValues = values.map(d => d[yKey]);
            const sorted = [...yValues].sort((a, b) => a - b);

            return {
                manifestation,
                values: yValues,
                sorted,
                count: yValues.length,
                min: d3.min(yValues),
                max: d3.max(yValues),
                median: d3.median(yValues),
                q1: d3.quantile(yValues, 0.25),
                q3: d3.quantile(yValues, 0.75),
                mean: d3.mean(yValues)
            };
        });

        const globalMin = d3.min(violinData, d => d.min);
        const globalMax = d3.max(violinData, d => d.max);
        const yAxisPadding = (globalMax - globalMin) * 0.1;
        const yAxisMin = Math.max(0, globalMin - yAxisPadding);
        const yAxisMax = globalMax + yAxisPadding;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = 400;
        const margin = {
            top: 50,
            right: 150,  // Increased right margin for labels
            bottom: 70,
            left: 80
        };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(violinData.map(d => d.manifestation))
            .range([0, width])
            .padding(0.2);  // Increased padding between violins

        const yScale = d3.scaleLinear()
            .domain([yAxisMin, yAxisMax])
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
        }

        mainGroup.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'middle')
            .attr('dy', '1em');

        const yAxis = mainGroup.append('g')
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2))
            );

        mainGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Manifestation');

        mainGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 20)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Age of Onset (years)');

        const kde = (data, min, max, bandwidth) => {
            // Handle edge cases
            if (!data || data.length === 0 || min === max) {
                // Return a simple spike at the single value
                return [{ x: min, density: 1 }];
            }

            const kdePoints = [];
            // Ensure we have a valid step size
            const step = Math.max((max - min) / 100, 0.001);

            for (let x = min; x <= max; x += step) {
                let density = 0;
                for (const value of data) {
                    const u = (x - value) / bandwidth;
                    density += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI));
                }
                density = density / data.length;
                kdePoints.push({ x, density });
            }

            return kdePoints;
        };

        function updatePlot() {
            plotGroup.selectAll('.violin-group').remove();

            const transform = zoomTransform || d3.zoomIdentity;
            const currentYScale = transform.rescaleY(yScale);

            yAxis.call(d3.axisLeft(currentYScale).ticks(5).tickFormat(d => d.toFixed(2)));

            if (showGrid) {
                mainGroup.select('.grid')
                    .call(d3.axisLeft(currentYScale)
                        .ticks(5)
                        .tickSize(-width)
                        .tickFormat('')
                    );
            }

            violinData.forEach((d, i) => {
                const bandwidth = (d.max - d.min) / 10;
                const kdeData = kde(d.values, d.min, d.max, bandwidth);

                const maxDensity = d3.max(kdeData, p => p.density);
                const scaleFactor = (xScale.bandwidth() * 0.8) / (2 * maxDensity);  // Reduced violin width to 80%

                const pathData = [
                    ...kdeData.map(p => ({ x: p.x, density: p.density * scaleFactor })),
                    ...kdeData.reverse().map(p => ({ x: p.x, density: -p.density * scaleFactor }))
                ];

                const g = plotGroup.append('g')
                    .attr('class', 'violin-group')
                    .attr('transform', `translate(${xScale(d.manifestation) + xScale.bandwidth() / 2}, 0)`);

                g.append('path')
                    .datum(pathData)
                    .attr('fill', color)
                    .attr('fill-opacity', selectedViolin === d.manifestation ? 0.8 : 0.6)
                    .attr('stroke', selectedViolin === d.manifestation ? '#ff0000' : 'none')
                    .attr('stroke-width', selectedViolin === d.manifestation ? 2 : 0)
                    .attr('d', d3.line()
                        .x(p => p.density)
                        .y(p => currentYScale(p.x))
                        .curve(d3.curveMonotoneX)
                    )
                    .on('mouseover', function () {
                        d3.select(this)
                            .attr('fill-opacity', 0.8);
                        showTooltip(d);
                    })
                    .on('mousemove', function (event) {
                        updateTooltipPosition(event);
                    })
                    .on('mouseout', function () {
                        d3.select(this)
                            .attr('fill-opacity', selectedViolin === d.manifestation ? 0.8 : 0.6);
                        hideTooltip();
                    })
                    .on('click', () => {
                        setSelectedViolin(selectedViolin === d.manifestation ? null : d.manifestation);
                    });

                // Add tracked variant data points as red lines
                if (filteredData && filteredData.length > 0) {
                    filteredData.forEach((item, index) => {
                        // For each manifestation, check the corresponding property
                        let ageOfOnset;
                        switch (d.manifestation) {
                            case 'Diabetes Insipidus':
                                ageOfOnset = item.di;
                                break;
                            case 'Diabetes Mellitus':
                                ageOfOnset = item.dm;
                                break;
                            case 'Optic Atrophy':
                                ageOfOnset = item.oa;
                                break;
                            case 'Hearing Loss':
                                ageOfOnset = item.hl;
                                break;
                            default:
                                ageOfOnset = null;
                        }

                        // Only draw the line if we have an age of onset for this manifestation
                        if (ageOfOnset !== null && ageOfOnset !== undefined) {
                            const maxDensity = d3.max(kdeData, p => p.density);
                            const lineWidth = maxDensity * scaleFactor * 2;

                            g.append('line')
                                .attr('x1', -lineWidth / 2)
                                .attr('x2', lineWidth / 2)
                                .attr('y1', currentYScale(ageOfOnset))
                                .attr('y2', currentYScale(ageOfOnset))
                                .attr('stroke', '#ff0000')
                                .attr('stroke-width', 3)
                                .attr('stroke-dasharray', '5,3')
                                .attr('class', 'tracked-variant-line');

                            // Add variant name label with adjusted positioning
                            g.append('text')
                                .attr('x', lineWidth / 2 + 5)
                                .attr('y', currentYScale(ageOfOnset))
                                .attr('dy', '0.35em')
                                .text(item.name || `Variant (${index + 1})`)
                                .attr('font-size', '10px')
                                .attr('fill', '#ff0000')
                                .each(function () {
                                    const bbox = this.getBBox();
                                    const xPos = xScale(d.manifestation);
                                    if (xPos + xScale.bandwidth() + bbox.width > width) {
                                        d3.select(this)
                                            .attr('x', -lineWidth / 2 - bbox.width - 5)
                                            .attr('text-anchor', 'end');
                                    }
                                });
                        }
                    });
                }

                // Adjust other label positions
                g.selectAll('text')
                    .each(function () {
                        const bbox = this.getBBox();
                        const xPos = xScale(d.manifestation);
                        if (xPos + xScale.bandwidth() + bbox.width > width) {
                            d3.select(this)
                                .attr('text-anchor', 'end')
                                .attr('x', function () {
                                    const currentX = d3.select(this).attr('x');
                                    return -parseFloat(currentX);
                                });
                        }
                    });

                //median line
                g.append('line')
                    .attr('x1', -xScale.bandwidth() / 2)
                    .attr('x2', xScale.bandwidth() / 2)
                    .attr('y1', currentYScale(d.median))
                    .attr('y2', currentYScale(d.median))
                    .attr('stroke', selectedViolin === d.manifestation ? '#ff0000' : color)
                    .attr('stroke-width', 2);

                //mean line
                g.append('line')
                    .attr('x1', -xScale.bandwidth() / 2)
                    .attr('x2', xScale.bandwidth() / 2)
                    .attr('y1', currentYScale(d.mean))
                    .attr('y2', currentYScale(d.mean))
                    .attr('stroke', '#ff7300')
                    .attr('stroke-width', 2);

                //quartile lines
                g.append('line')
                    .attr('x1', -xScale.bandwidth() / 2)
                    .attr('x2', xScale.bandwidth() / 2)
                    .attr('y1', currentYScale(d.q1))
                    .attr('y2', currentYScale(d.q1))
                    .attr('stroke', selectedViolin === d.manifestation ? '#ff0000' : color)
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '3,3');

                g.append('line')
                    .attr('x1', -xScale.bandwidth() / 2)
                    .attr('x2', xScale.bandwidth() / 2)
                    .attr('y1', currentYScale(d.q3))
                    .attr('y2', currentYScale(d.q3))
                    .attr('stroke', selectedViolin === d.manifestation ? '#ff0000' : color)
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '3,3');

                //labels
                g.append('text')
                    .attr('x', xScale.bandwidth() / 2 + 5)
                    .attr('y', currentYScale(d.median))
                    .attr('dy', '0.35em')
                    .text(`Median: ${d.median.toFixed(2)}`)
                    .attr('font-size', '10px')
                    .attr('fill', selectedViolin === d.manifestation ? '#ff0000' : '#000')
                    .each(function () {
                        const bbox = this.getBBox();
                        const xPos = xScale(d.manifestation);
                        if (xPos + xScale.bandwidth() + bbox.width > width) {
                            d3.select(this)
                                .attr('text-anchor', 'end')
                                .attr('x', function () {
                                    const currentX = d3.select(this).attr('x');
                                    return -parseFloat(currentX);
                                });
                        }
                    });

                g.append('text')
                    .attr('x', xScale.bandwidth() / 2 + 5)
                    .attr('y', currentYScale(d.mean))
                    .attr('dy', '0.35em')
                    .text(`Mean: ${d.mean.toFixed(2)}`)
                    .attr('font-size', '10px')
                    .attr('fill', '#ff7300')
                    .each(function () {
                        const bbox = this.getBBox();
                        const xPos = xScale(d.manifestation);
                        if (xPos + xScale.bandwidth() + bbox.width > width) {
                            d3.select(this)
                                .attr('text-anchor', 'end')
                                .attr('x', function () {
                                    const currentX = d3.select(this).attr('x');
                                    return -parseFloat(currentX);
                                });
                        }
                    });
            });
        }

        // Function to show tooltip
        function showTooltip(d) {
            const tooltip = d3.select('body').select('.tooltip');

            if (tooltip.empty()) {
                d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background-color', 'rgba(255, 255, 255, 0.9)')
                    .style('border', '1px solid #ccc')
                    .style('border-radius', '4px')
                    .style('padding', '8px')
                    .style('font-size', '12px')
                    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
                    .style('pointer-events', 'none')
                    .style('z-index', 1000);
            }

            d3.select('.tooltip')
                .html(`
                    <strong>${d.manifestation}</strong><br/>
                    Min: ${d.min.toFixed(2)}<br/>
                    Q1: ${d.q1.toFixed(2)}<br/>
                    Median: ${d.median.toFixed(2)}<br/>
                    Mean: ${d.mean.toFixed(2)}<br/>
                    Q3: ${d.q3.toFixed(2)}<br/>
                    Max: ${d.max.toFixed(2)}<br/>
                    n=${d.count}
                `)
                .style('visibility', 'visible');
        }

        function updateTooltipPosition(event) {
            d3.select('.tooltip')
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        }

        function hideTooltip() {
            d3.select('.tooltip').style('visibility', 'hidden');
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
                setSelectedViolin(null);
                updatePlot();
            });

        return () => {
            d3.select('body').selectAll('.tooltip').remove();
        };

    }, [data, xKey, yKey, color, showGrid, selectedViolin, zoomTransform, filteredData]);

    return (
        <div className="violin-plot-container" style={{ position: 'relative' }}>
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
                            width: '12px',
                            height: '12px',
                            backgroundColor: color,
                            marginRight: '5px',
                            opacity: 0.6
                        }}></div>
                        <span>Distribution</span>
                        {filteredData && filteredData.length > 0 && (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '2px',
                                    backgroundColor: '#ff0000',
                                    margin: '0 5px 0 10px',
                                    borderTop: '2px dashed #ff0000'
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
                <p>Interactive features: Zoom with mouse wheel, click on violins to highlight, click and drag to pan</p>
            </div>
        </div>
    );
} 