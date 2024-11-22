import React, { Component } from "react";
import * as d3 from "d3";
import metalsCSV from "./metals.csv"; // Ensure the path to your CSV file is correct

class Comp2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      medianDataAlum: [],
      medianDataGold: [],
      medianDataSilver: [],
      medianDataNickel: [],
      medianDataUranium: [],
      medianDataAlumInfl: [],
      medianDataGoldInfl: [],
      medianDataSilverInfl: [],
      medianDataNickelInfl: [],
      medianDataUraniumInfl: [],
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
        const pricesAlumInfl = values.map((d) => +d.Price_alum_infl);
        const pricesGoldInfl = values.map((d) => +d.Price_gold_infl);
        const pricesNickelInfl = values.map((d) => +d.Price_nickel_infl);
        const pricesSilverInfl = values.map((d) => +d.Price_silver_infl);
        const pricesUranInfl = values.map((d) => +d.Price_uran_infl);

        const medianPriceAlum = this.calculateMedian(pricesAlum);
        const medianPriceGold = this.calculateMedian(pricesGold);
        const medianPriceSilver = this.calculateMedian(pricesSilver);
        const medianPriceNickel = this.calculateMedian(pricesNickel);
        const medianPriceUranium = this.calculateMedian(pricesUranium);
        const medianPriceAlumInfl = this.calculateMedian(pricesAlumInfl);
        const medianPriceGoldInfl = this.calculateMedian(pricesGoldInfl);
        const medianPriceNickelInfl = this.calculateMedian(pricesNickelInfl);
        const medianPriceSilverInfl = this.calculateMedian(pricesSilverInfl);
        const medianPriceUranInfl = this.calculateMedian(pricesUranInfl);

        medianDataAlum.push({
          year,
          medianPrice: medianPriceAlum,
          medianPriceInfl: medianPriceAlumInfl,
        });
        medianDataGold.push({
          year,
          medianPrice: medianPriceGold,
          medianPriceInfl: medianPriceGoldInfl,
        });
        medianDataSilver.push({
          year,
          medianPrice: medianPriceSilver,
          medianPriceInfl: medianPriceSilverInfl,
        });
        medianDataNickel.push({
          year,
          medianPrice: medianPriceNickel,
          medianPriceInfl: medianPriceNickelInfl,
        });
        medianDataUranium.push({
          year,
          medianPrice: medianPriceUranium,
          medianPriceInfl: medianPriceUranInfl,
        });
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
  }

  // Function to create the bar chart using D3
  createStackChart() {
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

    data = data.map((d) => ({
      ...d,
      diff: d.medianPriceInfl - d.medianPrice,
    }));

    // Prepare data for stacking
    const stackGenerator = d3.stack().keys(["medianPrice", "medianPriceInfl"]);
    const stackedData = stackGenerator(data);

    // Set up the scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) => d.medianPrice + d.medianPriceInfl), // Ensure diff is non-negative
      ])
      .nice()
      .range([height, 0]);

    console.log(data);

    // Create the SVG container
    d3.select("#stackbar-chart").selectAll("svg").remove();
    const svg = d3.select("#stackbar-chart").selectAll("svg").data([null]);

    const svgEnter = svg
      .enter()
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Merge to avoid duplication
    const chart = svgEnter.merge(svg);

    // Remove any existing layers
    chart.selectAll(".stacklayer").remove();

    // Draw the stacked bars
    chart
      .selectAll(".stacklayer")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("class", "stacklayer")
      .attr("fill", (d, i) => (i === 0 ? "steelblue" : "orange")) // Color for each layer
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.data.year))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth());

    // Add the axes
    //chart.selectAll(".stackaxis").remove();

    chart
      .append("g")
      .attr("class", "stackaxis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    chart.append("g").attr("class", "stackaxis").call(d3.axisLeft(yScale));

    // Add axis titles
    chart.selectAll(".stack-axis-title").remove();

    chart
      .append("text")
      .attr("class", "stack-axis-title")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .style("text-anchor", "middle")
      .text("Year");

    chart
      .append("text")
      .attr("class", "stack-axis-title")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(yAxisTitle);
  }

  // Handle the change of selected data (alum, gold, or silver)
  handleRadioChange = (event) => {
    const selectedData = event.target.value;
    this.setState({ selectedData });
    this.createStackChart();
  };

  componentDidUpdate() {
    this.createStackChart();
  }

  render() {
    return (
      <div>
        <div className="radiogroup">
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

        <div id="stackbar-chart"></div>
        <div
          id="stacktooltip"
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

export default Comp2;
