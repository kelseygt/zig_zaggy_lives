# zig_zaggy_lives

This project aims to create an animation that visualizes the "zig-zaggy lives" of a starting cohort of students, and the trajectories they take over the course of ten years. For a large portion of the American population, the idea of the "4-year degree" is outdated and becoming a thing of the past, as students need to work while in school, perhaps support a family, or take intermittent breaks amidst pandemics and financial crises.

This project includes SQL code for pulling data, R code for data wrangling, and Javascript/CSS/HTML for the final animation. Data sets being fed into R include: students' total earned credit hours for each term they were enrolled, their maximum term of enrollment, their graduation term (if applicable), and their term of transfer-out to another institution (if applicable). 

For now, only the finalized data sets being fed into the D3 animation have been provided. The other data sets will be added once they've been scrubbed of identifying information.

To see the logic used in establishing whether a student graduates, takes a sabbatical, transfer out, or drops out, see the 'data_wrangling_logic' doc file. 

Many thanks to Nathan Yau with [Flowing Data](https://flowingdata.com/2015/12/15/a-day-in-the-life-of-americans/) for animation inspiration, and a huge shout-out to [Devon DeJohn](https://github.com/ddejohn) for coding assistance. This project has been a huge undertaking for a novice JS user, and his expertise was invaluable.