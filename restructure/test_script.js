// START OF SETUP

// Initialize global variables

// Simulation-specific variables
let simulationRate = 1000;
let pauseSimulation = true;
let DEBUG = false;

// Initialize global constants

// Regex for term codes to get term labels, and semester code -> semester label mapping
const re = new RegExp("(20\\d{2})(30|40|50)"); // matches years in this millennium (20xx) followed by 30, 40, or 50
const semesterLabels = { 30: "Fall", 40: "Spring", 50: "Summer" };

// Chart dimensions
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Bubble stuff
const bubbleRadius = 5; // Base radius of a bubble
const bubblePadding = 1.5; // Collision detection uses this number times the radius of each bubble
const bubbleRadiusVariance = 0.25 * bubbleRadius; // By how much the radius of a bubble can vary
let predicateFunction = filterNone; // predicateFunction will always need to be defined

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

// Filters for various criteria need to be implemented here, they should
// take a filter criteria, and return a function which tests a given node
// against that criteria and returns a boolean
function filterSex(sex) {
  return (d) => {
    return d.sex === sex;
  };
}

// This is the only "filter" function which does not return a function
function filterNone(d) {
  return true;
}

// Tell bubbles where to go next
function updateBubblePositions() {
  d3.selectAll("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);
}

// Call this function to filter out bubbles based on the predicate passed in
function updateBubbleColors(predicate = predicateFunction) {
  d3.selectAll("circle")
    .transition()
    .duration(simulationRate * 0.25) // How quickly the color transitions
    .attr("fill", (d) => (predicate(d) ? stages[d.stage].color : "#354162"));
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
  iterMin = 0;
  iterMax = termCodes.length;
  // This generator will loop between `min` and `max` forever
  while (true) {
    // Loop back to beginning
    if (i === iterMax) {
      i = iterMin;
    }
    const received = yield termCodes[i];

    // If we don't receive new instructions, carry on
    if (typeof received === "undefined") {
      i++;
      // otherwise, get new instructions
    } else {
      let { newMin, newMax, newIter } = received;
      iterMin = newMin ?? iterMin;
      iterMax = newMax ?? iterMax;
      i = newIter ?? i;
      i = Math.max(Math.min(i, iterMax), iterMin);
    }
  }
}

// Return a random number in the range [x - c, x + c]
function plusMinus(x, c) {
  return Math.round(x + c * (2 * Math.random() - 1));
}

// Initializing starting position of a student node
function initializeNode(stage, x, y, student) {
  return {
    ...student,
    x: x + Math.random(),
    y: y + Math.random(),
    r: plusMinus(bubbleRadius, bubbleRadiusVariance),
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
  const strength = 0.25;
  let nodes;

  function force(alpha) {
    const k = alpha * strength;
    for (const d of nodes) {
      d.vx -= k * (d.x - stages[d.stage].x);
      d.vy -= k * (d.y - stages[d.stage].y);
    }
  }
  force.initialize = (_) => (nodes = _);

  return force;
}
// END OF SETUP

// MAIN PROGRAM
// Load data, and then...
d3.csv("../data/201150_ftf.csv", d3.autoType).then(function loadData(studentData) {
  // Get term codes from dataset
  const termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));

  // Initialize student nodes
  let stage = "Starting Cohort";
  let x = stages[stage].x;
  let y = stages[stage].y;
  let studentNodes = studentData.map((student) => initializeNode(stage, x, y, student)); //.slice(0, 1000);
  stages[stage].count = studentNodes.length;

  // Draw a bubble for each student
  SVG.append("g")
    .selectAll("circle")
    .data(studentNodes)
    .join("circle")
    .attr("fill", (d) => stages[d.stage].color) // Starting stage/color established in initializeNode()
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r);

  // The actual code which, given a term code, updates each node's position and color
  function updateNodeData(term) {
    studentNodes.forEach(function updateSingleNode(node) {
      stages[node.stage].count -= 1;
      node.stage = node[term];
      stages[node.stage].count += 1;
    });
  }

  // Creates a d3 simulation object with these physics
  const physics = d3
    .forceSimulation(studentNodes)
    .force("cluster", forceCluster())
    .force(
      "collide",
      d3.forceCollide((d) => bubblePadding * d.r)
    )
    .alpha(0.09)
    .alphaDecay(0);

  // Tells d3 how to apply physics to nodes
  physics.on("tick", updateBubblePositions);

  // Initializes a termCode generator, we're getting ready to actually start animating
  let termCodeGenerator = termCodeGeneratorFactory(termCodes);

  // DEBUG by following a single student
  let studentX = Math.floor(Math.random() * studentNodes.length);

  function debugStatements() {
    // DEBUG print statements for student X
    let { pid, x, y, stage, sex } = studentNodes[studentX];
    let counts = Object.keys(stages).map((k) => stages[k].count);
    console.log(
      `term: ${term}\ncounts: ${counts}\ntotal: ${counts.reduce(
        (s, x) => s + x,
        0
      )}\nstudent ${pid} (sex: ${sex}):\n  stage: ${stage}\n  x: ${x}\n  y: ${y}`
    );
  }

  // The global simulation controller; this is essentially the "circuitry" to which the pauseSimulation BUTTON is actually wired
  function simulationController() {
    if (pauseSimulation) {
      setTimeout(simulationController, 100); // Wait 100ms, then check again if the simulation is still paused
    } else {
      setTimeout(simulationStep, 10); // Simulation was unpaused, wait 10ms and then go back to simulationStepFunction
    }
  }

  // Everything that needs to happen for a single animation frame
  function simulationStep() {
    // Get the next term code from the generator
    // instead of this plain .next(), this is where you'd implement your bookmark and slider handle onChange listeners

    // Suppose the user wants to filter on sex == female
    // predicateFunction = filterSex("M")  // Then pass `predicate` to updateBubbleColors
    let term = termCodeGenerator.next().value;
    updateNodeData(term);

    if (DEBUG) {
      debugStatements();
    }

    updateBubbleColors();
    setTimeout(simulationController, simulationRate);
  }

  // Finally ready to start the animation...
  // Launch the algorithm!
  setTimeout(simulationController, 10);
});
