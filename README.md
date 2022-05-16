# zig_zaggy_lives

This project aims at creating an animation that visualizes the "zig-zaggy lives" of a starting cohort of students, and the trajectories they take over the course of ten years. Understanding that the "4-year degree" is slowly becoming a thing of the past is vital, as students need to work while in school, perhaps support a family, or take intermittent breaks as life throws pandemics and financial crises their way.

This project includes SQL code for pulling data, R code for data wrangling, and Javascript for the D3 animation. Data sets being fed into R include: students' total earned credit hours for each term they were enrolled, their maximum term of enrollment, their graduation term (if applicable), and their term of transfer-out to another institution (if applicable). 

Establishing whether a student graduates, takes a sabbatical, transfer out, or drops out uses the logic below. Beginning with a data frame of students and their total earned hours for each semester:

1. 'Graduated' logic (this one's easy):
    - ‘Graduated’ here is only bachelor’s degrees
    - Replace ALL term values with 'graduated' status and fill forward, regardless of future enrollment
2. 'Transferred Out' logic:
    - Replace term values with 'transferred', but only where the value is not equal to 'Graduated'
    - Fill forward transfer status, but only where term value is NA
3. 'Drop Out' logic:
    - Calc is based on a student's last enrolled semester (max term)
    - Drop-outs are considered someone who left the institution without graduating, and did not enroll elsewhere
    - This was the trickiest one, and the logic was done in Excel first, to remove students with a max term that meet the below criteria. Logic to be implemented in R forthcoming.
        - If the student has a 'graduated' status AFTER their last semester, their max term was removed (because they should not be considered a drop-out)	
        - If the student has a 'graduated' status BEFORE their last semester, that's already been overwritten by 'graduated' status
        - If the student has a 'graduated' status EQUIVALENT TO their last semester, that's already been overwritten by 'graduated' status
        - If the student has a 'transferred out' status AFTER their last semester, their max term was removed (because they should not be considered a drop-out, and their status between their max term and their transferred term will be sabbatical)
        - If the student has a 'transferred out' status BEFORE their last semester, their max term was kept (because they came back to MSU after enrolling elsewhere)
        - If the student has a 'transferred out' status EQUIVALENT TO their last semester, their max term was removed (because they should not be considered a drop-out)
4. 'Sabbatical' logic:
    - Sabbatical replaces the remaining NA values, with the exception of summer semesters
5. Then the remaining NAs are filled in with the previous value

Note: The current format of the data wrangling process is more laborious than it should be. The eventual goal is to refactor the Javascript to function row-wise (one row per student, with each "stage" being a column), rather than its current column-wise format (multiple rows per student, with a row for every "stage" a student experiences).