
// Dimensions of chart
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 1200 - margin.left - margin.right;
const height = 1100 - margin.top - margin.bottom;

// Initialize global constants
const radius = 3; // Size of the nodes
const padding = 3 * radius; // Space between nodes
const cluster_padding = 2 * padding; // Space between nodes in different stages

// Establishing groups
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
const initialData = {
  x: groups["Starting Cohort"].x,
  y: groups["Starting Cohort"].y
}

// Load in data
const rawData = d3.csv("../data/ftf_data_files_final/201150_ftf.csv", d3.autoType);

// Initialize global variables
const re = new RegExp("(20\\d{2})(30|40|50)");  // matches years in this millenium (20xx) followed by 30, 40, or 50
const semesterLabels = { "30": "Fall", "40": "Spring", "50": "Summer" };

// Once the promise has been fulfilled:
rawData.then(function loadData(dataFileContents) {
  //Initialize local variables
  let studentNodes = studentData.map((student) => ({
    ...initialData, r: radius * (1 + Math.random()), ...student
  }))

  studentData = dataFileContents;
  termCodes = Object.keys(studentData[0]).filter((k) => re.test(k));
  termLabels = termCodes.map(getTermLabel);
  
  // Create node data
  studentData.forEach()



// });


// Functions

function getTermLabel(termCode) {
  let [_, year, semCode] = termCode.match(re);  // Array destructuring
  return `${semesterLabels[semCode]} ${year}`;
}
