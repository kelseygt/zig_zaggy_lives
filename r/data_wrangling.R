
# loading in packages
library(dplyr)
library(tidyr)
library(readxl)
library(zoo)
library(tibble)

# loading in data
setwd("C:/Users/Laserbeams/Desktop/zig_zag/working_files")
raw_data <- read.csv("all_students_201150.csv", header = T, check.names = F)
grad_data <- as.data.frame(read_excel("grads_from_201150.xlsx", sheet = "for_import"))
trans_data <- as.data.frame(read_excel("transfer_outs_201150.xlsx", sheet = "for_import"))
drop_data <- as.data.frame(read_excel("max_term_201150.xlsx", sheet = "for_import"))

#############
# data prep #
#############

# remember to subset by student type, remove non-degree seeking

# converting credit hours to class levels
mapping <- raw_data[ , 4:ncol(raw_data)]
mapping <- mapping %>% mutate(
  across(
    .cols = everything(),
    .fns = ~ case_when(
      .x < 30 ~ 'Freshman',
      .x < 60 ~ 'Sophomore',
      .x < 90 ~ 'Junior',
      .x >= 90 ~ 'Senior',
      TRUE ~ as.character(.x)
    )
  )
)
class_levels <- cbind("PIDM" = raw_data$SHRTGPA_PIDM, mapping)
class_levels <- arrange(class_levels, PIDM)

########################
# graduation wrangling #
########################

# converting grad terms to 'graduated' and adding columns (if necessary)
grad_data[ , 2:ncol(grad_data)][grad_data[ , 2:ncol(grad_data)] == 1] <- "Graduated"
grad_data <- grad_data %>%
  bind_rows(class_levels %>% filter(F)) %>%
  select(everything())
grad_data <- grad_data[, order(colnames(grad_data))] %>%
  relocate(PIDM)

# filling 'graduated' status forward
# unlike the other statuses, the graduation status gets filled forward for every term, overwriting everything
grad_data <- grad_data %>%
  pivot_longer(2:ncol(grad_data)) %>%
  group_by(PIDM) %>%
  fill(value)
grad_data <- as.data.frame(grad_data %>% pivot_wider(names_from = name, values_from = value))

# adding in PIDMs in class_levels not in the grad table
grad_append <- class_levels[!(class_levels$PIDM %in% grad_data$PIDM), ] 
grad_append[ , 2:ncol(grad_append)] <- NA
grad_data <- rbind(grad_data, grad_append)
grad_data <- arrange(grad_data, PIDM)

######################
# transfer wrangling #
######################

# converting transfer terms to 'transferred out' and adding columns (if necessary)
trans_data[ , 2:ncol(trans_data)][trans_data[ , 2:ncol(trans_data)] == 1] <- "Transferred Out"
trans_data <- trans_data %>%
  bind_rows(class_levels %>% filter(F)) %>%
  select(everything())
trans_data <- trans_data[, order(colnames(trans_data))] %>%
  relocate(PIDM)
trans_data <- trans_data %>% 
  select(-c("202150", "202230")) # removes the semesters beyond 10 years

# adding in PIDMs in class_levels not in the transfer table
trans_append <- class_levels[!(class_levels$PIDM %in% trans_data$PIDM), ]
trans_append[ , 2:ncol(trans_append)] <- NA 
trans_data <- rbind(trans_data, trans_append)
trans_data <- arrange(trans_data, PIDM)

######################
# drop out wrangling #
######################

# converting max terms to 'dropped out' and adding columns (if necessary)
drop_data[ , 2:ncol(drop_data)][drop_data[ , 2:ncol(drop_data)] == 1] <- "Dropped Out"
drop_data <- drop_data %>%
  bind_rows(class_levels %>% filter(F)) %>%
  select(everything())
drop_data <- drop_data[, order(colnames(drop_data))] %>%
  relocate(PIDM)
drop_data <- drop_data %>% 
  select(-c("202150", "202230", "202240", "202250")) # removes the semesters beyond 10 years

# adding in PIDMs in class_levels not in the transfer table
drop_append <- class_levels[!(class_levels$PIDM %in% drop_data$PIDM), ]
drop_append[ , 2:ncol(trans_append)] <- NA 
drop_data <- rbind(drop_data, drop_append)
drop_data <- arrange(drop_data, PIDM)

#############################
# checking before combining #
#############################

nrow(class_levels)
nrow(grad_data)
nrow(trans_data)
nrow(drop_data)

##################
# stage creation #
##################

# filling in grad data
# translation: if the grad_data value is not NA, input "Graduated" on top of the existing value in class_levels (except in the PIDM column)
zz_grad <- as.data.frame(sapply(colnames(class_levels), FUN = function(colname) 
  ifelse(!is.na(grad_data[[colname]]) & colname != "PIDM", "Graduated", class_levels[[colname]])))

# filling in transfer data
# translation: if the trans_data value is not NA, and the grad status we just calculated is NA or does not equal "Graduated", then input
# "Transferred Out" on top of the existing value or NA (except in the PIDM column)
zz_trans <- as.data.frame(sapply(colnames(zz_grad), FUN = function(colname) 
  ifelse(!is.na(trans_data[[colname]]) & (is.na(zz_grad[[colname]]) | zz_grad[[colname]] != "Graduated") 
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
  ifelse(!is.na(drop_data[[colname]]) 
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

# filling in sabbatical
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
    "Sabbatical", zz_t[[pidm]])
}

zz_sabb <- as.data.frame(sapply(colnames(zz_t), FUN = function(pidm) sabb(pidm)))

# filling in the remaining NAs
zz_sabb <- zz_sabb %>% fill(everything())
rownames(zz_sabb) <- rownames(zz_t)
zz_sabb <- as.data.frame(t(zz_sabb))
zz_sabb <- rownames_to_column(zz_sabb, "PIDM")

# adding column for start position
zz <- add_column(zz_sabb, start = rep("First-Time Freshman", times = nrow(zz_sabb)), .after = "PIDM")

# export final data set
write.csv(zz, "final_zz.csv", row.names = F)
write.csv(pivot_longer(!PIDM, data = zz, names_to = "term", values_to = "grp"), "final_zz_pivoted.csv", row.names = F)
