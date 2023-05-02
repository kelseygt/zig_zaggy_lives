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

    let collegeMajor = document.getElementById("select-college-of-major").value
    if (collegeMajor !== "All") {
        if (student.college_recoded != collegeMajor) {
            return false
        }
    }

    let deptMajor = document.getElementById("select-department-of-major").value
    if (deptMajor !== "All") {
        if (student.dept_recoded != deptMajor) {
            return false
        }
    }

    let collegeEndingMajor = document.getElementById("select-college-of-ending-major").value
    if (collegeEndingMajor !== "All") {
        if (student.ending_college_recoded != collegeEndingMajor) {
            return false
        }
    }

    let deptEndingMajor = document.getElementById("select-department-of-ending-major").value
    if (deptEndingMajor !== "All") {
        if (student.ending_dept_recoded != deptEndingMajor) {
            return false
        }
    }

    let pellElig = document.getElementById("select-pell-eligibility").value
    if (pellElig !== "All") {
        if (student.pell_term != pellElig) {
            return false
        }
    }

    let termGpa = document.getElementById("select-term-gpa").value
    if (termGpa !== "All") {
        if (student.gpa_bucketed != termGpa) {
            return false
        }
    }

    let efc = document.getElementById("select-efc").value
    if (efc !== "All") {
        if (student.efc_bucketed != efc) {
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
    document.getElementById("select-department-of-major").selectedIndex = 0;
    document.getElementById("select-pell-eligibility").selectedIndex = 0;
    document.getElementById("select-efc").selectedIndex = 0;
    document.getElementById("select-term-gpa").selectedIndex = 0;
    document.getElementById("select-college-of-ending-major").selectedIndex = 0;
    document.getElementById("select-department-of-ending-major").selectedIndex = 0;
    resetAnimation();
}


function togglePlayPauseForReset() {
    globalThis.pauseSimulation = true;
    let toggleElement = document.getElementById("toggleId");
    toggleElement.innerHTML = "play_arrow";
}