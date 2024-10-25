"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

const INNER_RADIUS = 64;
const OUTER_RADIUS = 72;

interface IArc {
  title: string;
  percentage: number;
  width?: number;
  height?: number;
}

function Arc({ title, percentage, width = 144, height = 72 }: IArc) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height}) rotate(-90)`);
    const tau = 2 * Math.PI / 2;

    const arc = d3.arc()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS)
      .startAngle(0);

    // Append arc
    g.append("path")
      .datum({
        innerRadius: INNER_RADIUS,
        outerRadius: OUTER_RADIUS,
        startAngle: 0,
        endAngle: tau
      })
      .style("fill", "rgba(231, 229, 228, 1)")
      .attr("d", arc);

    // Fill percentage
    g.append("path")
      .datum({
        innerRadius: INNER_RADIUS,
        outerRadius: OUTER_RADIUS,
        startAngle: 0,
        endAngle: percentage / 100 * tau
      })
      .style("fill", "rgba(255, 149, 113, 1)")
      .attr("d", arc);
  }, []);

  return (
    <div className="relative" style={{ width: `${width}px`}}>
      <h4 className="text-center text-xs mb-2">{title}</h4>
      <div className="absolute bottom-0 left-0 right-0">
        <span className="block text-xl text-center">{percentage.toFixed(1)}</span>
        <span className="block text-xs text-center">%</span>
      </div>
      <svg width={width} height={height} ref={ref} />
    </div>
  )
}

export default Arc;
