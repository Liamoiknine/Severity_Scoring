import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/Plots.css';
import colors from '../config/colors';

//guidance from react-graph-gallery.com/boxplot
export default function D3BoxPlot({
    data,
    xKey,
    yKey,
    title,
    color = colors.primary,
    showGrid = true,
    showLegend = true,
    filteredData = []
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const zoomRef = useRef(null);
    const [selectedManifestation, setSelectedManifestation] = useState(null);
    const [zoomTransform, setZoomTransform] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const groupedData = d3.group(data, d => d[xKey]);

        const boxPlotData = Array.from(groupedData.entries()).map(([manifestation, values]) => {
            const yValues = values.map(d => d[yKey]);
            const sorted = [...yValues].sort((a, b) => a - b);

            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);

            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;

            const outliers = sorted.filter(d => d < lowerBound || d > upperBound);

            const min = d3.min(sorted.filter(d => d >= lowerBound));
            const max = d3.max(sorted.filter(d => d <= upperBound));

            const mean = d3.mean(yValues);

            return {
                manifestation,
                values: yValues,
                sorted,
                count: yValues.length,
                min,
                max,
                q1,
                median,
                q3,
                mean,
                outliers,
                lowerBound,
                upperBound
            };
        });
        const globalMin = d3.min(boxPlotData, d => Math.min(d.min, ...d.outliers));
        const globalMax = d3.max(boxPlotData, d => Math.max(d.max, ...d.outliers));
        const yAxisPadding = (globalMax - globalMin) * 0.1;
        const yAxisMin = Math.max(0, globalMin - yAxisPadding);
        const yAxisMax = globalMax + yAxisPadding;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight || 600;
        const margin = { top: 50, right: 80, bottom: 50, left: 80 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(boxPlotData.map(d => d.manifestation))
            .range([0, width])
            .padding(0.3);

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

        const xAxis = mainGroup.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'middle')
            .attr('dy', '0.5em');

        const yAxis = mainGroup.append('g')
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2))
            );

        mainGroup.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
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

        function updateBoxPlots() {
            plotGroup.selectAll('.box-group').remove();

            const transform = zoomTransform || d3.zoomIdentity;
            const currentYScale = transform.rescaleY(yScale);

            boxPlotData.forEach((d, i) => {
                const xPos = xScale(d.manifestation) + xScale.bandwidth() / 2;
                const boxWidth = xScale.bandwidth() * 0.7;

                const isSelected = selectedManifestation === d.manifestation;

                const boxGroup = plotGroup.append('g')
                    .attr('class', 'box-group')
                    .attr('transform', `translate(${xPos}, 0)`);

                boxGroup.append('rect')
                    .attr('x', -boxWidth / 2)
                    .attr('y', currentYScale(d.q3))
                    .attr('width', boxWidth)
                    .attr('height', currentYScale(d.q1) - currentYScale(d.q3))
                    .attr('fill', color)
                    .attr('fill-opacity', isSelected ? 0.8 : 0.6)
                    .attr('stroke', isSelected ? colors.chartSelected : color)
                    .attr('stroke-width', isSelected ? 2 : 1)
                    .attr('class', 'box-rect')
                    .on('click', () => {
                        setSelectedManifestation(isSelected ? null : d.manifestation);
                    });

                boxGroup.append('line')
                    .attr('x1', -boxWidth / 2)
                    .attr('x2', boxWidth / 2)
                    .attr('y1', currentYScale(d.median))
                    .attr('y2', currentYScale(d.median))
                    .attr('stroke', isSelected ? colors.chartSelected : colors.textBlack)
                    .attr('stroke-width', isSelected ? 3 : 2);

                boxGroup.append('circle')
                    .attr('cx', 0)
                    .attr('cy', currentYScale(d.mean))
                    .attr('r', isSelected ? 5 : 4)
                    .attr('fill', colors.chartOutlier)
                    .attr('stroke', colors.textWhite)
                    .attr('stroke-width', 1)
                    .attr('class', 'mean-point');

                boxGroup.append('line')
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', currentYScale(d.q1))
                    .attr('y2', currentYScale(d.min))
                    .attr('stroke', isSelected ? colors.chartSelected : color)
                    .attr('stroke-width', isSelected ? 2 : 1);

                boxGroup.append('line')
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', currentYScale(d.q3))
                    .attr('y2', currentYScale(d.max))
                    .attr('stroke', isSelected ? colors.chartSelected : color)
                    .attr('stroke-width', isSelected ? 2 : 1);

                boxGroup.append('line')
                    .attr('x1', -boxWidth / 4)
                    .attr('x2', boxWidth / 4)
                    .attr('y1', currentYScale(d.min))
                    .attr('y2', currentYScale(d.min))
                    .attr('stroke', isSelected ? colors.chartSelected : color)
                    .attr('stroke-width', isSelected ? 2 : 1);

                boxGroup.append('line')
                    .attr('x1', -boxWidth / 4)
                    .attr('x2', boxWidth / 4)
                    .attr('y1', currentYScale(d.max))
                    .attr('y2', currentYScale(d.max))
                    .attr('stroke', isSelected ? colors.chartSelected : color)
                    .attr('stroke-width', isSelected ? 2 : 1);

                if (filteredData && filteredData.length > 0) {
                    filteredData.forEach((item, index) => {
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

                        if (ageOfOnset !== null && ageOfOnset !== undefined) {
                            const patientColor = item.color || colors.chartSelected;
                            boxGroup.append('line')
                                .attr('x1', -boxWidth / 2)
                                .attr('x2', boxWidth / 2)
                                .attr('y1', currentYScale(ageOfOnset))
                                .attr('y2', currentYScale(ageOfOnset))
                                .attr('stroke', patientColor)
                                .attr('stroke-width', 3)
                                .attr('stroke-dasharray', '5,3')
                                .attr('class', 'tracked-variant-line');

                            boxGroup.append('text')
                                .attr('x', boxWidth / 2 + 5)
                                .attr('y', currentYScale(ageOfOnset))
                                .attr('dy', '0.35em')
                                .text(item.name || `Variant (${index + 1})`)
                                .attr('font-size', '10px')
                                .attr('fill', patientColor)
                                .each(function () {
                                    const bbox = this.getBBox();
                                    if (xPos + bbox.x + bbox.width > width) {
                                        d3.select(this)
                                            .attr('x', -boxWidth / 2 - bbox.width - 5)
                                            .attr('text-anchor', 'end');
                                    }
                                });
                        }
                    });
                }

                d.outliers.forEach(outlier => {
                    boxGroup.append('circle')
                        .attr('cx', 0)
                        .attr('cy', currentYScale(outlier))
                        .attr('r', isSelected ? 4 : 3)
                        .attr('fill', isSelected ? colors.chartSelected : color)
                        .attr('stroke', colors.textWhite)
                        .attr('stroke-width', 1)
                        .attr('class', 'outlier-point');
                });

                boxGroup.append('text')
                    .attr('x', boxWidth / 2 + 5)
                    .attr('y', currentYScale(d.median))
                    .attr('dy', '0.35em')
                    .text(`Median: ${d.median.toFixed(2)}`)
                    .attr('font-size', '10px')
                    .attr('fill', isSelected ? colors.chartSelected : colors.textBlack)
                    .each(function () {
                        const bbox = this.getBBox();
                        if (xPos + bbox.x + bbox.width > width) {
                            d3.select(this)
                                .attr('x', -boxWidth / 2 - bbox.width - 5)
                                .attr('text-anchor', 'start');
                        }
                    });

                boxGroup.append('text')
                    .attr('x', boxWidth / 2 + 5)
                    .attr('y', currentYScale(d.mean))
                    .attr('dy', '0.35em')
                    .text(`Mean: ${d.mean.toFixed(2)}`)
                    .attr('font-size', '10px')
                    .attr('fill', colors.chartOutlier)
                    .each(function () {
                        const bbox = this.getBBox();
                        if (xPos + bbox.x + bbox.width > width) {
                            d3.select(this)
                                .attr('x', -boxWidth / 2 - bbox.width - 5)
                                .attr('text-anchor', 'start');
                        }
                    });

                boxGroup.append('text')
                    .attr('x', 0)
                    .attr('y', height + 20)
                    .attr('text-anchor', 'middle')
                    .text(`n=${d.count}`)
                    .attr('font-size', '10px')
                    .attr('fill', isSelected ? colors.chartSelected : colors.textSecondary);
            });

            yAxis.call(d3.axisLeft(currentYScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2))
            );

            if (showGrid) {
                mainGroup.select('.grid')
                    .call(d3.axisLeft(currentYScale)
                        .ticks(5)
                        .tickSize(-width)
                        .tickFormat('')
                    );
            }
        }

        const zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                setZoomTransform(event.transform);
                updateBoxPlots();
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        updateBoxPlots();

        return () => {
            d3.select('body').selectAll('.tooltip').remove();
        };

    }, [data, xKey, yKey, color, showGrid, selectedManifestation, zoomTransform, filteredData]);

    const handleReset = () => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition()
                .duration(750)
                .call(zoomRef.current.transform, d3.zoomIdentity);
            setSelectedManifestation(null);
            setZoomTransform(d3.zoomIdentity);
        }
    };

    return (
        <div className="box-plot-container" style={{ position: 'relative' }}>
            {title && <h3 className="plot-title">{title}</h3>}
            {showLegend && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '-10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.borderPrimary}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 5,
                    pointerEvents: 'auto'
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
                        <span>Box</span>
                        <div style={{
                            width: '20px',
                            height: '2px',
                            backgroundColor: colors.textBlack,
                            margin: '0 5px 0 10px'
                        }}></div>
                        <span>Median</span>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: colors.chartOutlier,
                            margin: '0 5px 0 10px'
                        }}></div>
                        <span>Mean</span>
                        {filteredData && filteredData.length > 0 && (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '2px',
                                    backgroundColor: colors.chartSelected,
                                    margin: '0 5px 0 10px',
                                    borderTop: `2px dashed ${colors.chartSelected}`
                                }}></div>
                                <span>Tracked Variant</span>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleReset}
                        style={{
                            backgroundColor: colors.primary,
                            color: colors.textWhite,
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            position: 'relative',
                            zIndex: 10,
                            pointerEvents: 'auto',
                            minWidth: '80px',
                            flexShrink: 0
                        }}
                    >
                        Reset View
                    </button>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', flex: '1', minHeight: '500px', maxHeight: '600px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '-10px' }}>
                <svg ref={svgRef} style={{ display: 'block' }}></svg>
            </div>
        </div>
    );
} 