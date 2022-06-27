
library(dplyr)
library(readr)

setwd("C:/Users/Laserbeams/Desktop/working_files/ftf_data_files/") #

cohort <- function(df) {
  df$start <- rep(colnames(df[3]), nrow(df))
  return(df)
}

df_list <- list.files(full.names = TRUE, pattern = "f.csv$") #
dfs <- lapply(df_list, read.csv, check.names = F)
dfs_updated <- lapply(dfs, cohort)
df_final <- do.call("bind_rows", dfs_updated)

write.csv(df_final, paste("all_ftf_cohorts.csv"), row.names = F) #
