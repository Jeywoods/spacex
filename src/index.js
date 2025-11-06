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

  svg.append('path')
    .datum({type: "FeatureCollection", features: Geo.features})
    .attr('d', path)
    .attr('class', 'world-map');

  const launchpadsGeoJSON = {
    type: "FeatureCollection",
    features: launchpads.map(pad => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pad.longitude, pad.latitude]
      },
      properties: {
        name: pad.name,
        locality: pad.locality,
        region: pad.region,
        status: pad.status
      }
    }))
  };

  const dots = svg.append('g')
    .selectAll('.launchpad-point')
    .data(launchpadsGeoJSON.features)
    .enter()
    .append('path')
    .attr('d', path.pointRadius(6))
    .attr('class', 'launchpad-point');

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  dots.on("mouseover", function (event, d) {
      tooltip
        .html(`<b>${d.properties.name}</b><br>${d.properties.locality}, ${d.properties.region}`)
        .style("visibility", "visible");

      d3.select(this)
        .classed('hover', true);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", event.pageY - 40 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
      d3.select(this)
        .classed('hover', false);
    });
}