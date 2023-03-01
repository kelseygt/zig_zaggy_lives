
# this script creates a data frame containing the start and finish of every student's
# hiatus, if they had one (one row per student per hiatus). the input is the "compiled"
# list of cohorts, which contains staggered amounts of data. takes probably 10 minutes
# to run.

# load packages
library(dplyr)

# load in data set
all_cohorts <- read.csv(file.choose(), header = T, check.names = F) %>%
  select(-c(transfer_out_point_in_time)) # all cohorts
test_data <- all_cohorts[1:20, ] # mini data set for testing

# creates empty data frame for all hiatuses (one row per student per hiatus)
all_hiatuses <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
  `colnames<-`(c('pidm', 'cohort', 'hiatus_start', 'hiatus_end', 'num_sem', 'ending_status'))

# loops through every student
for (student_id in all_cohorts$pid) {
  
  i = 1
  # filters overall data set to an individual student
  # because the data is staggered, depending on the cohort, any columns with NAs are removed.
  trajectory <- all_cohorts[all_cohorts$pid == student_id, ] %>%
    select_if(~ !any(is.na(.)))
  # creates empty data frame for each student to store all their hiatus
  student_hiatuses <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
    `colnames<-`(c('pidm', 'cohort', 'hiatus_start', 'hiatus_end', 'num_sem', 'ending_status'))
  
  # loops through stages to find hiatuses
  while (i <= ncol(trajectory)) {

    if (trajectory[, i] == "Sabbatical") {
      
      # creates empty data frame for an individual hiatus (should only ever be one row)
      hiatus <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
        `colnames<-`(c('pidm', 'cohort', 'hiatus_start', 'hiatus_end', 'num_sem', 'ending_status'))
      # also creates empty vector for the hiatus semesters, in order to calculate hiatus length
      hiatus_length <- c()
      hiatus[1, 1] <- student_id
      hiatus[1, 2] <- trajectory$start
      hiatus[1, 3] <- colnames(trajectory[i]) # starting semester of hiatus
      j = i
      
      # finds the end of an individual hiatus
      while (j <= ncol(trajectory)) {
        
        if (trajectory[1, j] == "Sabbatical" & j < ncol(trajectory)) {
          hiatus_length <- c(hiatus_length, colnames(trajectory[j]))
          j = j + 1
        } else if (trajectory[1, j] == "Sabbatical" & j == ncol(trajectory)) {
          hiatus[1, 4] <- "Ongoing" # for those with an ongoing hiatus
          hiatus[1, 6] <- "Hiatus" # ending status of student
          hiatus_length <- c(hiatus_length, colnames(trajectory[j]))
          j = j + 1
          break
        } else {
          hiatus[1, 4] <- colnames(trajectory[j - 1]) # ending semester of hiatus
          hiatus[1, 5] <- length(hiatus_length[substr(hiatus_length, 5, 6) != '40']) # hiatus length, excluding summers
          hiatus[1, 6] <- trajectory[, ncol(trajectory)] # ending status of student
          break
        }
      }
      
      # appends on an individual hiatus to an individual student's set of hiatuses
      student_hiatuses <- rbind(student_hiatuses, hiatus)
      i = j
      
    } else {
      # if a specific term isn't a hiatus, increment to the next term
      i = i + 1
    }
  }
  
  # finally, append on a data frame all of an individual's hiatuses to the master
  # data frame of hiatuses
  if (nrow(student_hiatuses) > 0) {
    all_hiatuses <- rbind(all_hiatuses, student_hiatuses)
  }
  
}

# adds bucket for when a student's hiatus occurs
all_hiatuses$hiatus_pit <- case_when(
  all_hiatuses$hiatus_start <= all_hiatuses$cohort + 90 ~ "Within first year",
  all_hiatuses$hiatus_start <= all_hiatuses$cohort + 190 ~ "Within second year",
  all_hiatuses$hiatus_start <= all_hiatuses$cohort + 290 ~ "Within third year",
  all_hiatuses$hiatus_start <= all_hiatuses$cohort + 390 ~ "Within fourth year",
  all_hiatuses$hiatus_start > all_hiatuses$cohort + 390 ~ "During fifth year or beyond"
)

setwd("C:/Users/Laserbeams/Desktop/")
write.csv(all_hiatuses, "hiatus_investigation.csv", row.names = F)
