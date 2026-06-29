'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ModuleRiskData } from '@/lib/riskEngine';

interface HeatmapTreemapProps {
  data: ModuleRiskData[];
}

export function HeatmapTreemap({ data }: HeatmapTreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: any; x: number; y: number }>({
    visible: false,
    content: null,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 500;

    // Hierarchy data structure for Treemap
    const rootData = { name: 'root', children: data };
    const hierarchy = d3.hierarchy<any>(rootData)
      .sum(d => d.size)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap<any>()
      .size([width, height])
      .padding(4)
      .round(true);

    const root = treemapLayout(hierarchy);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'sans-serif');

    // Color scale based on overallRisk (0-100)
    // Safe (0) -> Green, Warning (50) -> Yellow, Danger (100) -> Orange/Red (unless silo)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 100]);

    const leaf = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('fill', d => {
        // Feature: Lone-contributor silo highlight
        if (d.data.loneContributor) return '#ef4444'; // Solid Red for silos
        return colorScale(d.data.overallRisk);
      })
      .attr('stroke', d => d.data.loneContributor ? '#991b1b' : '#fff')
      .attr('stroke-width', d => d.data.loneContributor ? 2 : 1)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setTooltip({
          visible: true,
          content: d.data,
          x: event.pageX,
          y: event.pageY,
        });
        d3.select(event.currentTarget).attr('stroke', '#000').attr('stroke-width', 2);
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseleave', (event, d) => {
        setTooltip(prev => ({ ...prev, visible: false }));
        d3.select(event.currentTarget)
          .attr('stroke', d.data.loneContributor ? '#991b1b' : '#fff')
          .attr('stroke-width', d.data.loneContributor ? 2 : 1);
      });

    // Add labels
    leaf.append('text')
      .attr('x', 6)
      .attr('y', 20)
      .attr('fill', d => {
        if (d.data.loneContributor) return '#fff';
        return d.data.overallRisk > 60 ? '#fff' : '#000';
      })
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.data.name);

    leaf.append('text')
      .attr('x', 6)
      .attr('y', 40)
      .attr('fill', d => {
        if (d.data.loneContributor) return '#fca5a5';
        return d.data.overallRisk > 60 ? '#fde047' : '#4b5563';
      })
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => `Risk: ${d.data.overallRisk}%`);

  }, [data]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <svg ref={svgRef} className="w-full drop-shadow-sm" />

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div 
          className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: tooltip.x - (containerRef.current?.getBoundingClientRect().left || 0), 
            top: tooltip.y - (containerRef.current?.getBoundingClientRect().top || 0) - 20,
            minWidth: '250px'
          }}
        >
          <div className="font-bold text-lg border-b pb-2 mb-2">{tooltip.content.name}</div>
          
          {tooltip.content.loneContributor && (
            <div className="bg-red-50 text-red-700 p-2 rounded-md mb-3 flex items-start gap-2 border border-red-200">
              <span className="text-xl">🚨</span>
              <div>
                <strong className="block">Critical Silo Risk</strong>
                <span className="text-xs">Last 10 decisions traced to lone author <b>{tooltip.content.loneContributor}</b></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-700">
            <div>Code Churn: <span className="font-semibold">{tooltip.content.factors.codeChurn}%</span></div>
            <div>Complexity: <span className="font-semibold">{tooltip.content.factors.complexity}%</span></div>
            <div>Test Gap: <span className="font-semibold">{tooltip.content.factors.testCoverage}%</span></div>
            <div>Issues: <span className="font-semibold">{tooltip.content.factors.issueVolume}%</span></div>
            <div>Dep. Depth: <span className="font-semibold">{tooltip.content.factors.dependencyDepth}%</span></div>
            <div>Age: <span className="font-semibold">{tooltip.content.factors.age}%</span></div>
          </div>
          
          <div className="mt-3 pt-2 border-t font-bold flex justify-between">
            <span>Overall Risk:</span>
            <span className={tooltip.content.overallRisk >= 80 ? 'text-red-600' : 'text-orange-600'}>
              {tooltip.content.overallRisk}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
