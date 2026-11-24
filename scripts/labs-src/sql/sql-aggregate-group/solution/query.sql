-- ============================================================================
-- 聚合与分组：COUNT / AVG / SUM、GROUP BY、HAVING
-- 一条聚合语句能把几十行数据汇总成几个数字，这是报表和统计的基石
-- ============================================================================

-- ── Step 1：聚合函数：很多行 → 1 行 ────────────────────────────────────────

-- 【查询 1】一条语句得到全公司的 5 个统计数。AVG 的结果带很长的小数，用 ROUND(x, 2) 保留两位
-- 预期：1 行 5 列：30 23150 45000 10000 694500
SELECT COUNT(*) AS 员工人数,
       ROUND(AVG(salary), 2) AS 平均月薪,
       MAX(salary) AS 最高月薪,
       MIN(salary) AS 最低月薪,
       SUM(salary) AS 月薪总额
FROM employees;

-- 【查询 2】COUNT(*) 数的是行数；COUNT(列) 只数这一列「不为 NULL」的行
-- 预期：1 行 2 列：30 25
SELECT COUNT(*) AS 员工人数, COUNT(manager_id) AS 有直属上级的人数 FROM employees;

-- 【查询 3】COUNT(DISTINCT 列)：先去重再数，30 名员工其实只有 19 种职位
-- 预期：1 行 1 列：19
SELECT COUNT(DISTINCT title) AS 职位种类 FROM employees;

-- 【查询 4】聚合之前可以先用 WHERE 筛选：只统计 2022 年以来入职的员工
-- 预期：1 行 2 列：5 13500
SELECT COUNT(*) AS 人数, ROUND(AVG(salary), 2) AS 平均月薪
FROM employees
WHERE hire_date >= '2022-01-01';

-- ── Step 2：GROUP BY：很多行 → 每组 1 行 ──────────────────────────────────

-- 【查询 5】按部门分组：dept_id 相同的行归为一组，每个组各自算出 1 行结果
-- 预期：5 行 5 列：1 12 25708.33 45000 308500、2 5 27100 40000 135500、3 6 20000 36000 120000、4 3 19666.67 30000 59000、5 4 17875 32000 71500
SELECT dept_id,
       COUNT(*) AS 人数,
       ROUND(AVG(salary), 2) AS 平均月薪,
       MAX(salary) AS 最高月薪,
       SUM(salary) AS 月薪总额
FROM employees
GROUP BY dept_id
ORDER BY dept_id;

-- 【查询 6】按职位分组，并按人数从多到少排：一眼看出哪种职位人最多
-- 预期：19 行 2 列：工程师 4、产品经理 3、市场专员 3、高级工程师 3、会计 2、初级工程师 2
SELECT title, COUNT(*) AS 人数
FROM employees
GROUP BY title
ORDER BY 人数 DESC, title;

-- 【查询 7】按状态统计项目：每组的项目数和预算合计（单位：万元）
-- 预期：3 行 3 列：进行中 3 970、已完成 4 960、已搁置 1 75
SELECT status, COUNT(*) AS 项目数, SUM(budget) AS 预算合计
FROM projects
GROUP BY status
ORDER BY 预算合计 DESC;

-- 【查询 8】GROUP BY 可以写多列：部门和性别都相同才算同一组
-- 预期：10 行 3 列：1 女 4、1 男 8、2 女 2、2 男 3、3 女 3、3 男 3、4 女 2、4 男 1、5 女 2、5 男 2
SELECT dept_id, gender, COUNT(*) AS 人数
FROM employees
GROUP BY dept_id, gender
ORDER BY dept_id, gender;

-- ── Step 3：HAVING：筛选「分组之后」的结果 ─────────────────────────────────

-- 【查询 9】HAVING：只保留汇总后人数不少于 5 人的部门。WHERE 做不到这件事，
--          因为 WHERE 在分组之前执行，那时还没有「人数」这个概念
-- 预期：3 行 3 列：1 12 25708.33、3 6 20000、2 5 27100
SELECT dept_id, COUNT(*) AS 人数, ROUND(AVG(salary), 2) AS 平均月薪
FROM employees
GROUP BY dept_id
HAVING COUNT(*) >= 5
ORDER BY 人数 DESC, dept_id;

-- 【查询 10】HAVING 里也可以写 AVG、SUM 这类聚合函数：只看平均月薪高于 21000 的部门
-- 预期：2 行 3 列：2 5 27100、1 12 25708.33
SELECT dept_id, COUNT(*) AS 人数, ROUND(AVG(salary), 2) AS 平均月薪
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 21000
ORDER BY 平均月薪 DESC;

-- 【查询 11】WHERE 与 HAVING 同时出现：WHERE 先筛掉行（只看 2020 年以前入职的），
--           GROUP BY 分组，HAVING 再筛掉组（只留 3 人以上的部门）
-- 预期：2 行 3 列：1 7 45000、2 4 40000
SELECT dept_id, COUNT(*) AS 人数, MAX(salary) AS 最高月薪
FROM employees
WHERE hire_date < '2020-01-01'
GROUP BY dept_id
HAVING COUNT(*) >= 3
ORDER BY dept_id;

-- 【查询 12】每个项目每周投入的总小时数，只保留 100 小时以上的项目
-- 预期：3 行 2 列：1 144、3 144、2 128
SELECT project_id, SUM(hours_per_week) AS 每周投入合计
FROM assignments
GROUP BY project_id
HAVING SUM(hours_per_week) >= 100
ORDER BY 每周投入合计 DESC, project_id;
