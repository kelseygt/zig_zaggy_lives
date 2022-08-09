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
const bubbleRadius = 4; // Base radius of a bubble
const bubblePadding = 1.5; // Collision detection uses this number times the radius of each bubble
const bubbleRadiusVariance = 0.25 * bubbleRadius; // By how much the radius of a bubble can vary
let predicateFunction = filterNone; // predicateFunction will always need to be defined

// Text stuff
let timeNotes = {
  "start": "Click play to get started.",
  201150: "We start with just over 2000 full- and part-time first-time freshman. By the end of the first semester, over 8% have dropped out. That percentage doubles by the end of the first year. By this same time, around the same number of students have opted to take at least one semester off.",
  201250: "",
  201450: "Here we hit the fourth year of study for this cohort. By the end of this year, we'll have seen almost a third of this cohort drop out, and only about 6% of the students graduate. However, almost a third of students are still on track in their studies. Pause at the summer semester to really digest where this cohort stands.",
  201550: "",
  201650: "Here marks the start of the sixth year from when this group of students began. By the end of the academic year, the number of graduates will jump to four times as many as we had two years ago at the 4-year mark. Pause at the summer semester again to absorb the overall picture.",
  201750: "From here, during the seventh year, things start to slow down, as most students -- but not all -- have come to the end of their chosen path.",
  202050: "And here we are at year 10. The majority of students will have settled into their final classification by now, be it dropped out, transferred out, or graduated. Even still, a small handful of students continue on their educational journey at MSU Denver. Pause here for a final snapshot of this cohort.",
};

// Stage locations and properties
const stages = {
  "Starting Cohort": {
    x: width * 0.5,
    y: height * 0.15,
    color: "#843b97",
    count: 0,
    hovertext: "A 'Starting Cohort' is defined as a group of students in their first semester at MSU Denver.",
  },
  Freshman: {
    x: width * 0.8,
    y: height * 0.236,
    color: "#7DD9C1",
    count: 0,
    hovertext: "Freshman are defined as those students having earned fewer than 30 credit hours prior to the start of the term in question.",
  },
  Sophomore: {
    x: width * 0.89,
    y: height * 0.47,
    color: "#3AC6A0",
    count: 0,
    hovertext: "Sophomores are defined as those students having earned fewer than 60 credit hours prior to the start of the term in question.",
  },
  Junior: {
    x: width * 0.8,
    y: height * 0.71,
    color: "#35B794",
    count: 0,
    hovertext: "Juniors are defined as those students having earned fewer than 90 credit hours prior to the start of the term in question.",
  },
  Senior: {
    x: width * 0.5,
    y: height * 0.8,
    color: "#31A888",
    count: 0,
    hovertext: "Seniors are defined as those students having earned at least 90 credit hours prior to the start of the term in question.",
  },
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
    hovertext: "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may subsequently return to MSU Denver.",
  },
  "Dropped Out": {
    x: width * 0.2,
    y: height * 0.236,
    color: "#d53739",
    count: 0,
    hovertext: "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal.",
  },
  Sabbatical: {
    x: width * 0.5,
    y: height * 0.47,
    color: "#Eae61a",
    count: 0,
    hovertext: "'Sabbatical' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term.",
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

// Define the div for the hovertext
const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function initialDraws(studentNodes) {
  // A bubble for each student
  SVG.append("g")
    .selectAll("circle")
    .data(studentNodes)
    .join("circle")
    .attr("fill", (d) => stages[d.stage].color) // Starting stage/color established in initializeNodes()
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r);

  // Stage labels
  SVG.selectAll()
    .data(d3.keys(stages))
    .join("text")
    .attr("text-anchor", "middle")
    .attr("x", (d) => stages[d].x)
    .attr("y", (d) => stages[d].y + 100)
    .text((d) => d)
    .on("mouseover", (d) => {
      if (stages[d].hovertext) {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(stages[d].hovertext)
          .style("left", d3.event.pageX - 275 + "px")
          .style("top", d3.event.pageY - 28 + "px");
      }
    })
    .on("mouseout", () => {
      div.transition().duration(500).style("opacity", 0);
    });

  // Initializes the group counts and percentages label locations
  // but does not actually draw the Ns and %s (see updateLabels function)
  SVG
    .selectAll(".groupPercentages")
    .data(d3.keys(stages))
    .join("text")
    .attr("class", "groupPercentages")
    .attr("text-anchor", "middle")
    .attr("x", (d) => stages[d].x)
    .attr("y", (d) => stages[d].y + 125);

  // The 'click play to get started'

  // Year 1, etc...
}

// Creates a physics environment
function makePhysicsEnvironment(studentNodes) {
  let physics = d3
    .forceSimulation(studentNodes)
    .force("cluster", forceCluster())
    .force(
      "collide",
      d3.forceCollide((d) => bubblePadding * d.r)
    )
    .alpha(0.06)
    .alphaDecay(0);

  physics.on("tick", updateBubblePositions);
}

