import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/Plots.css';
import colors from '../config/colors';

//guidance from react-graph-gallery.com/scatter-plot

//TODO: fix tooltip not showing on point hover
export default function D3ScatterPlot({
    data,
    xKey,
    yKey,
    title,
    color = colors.chartDefault,
    showGrid = true,
    showLegend = true,
    filteredData = [],
    onPointClick,
    onSeeAllClick
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const popupRef = useRef();
    const zoomRef = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [zoomTransform, setZoomTransform] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

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
            .attr('clip-path', 'url(#plot-clip)')
            .attr('class', 'plot-group');

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
            .attr('y', height + margin.bottom - 5)
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
                .attr('fill-opacity', d => {
                    const isSelected = selectedPoint && 
                        selectedPoint.patientData && 
                        d.patientData &&
                        selectedPoint.patientData.id === d.patientData.id &&
                        selectedPoint.ageOfOnset1 === d.ageOfOnset1 &&
                        selectedPoint.ageOfOnset2 === d.ageOfOnset2;
                    return isSelected ? 0.8 : 0.6;
                })
                .attr('stroke', d => {
                    const isSelected = selectedPoint && 
                        selectedPoint.patientData && 
                        d.patientData &&
                        selectedPoint.patientData.id === d.patientData.id &&
                        selectedPoint.ageOfOnset1 === d.ageOfOnset1 &&
                        selectedPoint.ageOfOnset2 === d.ageOfOnset2;
                    return isSelected ? colors.chartSelected : colors.textWhite;
                })
                .attr('stroke-width', 1)
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('fill-opacity', 0.8)
                        .attr('r', 7);
                })
                .on('mouseout', function (event, d) {
                    const isSelected = selectedPoint && 
                        selectedPoint.patientData && 
                        d.patientData &&
                        selectedPoint.patientData.id === d.patientData.id &&
                        selectedPoint.ageOfOnset1 === d.ageOfOnset1 &&
                        selectedPoint.ageOfOnset2 === d.ageOfOnset2;
                    d3.select(this)
                        .attr('fill-opacity', isSelected ? 0.8 : 0.6)
                        .attr('r', 5);
                })
                .on('click', function (event, d) {
                    event.stopPropagation();
                    // Compare by patient ID or data values instead of object reference
                    const isCurrentlySelected = selectedPoint && 
                        selectedPoint.patientData && 
                        d.patientData &&
                        selectedPoint.patientData.id === d.patientData.id &&
                        selectedPoint.ageOfOnset1 === d.ageOfOnset1 &&
                        selectedPoint.ageOfOnset2 === d.ageOfOnset2;
                    
                    const newSelection = isCurrentlySelected ? null : d;
                    setSelectedPoint(newSelection);
                    if (onPointClick) {
                        onPointClick(newSelection ? d.patientData : null);
                    }
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
                        .attr('stroke', 'red')
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
                        const patientColor = item.color || colors.chartSelected;
                        plotGroup.append('circle')
                            .attr('class', 'tracked-variant-point')
                            .attr('cx', currentXScale(xValue))
                            .attr('cy', currentYScale(yValue))
                            .attr('r', 5)
                            .attr('fill', 'none')
                            .attr('stroke', patientColor)
                            .attr('stroke-width', 2)

                        plotGroup.append('text')
                            .attr('x', currentXScale(xValue) + 10)
                            .attr('y', currentYScale(yValue))
                            .attr('dy', '0.35em')
                            .text(item.name || `Variant (${index + 1})`)
                            .attr('font-size', '10px')
                            .attr('fill', patientColor)
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

        zoomRef.current = zoom;
        svg.call(zoom);

        // Handle clicks on SVG background to deselect
        svg.on('click', function(event) {
            // Only deselect if clicking on the SVG background or plot area (not on circles, axes, text, etc.)
            const target = event.target;
            const isCircle = target.tagName === 'circle' && target.classList.contains('point');
            const isAxis = target.tagName === 'g' && (target.classList.contains('x-axis') || target.classList.contains('y-axis'));
            const isText = target.tagName === 'text';
            const isGrid = target.tagName === 'line' && target.classList.contains('grid');
            const isTrackedVariant = target.tagName === 'circle' && target.classList.contains('tracked-variant-point');
            const isRegressionLine = target.tagName === 'line' && target.classList.contains('regression-line');
            
            // Deselect if clicking on background (not on interactive elements)
            if (!isCircle && !isAxis && !isText && !isGrid && !isTrackedVariant && !isRegressionLine) {
                setSelectedPoint(null);
                if (onPointClick) {
                    onPointClick(null);
                }
            }
        });

        updatePlot();

        return () => {
            d3.select('body').selectAll('.tooltip').remove();
        };

    }, [data, xKey, yKey, color, showGrid, selectedPoint, zoomTransform, filteredData, onPointClick]);

    // Handle click outside to deselect
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!selectedPoint) return;
            
            // Don't deselect if clicking on a circle point
            const clickedElement = event.target;
            if (clickedElement.tagName === 'circle' && clickedElement.classList.contains('point')) {
                return; // Let the circle's own click handler handle it
            }
            
            if (popupRef.current && 
                !popupRef.current.contains(event.target) &&
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                svgRef.current &&
                !svgRef.current.contains(event.target)) {
                setSelectedPoint(null);
                if (onPointClick) {
                    onPointClick(null);
                }
            }
        };

        if (selectedPoint) {
            // Use a delay to avoid conflicts with circle click handlers
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [selectedPoint, onPointClick]);

    const handleReset = () => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition()
                .duration(750)
                .call(zoomRef.current.transform, d3.zoomIdentity);
            setSelectedPoint(null);
            setZoomTransform(d3.zoomIdentity);
            if (onPointClick) {
                onPointClick(null);
            }
        }
    };

    const handleSeeAll = () => {
        if (selectedPoint && selectedPoint.patientData) {
            if (onPointClick) {
                onPointClick(selectedPoint.patientData);
            }
            if (onSeeAllClick) {
                onSeeAllClick();
            }
            // Keep the popup visible after clicking "See All"
        }
    };

    return (
        <div className="scatter-plot-container" style={{ position: 'relative' }}>
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
                                    border: `2px solid ${colors.chartSelected}`,
                                    margin: '0 5px 0 10px'
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
            <div ref={containerRef} style={{ width: '100%', flex: '1', minHeight: '500px', maxHeight: '600px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '-10px', position: 'relative' }}>
                <svg ref={svgRef} style={{ display: 'block' }}></svg>
                {selectedPoint && selectedPoint.patientData && (
                    <div 
                        ref={popupRef}
                        className="scatter-plot-popup"
                        style={{
                            position: 'absolute',
                            top: '30px',
                            right: '30px',
                            backgroundColor: 'white',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            minWidth: '200px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '4px', fontSize: '13px' }}>
                            <strong>Allele 1:</strong> {selectedPoint.patientData.allele_1 || '—'}
                        </div>
                        <div style={{ marginBottom: '12px', fontSize: '13px' }}>
                            <strong>Allele 2:</strong> {selectedPoint.patientData.allele_2 || '—'}
                        </div>
                        <div style={{
                            borderTop: `1px solid ${colors.borderPrimary}`,
                            marginBottom: '12px',
                            marginTop: '8px'
                        }}></div>
                        <button
                            onClick={handleSeeAll}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: colors.primary,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '500'
                            }}
                        >
                            See All
                            <span style={{ fontSize: '12px' }}>›</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 