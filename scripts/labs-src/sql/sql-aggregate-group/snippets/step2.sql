-- 按职位分组，数一数每种职位各有多少人（人数相同的按职位排，顺序才稳定）
SELECT title, COUNT(*) AS 人数
FROM employees
GROUP BY title
ORDER BY 人数 DESC, title;

-- 换一张表、换一个分组列：每个部门有几个项目、预算合计多少
SELECT dept_id, COUNT(*) AS 项目数, SUM(budget) AS 预算合计
FROM projects
GROUP BY dept_id;
