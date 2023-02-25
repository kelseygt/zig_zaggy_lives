// Filter functions used in the sidebar

function studentDataFilter(student) {

    let timeStatus = document.getElementById("select-time-status").value
    if (timeStatus !== "All") {
        if (student.time_status != timeStatus) {
            return false
        }
    }

    let sex = document.getElementById("select-sex").value
    if (sex !== "All") {
        if (student.sex != sex) {
            return false
        }
    }

    let raceEthnicity = document.getElementById("select-race-ethnicity").value
    if (raceEthnicity !== "All") {
        if (student.race_ethnicity != raceEthnicity) {
            return false
        }
    }

    let firstGenStatus = document.getElementById("select-first-gen-status").value
    if (firstGenStatus !== "All") {
        if (student.first_gen_status != firstGenStatus) {
            return false
        }
    }

    // Need to eventually update the R script to deal with the college issue here
    // In the meantime, this filter always needs to occur last
    let collegeMajor = document.getElementById("select-college-of-major").value
    if (collegeMajor !== "All") {
        if (collegeMajor == "College Health Applied Science"
            && student.college_of_major == "College Professional Studies") {
            return true
        }
        else if (student.college_of_major != collegeMajor) {
            return false
        }
    }

    return true
}

function resetDropdowns() {
    document.getElementById("select-cohort").selectedIndex = 0;
    document.getElementById("select-student-type").selectedIndex = 0;
    document.getElementById("select-time-status").selectedIndex = 0;
    document.getElementById("select-sex").selectedIndex = 0;
    document.getElementById("select-race-ethnicity").selectedIndex = 0;
    document.getElementById("select-first-gen-status").selectedIndex = 0;
    document.getElementById("select-college-of-major").selectedIndex = 0;
    resetAnimation();
}


function togglePlayPauseForReset() {
    globalThis.pauseSimulation = true;
    let toggleElement = document.getElementById("toggleId");
    toggleElement.innerHTML = "play_arrow";
}