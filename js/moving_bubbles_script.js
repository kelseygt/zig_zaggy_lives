// Dimensions of chart.
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Initialize global constants.
const radius = 3; // Size of the nodes
const padding = 3 * radius; // Space between nodes
const cluster_padding = 2 * padding; // Space between nodes in different stages

// Initialize global variables.
let simulationRate = 5000; // in milliseconds
let sliderValue = 1;
let previousSliderValue = sliderValue;
let slider = document.querySelector("input[type='range']");
let PAUSE = true;
let numNodes;
let start = "Click 'Play' to get started."
let timeNotes = {
  0: "We start with just over 2000 full- and part-time first-time freshman. By the end of the first semester, over 8% have dropped out. That percentage doubles by the end of the first year. By this same time, around the same number of students have opted to take at least one semester off.",
  9: "Here we hit the fourth year of study for this cohort. By the end of this year, we'll have seen almost a third of this cohort drop out, and only about 6% of the students graduate. However, almost a third of students are still on track in their studies. Pause at the summer semester to really digest where this cohort stands.",
 15: "Here marks the start of the sixth year from when this group of students began. By the end of the academic year, the number of graduates will jump to four times as many as we had two years ago at the 4-year mark. Pause at the summer semester again to absorb the overall picture.",
 19: "From here, during the seventh year, things start to slow down, as most students -- but not all -- have come to the end of their chosen path.",
 27: "And here we are at year 10. The majority of students will have settled into their final classification by now, be it dropped out, transferred out, or graduated. Even still, a small handful of students continue on their educational journey at MSU Denver. Pause here for a final snapshot of this cohort."
}

// Buttons.
d3.select('button#toggleId')
  .on('click', function () {
    let self = d3.select(this)
    PAUSE = !PAUSE
    console.log(`Animation ${PAUSE ? 'paused' : 'playing'}`)
    // self.text(PAUSE ? 'Play' : 'Pause')
  })
  // .text(PAUSE ? 'Play' : 'Pause')

d3.select('button#reset')
  .on('click', function () {
    sliderValue = 1;
    previousSliderValue = 0;
  })

// Adjust play rate if needed.
d3.select('button#slower')
  .on('click', function () {
    simulationRate += 500
    console.log(simulationRate)
  })
d3.select('button#faster')
  .on('click', function () {
    simulationRate = Math.max(500, (simulationRate - 500));
    console.log(simulationRate);
  })

const termLabels = [
  "Fall 2011",
  "Spring 2012",
  "Summer 2012",
  "Fall 2012",
  "Spring 2013",
  "Summer 2013",
  "Fall 2013",
  "Spring 2014",
  "Summer 2014",
  "Fall 2014",
  "Spring 2015",
  "Summer 2015",
  "Fall 2015",
  "Spring 2016",
  "Summer 2016",
  "Fall 2016",
  "Spring 2017",
  "Summer 2017",
  "Fall 2017",
  "Spring 2018",
  "Summer 2018",
  "Fall 2018",
  "Spring 2019",
  "Summer 2019",
  "Fall 2019",
  "Spring 2020",
  "Summer 2020",
  "Fall 2020",
  "Spring 2021",
  "Summer 2021",
];

// Group coordinates and meta info.

// Coordinates have been converted to dynamic coordinates (rather than hard-coded) based on the chart dimensions. 
// Temporary fix, as this still needs work, since this only stays valid if the dimension ratio of the chart stays the same.
const groups = {
  "Starting Cohort": { x: width*0.5, y: height*.15, color: "#843b97", cnt: 0, fullname: "Starting Cohort" }, // was x: 120 for a circle, doesn't fit well though
  "Sabbatical": { x: width*0.5, y: height*0.47, color: "#Eae61a", cnt: 0, fullname: "Sabbatical", hovertext: "'Sabbatical' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term." },
  "Freshman": { x: width*0.8, y: height*0.236, color: "#7DD9C1", cnt: 0, fullname: "Freshman" },
  "Sophomore": { x: width*0.89, y: height*0.47, color: "#3AC6A0", cnt: 0, fullname: "Sophomore" },
  "Junior": { x: width*0.8, y: height*0.71, color: "#35B794", cnt: 0, fullname: "Junior" },
  "Senior": { x: width*0.5, y: height*0.80, color: "#31A888", cnt: 0, fullname: "Senior" },
  "Graduated": { x: width*0.2, y: height*0.71, color: "#34C3D5", cnt: 0, fullname: "Graduated", hovertext: "'Graduated' here is defined as bachelor's degree recipients." },
  "Transferred Out": { x: width*0.11, y: height*0.47, color: "#f8882a", cnt: 0, fullname: "Transferred Out", hovertext: "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may subsequently return to MSU Denver." },
  "Dropped Out": { x: width*0.2, y: height*0.236, color: "#d53739", cnt: 0, fullname: "Dropped Out", hovertext: "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal." },
};

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select("#chart").style("width", width + margin.left + margin.right + "px");

