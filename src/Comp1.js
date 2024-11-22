import React, { Component } from "react";
import * as d3 from "d3";
import metalsCSV from "./metals.csv"; // Ensure the path to your CSV file is correct

class Comp1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      medianDataAlum: [], // For median Price_alum
      medianDataGold: [], // For median Price_gold
      medianDataSilver: [], // For median Price_silver
      medianDataNickel: [],
      medianDataUranium: [],
      selectedData: "alum",
    };
  }

  // Function to calculate the median of an array of numbers
  calculateMedian(values) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  componentDidMount() {
    // Load the CSV data
    d3.csv(metalsCSV).then((data) => {
      const filteredData = data.filter((d) => +d.Year <= 2020);
      // Group the data by Year
      const groupedByYear = d3.group(filteredData, (d) => d.Year);

      // Arrays to hold the median data for Price_alum, Price_gold, and Price_silver
      const medianDataAlum = [];
      const medianDataGold = [];
      const medianDataSilver = [];
      const medianDataNickel = [];
      const medianDataUranium = [];

      // Loop through each year and calculate the median of Price_alum, Price_gold, and Price_silver
      groupedByYear.forEach((values, year) => {
        const pricesAlum = values.map((d) => +d.Price_alum); // Median for Price_alum
        const pricesGold = values.map((d) => +d.Price_gold); // Median for Price_gold
        const pricesSilver = values.map((d) => +d.Price_silver); // Median for Price_silver
        const pricesNickel = values.map((d) => +d.Price_nickel);
        const pricesUranium = values.map((d) => +d.Price_uran);

        const medianPriceAlum = this.calculateMedian(pricesAlum);
        const medianPriceGold = this.calculateMedian(pricesGold);
        const medianPriceSilver = this.calculateMedian(pricesSilver);
        const medianPriceNickel = this.calculateMedian(pricesNickel);
        const medianPriceUranium = this.calculateMedian(pricesUranium);

        medianDataAlum.push({ year, medianPrice: medianPriceAlum });
        medianDataGold.push({ year, medianPrice: medianPriceGold });
        medianDataSilver.push({ year, medianPrice: medianPriceSilver });
        medianDataNickel.push({ year, medianPrice: medianPriceNickel });
        medianDataUranium.push({ year, medianPrice: medianPriceUranium });
      });

      // Set the median data for alum, gold, and silver in state
      this.setState({
        medianDataAlum,
        medianDataGold,
        medianDataSilver,
        medianDataNickel,
        medianDataUranium,
      });
    });

    this.createBarChart();
  }

  // Function to create the bar chart using D3
  createBarChart() {
    const {
      selectedData,
      medianDataAlum,
      medianDataGold,
      medianDataSilver,
      medianDataNickel,
      medianDataUranium,
    } = this.state;

    const margin = { top: 10, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 330 - margin.top - margin.bottom;

    // Use the selected data to determine which dataset to visualize
    let data;
    let yAxisTitle = "";
    if (selectedData === "alum") {
      data = medianDataAlum;
      yAxisTitle = "Price of Aluminum (USD per Ton)";
    } else if (selectedData === "gold") {
      data = medianDataGold;
      yAxisTitle = "Price of Gold (USD per Troy Ounce)";
    } else if (selectedData === "silver") {
      data = medianDataSilver;
      yAxisTitle = "Price of Silver (USD per Troy Ounce)";
    } else if (selectedData === "nickel") {
      data = medianDataNickel;
      yAxisTitle = "Price of Nickel (USD per Ton)";
    } else if (selectedData === "uranium") {
      data = medianDataUranium;
      yAxisTitle = "Price of Uranium (USD per Pound)";
    }

    // Set up the scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.medianPrice)])
      .nice() // Rounds the domain to a nice number for the axis
      .range([height, 0]);

    // Create the SVG container (only once)
    const svg = d3.select("#bar-chart").selectAll("svg").data([null]);

    svg
      .enter()
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .merge(svg);

    // Create or update the bars
    const bars = svg
      .select("g")
      .selectAll(".bar")
      .data(data, (d) => d.year); // Use the year as the key for data binding

    // Update existing bars with transitions
    bars
      .transition()
      .duration(1000)
      .attr("y", (d) => yScale(d.medianPrice))
      .attr("height", (d) => height - yScale(d.medianPrice)); // Transition the height

    // Enter new bars if necessary (when switching between datasets)
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.year))
      .attr("y", height)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", "steelblue")
      .transition()
      .duration(1000)
      .attr("y", (d) => yScale(d.medianPrice))
      .attr("height", (d) => height - yScale(d.medianPrice));

    // Exit bars that are no longer needed (if any)
    bars
      .exit()
      .transition()
      .duration(1000)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    svg.selectAll(".axis").remove();

    // Add the X axis with transition
    const xAxis = svg
      .select("g")
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    xAxis
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    // Add the Y axis with transition
    svg
      .select("g")
      .append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yScale))
      .transition()
      .duration(1000); // Transition for the Y axis

    svg.selectAll(".axis-title").remove();

    // Assuming 'svg' is your SVG container and 'width' & 'height' are defined
    svg
      .select("g")
      .append("text")
      .attr("class", "axis-title")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .style("text-anchor", "middle")
      .text("Year");

    // Add the new Y-axis title (dynamically updated)
    svg
      .select("g")
      .append("text")
      .attr("class", "axis-title") // Add a class to target this title later
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(yAxisTitle);

    const tooltip = d3.select("#tooltip");

    // Add mouseover event listener to show the tooltip
    bars
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Year: ${d.year}<br/>Median Price: $${d.medianPrice.toFixed(2)}`
          )
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      // Hide the tooltip when mouseout
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      })
      // Move the tooltip with mouse
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      });
  }

  // Handle the change of selected data (alum, gold, or silver)
  handleRadioChange = (event) => {
    const selectedData = event.target.value;
    this.setState({ selectedData }, this.createBarChart);
  };

  componentDidUpdate() {
    this.createBarChart();
  }

  render() {
    return (
      <div>
        <div>
          <label>
            <input
              type="radio"
              value="alum"
              checked={this.state.selectedData === "alum"}
              onChange={this.handleRadioChange}
            />
            Price Alum
          </label>
          <label>
            <input
              type="radio"
              value="gold"
              checked={this.state.selectedData === "gold"}
              onChange={this.handleRadioChange}
            />
            Price Gold
          </label>
          <label>
            <input
              type="radio"
              value="silver"
              checked={this.state.selectedData === "silver"}
              onChange={this.handleRadioChange}
            />
            Price Silver
          </label>
          <label>
            <input
              type="radio"
              value="nickel"
              checked={this.state.selectedData === "nickel"}
              onChange={this.handleRadioChange}
            />
            Price Nickel
          </label>
          <label>
            <input
              type="radio"
              value="uranium"
              checked={this.state.selectedData === "uranium"}
              onChange={this.handleRadioChange}
            />
            Price Uranium
          </label>
        </div>

        <div id="bar-chart"></div>
        <div
          id="tooltip"
          style={{
            position: "absolute",
            opacity: 0, // Initially hidden
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px",
            borderRadius: "5px",
            pointerEvents: "none", // Prevent tooltip from blocking mouse events
          }}
        ></div>
      </div>
    );
  }
}

export default Comp1;
