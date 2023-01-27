
# this script creates a data frame containing the start and finish of every student's
# transfer, if they had one (one row per student per transfer). the input is the "compiled"
# list of cohorts, which contains staggered amounts of data. takes probably 10 minutes
# to run.

# load packages
library(dplyr)

# load in data set
all_cohorts <- read.csv(file.choose(), header = T, check.names = F) %>%
  select(-c(transfer_out_point_in_time)) # all cohorts
test_data <- all_cohorts[1:20, ] # mini data set for testing

# creates empty data frame for all transfers (one row per student per transfer)
all_transfers <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
  `colnames<-`(c('pidm', 'cohort', 'transfer_start', 'transfer_end', 'num_sem', 'ending_status'))

# loops through every student
for (student_id in all_cohorts$pid) {
  
  i = 1
  # filters overall data set to an individual student
  # because the data is staggered, depending on the cohort, any columns with NAs
  # are removed.
  trajectory <- all_cohorts[all_cohorts$pid == student_id, ] %>%
    select_if(~ !any(is.na(.)))
  # creates empty data frame for each student to store all their transfers
  student_transfers <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
    `colnames<-`(c('pidm', 'cohort', 'transfer_start', 'transfer_end', 'num_sem', 'ending_status'))
  
  # loops through stages to find transfers
  while (i <= ncol(trajectory)) {
    
    if (trajectory[, i] == "Transferred Out") {
      
      # creates empty data frame for an individual transfer (should only ever be one row)
      transfer <- data.frame(matrix(ncol = 6, nrow = 0)) %>%
        `colnames<-`(c('pidm', 'cohort', 'transfer_start', 'transfer_end', 'num_sem', 'ending_status'))
      # also creates empty vector for the transfer semesters, in order to calculate transfer length
      transfer_length <- c()
      transfer[1, 1] <- student_id
      transfer[1, 2] <- trajectory$start
      transfer[1, 3] <- colnames(trajectory[i]) # starting semester of transfer
      j = i
      
      # finds the end of an individual transfer
      while (j <= ncol(trajectory)) {
        
        if (trajectory[1, j] == "Transferred Out" & j < ncol(trajectory)) {
          transfer_length <- c(transfer_length, colnames(trajectory[j]))
          j = j + 1
        } else if (trajectory[1, j] == "Transferred Out" & j == ncol(trajectory)) {
          transfer[1, 4] <- "Ongoing" # for those with an ongoing transfer
          transfer[1, 6] <- "Transferred Out" # ending status of student
          transfer_length <- c(transfer_length, colnames(trajectory[j]))
          j = j + 1
          break
        } else {
          transfer[1, 4] <- colnames(trajectory[j - 1]) # ending semester of transfer
          transfer[1, 5] <- ifelse(length(transfer_length[substr(transfer_length, 5, 6) != '40']) == 0, 1,
                                   length(transfer_length[substr(transfer_length, 5, 6) != '40'])) # transfer length, excluding summers
          transfer[1, 6] <- trajectory[, ncol(trajectory)] # ending status of student
          break
        }
      }
      
      # appends on an individual transfer to an individual student's set of transfers
      student_transfers <- rbind(student_transfers, transfer)
      i = j
      
    } else {
      # if a specific term isn't a transfer, increment to the next term
      i = i + 1
    }
  }
  
  # finally, append on a data frame all of an individual's transfers to the master
  # data frame of transfers
  if (nrow(student_transfers) > 0) {
    all_transfers <- rbind(all_transfers, student_transfers)
  }
  
}

# adds bucket for when a student's transfer occurs
all_transfers$transfer_pit <- case_when(
  all_transfers$transfer_start <= all_transfers$cohort + 90 ~ "Within first year",
  all_transfers$transfer_start <= all_transfers$cohort + 190 ~ "Within second year",
  all_transfers$transfer_start <= all_transfers$cohort + 290 ~ "Within third year",
  all_transfers$transfer_start <= all_transfers$cohort + 390 ~ "Within fourth year",
  all_transfers$transfer_start > all_transfers$cohort + 390 ~ "During fifth year or beyond"
)

setwd("C:/Users/Laserbeams/Desktop/")
write.csv(all_transfers, "transfer_investigation.csv", row.names = F)
