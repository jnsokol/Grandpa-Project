import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function App() {
  const layout = [
    { i: "a", x: 0, y: 0, w: 2, h: 2 },
    { i: "b", x: 2, y: 0, w: 2, h: 2 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard 🔥</h1>

      <GridLayout
        className="layout"
        layout={layout}
        cols={4}
        rowHeight={100}
        width={800}
      >
        <div key="a" style={{ background: "#ddd" }}>Tile A</div>
        <div key="b" style={{ background: "#bbb" }}>Tile B</div>
      </GridLayout>
    </div>
  );
}

export default App;