
// Dimensions of chart
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Initialize global constants
const radius = 3; // Size of the studentNodes
const padding = 3 * radius; // Space between studentNodes
const cluster_padding = 2 * padding; // Space between studentNodes in different stages

// Establishing groups
const groups = {
  "Starting Cohort": { x: width * 0.5, y: height * .15, color: "#843b97", count: 0 },
  "Freshman": { x: width * 0.8, y: height * 0.236, color: "#7DD9C1", count: 0 },
  "Sophomore": { x: width * 0.89, y: height * 0.47, color: "#3AC6A0", count: 0 },
  "Junior": { x: width * 0.8, y: height * 0.71, color: "#35B794", count: 0 },
  "Senior": { x: width * 0.5, y: height * 0.80, color: "#31A888", count: 0 },
  "Graduated": { x: width * 0.2, y: height * 0.71, color: "#34C3D5", count: 0, hovertext: "'Graduated' here is defined as bachelor's degree recipients." },
  "Transferred Out": { x: width * 0.11, y: height * 0.47, color: "#f8882a", count: 0, hovertext: "'Transferred Out' is here defined as when we have established evidence of a student enrolling at an external institution. This category is not terminal; students may have evidence of transferring out, but may subsequently return to MSU Denver." },
  "Dropped Out": { x: width * 0.2, y: height * 0.236, color: "#d53739", count: 0, hovertext: "'Dropped Out' is here defined as a student who has no subsequent enrollment at MSU Denver to date, and no enrollment at any external institution. This category is terminal." },
  "Sabbatical": { x: width * 0.5, y: height * 0.47, color: "#Eae61a", count: 0, hovertext: "'Sabbatical' is defined here as when a student takes one or more semesters off between enrolled semesters, excluding the summer term." },
};

// Creating chart SVG
const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select("#chart").style("width", width + margin.left + margin.right + "px");

// Load in data
const rawData = d3.csv("../data/ftf_data_files_final/201150_ftf.csv", d3.autoType);

// Initialize global variables
const re = new RegExp("(20\\d{2})(30|40|50)");  // matches years in this millenium (20xx) followed by 30, 40, or 50
const semesterLabels = { "30": "Fall", "40": "Spring", "50": "Summer" };

// Once the promise has been fulfilled:
rawData.then(function loadData(studentData) {
  //Initialize local variables
  termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));
  termLabels = termCodes.map(getTermLabel);

  // Create node data
  let studentNodes = studentData.map(initializeNode)
   
  // Bubble for each student
  const circle = svg
  .append("g")
  .selectAll("circle")
  .data(studentNodes)
  .join("circle")
  .attr("cx", (d) => d.x)
  .attr("cy", (d) => d.y)
  .attr("fill", () => groups["Starting Cohort"].color);

  // Ease in the circles
  circle
  .transition()
  .delay((d, i) => i)
  .duration(800)
  .attrTween("r", (d) => {
    const i = d3.interpolate(0, d.r);
    return (t) => (d.r = i(t));
  });
  
  // Forces
  const simulation = d3
  .forceSimulation(studentNodes)
  .force("x", (d) => d3.forceX(d.x))
  .force("y", (d) => d3.forceY(d.y))
  .force("cluster", forceCluster())
  .force("collide", forceCollide())
  .alpha(0.09)
  .alphaDecay(0);
  
  // Adjust position of circles
  simulation.on("tick", () => {
    circle
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", (d) => groups["Starting Cohort"].color);
  });
});

// Functions

// Initializing starting positions of nodes
function initializeNode(student) {
  return {
    ...student,
    x: groups["Starting Cohort"].x + Math.random(),
    y: groups["Starting Cohort"].y + Math.random(),
    r: radius * (1 + Math.random()),
    group: "Starting Cohort",
  }
}

// Creating dynamic labels
function getTermLabel(termCode) {
  let [_, year, semCode] = termCode.match(re);  // Array destructuring
  return `${semesterLabels[semCode]} ${year}`;
}

// Force to increment studentNodes to groups
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

// Force for collision detection
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
