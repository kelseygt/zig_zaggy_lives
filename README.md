# zig_zaggy_lives

This project aims to create an animation that visualizes the "zig-zaggy lives" of a starting cohort of students, and the trajectories they take over the course of ten years. For a large portion of the American population, the idea of the "4-year degree" is outdated and becoming a thing of the past, as students need to work while in school, perhaps support a family, or take intermittent breaks amidst pandemics and financial crises.

This project includes SQL code for pulling data, R code for data wrangling, and Javascript for the D3 animation. Data sets being fed into R include: students' total earned credit hours for each term they were enrolled, their maximum term of enrollment, their graduation term (if applicable), and their term of transfer-out to another institution (if applicable). 

For now, only the finalized data set being fed into the D3 animation has been provided. The other data sets will be added once they've been scrubbed of identifying information.

To see the logic used in establishing whether a student graduates, takes a sabbatical, transfer out, or drops out, see the 'data_wrangling_logic' doc file. 

Note: The current format of the data wrangling process is more laborious than it should be. The eventual goal is to refactor the Javascript to function row-wise (one row per student, with each "stage" being a column), rather than its current column-wise format (multiple rows per student, with a row for every "stage" a student experiences).

Many thanks to Nathan Yau with [Flowing Data](https://flowingdata.com/2015/12/15/a-day-in-the-life-of-americans/) for layout and D3 coding inspiration. As a novice javascript user creating their first animation, his tutorials were invaluable.