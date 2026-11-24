-- ============================================================================
-- 子查询与窗口函数：一个查询里套另一个查询；ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)
-- ============================================================================

-- ── Step 1：子查询：查询的结果当成一个值、一个集合或一张临时表 ────────────

-- 【查询 1】先单独算出全公司平均月薪——它的结果就是一个值
-- 预期：1 行 1 列：23150
SELECT ROUND(AVG(salary), 2) AS 公司平均月薪 FROM employees;

-- 【查询 2】子查询当「一个值」用：把上面那条查询放进括号，外层就可以拿它和每个员工比较
-- 预期：14 行 3 列：王振华 技术总监 45000、邓宇 品牌经理 25000、秦悦 财务总监 32000
SELECT name, title, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC, id;

-- 【查询 3】子查询当「一个集合」用：IN 的右边可以是一条查询。这里找出「办公地点在上海的部门」的所有员工
-- 预期：10 行 2 列：谢雨欣 市场总监、邓宇 品牌经理、秦悦 财务总监、袁浩然 出纳
SELECT name, title
FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE location = '上海')
ORDER BY id;

-- 【查询 4】NOT IN + 子查询：没有参与任何项目的员工（和上一关的 LEFT JOIN … IS NULL 是同一个结果）
-- 预期：5 行 2 列：王振华 技术总监、谢雨欣 市场总监、秦悦 财务总监、董倩 会计、袁浩然 出纳
SELECT name, title
FROM employees
WHERE id NOT IN (SELECT employee_id FROM assignments)
ORDER BY id;

-- 【查询 5】子查询当「一张临时表」用：放在 FROM 里，先算出每个部门的平均月薪，再从这张临时表里筛选
-- 预期：2 行 2 列：2 27100、1 25708.33
SELECT dept_id, avg_salary AS 平均月薪
FROM (SELECT dept_id, ROUND(AVG(salary), 2) AS avg_salary
      FROM employees
      GROUP BY dept_id) AS dept_avg
WHERE avg_salary > 21000
ORDER BY 平均月薪 DESC;

-- ── Step 2：相关子查询：内层查询引用了外层的行 ────────────────────────────

-- 【查询 6】外层每取一行员工，内层就重新算一次「这个员工所在部门的平均月薪」，
--          然后比较：月薪高于自己所在部门平均的员工
-- 预期：10 行 4 列：王振华 1 45000 25708.33、郑浩 2 40000 27100、谢雨欣 3 36000 20000、马婧 4 30000 19666.67、秦悦 5 32000 17875
SELECT e.name, e.dept_id, e.salary,
       (SELECT ROUND(AVG(salary), 2) FROM employees WHERE dept_id = e.dept_id) AS 部门平均月薪
FROM employees AS e
WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id)
ORDER BY e.dept_id, e.salary DESC;

-- 【查询 7】EXISTS：只要子查询能查到行就为真。效果同「参与了至少一个项目」，只是换了一种写法
-- 预期：25 行 2 列：李思远 架构师、曹阳 UI设计师、范斌 会计
SELECT e.name, e.title
FROM employees AS e
WHERE EXISTS (SELECT 1 FROM assignments AS a WHERE a.employee_id = e.id)
ORDER BY e.id;

-- 【查询 8】一个经典的坑：想找「手下一个兵都没有的员工」，直觉的写法是 NOT IN（所有上级的编号）。
--           但 manager_id 里有 5 个 NULL，而 NOT IN 的列表里只要混进一个 NULL，就一行都匹配不上
-- 预期：0 行
SELECT name, title
FROM employees
WHERE id NOT IN (SELECT manager_id FROM employees);

-- 【查询 9】把 NULL 先过滤掉就正常了：10 个人带着团队，剩下的 20 个不带
-- 预期：20 行 2 列：杨帆 工程师、苏晴 测试工程师、袁浩然 出纳
SELECT name, title
FROM employees
WHERE id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL)
ORDER BY id;

-- ── Step 3：窗口函数：不合并行，也能算出「组内排名」「组内平均值」 ──────────

-- 【查询 10】ROW_NUMBER() OVER (PARTITION BY 部门 ORDER BY 月薪 DESC)：
--           按部门分区，区内按月薪从高到低编号。每一行都保留，只是多了一列排名
-- 预期：30 行 4 列：1 王振华 45000 1、1 李思远 38000 2、1 王强 32000 3、2 郑浩 40000 1
SELECT dept_id, name, salary,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS 部门内排名
FROM employees
ORDER BY dept_id, 部门内排名;

-- 【查询 11】窗口函数不能直接写在 WHERE 里（会报错 misuse of window function ROW_NUMBER()），
--           所以把查询 10 包成临时表，再筛选「排名第 1」：这就是经典的「每组取第一名」
-- 预期：5 行 3 列：1 王振华 45000、2 郑浩 40000、3 谢雨欣 36000、4 马婧 30000、5 秦悦 32000
SELECT dept_id, name, salary
FROM (SELECT dept_id, name, salary,
             ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
      FROM employees) AS ranked
WHERE rn = 1
ORDER BY dept_id;

-- 【查询 12】三个名次函数的区别，看并列（王强、秦悦都是 32000）时最清楚：
--           ROW_NUMBER 硬编号 5、6（这里加了 id 作为第二排序键，并列时谁先谁后才有明确依据）；
--           RANK 并列第 5、下一名跳到 7；DENSE_RANK 并列第 5、下一名仍是 6（这两个只按月薪排）
-- 预期：8 行 5 列：王振华 45000 1 1 1、王强 32000 5 5 5、秦悦 32000 6 5 5、陈雅婷 31000 7 7 6、刘洋 30000 8 8 7
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, id) AS 行号,
       RANK()       OVER (ORDER BY salary DESC) AS 排名,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS 稠密排名
FROM employees
ORDER BY salary DESC, id
LIMIT 8;

-- 【查询 13】聚合函数也能当窗口函数：AVG() OVER (PARTITION BY …) 把部门平均月薪贴到每一行旁边，
--           和查询 6 里相关子查询算出的数值一样，但不用对每一行都重新查一遍
-- 预期：30 行 4 列：李思远 1 38000 25708.33、韩露 2 27000 27100、董倩 5 14500 17875
SELECT name, dept_id, salary,
       ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS 部门平均月薪
FROM employees
ORDER BY dept_id, salary DESC;
