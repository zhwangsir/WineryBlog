-- 聚合函数把一列的许多值算成一个数
SELECT MAX(salary) AS 最高月薪, MIN(salary) AS 最低月薪, SUM(salary) AS 月薪总额 FROM employees;

-- 结果带很长的小数时，用 ROUND(x, 2) 保留两位
SELECT ROUND(AVG(salary), 2) AS 平均月薪 FROM employees;
