// START OF SETUP

// Simulation-specific variables
// Global flags for controller to listen to
simulationRate = 8000;
animStart = true;
pauseSimulation = true;
dataSetSwitched = true;
debug = false;

d3.select("#transition-speed1 .spd").text(simulationRate / 1000);
d3.select("#transition-speed2 .spd").text(simulationRate / 1000);

// Regex for term codes to get term labels, and semester code -> semester label mapping
const re = new RegExp("(20\\d{2})(30|40|50)"); // matches years in this millennium (20xx) followed by 30, 40, or 50
const semesterLabels = { 50: "Fall", 30: "Spring", 40: "Summer" };

// Chart dimensions
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Bubble stuff
const bubbleRadius = 4; // Base radius of a bubble
const bubblePadding = 1.4; // Collision detection uses this number times the radius of each bubble
const bubbleRadiusVariance = 0.25 * bubbleRadius; // By how much the radius of a bubble can vary

// Stage locations and properties
stages = {
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
    hovertext:
      "Freshman are defined as those students having earned fewer than 30 credit hours prior to the start of the term in question.",
  },
  Sophomore: {
    x: width * 0.89,
    y: height * 0.47,
    color: "#3AC6A0",
    count: 0,
    hovertext:
      "Sophomores are defined as those students having earned between 30 and 59.99 credit hours prior to the start of the term in question.",
  },
  Junior: {
    x: width * 0.8,
    y: height * 0.71,
    color: "#35B794",
    count: 0,
    hovertext:
      "Juniors are defined as those students having earned between 60 and 89.99 credit hours prior to the start of the term in question.",
  },
  Senior: {
    x: width * 0.5,
    y: height * 0.8,
    color: "#31A888",
    count: 0,
    hovertext:
      "Seniors are defined as those students having earned at least 90 credit hours prior to the start of the term in question.",
  },
  Graduated: {
    x: width * 0.2,
    y: height * 0.71,
    color: "#34C3D5",
    count: 0,
    hovertext: "'Graduated' is here defined as bachelor's degree recipients.",
  },
  "Transferred Out": {
    x: width * 0.11,
    y: height * 0.47,
    color: "#f8882a",
    count: 0,
    hovertext:
      "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may also subsequently return to MSU Denver.",
  },
  "Dropped Out": {
    x: width * 0.2,
    y: height * 0.236,
    color: "#d53739",
    count: 0,
    hovertext:
      "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal.",
  },
  Hiatus: {
    x: width * 0.5,
    y: height * 0.47,
    color: "#Eae61a",
    count: 0,
    hovertext:
      "'Hiatus' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term.",
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

// let physics = d3
//   .forceSimulation([])
//   .force("cluster", forceCluster())
//   .force("collide", d3.forceCollide((d) => bubblePadding * d.r))
//   .alpha(0.06)
//   .alphaDecay(0)
//   .on("tick", updateBubblePositions);

let physics = d3
  .forceSimulation([])
  .alphaTarget(0.005)
  .velocityDecay(0.04)
  .alphaDecay(0.3)
  .force("cluster", forceCluster())
  // .force('charge', d3.forceManyBody().strength(-4))
  // .force("x", d3.forceX().strength(0.01))
  // .force("y", d3.forceY().strength(0.01))
  .force("collide", d3.forceCollide().radius(d => bubblePadding * d.r).strength(0.25))
  .on("tick", updateBubblePositions);

// Buttons and sliders
let termSlider = document.getElementById('termSlider');

// // Plays and pauses the animation, and also fades out starting instructional text on first click
// d3.select("button#toggleId")
//   .on("click", () => {
//     d3.select("#starting-note")
//       .transition()
//       .duration(500)
//       .style("opacity", 0)
//       .text(timeNotes['start'])
//   });

d3.select('button#slower') // Transition speed slower
  .on('click', function () {
    updateTransitionSpeedHoverText(500)
  })

d3.select('button#faster') // Transition speed faster
  .on('click', function () {
    updateTransitionSpeedHoverText(-500)
  })

// Define the div for the hovertext
const div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

// Draw chart elements for the first time
function initialDraws(studentNodes, cohortType, cohortName) {
  // A bubble for each student
  SVG.append("g")
    .selectAll("circle")
    .data(studentNodes)
    .join("circle")
    .attr("fill", (d) => globalThis.stages[d.stage].color) // Starting stage/color established in initializeNodes()
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r);

  // Stage labels
  SVG.selectAll()
    .data(d3.keys(globalThis.stages))
    .join("text")
    .attr("text-anchor", "middle")
    .attr("x", (d) => globalThis.stages[d].x)
    .attr("y", (d) => globalThis.stages[d].y + 100)
    .text((d) => d)
    .on("mouseover", (d) => {
      if (globalThis.stages[d].hovertext) {
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html(globalThis.stages[d].hovertext)
          .style("left", d3.event.pageX - 275 + "px")
          .style("top", d3.event.pageY - 28 + "px");
      }
    })
    .on("mouseout", () => {
      div.transition().duration(500).style("opacity", 0);
    });

  // Initializes the group counts and percentages label locations
  // but does not actually draw the Ns and %s (see updateLabels function)
  SVG.selectAll(".groupPercentages")
    .data(d3.keys(globalThis.stages))
    .join("text")
    .attr("class", "groupPercentages")
    .attr("text-anchor", "middle")
    .attr("x", (d) => globalThis.stages[d].x)
    .attr("y", (d) => globalThis.stages[d].y + 125);

  // Fade in the number of students for this cohort
  d3.select("#num-students")
    .style("opacity", 0)
    .transition()
    .duration(1000)
    .style("opacity", 1)
    .text(studentNodes.length.toLocaleString());

  // Fade in the cohort type
  d3.select("#cohort-type")
    .style("opacity", 0)
    .transition()
    .duration(2000)
    .style("opacity", 1)
    // .style("color", "#ffffff")
    .text(cohortType.options[cohortType.selectedIndex].text);

  d3.select("#cohort-year")
    // .style("opacity", 0)
    // .transition()
    // .duration(1000)
    .style("opacity", 1)
    // .style("color", "#FF9B54")
    .text(cohortName);

  // Fade in the super sexy author
  d3.select("#author")
  // .style("opacity", 0)
  // .transition()
  // .duration(1500)
  // .style("opacity", 1)
  // .style("color", "#ffffff");

  // Any other items you want to draw as part of first time chart setup
}

