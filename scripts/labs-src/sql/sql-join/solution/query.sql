-- ============================================================================
-- 连接查询：INNER JOIN、LEFT JOIN、多表连接
-- employees（员工）里只存了 dept_id 这样的编号，要显示「部门名称」就得把两张表连起来
-- 连接的条件写在 ON 里，一般是这张表的外键 = 另一张表的主键
-- ============================================================================

-- ── Step 1：INNER JOIN ─────────────────────────────────────────────────────

-- 【查询 1】INNER JOIN：只保留两边的行都能匹配上的结果。
--          AS 给表起短别名（e、d），再用「表别名.列名」说明每一列来自哪张表
-- 预期：10 行 3 列：谢雨欣 市场总监 市场部、邓宇 品牌经理 市场部、秦悦 财务总监 财务部、袁浩然 出纳 财务部
SELECT e.name AS 员工, e.title AS 职位, d.name AS 部门
FROM employees AS e
INNER JOIN departments AS d ON e.dept_id = d.id
WHERE d.location = '上海'
ORDER BY e.id;

-- 【查询 2】连接之后照样可以分组：每个部门有多少人。人数相同的按部门编号排，保证顺序稳定
-- 预期：5 行 2 列：研发部 12、市场部 6、产品部 5、财务部 4、人事部 3
SELECT d.name AS 部门, COUNT(*) AS 人数
FROM departments AS d
INNER JOIN employees AS e ON e.dept_id = d.id
GROUP BY d.name
ORDER BY 人数 DESC, d.id;

-- ── Step 2：LEFT JOIN ──────────────────────────────────────────────────────

-- 【查询 3】LEFT JOIN：左表的行全部保留；右表找不到匹配时，右表的列补上 NULL。
--          8 号项目「海外市场调研」已经搁置，还没有任何人被分派进去
-- 预期：9 行 4 列：秋季校园招聘 已完成 25 项目负责人、报销系统升级 进行中 28 项目负责人、海外市场调研 已搁置 NULL NULL
SELECT p.name AS 项目, p.status AS 状态, a.employee_id AS 员工编号, a.role AS 角色
FROM projects AS p
LEFT JOIN assignments AS a ON a.project_id = p.id
WHERE p.id IN (6, 7, 8)
ORDER BY p.id, a.id;

-- 【查询 4】经典用法：找出「在右表里没有匹配」的行——LEFT JOIN 之后用 IS NULL 过滤
-- 预期：5 行 3 列：1 王振华 技术总监、18 谢雨欣 市场总监、27 秦悦 财务总监、29 董倩 会计、30 袁浩然 出纳
SELECT e.id, e.name, e.title
FROM employees AS e
LEFT JOIN assignments AS a ON a.employee_id = e.id
WHERE a.id IS NULL
ORDER BY e.id;

-- 【查询 5】LEFT JOIN + 分组：统计每个项目有几个人。注意要数 a.id（没有匹配时它是 NULL，不会被数进去），
--          如果写成 COUNT(*)，没人参与的 8 号项目也会被数成 1
-- 预期：8 行 3 列：3 数据中台一期 8、2 智能客服平台 7、1 星链支付网关 6、4 移动端App改版 6、5 品牌焕新计划 5、7 报销系统升级 5、6 秋季校园招聘 3、8 海外市场调研 0
SELECT p.id, p.name AS 项目, COUNT(a.id) AS 参与人数
FROM projects AS p
LEFT JOIN assignments AS a ON a.project_id = p.id
GROUP BY p.id, p.name
ORDER BY 参与人数 DESC, p.id;

-- ── Step 3：多表连接 ───────────────────────────────────────────────────────

-- 【查询 6】三表连接：assignments 是「员工 ↔ 项目」的中间表，两头各连一次，
--          就能把编号换成人名和项目名
-- 预期：19 行 4 列：数据中台一期 李思远 项目负责人 16、数据中台一期 刘洋 后端开发 24、报销系统升级 韩露 产品经理 8
SELECT p.name AS 项目, e.name AS 员工, a.role AS 角色, a.hours_per_week AS 每周小时
FROM assignments AS a
INNER JOIN employees AS e ON e.id = a.employee_id
INNER JOIN projects AS p ON p.id = a.project_id
WHERE p.status = '进行中'
ORDER BY p.id, a.id;

-- 【查询 7】再连一张 departments：每个项目的名称、归属部门和负责人，一条查询全部带出来
-- 预期：8 行 4 列：星链支付网关 研发部 李思远 架构师、品牌焕新计划 市场部 邓宇 品牌经理、海外市场调研 市场部 谢雨欣 市场总监
SELECT p.name AS 项目, d.name AS 归属部门, e.name AS 负责人, e.title AS 负责人职位
FROM projects AS p
INNER JOIN departments AS d ON d.id = p.dept_id
INNER JOIN employees AS e ON e.id = p.lead_id
ORDER BY p.id;

-- 【查询 8】自连接：employees 和它自己连接。一张表当两份用（e 是员工，m 是上级），
--          条件是「员工的 manager_id 等于另一份里某个员工的 id」
-- 预期：30 行 3 列：李思远 王振华 架构师、王强 李思远 高级工程师、王振华 NULL 技术总监
SELECT e.name AS 员工, m.name AS 直属上级, e.title AS 职位
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
ORDER BY e.id;
