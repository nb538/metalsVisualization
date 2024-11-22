import React, { Component } from "react";
import Comp1 from "./Comp1";
import Comp2 from "./Comp2";
import Comp3 from "./Comp3";
import Comp4 from "./Comp4";
import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="body">
        <div className="toprow">
          <Comp1 />
          <Comp3 />
        </div>
        <div className="bottomrow">
          <Comp2 />
          <Comp4 />
        </div>
      </div>
    );
  }
}

export default App;
