import React, { Component } from "react";
import * as d3 from "d3";
import "./App.css";

class Comp7 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      numericColumns: [],
      objectColumns: [],
      distinctCount: [],
      tooltipChart: [],
    };
  }

  // Function to avoid years being categorized as numeric, only meant for this dataset
  isYear(value) {
    const yearPattern = /^[12][0-9]{3}$/;
    return yearPattern.test(value);
  }

  categorizeColumns(csv_data) {
    if (!csv_data || csv_data.length < 2) {
      console.log("No Data");
      this.setState({
        numericColumns: [],
        objectColumns: [],
      });
      return;
    }

    // Extract columns from csv_data (header is the first row)
    const columns = Object.keys(csv_data[0]);
    const firstDataRow = csv_data[1];
    const categorizedColumns = columns.reduce(
      (acc, column) => {
        const value = firstDataRow[column];

        // Check for year column
        if (this.isYear(value)) {
          acc.object.push(column);
        } else {
          const isNumeric = !isNaN(+value);
          if (isNumeric) {
            acc.numeric.push(column);
          } else {
            acc.object.push(column);
          }
        }

        return acc;
      },
      { numeric: [], object: [] }
    );

    // Update state with categorized columns
    this.setState({
      numericColumns: categorizedColumns.numeric,
      objectColumns: categorizedColumns.object,
    });

    console.log("Categorized Columns Updated in State");
  }

  // Function that returns counts for each field for each type
  calculateColumnStats(csv_data) {
    const { numericColumns, objectColumns } = this.state;
    const numericStats = {};
    const objectStats = {};

    if (!csv_data || csv_data.length === 0) {
      return { numericStats, objectStats };
    }

    // Calculates counts for each field
    // Uses buckets(ranges) for numerics
    // Uses distinct values for objects
    numericColumns.forEach((col) => {
      const values = csv_data
        .map((row) => parseFloat(row[col]))
        .filter((v) => !isNaN(v));
      if (values.length === 0) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const bucketSize = (max - min) / 10;

      const buckets = Array(10).fill(0);
      values.forEach((val) => {
        const bucketIndex = Math.min(Math.floor((val - min) / bucketSize), 9);
        buckets[bucketIndex]++;
      });

      numericStats[col] = { min, max, buckets };
    });

    objectColumns.forEach((col) => {
      const counts = {};
      csv_data.forEach((row) => {
        const value = row[col];
        counts[value] = (counts[value] || 0) + 1;
      });

      objectStats[col] = counts;
    });

    return { numericStats, objectStats };
  }

  componentDidMount() {
    this.categorizeColumns(this.props.csv_data);
    this.tooltip = d3.select("#upload-tooltip");
  }

  componentDidUpdate(prevProps) {
    if (prevProps.csv_data !== this.props.csv_data) {
      console.log("csv_data prop updated");
      this.categorizeColumns(this.props.csv_data);
    }
  }

  // Function that draws bar graph when mouse hovers over span object.
  handleMouseEnter = (columnName) => {
    const { csv_data } = this.props;
    const { numericColumns } = this.state;
    const { numericStats, objectStats } = this.calculateColumnStats(csv_data);

    const tooltipDiv = d3
      .select("#upload-tooltip")
      .style("display", "block")
      .style("opacity", "1");

    tooltipDiv.html("");

    if (numericColumns.includes(columnName)) {
      const { min, max, buckets } = numericStats[columnName];
      const data = buckets.map((count, index) => ({
        value: min + (index + 1) * ((max - min) / buckets.length),
        count,
      }));

      const margin = { top: 26, right: 10, bottom: 80, left: 40 };
      const width = 540 - margin.left - margin.right;
      const height = 320 - margin.top - margin.bottom;

      const svg = tooltipDiv
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.value.toFixed(2)))
        .range([0, width])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.count)])
        .nice()
        .range([height, 0]);

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", `translate(-26, 30) rotate(-45)`)
        .style("text-anchor", "start");

      svg.append("g").call(d3.axisLeft(y));

      svg
        .selectAll(".title")
        .data([columnName])
        .join("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text((d) => d)
        .attr("fill", "white")
        .attr("font-size", "20px");

      svg
        .selectAll(".y-title")
        .data(["Count"])
        .join("text")
        .attr("class", "y-title")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 2 - 8)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text((d) => d)
        .attr("fill", "white")
        .attr("font-size", "16px");

      svg
        .selectAll(".x-title")
        .data(["Max Price per Bucket in USD"])
        .join("text")
        .attr("class", "x-title")
        .attr("x", width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .text((d) => d)
        .attr("fill", "white")
        .attr("font-size", "16px");

      svg
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.value.toFixed(2)))
        .attr("y", (d) => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.count))
        .attr("fill", "steelblue");
    } else {
      const counts = objectStats[columnName];
      const data = Object.entries(counts).map(([value, count]) => ({
        value,
        count,
      }));

      const margin = { top: 26, right: 10, bottom: 60, left: 40 };
      const width = 540 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      const svg = tooltipDiv
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.value))
        .range([0, width])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.count)])
        .nice()
        .range([height, 0]);

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", `translate(-20, 22) rotate(-60)`)
        .style("text-anchor", "start");

      svg.append("g").call(d3.axisLeft(y));

      svg
        .selectAll(".title")
        .data([columnName])
        .join("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text((d) => d)
        .attr("fill", "white")
        .attr("font-size", "20px");

      svg
        .selectAll(".y-title")
        .data(["Count"])
        .join("text")
        .attr("class", "y-title")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 2 - 8)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text((d) => d)
        .attr("fill", "white")
        .attr("font-size", "16px");

      if (columnName === "Year") {
        svg
          .selectAll(".x-title")
          .data(["Year"])
          .join("text")
          .attr("class", "x-title")
          .attr("x", width / 2)
          .attr("y", height + margin.top + 32)
          .attr("text-anchor", "middle")
          .text((d) => d)
          .attr("fill", "white")
          .attr("font-size", "16px");
      } else {
        svg
          .selectAll(".x-title")
          .data(["Month"])
          .join("text")
          .attr("class", "x-title")
          .attr("x", width / 2)
          .attr("y", height + margin.top + 32)
          .attr("text-anchor", "middle")
          .text((d) => d)
          .attr("fill", "white")
          .attr("font-size", "16px");
      }

      svg
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.value))
        .attr("y", (d) => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.count))
        .attr("fill", "steelblue");
    }
  };

  handleMouseMove = (event) => {
    this.tooltip
      .style("left", `${event.pageX - 400}px`)
      .style("top", `${event.pageY + 10}px`);
  };

  handleMouseLeave = () => {
    this.tooltip.style("opacity", "0").style("display", "none");
  };

  render() {
    const { numericColumns, objectColumns } = this.state;

    return (
      <div className="columnsgroup">
        <h2>Data Columns:</h2>
        <div style={{ maxWidth: "50%" }}>
          <h4>Numeric Columns:</h4>
          <div
            className="numbercols"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {numericColumns.map((col) => (
              <span
                key={col}
                style={{
                  padding: "5px",
                  border: "2px solid black",
                  borderRadius: "5px",
                }}
                onMouseEnter={() => this.handleMouseEnter(col)}
                onMouseMove={this.handleMouseMove}
                onMouseLeave={this.handleMouseLeave}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4>Object Columns:</h4>
          <div
            className="objectcols"
            style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
          >
            {objectColumns.map((col) => (
              <span
                key={col}
                style={{
                  padding: "5px",
                  border: "2px solid black",
                  borderRadius: "5px",
                }}
                onMouseEnter={() => this.handleMouseEnter(col)}
                onMouseMove={this.handleMouseMove}
                onMouseLeave={this.handleMouseLeave}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
        <div id="upload-tooltip" />
      </div>
    );
  }
}

export default Comp7;