// Creates a physics environment
function makePhysicsEnvironment(studentNodes) {
  physics.nodes([])
  physics.nodes(studentNodes)
}

// Changes the play button into a pause button and back again
function togglePlayPause() {
  globalThis.pauseSimulation = !globalThis.pauseSimulation;
  let toggleElement = document.getElementById("toggleId");
  if (globalThis.pauseSimulation) {
    toggleElement.innerHTML = "play_arrow";
  } else {
    toggleElement.innerHTML = "pause"
  }
}

// Updates the transition speed tooltip every time you click
function updateTransitionSpeedHoverText(increment) {
  globalThis.simulationRate = Math.min(Math.max(2000, globalThis.simulationRate + increment), 15000)
  console.log(`Simulation speed: ${globalThis.simulationRate}`)
  d3.select("#transition-speed1 .spd").text(globalThis.simulationRate / 1000); // One hovertext for the "slower" button
  d3.select("#transition-speed2 .spd").text(globalThis.simulationRate / 1000); // One hovertext for the "faster" button
}

// Updaters that run on every simulation step
// Tell bubbles where to go next
function updateBubblePositions() {
  d3.selectAll("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);
}

// Call this function to filter out bubbles based on the predicate passed in
function updateBubbleColors() {
  d3.selectAll("circle")
    .transition()
    .duration(globalThis.simulationRate * 0.25) // How quickly the color transitions
    .attr("fill", (d) => globalThis.stages[d.stage].color);  // If the predicate is true, fade the bubble out
}

// Updates the stage Ns and %s as well as the year label
// Any other labels that should be updated on every step of the animation
// should go here as well


function updateLabels(studentNodes, year) {
  SVG.selectAll(".groupPercentages").text((d) => {
    let n = globalThis.stages[d].count;
    let pct = Math.round((n / studentNodes.length) * 1000) / 10;
    return `n = ${n} (${pct}%)`;
  });

  d3.select("#yrcount .cnt").text(year);
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
    globalThis.stages[node.stage].count -= 1;
    node.stage = node[term];
    globalThis.stages[node.stage].count += 1;
  });
}

// Map a term code to a human-readable 'Semester Year' label
function termLabelFromTermCode(termCode) {
  let [_, year, semesterCode] = termCode.match(re); // Array destructuring
  return `${semesterLabels[semesterCode]} ${year}`
}

