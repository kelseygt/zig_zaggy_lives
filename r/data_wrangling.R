
# zig-zaggy lives

# loading in packages
library(dplyr)
library(tidyr)
library(readxl)
library(zoo)
library(tibble)
library(rstudioapi)

# loading in data (all but the credit hour files -- see first function in next section)
setwd("C:/Users/Laserbeams/Desktop/redo")
cohort_data <- read.csv("ftf_and_trans_201150_thru_202150.csv", header = T, check.names = F)
grad_data <- as.data.frame(read_excel("graduate_data.xlsx", sheet = "for_import"))
trans_data <- as.data.frame(read_excel("transfer_outs.xlsx", sheet = "for_import"))
max_term_data <- as.data.frame(read_excel("max_term.xlsx", sheet = "for_import_1"))
drop_data <- as.data.frame(read_excel("max_term.xlsx", sheet = "for_import_2"))

# building data trimming functions (order matters here)
read_cred_hr_data <- function(cohort) {
  credit_hrs <- read.csv(paste0("cohort_credit_hour_files/", cohort, "_cohort.csv"), header = T, check.names = F)
  return(credit_hrs)
}
trim_cohort_data <- function(cohort_data, student_type, cohort) {
  cohort_trimmed <- 
    if (student_type == 'ftf') {
      cohort_data %>%
        filter(TERM_CODE == cohort 
               & (STYP_CODE == 'G' | STYP_CODE == 'H' | STYP_CODE == 'Q' | STYP_CODE == 'L')
               & LEVL_CODE == 'UG'
               & MAJR_CODE != '0')
    } else {
      cohort_data %>%
        filter(TERM_CODE == cohort 
               & (STYP_CODE == 'T' | STYP_CODE == '2')
               & LEVL_CODE == 'UG'
               & MAJR_CODE != '0')
    } %>% arrange(PIDM)
  colnames(cohort_trimmed)[which(names(cohort_trimmed) == "TERM_CODE")] <- "COHORT" # changing column name
  return(cohort_trimmed)
}
trim_grad_data <- function(grad_data, student_type, cohort, credit_hrs) {
  grads_trimmed <- 
    if (student_type == 'ftf') {
      grad_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'G' | STYP_CODE == 'H' | STYP_CODE == 'Q' | STYP_CODE == 'L'))
    } else {
      grad_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'T' | STYP_CODE == '2'))
    } %>% arrange(PIDM)
  grads_trimmed <- grads_trimmed[, match(colnames(credit_hrs), names(grads_trimmed))] # limiting column names to those found in credit_hrs
  return(grads_trimmed)
}
trim_trans_data <- function(trans_data, student_type, cohort, credit_hrs) {
  trans_trimmed <- 
    if (student_type == 'ftf') {
      trans_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'G' | STYP_CODE == 'H' | STYP_CODE == 'Q' | STYP_CODE == 'L'))
    } else {
      trans_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'T' | STYP_CODE == '2'))
    } %>% arrange(PIDM)
  trans_trimmed <- trans_trimmed[, match(colnames(credit_hrs), names(trans_trimmed))]
  return(trans_trimmed)
}
trim_max_term_data <- function(max_term_data, student_type, cohort, credit_hrs, final_cohort) {
  max_trimmed <- 
    if (student_type == 'ftf') {
      max_term_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'G' | STYP_CODE == 'H' | STYP_CODE == 'Q' | STYP_CODE == 'L'))
    } else {
      max_term_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'T' | STYP_CODE == '2'))
    }
  max_trimmed <- 
    max_trimmed[, match(colnames(credit_hrs), names(max_trimmed))] %>%
    arrange(PIDM) %>%
    semi_join(final_cohort, by = 'PIDM') # removing small number of rows (if any) from max_term_data that are NOT in final_cohort
  return(max_trimmed)
}
trim_drop_data <- function(drop_data, student_type, cohort, credit_hrs) {
  drop_trimmed <- 
    if (student_type == 'ftf') {
      drop_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'G' | STYP_CODE == 'H' | STYP_CODE == 'Q' | STYP_CODE == 'L'))
    } else {
      drop_data %>%
        filter(COHORT == cohort & (STYP_CODE == 'T' | STYP_CODE == '2'))
    } %>% arrange(PIDM)
  drop_trimmed <- drop_trimmed[, match(colnames(credit_hrs), names(drop_trimmed))]
  return(drop_trimmed)
}

