
# A quick chi-square goodness of fit test to determine the statistical significance between
# the expected distribution of a cohort of students against the observed distribution, using
# a metric of interest and a specified point in time (e.g. racial proportions of the cohort
# vs. racial proportions of the population who dropped out a year later).

library(dplyr)
cohorts <- read.csv(file = "E:/Portfolio/zig_zaggy_lives/tableau_files/all_cohorts_compiled.csv", header = T, check.names = F)
enr_data <- read.csv(file = "E:/Portfolio/zig_zaggy_lives/data/base_working_files/ftf_and_trans_201150_thru_202150.csv", header = T, check.names = F)
joined <- left_join(cohorts, enr_data, by = c("pid" = "PIDM"))

# customize this section
cohort <- "201150"
pit <- "202140"
styp <- "First-Time Freshman"
metric <- "RACE_ETHNICITY"
population <- "Dropped Out"
# end

# building the function
chi_sq_test <- function(cohort, styp, metric, pit, population) {
  expected_prop <- joined %>%
    subset(start == cohort & student_type == styp) %>%
    select_if(~ !any(is.na(.))) %>%
    group_by(across(all_of(metric))) %>%
    summarise(n = n()) %>%
    mutate(n2 = NA)
  
  observed_prop <- joined %>%
    subset(start == cohort & student_type == styp) %>%
    select_if(~ !any(is.na(.)))
  observed_prop <- observed_prop[observed_prop[[pit]] == population,]
  
  for (race in expected_prop[[metric]]) {
    n <- observed_prop %>%
      subset(get(metric) == race) %>%
      nrow()
    expected_prop[expected_prop[[metric]] == race, ][3] <- n
  }
  
  chisq.test(x = expected_prop$n2, p = expected_prop$n/sum(expected_prop$n))
}
#end

chi_sq_test(cohort, styp, metric, pit, population)
