import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  sankey as d3Sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  SankeyLink,
  SankeyNode,
} from "d3-sankey";
import { ArrowDown } from "@phosphor-icons/react";
import { EPageType } from "@/types/components";
import { getTypeIcon } from "../icons/getTypeIcon";

interface Node {
  id: number | string;
  label: string;
  type: EPageType;
}

interface SankeyData {
  nodes: SankeyNode<Node, object>[];
  links: SankeyLink<Node, object>[];
}

interface ISankey {
  height: number;
  width: number;
  data: SankeyData;
}

interface ISankeyLinkPopup extends SankeyLink<Node, object> {
  screenPosition: [number, number];
}

interface ISankeyNodePopup extends SankeyNode<Node, object> {
  screenPosition: [number, number];
}

function Sankey({ height, width, data }: ISankey) {
  const ref = useRef<SVGSVGElement>(null);
  const [linkPopup, setLinkPopup] = useState<ISankeyLinkPopup>();
  const [nodePopup, setNodePopup] = useState<ISankeyNodePopup>();

  useEffect(() => {
    const svg = d3.select(ref.current);

    const sankey = d3Sankey()
      .nodeId((d) => (d as Node).id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [0, 0],
        [width, height],
      ]);

    const { nodes, links } = sankey({
      nodes: data.nodes.map((d) =>
        Object.assign({}, d as SankeyNode<Node, object>)
      ),
      links: data.links.map((d) =>
        Object.assign({}, d as SankeyLink<Node, object>)
      ),
    });

    // Append the nodes
    svg
      .append("g")
      .selectAll()
      .data(nodes)
      .join("rect")
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("height", (d) => (d.y1 || 0) - (d.y0 || 0))
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("fill", "#292524")
      .on("mouseover mousemove", (e, d) => {
        const { pageX, pageY } = e;
        setNodePopup({
          ...d,
          screenPosition: [pageX, pageY],
        } as ISankeyNodePopup);
      })
      .on("mouseout", () => {
        setNodePopup(undefined);
      });

    // Append the links
    svg
      .append("g")
      .selectAll()
      .data(links)
      .join("g")
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", "#E7E5E4")
      .attr("opacity", 0.25)
      .attr("stroke-width", (d) => Math.max(1, d.width || 0))
      .on("mouseover mousemove", (e, d) => {
        const { pageX, pageY } = e;
        setLinkPopup({
          ...d,
          screenPosition: [pageX, pageY],
        } as ISankeyLinkPopup);
        d3.select(e.target).attr("stroke", "#BCD6FF");
      })
      .on("mouseout", (e) => {
        setLinkPopup(undefined);
        d3.select(e.target).attr("stroke", "#E7E5E4");
      });
  }, [data, height, width]);

  return (
    <>
      {linkPopup && (
        <div
          className="absolute bg-white p-4 w-[250px] z-50 rounded border-1 border-neutral-200 drop-shadow-lg"
          style={{
            left: linkPopup.screenPosition[0],
            top: linkPopup.screenPosition[1],
            transform: "translate(-50%, -105%)",
          }}
        >
          <div className="bg-neutral-200 rounded p-2 mb-4 font-header">
            <div className="flex gap-2 justify-center">
              {getTypeIcon((linkPopup.source as Node).type)}
              {(linkPopup.source as Node).label}
            </div>
            <ArrowDown weight="bold" className="mx-auto my-1" />
            <div className="flex gap-2 justify-center">
              {getTypeIcon((linkPopup.target as Node).type)}
              {(linkPopup.target as Node).label}
            </div>
          </div>
          <table className="text-sm w-[100%] border-separate border-spacing-2">
            <tr>
              <td className="text-neutral-600">Value</td>
              <td className="text-right">{linkPopup.value}</td>
            </tr>
            <tr>
              <td className="text-neutral-600">Other value</td>
              <td className="text-right">{linkPopup.value}</td>
            </tr>
          </table>
        </div>
      )}
      {nodePopup && (
        <div
          className="absolute bg-white p-2 z-50 rounded border-1 border-neutral-200 drop-shadow-lg"
          style={{
            left: nodePopup.screenPosition[0],
            top: nodePopup.screenPosition[1],
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="flex gap-2 justify-center">
            {getTypeIcon(nodePopup.type)}
            {nodePopup.label}
          </div>
        </div>
      )}
      <svg width={width} height={height} ref={ref} />
    </>
  );
}

export default Sankey;
