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

  categorizeColumns(csv_data) {
    if (!csv_data || csv_data.length === 0) {
      console.log("No Data");
      this.setState({
        numericColumns: [],
        objectColumns: [],
      });
      return;
    }

    // Extract columns from csv_data
    const columns = Object.keys(csv_data[0]);
    const categorizedColumns = columns.reduce(
      (acc, column) => {
        // Check if all values in the column are numeric
        const isNumeric = csv_data.every((row) => !isNaN(+row[column]));
        if (isNumeric) {
          acc.numeric.push(column);
        } else {
          acc.object.push(column);
        }
        return acc;
      },
      { numeric: [], object: [] } // Initial categorized structure
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
        <div>
          <h4>Numeric Columns:</h4>
          <div
            className="numbercols"
            style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
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
