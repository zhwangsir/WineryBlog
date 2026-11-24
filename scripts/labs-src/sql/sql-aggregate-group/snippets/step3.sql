-- HAVING：分组之后再筛选——只保留项目数不少于 2 个的部门
SELECT dept_id, COUNT(*) AS 项目数, SUM(budget) AS 预算合计
FROM projects
GROUP BY dept_id
HAVING COUNT(*) >= 2;
