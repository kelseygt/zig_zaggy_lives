// START OF SETUP

// Initialize global variables

// Simulation-specific variables
let simulationRate = 3000;
let pauseSimulation = true;

// Initialize global constants

// Regex for term codes to get term labels, and semester code -> semester label mapping
const re = new RegExp("(20\\d{2})(30|40|50)"); // matches years in this millenium (20xx) followed by 30, 40, or 50
const semesterLabels = { 30: "Fall", 40: "Spring", 50: "Summer" };

// Chart dimensions
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Bubble stuff
const meanRadius = 4; // Base radius of a bubble
// const variance = 0.5 * meanRadius; // How much by which the radius of a bubble can vary
const padding = 2 * meanRadius; // Space between bubbles
const cluster_padding = 2 * padding; // Space between bubbles of different type

// Stage locations and properties
const stages = {
  "Starting Cohort": {
    x: width * 0.5,
    y: height * 0.15,
    color: "#843b97",
    count: 0,
  },
  Freshman: { x: width * 0.8, y: height * 0.236, color: "#7DD9C1", count: 0 },
  Sophomore: { x: width * 0.89, y: height * 0.47, color: "#3AC6A0", count: 0 },
  Junior: { x: width * 0.8, y: height * 0.71, color: "#35B794", count: 0 },
  Senior: { x: width * 0.5, y: height * 0.8, color: "#31A888", count: 0 },
  Graduated: {
    x: width * 0.2,
    y: height * 0.71,
    color: "#34C3D5",
    count: 0,
    hovertext: "'Graduated' here is defined as bachelor's degree recipients.",
  },
  "Transferred Out": {
    x: width * 0.11,
    y: height * 0.47,
    color: "#f8882a",
    count: 0,
    hovertext:
      "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may subsequently return to MSU Denver.",
  },
  "Dropped Out": {
    x: width * 0.2,
    y: height * 0.236,
    color: "#d53739",
    count: 0,
    hovertext:
      "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal.",
  },
  Sabbatical: {
    x: width * 0.5,
    y: height * 0.47,
    color: "#Eae61a",
    count: 0,
    hovertext:
      "'Sabbatical' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term.",
  },
};

// D3 initialization
const SVG = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Dunno why this step is separate
d3.select("#chart").style("width", width + margin.left + margin.right + "px");

d3.select("button#toggleId").on("click", () => {
  pauseSimulation = !pauseSimulation;
  console.log(`Animation ${pauseSimulation ? "paused" : "playing"}`);
});

// Helper functions

// Changes the play button into a pause button and back again
function toggleMaker() {
  var toggleElement = document.getElementById("toggleId");
  if (toggleElement.innerHTML === "play_arrow") {
    toggleElement.innerHTML = "pause";
  } else {
    toggleElement.innerHTML = "play_arrow";
  }
}

// d3.select("button#reset").on("click", function () {
//   sliderValue = 1;
//   previousSliderValue = 0;
// });

function* termCodeGeneratorFactory(termCodes) {
  // Scrubbable generator into which you can send an object with this structure:
  //   newSimulationInstructions = {
  //     newMin: <integer between 0 and termCodes.length - 1>,
  //     newMax: <integer between newMin + 1 and termCodes.length>,
  //     newIter: <integer between newMin and newMax>
  //   }
  //
  // NOTE: Any of the above properties can be omitted
  //
  // USAGE:
  //   To pass new instructions: termCodeGenerator.next(newInstructions)
  //
  // EXAMPLES:
  //   To set the animation's bookmarks (i.e., the user moved either or both of the bookmarks):
  //     termCodeGenerator.next({ newMin: minBookmark, newMax: maxBookmark})
  //   To set the animation to a new term (i.e., the slider handle was moved by the user):
  //     termCodeGenerator.next({ newIter: sliderValue })
  //   To do nothing:
  //     termCodeGenerator.next()
  //
  i = 0;
  min = 0;
  max = termCodes.length;
  // This generator will loop between `min` and `max` forever
  while (true) {
    const received = yield termCodes[i];

    // If we don't receive new instructions, carry on
    if (typeof received === "undefined") {
      i++;
      // otherwise, get new instructions
    } else {
      let { newMin, newMax, newIter } = received;
      min = newMin ? typeof newMin !== "undefined" : min;
      max = newMax ? typeof newMax !== "undefined" : max;
      i = newIter ? typeof newIter !== "undefined" : i;
    }

    // Loop back to beginning
    if (i === max) {
      i = min;
    }
  }
}

// function randBetween(min, max) {
//   return Math.random() * (max - min) + min;
// }

// Given a mean, return a random number with mean +/- variance
function plusMinus(mean, variance) {
  return Math.round(mean + (2 * variance * Math.random() - variance));
}

// Initializing starting position of a student node
function initializeNode(student) {
  let stage = "Starting Cohort";
  let x = stages[stage].x;
  let y = stages[stage].y;
  let color = stages[stage].color;
  return {
    ...student,
    x: plusMinus(x, 0.01 * height),
    y: plusMinus(y, 0.01 * width),
    r: plusMinus(meanRadius, meanRadius / 2),
    color: color,
    stage: stage,
  };
}

// Creating dynamic labels
function getTermLabel(termCode) {
  let [_, year, semesterCode] = termCode.match(re); // Array destructuring
  return `${semesterLabels[semesterCode]} ${year}`;
}

// Force to increment nodes to stages
function forceCluster() {
  const strength = 0.3;
  let studentNodes;

  function force(alpha) {
    const l = alpha * strength;
    for (const d of studentNodes) {
      d.vx -= (d.x - stages[d.stage].x) * l;
      d.vy -= (d.y - stages[d.stage].y) * l;
    }
  }
  force.initialize = (_) => (studentNodes = _);

  return force;
}

