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
let PAUSE = false;
let numNodes;

// Buttons.
d3.select('button#play-pause')
  .on('click', function () {
    let self = d3.select(this)
    PAUSE = !PAUSE
    console.log(`Animation ${PAUSE ? 'paused' : 'playing'}`)
    self.text(PAUSE ? 'Play' : 'Pause')
  })
  .text(PAUSE ? 'Play' : 'Pause')

// Adjust play rate if needed.
d3.select('button#slow')
  .on('click', function () {
    simulationRate += 500
    console.log(simulationRate)
  })
  .text('Slower')

d3.select('button#fast')
  .on('click', function () {
    simulationRate = Math.max(500, (simulationRate - 500));
    console.log(simulationRate);
  })
  .text('Faster')

d3.select('button#reset')
  .on('click', function () {
    sliderValue = 1;
    previousSliderValue = 0;
  })
  .text('Reset')

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
const groups = {
  "Starting Cohort": { x: 580, y: 150, color: "#843b97", cnt: 0, fullname: "Starting Cohort" }, // was x: 120 for a circle, doesn't fit well though
  "Sabbatical": { x: 580, y: 450, color: "#Eae61a", cnt: 0, fullname: "Sabbatical", hovertext: "'Sabbatical' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term." },
  "Freshman": { x: 930, y: 200, color: "#7bb890", cnt: 0, fullname: "Freshman" },
  "Sophomore": { x: 1030, y: 450, color: "#68ad80", cnt: 0, fullname: "Sophomore" },
  "Junior": { x: 930, y: 700, color: "#55a370", cnt: 0, fullname: "Junior" },
  "Senior": { x: 580, y: 800, color: "#429960", cnt: 0, fullname: "Senior" },
  "Graduated": { x: 230, y: 700, color: "#26a9bb", cnt: 0, fullname: "Graduated", hovertext: "'Graduated' here is defined as bachelor's degree recipients." },
  "Transferred Out": { x: 130, y: 450, color: "#f8882a", cnt: 0, fullname: "Transferred Out", hovertext: "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may subsequently return to MSU Denver." },
  "Dropped Out": { x: 230, y: 200, color: "#d53739", cnt: 0, fullname: "Dropped Out", hovertext: "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal." },
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
const stages = d3.tsv("data/ftf.tsv", d3.autoType);

// Once data is loaded...
stages.then(function (data) {
  // Initialize local variables.
  let people = {};
  let currentTerm = -1;

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

  // // Group percent
  // svg
  //   .selectAll(".grpper")
  //   .data(d3.keys(groups))
  //   .join("text")
  //   .attr("class", "grpper")
  //   .attr("text-anchor", "middle")
  //   .attr("x", (d) => groups[d].x)
  //   .attr("y", (d) => groups[d].y + 150)
  //   .text((d) => `${Math.round((groups[d].cnt / numNodes) * 1000) / 10}%`);

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

    // Update counters.
    svg.selectAll(".grpcnt").text((d) => `n = ${groups[d].cnt} (${Math.round((groups[d].cnt / numNodes) * 1000) / 10}%)`);
    // svg.selectAll(".grpper").text((d) => `${Math.round((groups[d].cnt / d3.keys(people).length) * 100 * 10) / 10}%`);

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

function getSliderValue(run) {
  previousSliderValue = sliderValue;
  sliderValue = run.value;
}

function updateSliderPosition(value) {
  slider.value = Math.min(Math.max(value, 1), 30);
}

