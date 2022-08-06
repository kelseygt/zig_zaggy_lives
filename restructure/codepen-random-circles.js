let data = [];

// This is where 'nodes.forEach()' would run
function updateData() {
  data = [];
  for (let i = 0; i < 10; i++) {
    let properties = {
      x: Math.random() * d3.select("svg").attr("width"),
      y: Math.random() * d3.select("svg").attr("height"),
      r: 10 + Math.random() * 10, // Math.random -> [0, 1)
    };
    data.push(properties);
  }
}

const colors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
];

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// All the things that should change when a circle moves
function updateCirclePositions() {
  d3.select("svg")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .transition()
    .attr("fill", (d) => randomColor())
    .attr("r", (d) => d.r)
    .attr("cy", (d) => d.y)
    .attr("cx", (d) => d.x);
}

// let numFrames = 0;
// let maxFrames = 10;

function updateAll() {
  updateData(); // this updates the actual data for each student
  updateCirclePositions(); // this updates the d3 circles which correspond with each "student"
  // numFrames += 1;
  // if (numFrames === maxFrames) {
  //   console.log("DONE!!!!!!!!!!!!!!!!!!!!!!")
  //   return;
  // }
  setTimeout(updateAll, 1000);
}

setTimeout(updateAll, 1);
