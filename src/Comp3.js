import React, { Component } from "react";
import * as d3 from "d3";

class Comp3 extends Component {
  componentDidMount() {
    var data = [
      { month: new Date(2023, 0, 1), coffee: 25, tea: 15, juice: 10 },
      { month: new Date(2023, 1, 1), coffee: 30, tea: 20, juice: 15 },
      { month: new Date(2023, 2, 1), coffee: 35, tea: 25, juice: 20 },
    ];

    var xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.month))
      .range([50, 275])
      .padding(0.2);

    var yScale = d3.scaleLinear().domain([0, 80]).range([275, 25]);

    var colorScale = d3
      .scaleOrdinal()
      .domain(["coffee", "tea", "juice"])
      .range(["brown", "green", "orange"]);

    var stackGen = d3.stack().keys(["coffee", "tea", "juice"]);
    var stackedSeries = stackGen(data);

    // Draw rectangles
    var container = d3.select(".container");

    container
      .selectAll("g.layer")
      .data(stackedSeries)
      .enter()
      .append("g")
      .attr("class", "layer")
      .attr("fill", (d) => colorScale(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.data.month))
      .attr("y", (d) => yScale(d[1])) // Use the end of the stack segment for y-position
      .attr("height", (d) => yScale(d[0]) - yScale(d[1])) // Height is the difference between the start and end of the stack segment
      .attr("width", xScale.bandwidth());

    // Create the x-axis
    d3.select(".x-axis")
      .attr("transform", "translate(0, 275)")
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")));

    // Create the y-axis
    d3.select(".y-axis")
      .attr("transform", "translate(50, 0)")
      .call(d3.axisLeft(yScale).ticks(5));
  }

  render() {
    return (
      <svg style={{ width: 350, height: 350 }}>
        <g className="container"></g>
        <g className="x-axis"></g>
        <g className="y-axis"></g>
      </svg>
    );
  }
}

export default Comp3;
