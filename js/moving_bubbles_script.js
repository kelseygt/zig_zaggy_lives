// Dimensions of chart
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Initialize global constants
const radius = 3; // Size of the nodes
const padding = 3 * radius; // Space between nodes
const cluster_padding = 2 * padding; // Space between nodes in different stages
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

// Initialize global variables
let simulationRate = 5000;
let minTerm = 1;
let maxTerm = 30;
let slider = document.getElementById('slider');
noUiSlider.create(slider, {
  start: [minTerm, minTerm, maxTerm - 25],
  step: 1,
  tooltips: {
    from: function(value) {
            return termLabels[Math.round(value - 1)];
        },
    to: function(value) {
            return termLabels[Math.round(value - 1)];
        }
    },
  connect: [false, true, true, false],
  range: {
      'min': 1,
      'max': 30
  }
});

function getSliderValues() {
  let sliderValueArray = slider.noUiSlider.get(true)
  return {
    sliderWindowMin: Math.round(sliderValueArray[0]),
    sliderValue: Math.round(sliderValueArray[1]),
    sliderWindowMax: Math.round(sliderValueArray[2])
  }
}

let {sliderWindowMin, sliderValue, sliderWindowMax} = getSliderValues();
// let sliderValue = 1;
// let sliderWindowMin = slider.noUiSlider.get()[0];
// let sliderWindowMax = slider.noUiSlider.get()[2];
let previousSliderValue = sliderValue;
console.log(slider.noUiSlider.get(true));

// let slider = document.querySelector("input[type='range']");
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

// Play, pause, faster, and slower buttons
d3.select('button#toggleId')
  .on('click', function () {
    let self = d3.select(this)
    PAUSE = !PAUSE
    console.log(`Animation ${PAUSE ? 'paused' : 'playing'}`)
  })

d3.select('button#reset')
  .on('click', function () {
    // sliderValue = sliderWindowMin;
    // previousSliderValue = 0;
    slider.noUiSlider.reset();
  })

// Adjust the transition speed
d3.select('button#slower')
  .on('click', function () {
    updateTransitionSpeedHoverText(500)
  })

d3.select('button#faster')
  .on('click', function () {
    updateTransitionSpeedHoverText(-500)
  })


// Group coordinates and meta info

