import React, { Component } from "react";
import * as d3 from "d3";
import metalsCSV from "./metals.csv";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

class Comp4 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedYear: 1992, // Default year for the slider
      medianData: [], // Holds all the processed data
      filteredData: null, // Holds data for the currently selected year
      selectedMetals: {
        Aluminum: true,
        Gold: true,
        Silver: true,
        Nickel: true,
        Uranium: true,
      }, // Tracks which metals are selected for display
      selectAll: true, // Tracks the state of the parent checkbox
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
      // Ensure numeric conversion for year and price fields
      data.forEach((d) => {
        d.Year = +d.Year;
        d.Price_alum = +d.Price_alum || 0;
        d.Price_gold = +d.Price_gold || 0;
        d.Price_silver = +d.Price_silver || 0;
        d.Price_nickel = +d.Price_nickel || 0;
        d.Price_uran = +d.Price_uran || 0;
      });

      // Group the data by year
      const groupedByYear = d3.group(data, (d) => d.Year);

      // Prepare median data
      const medianData = [];
      groupedByYear.forEach((values, year) => {
        // Extract prices for each metal
        const pricesAlum = values.map((d) => d.Price_alum);
        const pricesGold = values.map((d) => d.Price_gold);
        const pricesSilver = values.map((d) => d.Price_silver);
        const pricesNickel = values.map((d) => d.Price_nickel);
        const pricesUran = values.map((d) => d.Price_uran);

        // Calculate medians
        const medianPriceAlum = this.calculateMedian(pricesAlum);
        const medianPriceGold = this.calculateMedian(pricesGold);
        const medianPriceSilver = this.calculateMedian(pricesSilver);
        const medianPriceNickel = this.calculateMedian(pricesNickel);
        const medianPriceUranium = this.calculateMedian(pricesUran);

        // Store the results
        medianData.push({
          year,
          Aluminum: medianPriceAlum,
          Gold: medianPriceGold,
          Silver: medianPriceSilver,
          Nickel: medianPriceNickel,
          Uranium: medianPriceUranium,
        });
      });

      // Set the initial state
      const initialYear = this.state.selectedYear;
      const initialFilteredData = medianData.find(
        (d) => d.year === initialYear
      );

      this.setState({ medianData, filteredData: initialFilteredData }, () => {
        this.createBarChart();
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Update the chart when the filtered data or selected metals change
    if (
      prevState.filteredData !== this.state.filteredData ||
      prevState.selectedMetals !== this.state.selectedMetals
    ) {
      this.createBarChart();
    }
  }

  // Function to create the bar chart using D3
  createBarChart() {
    const { filteredData, selectedMetals } = this.state;

    if (!filteredData) return;

    const margin = { top: 20, right: 30, bottom: 45, left: 70 };
    const width = 400 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    // Filter data based on selected metals
    const data = Object.entries(filteredData)
      .filter(([metal, _]) => selectedMetals[metal])
      .map(([metal, medianPrice]) => ({ metal, medianPrice }))
      .filter((d) => d.metal !== "year"); // Exclude the year property

    // Clear existing SVG
    d3.select("#stack-chart").selectAll("*").remove();

    // Create the SVG container
    const svg = d3
      .select("#stack-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.metal))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.medianPrice)])
      .nice()
      .range([height, 0]);

    // Add X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Add Y-axis
    svg.append("g").call(d3.axisLeft(yScale));

    // Add bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.metal))
      .attr("y", (d) => yScale(d.medianPrice))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(d.medianPrice))
      .attr("fill", "steelblue");
  }

  handleSliderChange = (event, newValue) => {
    const { medianData } = this.state;

    // Find the data corresponding to the selected year
    const filteredData = medianData.find((d) => d.year === newValue);

    // Update the state with the new year and filtered data
    this.setState({ selectedYear: newValue, filteredData });
  };

  handleMetalSelection = (metal) => (event) => {
    this.setState((prevState) => {
      const updatedMetals = {
        ...prevState.selectedMetals,
        [metal]: event.target.checked,
      };

      // Check if all metals are selected
      const allSelected = Object.values(updatedMetals).every((value) => value);

      return { selectedMetals: updatedMetals, selectAll: allSelected };
    });
  };

  handleSelectAll = (event) => {
    const newValue = event.target.checked;
    const updatedMetals = Object.keys(this.state.selectedMetals).reduce(
      (acc, metal) => ({ ...acc, [metal]: newValue }),
      {}
    );

    this.setState({ selectedMetals: updatedMetals, selectAll: newValue });
  };

  render() {
    const { selectedYear, selectedMetals, selectAll } = this.state;

    return (
      <div className="comp4">
        <div className="slidegroup">
          <Box sx={{ height: 180, marginBottom: 4 }}>
            <Slider
              aria-label="Year"
              value={selectedYear}
              valueLabelDisplay="on"
              orientation="vertical"
              step={1}
              marks
              min={1992}
              max={2020}
              onChange={this.handleSliderChange}
            />
          </Box>
          <div id="stack-chart"></div>
        </div>
        <div className="checkgroup">
          <FormControlLabel
            control={
              <Checkbox checked={selectAll} onChange={this.handleSelectAll} />
            }
            label="Select All"
          />
          <div className="metalcheck">
            {Object.keys(selectedMetals).map((metal) => (
              <FormControlLabel
                key={metal}
                control={
                  <Checkbox
                    checked={selectedMetals[metal]}
                    onChange={this.handleMetalSelection(metal)}
                  />
                }
                label={metal}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default Comp4;
