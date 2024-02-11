import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
    { name: "Aggressor Casualties", value: 182647 },
    { name: "Defender Casualaties", value: 209375},
    { name: "Civilian casualties", value: 306887},
    { name: "Displaced Refugees", value: 12300000}
]

const SyriaChart = ({}) => {
    const svgRef = useRef(null);

    useEffect(() => {
        const width = 928;
        const height = Math.min(width, 500);

        const color = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

    const pie = d3.pie()
      .sort(null)
      .value(d => d.value)
      .padAngle(0.1);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2 - 1);

    const labelRadius = arc.outerRadius()() * 0.8;

    const arcLabel = d3.arc()
      .innerRadius(labelRadius)
      .outerRadius(labelRadius);

    const arcs = pie(data);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    svg.append("g")
      .attr("stroke", "white")
      .selectAll()
      .data(arcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
      .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

    svg.append("g")
      .attr("text-anchor", "middle")
      .selectAll()
      .data(arcs)
      .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .call(text => text.append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text(d => d.data.value.toLocaleString("en-US")));
  }, [data]);

  return (
    <svg ref={svgRef} />
  );
};

    
export default SyriaChart;