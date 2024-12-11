import React, { Component } from "react";
import * as d3 from "d3";
import metalsCSV from "./metals.csv";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Select from "@mui/material/Select";
import "./App.css";

class Comp6 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedYear: 1998,
      selectedMetal: "alum",
      filteredData: null,
      yearData: null,
      chartData: null,
    };
  }

  componentDidMount() {
    //console.log("Component Mounted");

    d3.csv(metalsCSV).then((data) => {
      data.forEach((d) => {
        d.Year = +d.Year;
        d.Price_alum = +d.Price_alum || 0;
        d.Price_gold = +d.Price_gold || 0;
        d.Price_silver = +d.Price_silver || 0;
        d.Price_nickel = +d.Price_nickel || 0;
        d.Price_uran = +d.Price_uran || 0;
        d.Price_alum_infl = +d.Price_alum_infl || 0;
        d.Price_gold_infl = +d.Price_gold_infl || 0;
        d.Price_silver_infl = +d.Price_silver_infl || 0;
        d.Price_nickel_infl = +d.Price_nickel_infl || 0;
        d.Price_uran_infl = +d.Price_uran_infl || 0;
      });

      const filteredData = data.filter((d) => d.Year <= 2020);

      const inflData = filteredData.filter(
        (d) => +d.Year === this.state.selectedYear
      );
      //console.log(inflData);

      const initChartData = inflData.map((entry) => ({
        Month: entry.Month,
        Price_alum: entry.Price_alum_infl,
        Price_alum_infl: entry.Price_alum_infl,
      }));

      this.setState({
        filteredData: filteredData,
        yearData: inflData,
        chartData: initChartData,
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { yearData, selectedMetal } = this.state;

    if (prevState.yearData !== yearData) {
      const priceKey = `Price_${selectedMetal}`;
      const priceInflKey = `Price_${selectedMetal}_infl`;

      const chartData = yearData.map((entry) => ({
        Month: entry.Month,
        [priceKey]: entry[priceKey],
        [priceInflKey]: entry[priceInflKey],
      }));

      this.setState({ chartData });
    }
    if (prevState.chartData !== this.state.chartData) {
      //console.log(yearData);
      this.createStackChart();
    }
  }

  createStackChart() {
    const { chartData, selectedMetal } = this.state;
    if (!chartData) return;
    //console.log(chartData);

    const priceKey = `Price_${selectedMetal}`;
    const priceInflKey = `Price_${selectedMetal}_infl`;
    const diffKey = `Price_difference`;
    //console.log(priceKey, priceInflKey);

    let yTitle;
    let legText;
    if (priceKey === "Price_alum") {
      yTitle = "Price in USD per Ton";
      legText = "Aluminum";
    } else if (priceKey === "Price_gold") {
      yTitle = "Price in USD per Troy Ounce";
      legText = "Gold";
    } else if (priceKey === "Price_silver") {
      yTitle = "Price in USD per Troy Ounce";
      legText = "Silver";
    } else if (priceKey === "Price_nickel") {
      yTitle = "Price in USD per Ton";
      legText = "Nickel";
    } else {
      yTitle = "Price in USD per Pound";
      legText = "Uranium";
    }

    const processedData = chartData.map((d) => ({
      Month: d.Month,
      [priceKey]: d[priceKey],
      [priceInflKey]: d[priceInflKey],
      [diffKey]: d[priceInflKey] - d[priceKey],
    }));

    const w = 760;
    const h = 400;
    const margin = { top: 40, right: 110, bottom: 50, left: 80 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    d3.select("#stackChart").select("svg").remove();

    const svg = d3
      .select("#stackChart")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const stack = d3
      .stack()
      .keys([priceKey, diffKey])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(processedData);

    const xScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.Month))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(series[series.length - 1], (d) => d[1])])
      .nice()
      .range([height, margin.top]);

    const colorScale = d3
      .scaleOrdinal()
      .domain([priceKey, diffKey])
      .range(["#000080", "#FFD700"]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    const bars = svg
      .selectAll("g.layer")
      .data(series)
      .join("g")
      .attr("class", "layer")
      .attr("fill", (d) => colorScale(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d, i) => xScale(processedData[i].Month))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth());

    const tooltip = d3.select("#tooltip");

    bars
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);

        const metalPrice = d.data[priceKey];
        const metalPriceInfl = d.data[priceInflKey];

        tooltip
          .html(
            `<strong>Month: </strong> ${d.data.Month}
           <br/><strong>Price: </strong> $${metalPrice.toFixed(2)}
           <br/><strong>Price with Inflation: </strong> $${metalPriceInfl.toFixed(
             2
           )}`
          )
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX - 200}px`)
          .style("top", `${event.pageY - 66}px`);
      });

    svg
      .selectAll(".x-title")
      .data(["Month"])
      .join("text")
      .attr("class", "x-title")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "16px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    svg
      .selectAll(".y-title")
      .data([yTitle])
      .join("text")
      .attr("class", "y-title")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left / 2 - 10)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "16px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    svg
      .selectAll(".title")
      .data(["Raw Price vs Inflation Adjusted"])
      .join("text")
      .attr("class", "title")
      .attr("x", margin.left / 4 + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .text((d) => d)
      .attr("font-size", "20px")
      .attr("fill", "black")
      .style("font-weight", "bold");

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width + 10}, ${height / 2})`);

    legend
      .selectAll("rect")
      .data([diffKey, priceKey])
      .join("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 80)
      .attr("width", 15)
      .attr("height", 30)
      .attr("fill", (d) => colorScale(d));

    legend
      .selectAll("text")
      .data([diffKey, priceKey])
      .join("text")
      .attr("x", 20)
      .attr("y", (d, i) => i * 80 + 10)
      .each(function (d) {
        const text = d3.select(this);
        const lines =
          d === priceKey
            ? [`Price of`, `${legText}`]
            : [`Price of`, `${legText}`, `(Adjusted)`];

        lines.forEach((line, i) => {
          text
            .append("tspan")
            .attr("x", 20)
            .attr("dy", i === 0 ? 0 : "1.2em")
            .text(line);
        });
      })
      .style("font-size", "1em");
  }

  handleDropChange = (event) => {
    const { filteredData } = this.state;
    const yearData = filteredData.filter((d) => d.Year === +event.target.value);
    this.setState({ selectedYear: +event.target.value, yearData });
  };

  handleRadioChange = (event) => {
    const metal = event.target.value;
    const { yearData } = this.state;

    const priceKey = `Price_${metal}`;
    const priceInflKey = `Price_${metal}_infl`;

    const chartData = yearData.map((entry) => ({
      Month: entry.Month,
      [priceKey]: entry[priceKey],
      [priceInflKey]: entry[priceInflKey],
    }));

    this.setState({ selectedMetal: metal, chartData });
  };

  render() {
    const { selectedYear, selectedMetal } = this.state;
    return (
      <div>
        <div className="stackchartgroup">
          <div className="chart-controls">
            <Box sx={{ maxWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Age"
                  onChange={this.handleDropChange}
                >
                  <MenuItem value={1992}>1992</MenuItem>
                  <MenuItem value={1993}>1993</MenuItem>
                  <MenuItem value={1994}>1994</MenuItem>
                  <MenuItem value={1995}>1995</MenuItem>
                  <MenuItem value={1996}>1996</MenuItem>
                  <MenuItem value={1997}>1997</MenuItem>
                  <MenuItem value={1998}>1998</MenuItem>
                  <MenuItem value={1999}>1999</MenuItem>
                  <MenuItem value={2000}>2000</MenuItem>
                  <MenuItem value={2001}>2001</MenuItem>
                  <MenuItem value={2002}>2002</MenuItem>
                  <MenuItem value={2003}>2003</MenuItem>
                  <MenuItem value={2004}>2004</MenuItem>
                  <MenuItem value={2005}>2005</MenuItem>
                  <MenuItem value={2006}>2006</MenuItem>
                  <MenuItem value={2007}>2007</MenuItem>
                  <MenuItem value={2008}>2008</MenuItem>
                  <MenuItem value={2009}>2009</MenuItem>
                  <MenuItem value={2010}>2010</MenuItem>
                  <MenuItem value={2011}>2011</MenuItem>
                  <MenuItem value={2012}>2012</MenuItem>
                  <MenuItem value={2013}>2013</MenuItem>
                  <MenuItem value={2014}>2014</MenuItem>
                  <MenuItem value={2015}>2015</MenuItem>
                  <MenuItem value={2016}>2016</MenuItem>
                  <MenuItem value={2017}>2017</MenuItem>
                  <MenuItem value={2018}>2018</MenuItem>
                  <MenuItem value={2019}>2019</MenuItem>
                  <MenuItem value={2020}>2020</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl>
              <FormLabel>Metal</FormLabel>
              <RadioGroup
                row
                value={selectedMetal}
                onChange={this.handleRadioChange}
              >
                <FormControlLabel
                  value="alum"
                  control={<Radio />}
                  label="Aluminum"
                />
                <FormControlLabel
                  value="gold"
                  control={<Radio />}
                  label="Gold   "
                />
                <FormControlLabel
                  value="silver"
                  control={<Radio />}
                  label="Silver"
                />
                <FormControlLabel
                  value="nickel"
                  control={<Radio />}
                  label="Nickel"
                />
                <FormControlLabel
                  value="uran"
                  control={<Radio />}
                  label="Uranium"
                />
              </RadioGroup>
            </FormControl>
          </div>
          <div id="stackChart" />
          <div id="tooltip" />
        </div>
      </div>
    );
  }
}

export default Comp6;
