// Slider area functions

// Updates the transition speed tooltip every time you click
function updateTransitionSpeedHoverText(increment) {
    globalThis.simulationRate = Math.min(Math.max(2000, globalThis.simulationRate + increment), 15000)
    console.log(`Simulation speed: ${globalThis.simulationRate}`)
    d3.select("#transition-speed1 .spd").text(globalThis.simulationRate / 1000); // One hovertext for the "slower" button
    d3.select("#transition-speed2 .spd").text(globalThis.simulationRate / 1000); // One hovertext for the "faster" button
}

// Slider functions
function createSlider(termCodes) {
    if (globalThis.globalThis.termSlider && globalThis.termSlider.noUiSlider) {
        globalThis.termSlider.noUiSlider.destroy();
    }

    let tooltipCallback = (value) => termLabelFromTermCode(termCodes[Math.round(value)]);
    let pipFormatCallback = (value) => `Year ${Math.floor(value / 3) + 1}`

    noUiSlider.create(globalThis.termSlider, {
        start: [0, 0, termCodes.length - 1],
        // snap: true,
        connect: [false, true, true, false],
        step: 1,
        range: {
            'min': 0,
            'max': termCodes.length - 1
        },
        tooltips: {
            from: tooltipCallback,
            to: tooltipCallback
        },
        pips: {
            mode: 'steps',
            filter: filterPipsClosure(termCodes),
            format: {
                to: pipFormatCallback,
                from: pipFormatCallback
            }
        }
    });

    globalThis.termSlider.noUiSlider.on("change", sliderHandleWasMoved)

    d3.select('button#reset')
        .on('click', () => {
            globalThis.termSlider.noUiSlider.reset();
            globalThis.animStart = true;
        })
};

function sliderHandleWasMoved(_, handle, _, _, _, _) {
    if (handle === 1) {
        globalThis.animStart = true;
    }
}

function filterPipsClosure(termCodes) {
    function filterPips(value, _) {
        let pointsInTime = [termCodes[2] ?? false, termCodes[11] ?? false, termCodes[17] ?? false, termCodes[29] ?? false]
        return pointsInTime.includes(termCodes[value]) ? 2 : -1
    }
    return filterPips
}

function incrementSlider() {
    let [min, i, max] = globalThis.termSlider.noUiSlider.get(true).map(Math.round);
    let next = Math.max(min, (i + 1) % (max + 1));
    console.log(`i: ${i}, min: ${min}, max: ${max}, next: ${next}`);
    globalThis.termSlider.noUiSlider.setHandle(1, next);
}

function getSliderValue() {
    return Math.round(globalThis.termSlider.noUiSlider.get(true)[1]);
}

function getTermAndYear(termCodes) {
    let i = getSliderValue()
    let term = termCodes[i]
    let year = Math.floor(i / 3) + 1
    return [term, year]
}