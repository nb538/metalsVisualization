import React, { Component } from "react";
import * as d3 from "d3";
import metalsCSV from "./metals.csv";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import "./App.css";

class Comp5 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedYear: 2000, // Default year for the slider
      medianData: [], // Holds all the processed data
      filteredData: null, // Holds data for the currently selected year
      selectedMetals: {
        Aluminum: true,
        Gold: true,
        Silver: true,
        Nickel: true,
        Uranium: true,
      }, // Tracks which metals are selected for display
      selectAll: true,
      sliderMin: 5,
      sliderRange: [1998, 2003],
    };
  }

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
    d3.csv(metalsCSV).then((data) => {
      const filteredData = data.filter((d) => +d.Year <= 2020);
      const groupedByYear = d3.group(filteredData, (d) => d.Year);

      const medianData = [];
      groupedByYear.forEach((values, year) => {
        const pricesAlum = values.map((d) => +d.Price_alum);
        const pricesGold = values.map((d) => +d.Price_gold);
        const pricesSilver = values.map((d) => +d.Price_silver);
        const pricesNickel = values.map((d) => +d.Price_nickel);
        const pricesUranium = values.map((d) => +d.Price_uran);

        const medianPriceAluminum = this.calculateMedian(pricesAlum) / 2000; // Convert from ton to pound
        const medianPriceGold = this.calculateMedian(pricesGold) * 14.5833; // Convert from troy ounce to pound
        const medianPriceSilver = this.calculateMedian(pricesSilver) * 14.5833; // Convert from troy ounce to pound
        const medianPriceNickel = this.calculateMedian(pricesNickel) / 2000; // Convert from ton to pound
        const medianPriceUranium = this.calculateMedian(pricesUranium); // Already in pounds

        medianData.push({
          year,
          medianPriceAluminum,
          medianPriceGold,
          medianPriceSilver,
          medianPriceNickel,
          medianPriceUranium,
        });
      });

      //console.log(medianData); // Log here to inspect the data
      this.setState({ medianData, filteredData: medianData });
    });

    this.drawLineChart();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.medianData !== this.state.medianData ||
      prevState.selectedMetals !== this.state.selectedMetals ||
      prevState.filteredData !== this.state.filteredData
    ) {
      this.drawLineChart();
    }
  }

  drawLineChart() {
    const { filteredData, selectedMetals } = this.state;

    if (!filteredData || filteredData.length === 0) return;

    // Set dimensions and margins
    const w = 600;
    const h = 400;
    const margin = { top: 30, right: 100, bottom: 50, left: 70 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    // Remove any existing SVG to avoid duplicates
    d3.select("#line-chart").selectAll("*").remove();

    // Append the SVG element
    const svg = d3
      .select("#line-chart")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse years and extract price fields
    const years = filteredData.map((d) => +d.year);
    const priceFields = [];
    if (selectedMetals.Aluminum) priceFields.push("medianPriceAluminum");
    if (selectedMetals.Gold) priceFields.push("medianPriceGold");
    if (selectedMetals.Silver) priceFields.push("medianPriceSilver");
    if (selectedMetals.Nickel) priceFields.push("medianPriceNickel");
    if (selectedMetals.Uranium) priceFields.push("medianPriceUranium");

    // Define scales
    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);

    const yMax = d3.max(filteredData, (d) =>
      d3.max(priceFields.map((key) => d[key]))
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([height, margin.top]);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d"))); // Format years as integers
    svg.append("g").call(d3.axisLeft(yScale));

    // Define line generator
    const line = d3
      .line()
      .x((d) => xScale(+d.year))
      .y((d) => yScale(d.value));

    // Prepare data for each line
    const linesData = priceFields.map((key) => {
      return {
        name: key,
        values: filteredData.map((d) => ({ year: d.year, value: d[key] })),
      };
    });

    // Define a color scale
    const metalColors = {
      medianPriceAluminum: "#000080",
      medianPriceGold: "#DAA520",
      medianPriceSilver: "#696969",
      medianPriceNickel: "#FF4500",
      medianPriceUranium: "#32CD32",
    };

    // Draw lines
    svg
      .selectAll(".line")
      .data(linesData) // Bind the data
      .join("path") // Handle enter, update, and exit
      .attr("class", "line") // Add a class for styling or identification
      .attr("fill", "none")
      .attr("stroke", (d) => metalColors[d.name]) // Use the index for stroke color
      .attr("stroke-width", 5)
      .attr("d", (d) => line(d.values));

    svg
      .selectAll(".x-title")
      .data(["Year"])
      .join("text")
      .attr("class", "x-title")
      .attr("x", width / 2)
      .attr("y", height + margin.top + 10)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "16px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    svg
      .selectAll(".y-title")
      .data(["Price in USD per Pound"])
      .join("text")
      .attr("class", "y-title")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left / 2 - 20)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "16px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    svg
      .selectAll(".title")
      .data(["Price of Metals Over Time"])
      .join("text")
      .attr("class", "title")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "20px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    // Add legend
    const legend = svg
      .selectAll(".legend")
      .data(linesData)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend
      .append("rect")
      .attr("x", width + 20)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", (d) => metalColors[d.name]);

    legend
      .append("text")
      .attr("x", width + 35)
      .attr("y", 10)
      .text((d) => d.name.replace("medianPrice", ""))
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  }

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

  handleRangeChange = (event, newYear, activeThumb) => {
    const { sliderMin, medianData } = this.state;
    const filteredData = medianData.filter(
      (d) => +d.year >= newYear[0] && +d.year <= newYear[1]
    );

    if (newYear[1] - newYear[0] < sliderMin) {
      if (activeThumb === 0) {
        const newStart = Math.min(newYear[0], 2020 - sliderMin);
        this.setState({
          sliderRange: [newStart, newStart + sliderMin],
          filteredData,
        });
      } else {
        const newEnd = Math.max(newYear[1], 1992 + sliderMin);
        this.setState({
          sliderRange: [newEnd - sliderMin, newEnd],
          filteredData,
        });
      }
    } else {
      this.setState({ sliderRange: newYear, filteredData });
    }
  };

  render() {
    const { selectedMetals, selectAll, sliderRange } = this.state;

    return (
      <div className="comp5">
        <Box sx={{ width: 400, marginBottom: 1, marginRight: 16 }}>
          <Slider
            value={sliderRange}
            onChange={this.handleRangeChange}
            valueLabelDisplay="on"
            step={1}
            marks
            min={1992}
            max={2020}
            disableSwap
          />
        </Box>
        <div className="linegroup">
          <div id="line-chart"></div>
          <div className="linechecks">
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
      </div>
    );
  }
}

export default Comp5;
