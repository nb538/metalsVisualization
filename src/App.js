import React, { Component } from "react";
import FileUpload from "./FileUpload";
import Comp5 from "./Comp5";
import Comp6 from "./Comp6";
import Comp7 from "./Comp7";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }

  componentDidMount = () => {
    //console.log(this.state.data);
  };

  componentDidUpdate = () => {
    console.log(this.state.data);
  };

  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  };

  render() {
    return (
      <div className="body">
        <div className="topgroup">
          <FileUpload set_data={this.set_data}></FileUpload>
          <Comp7 csv_data={this.state.data}></Comp7>
          <h1>This is the top group</h1>
        </div>
        <div className="dashboard">
          <div className="leftgroup">
            <Comp5 />
            <h1>This is the left group</h1>
          </div>
          <div className="rightgroup">
            <Comp6 />
            <h1>This is the right group</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