function simulationControllerFactory(simulationStepFunction) {
  // The global simulation controller; this is essentially the "circuitry" to which the pauseSimulation BUTTON is actually wired
  function simulationController() {
    if (pauseSimulation) {
      setTimeout(simulationController, 100); // Wait 100ms, then check again if the simulation is still paused
    } else {
      setTimeout(simulationStepFunction, 10); // Simulation was unpaused, wait 10ms and then go back to doSimulationStep
    }
  }

  return simulationController
}



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

// Updaters that run on every simulation step
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

function updateLabels(studentNodes, year) {
  SVG.selectAll(".groupPercentages")
    .text(
      (d) => {
        let n = stages[d].count;
        let pct = Math.round((n / studentNodes.length) * 1000) / 10
        return `n = ${n} (${pct}%)`
      }
    );

  d3.select("#yrcount .cnt").text(year);
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
    const received = yield [termCodes[i], Math.floor(i / 3) + 1];

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

// DEBUG print statements for student X
function debugStatements(studentNodes, studentX, term) {
  let { pid, x, y, stage, sex } = studentNodes[studentX];
  let counts = Object.keys(stages).map((k) => stages[k].count);
  let totals = counts.reduce((currentSum, nextElement) => currentSum + nextElement, 0);
  console.log(
    `term: ${term}\ncounts: ${counts}\ntotal: ${totals}\nstudent ${pid} (sex: ${sex}):\n  stage: ${stage}\n  x: ${x}\n  y: ${y}`
  );
}

// Return a random number in the range [x - c, x + c]
function plusMinus(x, c) {
  return Math.round(x + c * (2 * Math.random() - 1));
}

// Initializing starting position of a student node
function initializeNodes(stage, x, y, student) {
  return {
    ...student,
    x: x + Math.random(),
    y: y + Math.random(),
    r: plusMinus(bubbleRadius, bubbleRadiusVariance),
    stage: stage,
  };
}

// The actual code which, given a term code, updates each node's position and color
function updateNodes(studentNodes, term) {
  studentNodes.forEach(function updateSingleNode(node) {
    stages[node.stage].count -= 1;
    node.stage = node[term];
    stages[node.stage].count += 1;
  });
}

// Creating dynamic labels
function termLabelFromTermCode(termCode) {
  let [_, year, semesterCode] = termCode.match(re); // Array destructuring
  return `${semesterLabels[semesterCode]} ${year}`;
}

// Force to increment nodes to stages
function forceCluster() {
  const strength = 0.20;
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

function getStudentNodesAndTermCodes(studentData) {
  // Get term codes from dataset
  const termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));

  // Initialize student nodes
  let stage = "Starting Cohort";
  let x = stages[stage].x;
  let y = stages[stage].y;
  let studentNodes = studentData.map((student) => initializeNodes(stage, x, y, student)); //.slice(0, 1000);
  stages[stage].count = studentNodes.length;

  return Promise.resolve([studentNodes, termCodes]);
}
// END OF SETUP

// MAIN PROGRAM
function animateStudentData([studentNodes, termCodes]) {
  // Initial drawings
  initialDraws(studentNodes);

  // Give the labels their Ns and %s
  updateLabels(studentNodes, 1);

  // If studentNodes needs to change (i.e., switching datasets), you may need to reinitialize physics
  // which means that `const` should be replaced with `let`, and then when you make new physics,
  // you'll need to also update the `physics.on()`
  makePhysicsEnvironment(studentNodes);

  // Initializes a termCode generator, we're getting ready to actually start animating
  let termCodeGenerator = termCodeGeneratorFactory(termCodes);

  // DEBUG by following a single student
  let studentX = Math.floor(Math.random() * studentNodes.length);

  // THIS IS THE MAIN LOGIC FOR THE ANIMATION ITSELF; EVERYTHING ELSE IN THIS FILE IS A HELPER FUNCTION OR A VARIABLE
  // Everything that needs to happen for a single animation frame
  function doSimulationStep() {
    // Get the next term code from the generator
    // instead of this plain .next(), this is where you'd implement your bookmark and slider handle onChange listeners
    let [term, year] = termCodeGenerator.next().value;

    updateNodes(studentNodes, term);
    updateLabels(studentNodes, year);

    // Suppose the user wants to filter on sex == female
    // predicateFunction = filterSex("M")
    updateBubbleColors();

    if (DEBUG) {
      debugStatements(studentNodes, studentX, term);
    }
    setTimeout(simulationController, simulationRate);
  }

  // The simulation controller which is the global pause button listener
  let simulationController = simulationControllerFactory(doSimulationStep)

  // Finally ready to start the animation...
  // Launch the algorithm!
  setTimeout(simulationController, 10);
}
// END OF MAIN PROGRAM

// Load data, and then...
d3.csv("../data/201150_ftf.csv", d3.autoType).then(getStudentNodesAndTermCodes).then(animateStudentData);
