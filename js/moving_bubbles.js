// START OF SETUP

// Simulation-specific variables
let simulationRate = 1000;
let pauseSimulation = true;
let DEBUG = false;

// Regex for term codes to get term labels, and semester code -> semester label mapping
const re = new RegExp("(20\\d{2})(30|40|50)"); // matches years in this millennium (20xx) followed by 30, 40, or 50
const semesterLabels = { 50: "Fall", 30: "Spring", 40: "Summer" };

// Chart dimensions
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Bubble stuff
const bubbleRadius = 4; // Base radius of a bubble
const bubblePadding = 1.5; // Collision detection uses this number times the radius of each bubble
const bubbleRadiusVariance = 0.25 * bubbleRadius; // By how much the radius of a bubble can vary
let predicateFunction = filterNone; // predicateFunction will always need to be defined
let animStart = true;

// Text stuff
let timeNotes = {
  start: "Click play to get started.",
  201150:
    "We start with just over 2000 full- and part-time first-time freshman. By the end of the first semester, over 8% have dropped out. That percentage doubles by the end of the first year. By this same time, around the same number of students have opted to take at least one semester off.",
  201250: "",
  201450:
    "Here we hit the fourth year of study for this cohort. By the end of this year, we'll have seen almost a third of this cohort drop out, and only about 6% of the students graduate. However, almost a third of students are still on track in their studies. Pause at the summer semester to really digest where this cohort stands.",
  201550: "",
  201650:
    "Here marks the start of the sixth year from when this group of students began. By the end of the academic year, the number of graduates will jump to four times as many as we had two years ago at the 4-year mark. Pause at the summer semester again to absorb the overall picture.",
  201750:
    "From here, during the seventh year, things start to slow down, as most students -- but not all -- have come to the end of their chosen path.",
  202050:
    "And here we are at year 10. The majority of students will have settled into their final classification by now, be it dropped out, transferred out, or graduated. Even still, a small handful of students continue on their educational journey at MSU Denver. Pause here for a final snapshot of this cohort.",
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
    hovertext:
      "Freshman are defined as those students having earned fewer than 30 credit hours prior to the start of the term in question.",
  },
  Sophomore: {
    x: width * 0.89,
    y: height * 0.47,
    color: "#3AC6A0",
    count: 0,
    hovertext:
      "Sophomores are defined as those students having earned fewer than 60 credit hours prior to the start of the term in question.",
  },
  Junior: {
    x: width * 0.8,
    y: height * 0.71,
    color: "#35B794",
    count: 0,
    hovertext:
      "Juniors are defined as those students having earned fewer than 90 credit hours prior to the start of the term in question.",
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

// Buttons and sliders
const termSlider = document.getElementById('termSlider');

d3.select("button#toggleId").on("click", () => {
  pauseSimulation = !pauseSimulation;
});

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
        div.transition().duration(200).style("opacity", 0.9);
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
  SVG.selectAll(".groupPercentages")
    .data(d3.keys(stages))
    .join("text")
    .attr("class", "groupPercentages")
    .attr("text-anchor", "middle")
    .attr("x", (d) => stages[d].x)
    .attr("y", (d) => stages[d].y + 125);

  // The 'click play to get started' note

  // Any other items you want to draw as part of first time chart setup
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

// Changes the play button into a pause button and back again
function togglePlayPause() {
  let toggleElement = document.getElementById("toggleId");
  if (pauseSimulation) {
    toggleElement.innerHTML = "pause"
  } else {
    toggleElement.innerHTML = "play_arrow";
  }
}

// Updates the transition speed tooltip every time you click
function updateTransitionSpeedHoverText(increment) {
  simulationRate = Math.min(Math.max(500, simulationRate + increment), 10000)
  console.log(`Simulation speed: ${simulationRate}`)
  d3.select("#transition-speed1 .spd").text(simulationRate / 1000); // One hovertext for the "slower" button
  d3.select("#transition-speed2 .spd").text(simulationRate / 1000); // One hovertext for the "faster" button
}

// Various filter criteria here
// Each function should take a student node as argument,
// and return a boolean whether they match the criteria or not
function filterMale(student) {
  return student.sex === "M"
}

function filterFemale(student) {
  return student.sex === "F"
}

// This is the only "filter" function which does not return a function
// Underscore signifies that the argument (a student node) is unused
// Returns false because no student matches this criteria
function filterNone(_) {
  return false;
}

// This'll go back up at the top with the other constants
const filters = {
  "male": filterMale,
  "female": filterFemale,
  // etc.
}

// Return a function which takes an arbitrary number of predicate
// functions and evaluates the boolean AND across all of them
// Note: fails fast (returns false at first failed criteria; don't bother checking rest)
// E.g.: predicateFactory(filterMale, filterWhite) returns the function
// (student) => filterMale(student) && filterWhite(student)
function predicateFactory(...criteria) {
  function predicate(student) {
    for (const pred of criteria) {
      if (!pred(student)) {
        return false;
      }
    }
    return true;
  }

  return predicate
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
    .attr("fill", (d) => (predicate(d) ? "#354162" : stages[d.stage].color));  // If the predicate is true, fade the bubble out
}

// Updates the stage Ns and %s as well as the year label
// Any other labels that should be updated on every step of the animation
// should go here as well
function updateLabels(studentNodes, year) {
  SVG.selectAll(".groupPercentages").text((d) => {
    let n = stages[d].count;
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
    stages[node.stage].count -= 1;
    node.stage = node[term];
    stages[node.stage].count += 1;
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
  noUiSlider.create(termSlider, {
    start: [0, 0, termCodes.length - 1],
    // snap: true,
    connect: [false, true, true, false],
    step: 1,
    range: {
      'min': 0,
      'max': termCodes.length - 1
    },
    tooltips: {
      from: function (value) {
        return termLabelFromTermCode(termCodes[Math.round(value)]);
      },
      to: function (value) {
        return termLabelFromTermCode(termCodes[Math.round(value)]);
      }
    },
    pips: {
      mode: 'steps',
      filter: filterPipsClosure(termCodes),
      format: {
        to: (value) => `Year ${Math.floor(value / 3) + 1}`,
        from: (value) => `Year ${Math.floor(value / 3) + 1}`
      }
    }
  });

  d3.select('button#reset')
    .on('click', () => {
      termSlider.noUiSlider.reset();
      animStart = true;
    })
};

function filterPipsClosure(termCodes) {
  function filterPips(value, _) {
    let years4And6 = [termCodes[11] ?? false, termCodes[17] ?? false]
    return years4And6.includes(termCodes[value]) ? 2 : -1
  }
  return filterPips
}

function incrementSlider() {
  let [min, i, max] = termSlider.noUiSlider.get(true).map(Math.round);
  let next = Math.max(min, (i + 1) % (max + 1));
  console.log(`i: ${i}, min: ${min}, max: ${max}, next: ${next}`);

  termSlider.noUiSlider.setHandle(1, next);
}

function getSliderValue() {
  return Math.round(termSlider.noUiSlider.get(true)[1]);
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
    if (pauseSimulation) {
      setTimeout(controller, 100, animStart);
    } else {
      // Filter criteria listener goes here

      // Dataset switcher listener goes here
      // if dataset changes, call setTimeout(animateStudentData, 10, fileName)

      // If the animStart global flag is false, increment the slider
      // animStart will be true when an animation is first started
      // AND whenever the reset button is clicked
      if (!animStart) {
        incrementSlider();
      }

      let [term, year] = getTermAndYear(termCodes)
      console.log(term)

      updateNodes(studentNodes, term);
      updateLabels(studentNodes, year);

      // Suppose the user wants to filter on sex == female
      // predicateFunction = filterSex("M")
      updateBubbleColors();

      if (DEBUG) {
        debugStatements(studentNodes, studentX, term);
      }

      // Finally, move the slider
      animStart = false;
      setTimeout(controller, simulationRate);
    }
  }

  return controller;
}

// Load data, generate term codes, and initialize student nodes
async function loadStudentData(fileName) {
  // Wait for D3 to resolve the promise
  let studentData = await d3.csv(`../data/${fileName}`, d3.autoType);

  // Get term codes from dataset
  const termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));

  // Initialize student nodes
  let stage = "Starting Cohort";
  let x = stages[stage].x;
  let y = stages[stage].y;
  let studentNodes = studentData.map((student) => initializeNodes(stage, x, y, student)); //.slice(0, 1000);
  stages[stage].count = studentNodes.length;

  return [studentNodes, termCodes];
}
// END OF SETUP

// MAIN PROGRAM
// Set up animation and then launch the algorithm!
async function animateStudentData(fileName) {
  // Load data and initialize nodes with their starting locations
  let [studentNodes, termCodes] = await loadStudentData(fileName);

  // Clear the chart
  SVG.selectAll("*").remove();

  // Load in slider
  createSlider(termCodes);

  // Draw chart elements first time
  initialDraws(studentNodes);

  // Give the labels their Ns and %s
  updateLabels(studentNodes, 1);

  // Tells d3 to create a physics engine in which the physics will apply to studentNodes
  makePhysicsEnvironment(studentNodes);

  // DEBUG by following a single student
  let studentX = Math.floor(Math.random() * studentNodes.length);

  // Finally ready to start the animation...
  // Launch the algorithm!
  let controller = animatorControllerFactory(studentNodes, termCodes, studentX);

  controller();
}
// END OF MAIN PROGRAM

// Finally, actually call the main program with whatever dataset you want to start with (just the filename)
animateStudentData("201150_ftf.csv");