// Load data.
const stages = d3.tsv("data/201150_ftf_piv.tsv", d3.autoType);

// Once data is loaded...
stages.then(function (data) {
  // Initialize local variables.
  let people = {};
  let currentTerm = -1;
  let currentNote = timeNotes[currentTerm];
  let previousNote = timeNotes[currentTerm - 1];

  // Consolidate stages by pid.
  // The data file is one row per stage change.
  data.forEach((d) => {
    if (d3.keys(people).includes(d.pid + "")) {
      people[d.pid + ""].push(d);
    } else {
      people[d.pid + ""] = [d];
    }
  });

  numNodes = Object.keys(people).length

  // Create node data.
  var nodes = d3.keys(people).map(function (d) {
    // Initialize count for each group.
    groups[people[d][0].grp].cnt += 1;

    return {
      id: "node" + d,
      x: groups[people[d][0].grp].x + Math.random(),
      y: groups[people[d][0].grp].y + Math.random(),
      r: radius * (1 + Math.random()),
      color: groups[people[d][0].grp].color,
      group: people[d][0].grp,
      timeleft: people[d][0].duration,
      istage: 0,
      stages: people[d],
    };
  });

  // Circle for each node.
  const circle = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", (d) => d.color);

  // Ease in the circles.
  circle
    .transition()
    .delay((d, i) => i)
    .duration(800)
    .attrTween("r", (d) => {
      const i = d3.interpolate(0, d.r);
      return (t) => (d.r = i(t));
    });

  // Define the div for the tooltip
  const div = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Group name labels
  svg
    .selectAll(".grp")
    .data(d3.keys(groups))
    .join("text")
    .attr("class", "grp")
    .attr("text-anchor", "middle")
    .attr("x", (d) => groups[d].x)
    .attr("y", (d) => groups[d].y + 100)
    .text((d) => groups[d].fullname)
    .on('mouseover', d => {
      if (groups[d].hovertext) {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(groups[d].hovertext)
          .style('left', (d3.event.pageX - 275) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      }
    })
    .on('mouseout', () => {
      div
        .transition()
        .duration(500)
        .style('opacity', 0);
    });

  // Group counts
  svg
    .selectAll(".grpcnt")
    .data(d3.keys(groups))
    .join("text")
    .attr("class", "grpcnt")
    .attr("text-anchor", "middle")
    .attr("x", (d) => groups[d].x)
    .attr("y", (d) => groups[d].y + 125)
    .text((d) => `n = ${groups[d].cnt} (${Math.round((groups[d].cnt / numNodes) * 1000) / 10}%)`);

  // Forces
  const simulation = d3
    .forceSimulation(nodes)
    .force("x", (d) => d3.forceX(d.x))
    .force("y", (d) => d3.forceY(d.y))
    .force("cluster", forceCluster())
    .force("collide", forceCollide())
    .alpha(0.09)
    .alphaDecay(0);

  // Adjust position of circles.
  simulation.on("tick", () => {
    circle
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", (d) => groups[d.group].color);
  });

  d3.select("#starting-note")
  .style("opacity", 1)
  .style("color", "#ffffff")
  .text("#starting-note .start").text(start);

  function simulateNodes() {
    if (PAUSE === true) {
      setTimeout(simulateNodes, 100);
    } else {
      setTimeout(playSimulation, 100);
    }
  }

  // Make time pass. Adjust node stage as necessary.
  function playSimulation() {
    // Increment time.
    currentTerm += 1;

    // Loop back to beginning.
    if (currentTerm == 30) {
      sliderValue = 1;
      previousSliderValue = 0;
    }

    // If slider has changed, set nodes' istage to the slider value.
    if (sliderValue !== previousSliderValue) {
      console.log(`sliderValue: ${sliderValue}\nprevious: ${previousSliderValue}`);
      nodes.forEach((o) => (o.istage = Math.max(sliderValue - 1, 0)));
      previousSliderValue = sliderValue;
      currentTerm = sliderValue - 1;
    }

    // Update slider position based on loop.
    updateSliderPosition(currentTerm + 1);

    // Update node positions.
    nodes.forEach(function (node) {
      node.timeleft = Math.max(node.timeleft - 1, 0);
      if (node.timeleft == 0) {
        // Decrease counter for previous group.
        groups[node.group].cnt -= 1;

        // Update current node to new group.
        node.istage += 1;
        node.group = node.stages[node.istage].grp;
        node.timeleft = node.stages[node.istage].duration;

        // Increment counter for new group.
        groups[node.group].cnt += 1;
      }
    });

    // Update subtitles.
    d3.select("#term .trm").text(`${termLabels[currentTerm]}`);
    d3.select("#timecount .cnt").text(currentTerm);
    d3.select("#yrcount .cnt").text(Math.floor(currentTerm / 3) + 1);
    d3.select("#transition-speed .spd").text(simulationRate / 1000);
    
    // The below ~50 lines of code are very hacky and very ugly (but functional), and need reworked somehow.
    // currentNote = timeNotes[currentTerm] ?? currentNote
    // previousNote = timeNotes[currentTerm - 1] ?? previousNote

    if (currentTerm < 9) {
      currentNote = timeNotes[0]
    } else if (currentTerm < 15) {
      currentNote = timeNotes[9]
    } else if (currentTerm < 19) {
      currentNote = timeNotes[15]
    } else if (currentTerm < 27) {
      currentNote = timeNotes[19]
    } else if (currentTerm >= 27) {
      currentNote = timeNotes[27]
    }

    if (currentTerm == 0) {
      previousNote = timeNotes[27]
    } else if (currentTerm <= 9) {
      previousNote = timeNotes[0]
    } else if (currentTerm <= 15) {
      previousNote = timeNotes[9]
    } else if (currentTerm <= 19) {
      previousNote = timeNotes[15]
    }else if (currentTerm <= 27) {
      previousNote = timeNotes[19]
    } else if (currentTerm > 27) {
      previousNote = timeNotes[27]
    }

    if (currentNote != previousNote) {
      d3.select("#current-note")
      .style("opacity", 0)
      .transition()
      .duration(1500)
      .style("opacity", 1)
      .style("color", "#ffffff")
      .text("#current-note .note").text(`${currentNote}`);
    }

    if (currentTerm == 3 || currentTerm == 12 || currentTerm == 18 || currentTerm == 23) {
      d3.select("#current-note")
      .style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .style("color", "#ffffff")
      .text("#current-note .note").text(`${currentNote}`);
    }

    // Fade out the starting instructions after the user starts the animation.
    if (currentTerm < 0) {
      d3.select("#starting-note")
      .style("opacity", 1)
      .style("color", "#ffffff")
      .text("#starting-note .start").text(start);
    } else {
      d3.select("#starting-note")
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .style("color", "#ffffff")
      .text("#starting-note .start").text(start);
    }

    // Update counters.
    svg.selectAll(".grpcnt").text((d) => `n = ${groups[d].cnt} (${Math.round((groups[d].cnt / numNodes) * 1000) / 10}%)`);

    // Do it again.
    setTimeout(simulateNodes, simulationRate);
  }

  // Start things off after a few seconds.
  setTimeout(simulateNodes, simulationRate);
});

// Force to increment nodes to groups.
function forceCluster() {
  const strength = 0.3;
  let nodes;

  function force(alpha) {
    const l = alpha * strength;
    for (const d of nodes) {
      d.vx -= (d.x - groups[d.group].x) * l;
      d.vy -= (d.y - groups[d.group].y) * l;
    }
  }
  force.initialize = (_) => (nodes = _);

  return force;
}

// Force for collision detection.
function forceCollide() {
  const alpha = 0.15; // fixed for greater rigidity!
  let nodes;
  let maxRadius;

  function force() {
    const quadtree = d3.quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y
    );
    for (const d of nodes) {
      const r = d.r + maxRadius;
      const nx1 = d.x - r;
      const ny1 = d.y - r;
      const nx2 = d.x + r;
      const ny2 = d.y + r;
      quadtree.visit((q, x1, y1, x2, y2) => {
        if (!q.length)
          do {
            if (q.data !== d) {
              const r = d.r + q.data.r + (d.group === q.data.group ? padding : cluster_padding);
              let x = d.x - q.data.x;
              let y = d.y - q.data.y;
              let l = Math.hypot(x, y);
              if (l < r) {
                l = ((l - r) / l) * alpha;
                (d.x -= x *= l), (d.y -= y *= l);
                (q.data.x += x), (q.data.y += y);
              }
            }
          } while ((q = q.next));
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  }

  force.initialize = (_) => (maxRadius = d3.max((nodes = _), (d) => d.r) + Math.max(padding, cluster_padding));

  return force;
}

// Slider functions.
function getSliderValue(run) {
  previousSliderValue = sliderValue;
  sliderValue = run.value;
}

function updateSliderPosition(value) {
  slider.value = Math.min(Math.max(value, 1), 30);
}

function toggleMaker() {
  var toggleElement = document.getElementById("toggleId")
  if(toggleElement.innerHTML === "play_arrow") {
    toggleElement.innerHTML = "pause";
  }
  else {
    toggleElement.innerHTML = "play_arrow";
  }
}