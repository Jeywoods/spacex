import { SpaceX } from "./api/spacex";
import * as d3 from "d3";
import * as Geo from "./geo.json";

document.addEventListener("DOMContentLoaded", setup);

function setup() {
  const spaceX = new SpaceX();

  Promise.all([
    spaceX.launches(),
    spaceX.launchpads()
  ]).then(([launches, launchpads]) => {
    const listContainer = document.getElementById("listContainer");
    renderLaunches(launches, listContainer);
    drawMap(launchpads);
  });
}

function renderLaunches(launches, container) {
  const list = document.createElement("ul");
  list.classList.add("launch-list");

  launches.forEach(launch => {
    const item = document.createElement("li");
    item.textContent = launch.name;
    list.appendChild(item);
  });

  container.replaceChildren(list);
}

function drawMap(launchpads) {
  const width = 640;
  const height = 480;
  const margin = { top: 20, right: 10, bottom: 40, left: 100 };

  const svg = d3.select("#map")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const projection = d3.geoMercator()
    .scale(90)
    .center([0, 20])
    .translate([width / 2 - margin.left, height / 2]);

  const path = d3.geoPath().projection(projection);

  svg.append("g")
    .selectAll("path")
    .data(Geo.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#e0e0e0")
    .attr("stroke", "#999");

  const dots = svg.append("g")
    .selectAll("circle")
    .data(launchpads)
    .enter()
    .append("circle")
    .attr("class", "launchpad-dot")
    .attr("cx", d => projection([d.longitude, d.latitude])[0])
    .attr("cy", d => projection([d.longitude, d.latitude])[1])
    .attr("r", 5)
    .attr("fill", "#1976d2")
    .attr("opacity", 0.85);

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "14px")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.1)");

  dots.on("mouseover", function (event, d) {
      tooltip
        .html(`<b>${d.name}</b><br>${d.locality}, ${d.region}`)
        .style("visibility", "visible");

      d3.select(this)
        .transition().duration(150)
        .attr("r", 9)
        .attr("fill", "orange");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", event.pageY - 40 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");

      d3.select(this)
        .transition().duration(150)
        .attr("r", 5)
        .attr("fill", "#1976d2");
    });
}
