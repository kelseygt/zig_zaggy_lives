
# combines the cohort files into one data set for tableau purposes

library(dplyr)
library(readr)

# setwd("C:/Users/Laserbeams/Desktop/redo/data_files")

cohort <- function(df) {
  df$start <- rep("Starting Cohort", nrow(df))
  return(df)
}

df_list <- list.files(full.names = TRUE, pattern = ".csv$")
dfs <- lapply(df_list, read.csv, check.names = F)
dfs_updated <- lapply(dfs, cohort)
df_final <- do.call("bind_rows", dfs_updated)
write.csv(df_final, paste("all_cohorts_combined.csv"), row.names = F)
