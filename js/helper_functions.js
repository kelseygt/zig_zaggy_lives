// function changeDataSource() {
//     // togglePlayPause();
//     pauseSimulation = true
//     document.getElementById("toggleId").innerHTML = "play_arrow"
//     d3.select("#time-notes")
//         .style("opacity", 1)
//         .transition()
//         .duration(500)
//         .style("opacity", 0)
//         .style("color", "#ffffff");
//     dataChanged = true;
// }

function studentDataFilter(student) {

    let sex = document.getElementById("select-sex").value
    if (sex !== "All") {
        if (student.sex != sex) {
            return false
        }
    }

    let timeStatus = document.getElementById("select-time-status").value
    if (timeStatus !== "All") {
        if (student.time_status != timeStatus) {
            return false
        }
    }
    return true
}