// Force to increment nodes to stages
function forceCluster() {
  const strength = 0.2;
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

// Slider functions
function createSlider(termCodes) {
  if (globalThis.globalThis.termSlider && globalThis.termSlider.noUiSlider) {
    globalThis.termSlider.noUiSlider.destroy();
  }

  let tooltipCallback = (value) => termLabelFromTermCode(termCodes[Math.round(value)]);
  let pipFormatCallback = (value) => `Year ${Math.floor(value / 3) + 1}`

  noUiSlider.create(globalThis.termSlider, {
    start: [0, 0, termCodes.length - 1],
    // snap: true,
    connect: [false, true, true, false],
    step: 1,
    range: {
      'min': 0,
      'max': termCodes.length - 1
    },
    tooltips: {
      from: tooltipCallback,
      to: tooltipCallback
    },
    pips: {
      mode: 'steps',
      filter: filterPipsClosure(termCodes),
      format: {
        to: pipFormatCallback,
        from: pipFormatCallback
      }
    }
  });

  globalThis.termSlider.noUiSlider.on("change", sliderHandleWasMoved)

  d3.select('button#reset')
    .on('click', () => {
      globalThis.termSlider.noUiSlider.reset();
      globalThis.animStart = true;
    })
};

function sliderHandleWasMoved(_, handle, _, _, _, _) {
  // console.log("a slider handle was moved!")
  if (handle === 1) {
    // console.log("the current term handle was moved!")
    globalThis.animStart = true;
    // Fade out the current timenote because it may not be 
    d3.select("#time-notes")
      .style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .style("color", "#ffffff")
  } else {
    // console.log("a bookmark handle was moved!")
  }
}

function filterPipsClosure(termCodes) {
  function filterPips(value, _) {
    let pointsInTime = [termCodes[2] ?? false, termCodes[11] ?? false, termCodes[17] ?? false, termCodes[29] ?? false]
    return pointsInTime.includes(termCodes[value]) ? 2 : -1
  }
  return filterPips
}

function incrementSlider() {
  let [min, i, max] = globalThis.termSlider.noUiSlider.get(true).map(Math.round);
  let next = Math.max(min, (i + 1) % (max + 1));
  console.log(`i: ${i}, min: ${min}, max: ${max}, next: ${next}`);
  globalThis.termSlider.noUiSlider.setHandle(1, next);
}

function getSliderValue() {
  return Math.round(globalThis.termSlider.noUiSlider.get(true)[1]);
}

function getTermAndYear(termCodes) {
  let i = getSliderValue()
  let term = termCodes[i]
  let year = Math.floor(i / 3) + 1
  return [term, year]
}



// Return a controller which encapsulates everything that  needs to happen for a single animation frame
function animatorControllerFactory(studentNodes, termCodes, studentX) {
  // THIS IS THE MAIN LOGIC FOR THE ANIMATION ITSELF;
  // EVERYTHING ELSE IN THIS FILE IS A HELPER FUNCTION, A VARIABLE, OR SETUP CODE
  function controller() {
    // Dataset switcher listener goes here
    if (globalThis.dataSetSwitched) {
      globalThis.dataSetSwitched = false;
      setTimeout(animateStudentData, 10);
    } else if (globalThis.pauseSimulation) {
      setTimeout(controller, 10);
    } else {

      // If the animStart global flag is false, increment the slider
      // animStart will be true when an animation is first started
      // AND whenever the reset button is clicked
      if (!globalThis.animStart) {
        incrementSlider();
      }

      let [term, year] = getTermAndYear(termCodes)
      console.log(term)

      updateNodes(studentNodes, term);
      updateLabels(studentNodes, year);

      updateBubbleColors();

      if (globalThis.debug) {
        debugStatements(studentNodes, studentX, term);
      }

      // Finally, move the slider
      globalThis.animStart = false;
      setTimeout(controller, globalThis.simulationRate);
    }
  }

  return controller;
}

// Load data, generate term codes, and initialize student nodes
async function loadStudentDataAndInitalizeNodes(fileName) {
  // Wait for D3 to resolve the promise
  let loadedData = await d3.csv(`../data/${fileName}`, d3.autoType);
  let studentData = structuredClone(loadedData.filter(studentDataFilter));

  // Get term codes from dataset
  const termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));

  // Initialize student nodes
  let stage = "Starting Cohort";
  let x = globalThis.stages[stage].x;
  let y = globalThis.stages[stage].y;
  let studentNodes = studentData.map((student) => initializeNodes(stage, x, y, student)); //.slice(0, 1000);

  globalThis.stages[stage].count = studentNodes.length;

  return [studentNodes, termCodes];
}

// END OF SETUP

// MAIN PROGRAM
// Set up animation and then launch the algorithm!
async function animateStudentData() {
  let cohortTermCode = document.getElementById("select-cohort");
  let cohortType = document.getElementById("select-student-type");

  let fileName = `${cohortTermCode.value}_${cohortType.value}.csv`
  // Load data and initialize nodes with their starting locations
  console.log(`Loading file ${fileName}`)
  let [studentNodes, termCodes] = await loadStudentDataAndInitalizeNodes(fileName);

  // Clear the chart
  SVG.selectAll("*").remove();

  // Load in slider
  createSlider(termCodes);

  // Draw chart elements first time
  initialDraws(studentNodes, cohortType, termLabelFromTermCode(termCodes[0]));

  // Give the labels their Ns and %s
  updateLabels(studentNodes, 1);

  // Tells d3 to create a physics engine in which the physics will apply to studentNodes
  makePhysicsEnvironment(studentNodes);

  // DEBUG by following a single student
  let studentX = Math.floor(Math.random() * studentNodes.length);

  // Finally ready to start the animation...
  // Launch the algorithm!
  globalThis.animStart = true;
  let controller = animatorControllerFactory(studentNodes, termCodes, studentX);

  console.log("Setup complete, activating controller")
  controller();
}

function resetAnimation() {
  globalThis.dataSetSwitched = true;
  resetStageCounts();
  togglePlayPause()
}

function resetStageCounts() {
  Object.keys(globalThis.stages).forEach((k) => globalThis.stages[k].count = 0);
}


// END OF MAIN PROGRAM

// Finally, actually call the main program with whatever dataset you want to start with (just the filename)
animateStudentData().then(() => { });
