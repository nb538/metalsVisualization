import React, { Component } from "react";
import "./App.css";

class Comp7 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      numericColumns: [],
      objectColumns: [],
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

  componentDidMount() {
    this.categorizeColumns(this.props.csv_data);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.csv_data !== this.props.csv_data) {
      console.log("csv_data prop updated");
      this.categorizeColumns(this.props.csv_data);
    }
  }

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
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default Comp7;
