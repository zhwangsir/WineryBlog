-- 不去重：每个部门一行，「北京」会出现 3 次
SELECT location FROM departments;

-- 加上 DISTINCT：完全相同的行只留一行
SELECT DISTINCT location FROM departments;