# building main function
zig_zag <- function(cohort_data, grad_data, trans_data, max_term_data, drop_data) {
  
  # trimming data sets to apply to the cohort in question
  cohort <- showPrompt(title = "Cohort Selection", message = "Which cohort are you interested in?")
  student_type <- showPrompt(title = "Student Type Selection", message = "First-time freshman (ftf) or transfer students (trans)?")
  credit_hrs <- read_cred_hr_data(cohort)
  cohort_trimmed <- trim_cohort_data(cohort_data, student_type, cohort)
  final_cohort <- credit_hrs[(credit_hrs$PIDM %in% cohort_trimmed$PIDM),] %>% arrange(PIDM)
  grads_trimmed <- trim_grad_data(grad_data, student_type, cohort, credit_hrs)
  trans_trimmed <- trim_trans_data(trans_data, student_type, cohort, credit_hrs)
  max_trimmed <- trim_max_term_data(max_term_data, student_type, cohort, credit_hrs, final_cohort)
  drop_trimmed <- trim_drop_data(drop_data, student_type, cohort, credit_hrs)
  
  # final check (final_cohort rows should be equal to max_trimmed row, and the other three data sets 
  # should all have fewer rows than the final_cohort. they should all have the same number of columns.
  # (obviously this only works outside of the function for now, this was used in the build process)
  nrow(final_cohort) == nrow(max_trimmed) &
    nrow(grads_trimmed) < nrow(final_cohort) &
    nrow(trans_trimmed) < nrow(final_cohort) &
    nrow(drop_trimmed) < nrow(final_cohort)
  ncol(final_cohort) == ncol(grads_trimmed) &
    ncol(final_cohort) == ncol(trans_trimmed) &
    ncol(final_cohort) == ncol(max_trimmed) &
    ncol(final_cohort) == ncol(drop_trimmed)
  
  #########################
  # credit hour wrangling #
  #########################
  
  # backfilling 1s in the max_term data set for each student (all terms before their max term)
  # we'll keep any credit hours in the cohort data that are associated with a 1 in the max_term data, 
  # and remove any credit hour data in a term associated with an NA in the max_term data
  max_trimmed <- max_trimmed %>%
    mutate(flag2 = ifelse(if_all(contains('2'), ~ is.na(.x)), 1, NA)) %>%
    relocate(flag2, .after = last_col()) %>%
    pivot_longer(
      cols = contains('2'),
      names_to = 'cols',
      values_to = 'value'
    ) %>%
    group_by(PIDM) %>%
    fill(value, .direction = 'up') %>%
    ungroup %>%
    pivot_wider(
      names_from = 'cols',
      values_from = 'value'
    ) %>%
    subset(select = -c(flag2))
  
  # removing credit hours of those students who transferred in credit hours after their max term
  final_cohort <- as.data.frame(sapply(colnames(max_trimmed), FUN = function(colname) 
    ifelse(is.na(max_trimmed[[colname]]) & colname != "PIDM", NA, final_cohort[[colname]])))
  
  # converting credit hours to class levels
  final_cohort[2][is.na(final_cohort[2])] <- 0 # replaces NA values in first semester with 0
  mapping <- final_cohort[ , 2:ncol(final_cohort)] %>%
    mutate(across(.cols = everything(),
                  .fns = ~ case_when(
                    .x < 30 ~ 'Freshman',
                    .x < 60 ~ 'Sophomore',
                    .x < 90 ~ 'Junior',
                    .x >= 90 ~ 'Senior',
                    TRUE ~ as.character(.x))))
  class_levels <- cbind("PIDM" = final_cohort$PIDM, mapping) %>% arrange(PIDM)
  
  ########################
  # graduation wrangling #
  ########################
  
  # converting grad terms to 'graduated' and adding columns (if necessary)
  grads_trimmed[ , 2:ncol(grads_trimmed)][grads_trimmed[ , 2:ncol(grads_trimmed)] == 1] <- "Graduated"
  grads_trimmed$PIDM <- as.integer(grads_trimmed$PIDM)
  grads_trimmed[2:ncol(grads_trimmed)] <- sapply(grads_trimmed[2:ncol(grads_trimmed)], as.character)
  grads_trimmed <- grads_trimmed %>%
    bind_rows(class_levels %>% filter(F)) %>% 
    select(everything()) %>%
    select(order(colnames(grads_trimmed))) %>%
    relocate(PIDM)
  
  # filling 'graduated' status forward
  # unlike the other statuses, the graduation status gets filled forward for every term, overwriting everything
  grads_trimmed <- grads_trimmed %>%
    pivot_longer(2:ncol(grads_trimmed)) %>%
    group_by(PIDM) %>%
    fill(value, .direction = 'down') %>%
    ungroup %>%
    pivot_wider(names_from = name, values_from = value)
  
  # adding in PIDMs in class_levels not in the grad table
  grad_append <- class_levels[!(class_levels$PIDM %in% grads_trimmed$PIDM), ] # adds
  grad_append[ , 2:ncol(grad_append)] <- NA
  grads_trimmed <- 
    rbind(grads_trimmed, grad_append) %>% 
    arrange(PIDM) %>%
    semi_join(class_levels, by = "PIDM") # removing small number of rows (if any) from grad that are NOT in class_levels
  
  ######################
  # transfer wrangling #
  ######################
  
  # converting transfer terms to 'transferred out' and adding columns (if necessary)
  trans_trimmed[ , 2:ncol(trans_trimmed)][trans_trimmed[ , 2:ncol(trans_trimmed)] == 1] <- "Transferred Out"
  trans_trimmed$PIDM <- as.integer(trans_trimmed$PIDM)
  trans_trimmed[2:ncol(trans_trimmed)] <- sapply(trans_trimmed[2:ncol(trans_trimmed)], as.character)
  trans_trimmed <- trans_trimmed %>%
    bind_rows(class_levels %>% filter(F)) %>%
    select(everything())
  trans_trimmed <- trans_trimmed[, order(colnames(trans_trimmed))] %>%
    relocate(PIDM)
  
  # adding in PIDMs in class_levels not in the transfer table
  trans_append <- class_levels[!(class_levels$PIDM %in% trans_trimmed$PIDM), ]
  trans_append[ , 2:ncol(trans_append)] <- NA 
  trans_trimmed <- rbind(trans_trimmed, trans_append)
  trans_trimmed <- arrange(trans_trimmed, PIDM)
  # removing small number of rows (if any) from transfer that are NOT in class_levels
  trans_trimmed <- trans_trimmed %>% semi_join(class_levels, by = "PIDM")
  
  ######################
  # drop out wrangling #
  ######################
  
  # converting max terms to 'dropped out' and adding columns (if necessary)
  drop_trimmed[ , 2:ncol(drop_trimmed)][drop_trimmed[ , 2:ncol(drop_trimmed)] == 1] <- "Dropped Out"
  drop_trimmed$PIDM <- as.integer(drop_trimmed$PIDM)
  drop_trimmed[2:ncol(drop_trimmed)] <- sapply(drop_trimmed[2:ncol(drop_trimmed)], as.character)
  drop_trimmed <- drop_trimmed %>%
    bind_rows(class_levels %>% filter(F)) %>%
    select(everything())
  drop_trimmed <- drop_trimmed[, order(colnames(drop_trimmed))] %>%
    relocate(PIDM)
  
  # adding in PIDMs in class_levels not in the drop table
  drop_append <- class_levels[!(class_levels$PIDM %in% drop_trimmed$PIDM), ]
  drop_append[ , 2:ncol(trans_append)] <- NA 
  drop_trimmed <- rbind(drop_trimmed, drop_append)
  drop_trimmed <- arrange(drop_trimmed, PIDM)
  # removing small number of rows (if any) from dropped that are NOT in class_levels
  drop_trimmed <- drop_trimmed %>% semi_join(class_levels, by = "PIDM")
  
  #############################
  # checking before combining #
  #############################
  
  nrow(class_levels) == nrow(grads_trimmed) & 
    nrow(class_levels) == nrow(trans_trimmed) & 
    nrow(class_levels)== nrow(drop_trimmed)
  
  ##################
  # stage creation #
  ##################
  
  # filling in grad data
  # translation: if the grad_data value is not NA, input "Graduated" on top of the existing value in class_levels (except in the PIDM column)
  zz_grad <- as.data.frame(sapply(colnames(class_levels), FUN = function(colname) 
    ifelse(!is.na(grads_trimmed[[colname]]) & colname != "PIDM", "Graduated", class_levels[[colname]])))
  
  # filling in transfer data
  # translation: if the trans_data value is not NA, and the grad status we just calculated is NA or does not equal "Graduated", then input
  # "Transferred Out" on top of the existing value or NA (except in the PIDM column)
  zz_trans <- as.data.frame(sapply(colnames(zz_grad), FUN = function(colname) 
    ifelse(!is.na(trans_trimmed[[colname]]) & (is.na(zz_grad[[colname]]) | zz_grad[[colname]] != "Graduated") 
           & colname != "PIDM", "Transferred Out", zz_grad[[colname]])))
  
  # filling 'transferred' status forward
  zz_trans <- zz_trans %>%
    pivot_longer(2:ncol(zz_trans)) %>%
    group_by(PIDM) %>%
    mutate(value = ifelse(is.na(value) & na.locf(value) == "Transferred Out", na.locf(value), value))
  zz_trans <- as.data.frame(zz_trans %>% pivot_wider(names_from = name, values_from = value))
  
  # filling in drop out data
  # translation: if the drop_data value is not NA, and the grad status does not equal "Graduated" and the transferred out status does not
  # equal "Transferred Out", input "Dropped Out" on top of the existing value or NA (except in the PIDM column)
  zz_drop <- as.data.frame(sapply(colnames(zz_trans), FUN = function(colname) 
    ifelse(!is.na(drop_trimmed[[colname]]) 
           & (is.na(zz_trans[[colname]]) 
              | zz_trans[[colname]] != "Graduated" 
              | zz_trans[[colname]] != "Transferred Out") 
           & colname != "PIDM", "Dropped Out", zz_trans[[colname]])))
  
  # filling 'dropped out' status forward
  zz_drop <- zz_drop %>%
    pivot_longer(2:ncol(zz_drop)) %>%
    group_by(PIDM) %>%
    mutate(value = ifelse(is.na(value) & na.locf(value) == "Dropped Out", na.locf(value), value))
  zz_drop <- as.data.frame(zz_drop %>% pivot_wider(names_from = name, values_from = value))
  
  # filling in hiatus
  zz_t <- as.data.frame(t(zz_drop))
  colnames(zz_t) <- zz_drop$PIDM
  rownames(zz_t) <- colnames(zz_drop)
  zz_t <- zz_t[-1 ,]
  
  terms <- rownames(zz_t)
  sabb <- function(pidm) {
    before <- c(NA, head(zz_t[[pidm]], -1))
    after <- c(tail(zz_t[[pidm]], -1), NA)
    ifelse(
      (is.na(zz_t[[pidm]]) & is.na(before)) 
      | (is.na(zz_t[[pidm]]) & is.na(after)) 
      | (is.na(zz_t[[pidm]]) & substr(terms, 5, 6) != "40"), 
      "Hiatus", zz_t[[pidm]])
  }
  zz_sabb <- as.data.frame(sapply(colnames(zz_t), FUN = function(pidm) sabb(pidm)))
  
  # filling in the remaining NAs
  zz_sabb <- zz_sabb %>% fill(everything())
  rownames(zz_sabb) <- rownames(zz_t)
  zz_sabb <- as.data.frame(t(zz_sabb))
  zz_sabb <- rownames_to_column(zz_sabb, "PIDM")
  
  # adding column for start position
  colnames(zz_sabb)[which(names(zz_sabb) == "PIDM")] <- "pid"
  zz <- add_column(zz_sabb, start = rep("Starting Cohort", times = nrow(zz_sabb)), .after = "pid")
  # zz_piv <- pivot_longer(!pid, data = zz, names_to = "term", values_to = "grp")
  # zz_piv <- add_column(zz_piv, duration = rep(1, times = nrow(zz_piv)), .after = "grp")
  
  # appending on a couple final features to be used in filtering
  zz$pid <- as.integer(zz$pid)
  to_append <- cohort_data %>%
    select(PIDM,
           COLL_DESC, 
           DEPT_DESC,
           MAJR_CODE,
           MAJR_DESC, 
           TIME_STATUS, 
           SEX_CODE, 
           FG_CODE, 
           RACE_ETHNICITY)
  final <- left_join(zz, to_append, by = c("pid" = "PIDM"))
  final <- final %>% relocate(COLL_DESC, 
                              DEPT_DESC,
                              MAJR_CODE,
                              MAJR_DESC, 
                              TIME_STATUS, 
                              SEX_CODE, 
                              FG_CODE, 
                              RACE_ETHNICITY, 
                              .after = pid)
  final <- final %>% 
    rename("college_of_major" = "COLL_DESC",
           "dept_of_major" = "DEPT_DESC",
           "major_code" = "MAJR_CODE",
           "major" = "MAJR_DESC",
           "time_status" = "TIME_STATUS",
           "sex" = "SEX_CODE",
           "first_gen_status" = "FG_CODE",
           "race_ethnicity" = "RACE_ETHNICITY")
  
  # recoding college of major to match current structure of university
  ed_majors <- c("EDPB",
                 "EDU",
                 "ELCE",
                 "LECE",
                 "LEDS",
                 "LEED",
                 "LK12",
                 "LSPL",
                 "LTIR",
                 "PCIP",
                 "PETE",
                 "PTED",
                 "SED",
                 "TEDM",
                 "TLC",
                 "TLE",
                 "TLK",
                 "TLS",
                 "UNED"
  )

  final$college_of_major <-
    ifelse(final$major == "Computer Science", "College Health Applied Science",
           ifelse(final$major == "Journalism", "College Letters Arts Sciences",
                  ifelse(final$major_code %in% ed_majors, "School of Education",
                         ifelse(final$college_of_major == "College Professional Studies", "College Health Applied Science",
                                final$college_of_major))))
  
  # export final data set
  write.csv(final, paste0(cohort, "_", student_type, ".csv"), row.names = F)
  
}

# running final function
zig_zag(cohort_data, grad_data, trans_data, max_term_data, drop_data)
