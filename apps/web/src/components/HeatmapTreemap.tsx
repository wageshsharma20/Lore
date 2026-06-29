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
    // Dark mode neon colors:
    const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([0, 150]);

    const leaf = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('fill', d => {
        // Feature: Lone-contributor silo highlight
        if (d.data.loneContributor) return '#dc2626'; // Glowing red
        return colorScale(d.data.overallRisk);
      })
      .attr('stroke', d => d.data.loneContributor ? '#f87171' : '#1f2937')
      .attr('stroke-width', d => d.data.loneContributor ? 3 : 2)
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
        d3.select(event.currentTarget).attr('stroke', '#ffffff').attr('stroke-width', 3);
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
          .attr('stroke', d.data.loneContributor ? '#f87171' : '#1f2937')
          .attr('stroke-width', d.data.loneContributor ? 3 : 2);
      });

    // Add labels
    leaf.append('text')
      .attr('x', 8)
      .attr('y', 24)
      .attr('fill', '#ffffff')
      .style('font-size', '16px')
      .style('font-weight', '800')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
      .text(d => d.data.name);

    leaf.append('text')
      .attr('x', 8)
      .attr('y', 44)
      .attr('fill', 'rgba(255,255,255,0.8)')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
      .text(d => `Risk: ${d.data.overallRisk}%`);

    // Accessibility label for colorblind users
    leaf.append('text')
      .attr('x', 8)
      .attr('y', 62)
      .attr('fill', 'rgba(255,255,255,0.9)')
      .style('font-size', '12px')
      .style('font-weight', '800')
      .style('pointer-events', 'none')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.05em')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.9)')
      .text(d => d.data.overallRisk >= 80 ? 'Critical' : d.data.overallRisk >= 50 ? 'High' : 'Low');

  }, [data]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <svg ref={svgRef} className="w-full drop-shadow-sm" />

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div 
          className="absolute z-50 bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-5 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full text-white"
          style={{ 
            left: tooltip.x - (containerRef.current?.getBoundingClientRect().left || 0), 
            top: tooltip.y - (containerRef.current?.getBoundingClientRect().top || 0) - 20,
            minWidth: '280px'
          }}
        >
          <div className="font-bold text-xl border-b border-white/10 pb-3 mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{tooltip.content.name}</div>
          
          {tooltip.content.loneContributor && (
            <div className="bg-destructive/20 text-red-400 p-3 rounded-lg mb-4 flex items-start gap-3 border border-destructive/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <span className="text-2xl animate-pulse">🚨</span>
              <div>
                <strong className="block text-red-300">Critical Silo Risk</strong>
                <span className="text-xs text-red-200">Last 10 decisions traced to lone author <b className="text-white bg-black/50 px-1 rounded">{tooltip.content.loneContributor}</b></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-gray-300">
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Code Churn</span> <span className="font-semibold text-white">{tooltip.content.factors.codeChurn}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Complexity</span> <span className="font-semibold text-white">{tooltip.content.factors.complexity}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Test Gap</span> <span className="font-semibold text-white">{tooltip.content.factors.testCoverage}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Issues</span> <span className="font-semibold text-white">{tooltip.content.factors.issueVolume}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Dep. Depth</span> <span className="font-semibold text-white">{tooltip.content.factors.dependencyDepth}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Age</span> <span className="font-semibold text-white">{tooltip.content.factors.age}%</span></div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/10 font-bold flex justify-between items-center bg-white/5 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
            <span className="uppercase text-xs tracking-wider text-gray-400">Overall Risk</span>
            <span className={`text-xl ${tooltip.content.overallRisk >= 80 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}>
              {tooltip.content.overallRisk}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
