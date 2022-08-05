
const rawData = d3.csv("../data/ftf_data_files_final/201150_ftf.csv", d3.autoType);

const re = new RegExp("(20\\d{2})(30|40|50)");
const semesterLabels = { "30": "Fall", "40": "Spring", "50": "Summer" };

// TODO: add groups

rawData.then(function loadData(dataFileContents) {
  myData = dataFileContents;
  termCodes = Object.keys(myData[0]).filter((k) => re.test(k));
  termLabels = termCodes.map(getTermLabel);
  let students = {};

  // Checking ma shit
  console.log(myData);
  console.log(termCodes);
  console.log(termLabels)


});

function getTermLabel(termCode) {
  let [_, year, semCode] = termCode.match(re);
  return `${semesterLabels[semCode]} ${year}`;
}
