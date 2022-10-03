import "./App.scss";
import DonutChart from "./components/DonutChart";

const App = () => {
  return (
    <div className="App">
      <DonutChart viewBox={150} segments={6} borderSize={35} />
    </div>
  );
};

export default App;
