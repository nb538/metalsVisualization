import React, { Component } from "react";

class FileUploadMod extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      jsonData: null,
    };
  }

  handleFileSubmit = (event) => {
    event.preventDefault();
    const { file } = this.state;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const json = this.csvToJson(text);
        this.setState({ jsonData: json });
        this.props.set_data(json);
      };
      reader.readAsText(file);
    }
  };

  csvToJson = (csv) => {
    const lines = csv.split("\n"); // Split by new line to get rows
    const headers = lines[0].split(","); // Split first row to get headers
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(","); // Split each line by comma
      const obj = {};

      // Map each column value to the corresponding header
      headers.forEach((header, index) => {
        obj[header.trim()] = currentLine[index]?.trim(); // Trim to remove spaces
      });

      // Add object to result if it's not an empty row
      if (Object.keys(obj).length && lines[i].trim()) {
        const parsedObj = {
          Year: obj.Year,
          Month: obj.Month,
          Price_Aluminum: parseFloat(obj.Price_alum),
          Price_Gold: parseFloat(obj.Price_gold),
          Price_Nickel: parseFloat(obj.Price_nickel),
          Price_Silver: parseFloat(obj.Price_silver),
          Price_Uranium: parseFloat(obj.Price_uran),
          Inflation: parseFloat(obj.Inflation_rate),
          Price_Alum_Infl: parseFloat(obj.Price_alum_infl),
          Price_Gold_Infl: parseFloat(obj.Price_gold_infl),
          Price_Nickel_infl: parseFloat(obj.Price_nickel_infl),
          Price_Silver_Infl: parseFloat(obj.Price_silver_infl),
          Price_Uran_Infl: parseFloat(obj.Price_uran_infl),
        };

        result.push(parsedObj);
      }
    }

    return result;
  };

  render() {
    return (
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: 2,
          width: "80%",
          height: "95px",
          borderRadius: "10px",
        }}
      >
        <h2 style={{ marginLeft: "5%" }}>Upload a CSV File</h2>
        <form
          onSubmit={this.handleFileSubmit}
          style={{ justifyContent: "space-between", marginLeft: "5%" }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(event) => this.setState({ file: event.target.files[0] })}
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default FileUploadMod;