// Force for collision detection
// function forceCollide() {
//   const alpha = 0.15; // fixed for greater rigidity!
//   let studentNodes;
//   let maxRadius;

//   function force() {
//     const quadtree = d3.quadtree(
//       studentNodes,
//       (d) => d.x,
//       (d) => d.y
//     );
//     for (const d of studentNodes) {
//       const r = d.r + maxRadius;
//       const nx1 = d.x - r;
//       const ny1 = d.y - r;
//       const nx2 = d.x + r;
//       const ny2 = d.y + r;
//       quadtree.visit((q, x1, y1, x2, y2) => {
//         if (!q.length)
//           do {
//             if (q.data !== d) {
//               const r = d.r + q.data.r + (d.stage === q.data.stage ? padding : cluster_padding);
//               let x = d.x - q.data.x;
//               let y = d.y - q.data.y;
//               let l = Math.hypot(x, y);
//               if (l < r) {
//                 l = ((l - r) / l) * alpha;
//                 (d.x -= x *= l), (d.y -= y *= l);
//                 (q.data.x += x), (q.data.y += y);
//               }
//             }
//           } while ((q = q.next));
//         return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
//       });
//     }
//   }

//   force.initialize = (_) => (maxRadius = d3.max((studentNodes = _), (d) => d.r) + Math.max(padding, cluster_padding));

//   return force;
// }
// END OF SETUP

// MAIN PROGRAM
// Load data, and then...
d3.csv("../data/201150_ftf.csv", d3.autoType).then(function loadData(studentData) {
  // Get term codes from dataset
  const termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));

  // Create node data
  let studentNodes = studentData.map(initializeNode);
  stages["Starting Cohort"].count = studentNodes.length;
  // studentNodes.forEach((node) => console.log(`${node.x} ${node.y}`));

  // // Create circles
  // const circle = SVG
  //   // .append("g")
  //   .selectAll("circle")
  //   .data(studentNodes)
  //   .join("circle")
  //   .attr("cx", (d) => d.x)
  //   .attr("cy", (d) => d.y)
  //   .attr("fill", (d) => stages[d.stage].color);

  // Ease in the circles
  // circle
  //   .transition()
  //   .delay((d, i) => i)
  //   .duration(800)
  //   .attrTween("r", (d) => {
  //     const i = d3.interpolate(0, d.r);
  //     return (t) => (d.r = i(t));
  //   });

  // Draw a bubble for each student
  SVG.append("g")
    .selectAll("circle")
    .data(studentNodes)
    .join("circle")
    // .transition()
    // .delay((_, i) => i)
    // .duration(1000)
    .attr("fill", (d) => stages[d.stage].color) // Starting stage/color established in initializeNode()
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r);

  // The actual code which, given a term code, updates each node's position and color
  function updateNodeData(term) {
    studentNodes.forEach(function updateSingleNode(node) {
      let stage = node[term];
      stages[node.stage].count -= 1;
      node.x = stages[stage].x;
      node.y = stages[stage].y;
      node.color = stages[stage].color;
      node.stage = stage;
      stages[stage].count += 1;
    });
  }

  function transitionBubbles() {
    d3.selectAll("circle")
      .transition()
      // .delay((d, i) => i * 5)
      // .duration(simulationRate * 0.95)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", (d) => d.color);
  }

  // function updateBubbles() {
  //   bubbles
  //     .attr("cx", (d) => d.x)
  //     .attr("cy", (d) => d.y)
  //     .attr("fill", (d) => stages[d.stage].color);
  // }

  // Creates a d3 simulation object with these physics
  const physics = d3
    .forceSimulation(studentNodes)
    // .force("x", (d) => d3.forceX(d.x))
    // .force("y", (d) => d3.forceY(d.y))
    // .force("cluster", forceCluster())
    .force(
      "collide",
      d3.forceCollide((d) => d.r)
    )
    .alpha(0.09)
    .alphaDecay(0);

  // Tells d3 how to apply physics to nodes
  physics.on("tick", transitionBubbles);

  // Initializes a termCode generator, we're getting ready to actually start animating
  let termCodeGenerator = termCodeGeneratorFactory(termCodes);

  // Debug by following a single student
  let studentX = Math.floor(Math.random() * studentNodes.length);

  // The global simulation controller; this is essentially the "circuitry" to which the pauseSimulation BUTTON is actually wired
  function simulationController() {
    if (pauseSimulation) {
      setTimeout(simulationController, 100); // Wait 100ms and check again if the simulation is still paused
    } else {
      setTimeout(simulationStep, 10); // Simulation was unpaused, wait 10ms and then go back to simulationStepFunction
    }
  }

  // Everything that needs to happen for a single animation frame
  function simulationStep() {
    // Get the next term code from the generator
    // instead of this plain .next(), this is where you'd implement your bookmark and slider handle onChange listeners
    let term = termCodeGenerator.next().value;
    updateNodeData(term);

    // Debug stuff for student X
    let { pid, x, y, stage } = studentNodes[studentX];
    console.log(`term: ${term}\nstudent ${pid}:\n  stage: ${stage}\n  x: ${x}\n  y: ${y}`);

    let counts = Object.keys(stages).map((k) => stages[k].count);
    console.log(`counts: ${counts}\ntotal: ${counts.reduce((s, x) => s + x, 0)}`);

    // transitionBubbles();
    // physics.tick();
    setTimeout(simulationController, simulationRate);
  }

  // Finally ready to start the animation...
  // Launch the algorithm!
  setTimeout(simulationController, 10);
});