// Coordinates have been converted to dynamic coordinates (rather than hard-coded) based on the chart dimensions
// Temporary fix, as this still needs work, since this only stays valid if the dimension ratio of the chart stays the same
const groups = {
  "Starting Cohort": { x: width*0.5, y: height*.15, color: "#843b97", cnt: 0, fullname: "Starting Cohort" },
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

// Load in data
const stages = d3.tsv("data/201150_ftf_piv.tsv", d3.autoType);

// Once the data is loaded...
stages.then(function (data) {
  // Initialize local variables
  let people = {};
  // let currentTerm = sliderValue;
  let currentNote = timeNotes[sliderValue];
  let previousNote = timeNotes[sliderValue - 1];

  // Consolidate stages by pid
  // The data file is one row per stage change
  data.forEach((d) => {
    if (d3.keys(people).includes(d.pid + "")) {
      people[d.pid + ""].push(d);
    } else {
      people[d.pid + ""] = [d];
    }
  });

  numNodes = Object.keys(people).length

  // Create node data
  var nodes = d3.keys(people).map(function (d) {
    // Initialize count for each group
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

  // Circle for each student
  const circle = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", (d) => d.color);

  // Ease in the circles
  circle
    .transition()
    .delay((d, i) => i)
    .duration(800)
    .attrTween("r", (d) => {
      const i = d3.interpolate(0, d.r);
      return (t) => (d.r = i(t));
    });

  // Define the div for the hovertext
  const div = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Group name labels and hovertext with definitions (where applicable)
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

  // Group counts and percentages
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

  // Adjust position of circles
  simulation.on("tick", () => {
    circle
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", (d) => groups[d.group].color);
  });

  // Starting text instructing user to click play to start, and then fades out
  d3.select("#starting-note")
  .style("opacity", 1)
  .style("color", "#ffffff")
  .text("#starting-note .start").text(start);

  // Pause animation if the pause button is selected
  function simulateNodes() {
    if (PAUSE === true) {
      setTimeout(simulateNodes, 100);
    } else {
      setTimeout(playSimulation, 100);
    }
  }
  
  // Simulation function
  function playSimulation() {
    // Get current slider values
    ({sliderWindowMin, sliderValue, sliderWindowMax} = getSliderValues());
    
    console.log(`before node update:\nsliderValue: ${sliderValue}\nmin_slider_value: ${sliderWindowMin}\nmax_slider_value: ${sliderWindowMax}`);
    
    // Loop back to beginning if slider reaches the max
    if (sliderValue === sliderWindowMax) {
      sliderValue = sliderWindowMin;
      slider.noUiSlider.set([null, sliderWindowMin, null])
    }
    
    // nodes.forEach((o) => (o.istage = sliderValue));
    // If slider has changed or the animation has reset, set nodes' istage to the slider value
    // if ((sliderValue !== previousSliderValue) || (sliderValue === sliderWindowMin)) {
      // }
      
      // Update node positions.
      nodes.forEach(function (node) {
        node.timeleft = Math.max(node.timeleft - 1, 0);
        if (node.timeleft == 0) {
          // Decrease counter for previous group
          groups[node.group].cnt -= 1;
          
          // Update current node to new group
          // node.istage += 1;
          node.group = node.stages[sliderValue].grp;
          node.timeleft = node.stages[sliderValue].duration;
          
          // Increment counter for new group
        groups[node.group].cnt += 1;
      }
    });
    
    slider.noUiSlider.set([null, sliderValue + 1, null]);
    ({sliderWindowMin, sliderValue, sliderWindowMax} = getSliderValues());
    console.log(`after node update:\nsliderValue: ${sliderValue}\nmin_slider_value: ${sliderWindowMin}\nmax_slider_value: ${sliderWindowMax}`);
    // Finally, after all checks, update the previous slider value
    // previousSliderValue = sliderValue;
    
    // Update subtitles
    d3.select("#term .trm").text(`${termLabels[sliderValue]}`);
    d3.select("#timecount .cnt").text(sliderValue);
    d3.select("#yrcount .cnt").text(Math.floor(sliderValue / 3) + 1);
    
    // Adds commentary that fades in and out
    // The below ~50 lines of code are very hacky and very ugly (but functional), and need reworked somehow

    if (sliderValue < 9) {
      currentNote = timeNotes[0]
    } else if (sliderValue < 15) {
      currentNote = timeNotes[9]
    } else if (sliderValue < 19) {
      currentNote = timeNotes[15]
    } else if (sliderValue < 27) {
      currentNote = timeNotes[19]
    } else if (sliderValue >= 27) {
      currentNote = timeNotes[27]
    }

    if (sliderValue == 0) {
      previousNote = timeNotes[27]
    } else if (sliderValue <= 9) {
      previousNote = timeNotes[0]
    } else if (sliderValue <= 15) {
      previousNote = timeNotes[9]
    } else if (sliderValue <= 19) {
      previousNote = timeNotes[15]
    }else if (sliderValue <= 27) {
      previousNote = timeNotes[19]
    } else if (sliderValue > 27) {
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

    if (sliderValue == 3 || sliderValue == 12 || sliderValue == 18 || sliderValue == 23) {
      d3.select("#current-note")
      .style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .style("color", "#ffffff")
      .text("#current-note .note").text(`${currentNote}`);
    }

    // Fade out the starting instructions after the user starts the animation
    if (sliderValue < 0) {
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

    // Update count and percentages
    svg.selectAll(".grpcnt").text((d) => `n = ${groups[d].cnt} (${Math.round((groups[d].cnt / numNodes) * 1000) / 10}%)`);

    // And repeat
    setTimeout(simulateNodes, simulationRate);
  }

  // Start things off
  setTimeout(simulateNodes, simulationRate);
});

// Force to increment nodes to groups
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

// Changes the play button into a pause button and back again
function toggleMaker() {
  var toggleElement = document.getElementById("toggleId")
  if(toggleElement.innerHTML === "play_arrow") {
    toggleElement.innerHTML = "pause";
  }
  else {
    toggleElement.innerHTML = "play_arrow";
  }
}

// Updates the transition speed tooltip every time you click
function updateTransitionSpeedHoverText(increment) {
  simulationRate = Math.min(Math.max(500, simulationRate + increment), 10000)
  console.log(simulationRate)
  d3.select("#transition-speed1 .spd").text(simulationRate / 1000); // One hovertext for the "slower" button
  d3.select("#transition-speed2 .spd").text(simulationRate / 1000); // One hovertext for the "faster" button
}

// const range = document.getElementById('myRange');
// const rangeValue = document.getElementById('rangeValue');

// Slider functions
// function updateSliderHandleTooltipPosition() {
//   const newValue = Number( (range.value - range.min) * 100 / (range.max - range.min) );
//   const newPosition = 10 - (newValue * 0.2);
//   rangeValue.innerHTML = `<span>${termLabels[range.value - 1]}</span>`;
//   rangeValue.style.left = `calc(${newValue}% + (${newPosition}px))`;
// };

// function getSliderValue(run) {
//   previousSliderValue = sliderValue;
//   sliderValue = run.value;
// }

// function updateSliderPosition(value) {
//   slider.value = Math.min(Math.max(value, 1), maxTerm);
//   updateSliderHandleTooltipPosition();
// }

// document.addEventListener("DOMContentLoaded", updateSliderHandleTooltipPosition);
// range.addEventListener('input', updateSliderHandleTooltipPosition);


// let sliderWindowMin = document.getElementById("sliderWindowMin");
// let sliderCurrentValue = document.getElementById("sliderCurrentValue");
// let sliderWindowMax = document.getElementById("sliderWindowMax");

// slider.noUiSlider.on("update", function (values, handle) {
  
//   let slider_values = slider.noUiSlider.get();

//   const sliderWindowMinNewVal = Number( (parseInt(slider_values[0]) - minTerm) * 100 / (maxTerm - minTerm) );
//   const sliderWindowMinNewPos = 10 - (sliderWindowMinNewVal * 0.2);
//   sliderWindowMin.innerHTML = `<span>${termLabels[parseInt(slider_values[0])- 1]}</span>`;
//   sliderWindowMin.style.left = `calc(${sliderWindowMinNewVal}% + (${sliderWindowMinNewPos}px))`;

//   const sliderCurrentValueNewVal = Number( (parseInt(slider_values[1]) - minTerm) * 100 / (maxTerm - minTerm) );
//   const sliderCurrentValueNewPos = 10 - (sliderCurrentValueNewVal * 0.2);
//   sliderCurrentValue.innerHTML = `<span>${termLabels[parseInt(slider_values[1])- 1]}</span>`;
//   sliderCurrentValue.style.left = `calc(${sliderCurrentValueNewVal}% + (${sliderCurrentValueNewPos}px))`;

//   const sliderWindowMaxNewVal = Number( (parseInt(slider_values[2]) - minTerm) * 100 / (maxTerm - minTerm) );
//   const sliderWindowMaxNewPos = 10 - (sliderWindowMaxNewVal * 0.2);
//   sliderWindowMax.innerHTML = `<span>${termLabels[parseInt(slider_values[2])- 1]}</span>`;
//   sliderWindowMax.style.left = `calc(${sliderWindowMaxNewVal}% + (${sliderWindowMaxNewPos}px))`;

// });


          


// slider.noUiSlider.on('update', function (values, handle) {
//   currentTerm = slider.noUiSlider.get()[1] + 1;
// });