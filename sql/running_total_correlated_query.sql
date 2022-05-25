/* 
This selects all students enrolled in a particular semester, but unions on a specific pull for the first
semester in question, so folks who shouldn't don't come in with a NULL during the pivot (i.e. those who 
earned 0 credit hours in the base term were coming in with an incorrect null value for total earned
hours up through that term).
*/

SELECT * FROM (
SELECT *
FROM
    (
        SELECT
            saturn.shrtgpa.shrtgpa_pidm as pidm,
            saturn.shrtgpa.shrtgpa_term_code as term,
            (
                SELECT
                    SUM(running_total.shrtgpa_hours_earned)
                FROM
                    saturn.shrtgpa running_total
                WHERE
                    1 = 1
                    AND running_total.shrtgpa_pidm = saturn.shrtgpa.shrtgpa_pidm
                    AND running_total.shrtgpa_term_code < saturn.shrtgpa.shrtgpa_term_code
                    AND running_total.shrtgpa_levl_code = 'UG'
                    -- AND running_total.shrtgpa_gpa_type_ind = 'I'
            ) AS running_total
        FROM
            saturn.shrtgpa
        WHERE
            saturn.shrtgpa.shrtgpa_pidm IN (
                SELECT
                    saturn.sfrstcr.sfrstcr_pidm as pidm
                FROM
                    saturn.sfrstcr
                WHERE
                    1 = 1
                    AND saturn.sfrstcr.sfrstcr_rsts_code IN (
                        'AU',
                        'RE',
                        'RW',
                        'RZ',
                        'AW',
                        'NB',
                        'NC',
                        'NX',
                        'NZ',
                        'W'
                    )
                    AND saturn.sfrstcr.sfrstcr_term_code = 201150
                GROUP BY
                    saturn.sfrstcr.sfrstcr_pidm,
                    saturn.sfrstcr.sfrstcr_term_code
            )
            AND saturn.shrtgpa.shrtgpa_levl_code = 'UG'
            -- AND saturn.shrtgpa.shrtgpa_gpa_type_ind = 'I'
        GROUP BY
            saturn.shrtgpa.shrtgpa_pidm,
            saturn.shrtgpa.shrtgpa_term_code
        ORDER BY
            saturn.shrtgpa.shrtgpa_pidm,
            saturn.shrtgpa.shrtgpa_term_code
    )
UNION
SELECT
    base_term.shrtgpa_pidm AS pidm,
    '201150' as term,
    SUM(base_term.shrtgpa_hours_earned) AS running_total
FROM
    saturn.shrtgpa base_term
WHERE
    1 = 1
    AND base_term.shrtgpa_pidm IN (
        SELECT
            saturn.sfrstcr.sfrstcr_pidm as pidm
        FROM
            saturn.sfrstcr
        WHERE
            1 = 1
            AND saturn.sfrstcr.sfrstcr_rsts_code IN (
                'AU',
                'RE',
                'RW',
                'RZ',
                'AW',
                'NB',
                'NC',
                'NX',
                'NZ',
                'W'
            )
            AND saturn.sfrstcr.sfrstcr_term_code = 201150)
    AND base_term.shrtgpa_term_code < 201150
    AND base_term.shrtgpa_levl_code = 'UG'
    -- AND base_term.shrtgpa_gpa_type_ind = 'I'
GROUP BY 
    base_term.shrtgpa_pidm,
    '201150')
PIVOT (
        AVG(running_total) FOR term IN (
            201150,
            201230,
            201240,
            201250,
            201330,
            201340,
            201350,
            201430,
            201440,
            201450,
            201530,
            201540,
            201550,
            201630,
            201640,
            201650,
            201730,
            201740,
            201750,
            201830,
            201840,
            201850,
            201930,
            201940,
            201950,
            202030,
            202040,
            202050,
            202130,
            202140
        )
    )
ORDER BY pidm