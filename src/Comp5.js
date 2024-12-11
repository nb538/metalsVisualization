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
      selectedYear: 2000,
      medianData: [],
      filteredData: null,
      selectedMetals: {
        Aluminum: true,
        Gold: true,
        Silver: true,
        Nickel: true,
        Uranium: true,
      },
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

    const w = 700;
    const h = 400;
    const margin = { top: 30, right: 200, bottom: 50, left: 70 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    d3.select("#line-chart").selectAll("*").remove();

    const svg = d3
      .select("#line-chart")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const years = filteredData.map((d) => +d.year);
    const priceFields = [];
    if (selectedMetals.Aluminum) priceFields.push("medianPriceAluminum");
    if (selectedMetals.Gold) priceFields.push("medianPriceGold");
    if (selectedMetals.Silver) priceFields.push("medianPriceSilver");
    if (selectedMetals.Nickel) priceFields.push("medianPriceNickel");
    if (selectedMetals.Uranium) priceFields.push("medianPriceUranium");

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);

    const yMax = d3.max(filteredData, (d) =>
      d3.max(priceFields.map((key) => d[key]))
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([height, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    svg.append("g").call(d3.axisLeft(yScale));

    const line = d3
      .line()
      .x((d) => xScale(+d.year))
      .y((d) => yScale(d.value));

    const linesData = priceFields.map((key) => {
      return {
        name: key,
        values: filteredData.map((d) => ({ year: d.year, value: d[key] })),
      };
    });

    const metalColors = {
      medianPriceAluminum: "#0000FF",
      medianPriceGold: "#FFFF00",
      medianPriceSilver: "#FF00FF",
      medianPriceNickel: "#FF0000",
      medianPriceUranium: "#00FF00",
    };

    svg
      .selectAll(".line")
      .data(linesData)
      .join("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", (d) => metalColors[d.name])
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

    const legend = svg
      .selectAll(".legend")
      .data(linesData)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(20,${i * 60 + 40})`);

    legend
      .append("rect")
      .attr("x", width + 10)
      .attr("y", -2)
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", (d) => metalColors[d.name]);

    legend
      .append("text")
      .attr("x", width + 35)
      .attr("y", 10)
      .text((d) => d.name.replace("medianPrice", ""))
      .style("font-size", "24px")
      .attr("alignment-baseline", "middle");
  }

  handleMetalSelection = (metal) => (event) => {
    this.setState((prevState) => {
      const updatedMetals = {
        ...prevState.selectedMetals,
        [metal]: event.target.checked,
      };

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
        <div className="line-controls">
          <Box sx={{ width: 400, marginBottom: 1, marginTop: 2 }}>
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
        <div className="linegroup">
          <div id="line-chart"></div>
        </div>
      </div>
    );
  }
}

export default Comp5;
