-- ============================================================================
-- 连接查询：INNER JOIN、LEFT JOIN、多表连接
-- employees（员工）里只存了 dept_id 这样的编号，要显示「部门名称」就得把两张表连起来
-- 连接的条件写在 ON 里，一般是这张表的外键 = 另一张表的主键
-- 每条查询都按【查询 N】编了号；请按左侧的步骤补全标着 TODO 的查询
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

-- 【查询 2】TODO：连接 departments 和 employees，统计每个部门有多少人。
--               两列：部门（d.name）、人数；按人数从多到少排序，人数相同的按部门编号排
-- 预期：5 行 2 列：研发部 12、市场部 6、产品部 5、财务部 4、人事部 3

-- ── Step 2：LEFT JOIN ──────────────────────────────────────────────────────

-- 【查询 3】TODO：用 LEFT JOIN 列出 6、7、8 号项目的分工，四列：项目、状态、员工编号、角色。
--               只保留 p.id IN (6, 7, 8) 的行，按 p.id、a.id 排序。
--               留意 8 号项目「海外市场调研」：它已经搁置，一个人都没分派进来，右表的两列会补上 NULL
-- 预期：9 行 4 列：秋季校园招聘 已完成 25 项目负责人、报销系统升级 进行中 28 项目负责人、海外市场调研 已搁置 NULL NULL

-- 【查询 4】TODO：找出没有参与任何项目的员工，三列：id、name、title，按 id 排序。
--               套路：employees LEFT JOIN assignments 之后，用 WHERE a.id IS NULL 只留「没匹配上」的行
-- 预期：5 行 3 列：1 王振华 技术总监、18 谢雨欣 市场总监、27 秦悦 财务总监、29 董倩 会计、30 袁浩然 出纳

-- 【查询 5】LEFT JOIN + 分组：统计每个项目有几个人。注意要数 a.id（没有匹配时它是 NULL，不会被数进去），
--          如果写成 COUNT(*)，没人参与的 8 号项目也会被数成 1
-- 预期：8 行 3 列：3 数据中台一期 8、2 智能客服平台 7、1 星链支付网关 6、4 移动端App改版 6、5 品牌焕新计划 5、7 报销系统升级 5、6 秋季校园招聘 3、8 海外市场调研 0
SELECT p.id, p.name AS 项目, COUNT(a.id) AS 参与人数
FROM projects AS p
LEFT JOIN assignments AS a ON a.project_id = p.id
GROUP BY p.id, p.name
ORDER BY 参与人数 DESC, p.id;

-- ── Step 3：多表连接 ───────────────────────────────────────────────────────

-- 【查询 6】TODO：连接 assignments、employees、projects 三张表，列出所有「进行中」项目的参与明细，
--               四列：项目、员工、角色、每周小时；按 p.id、a.id 排序
-- 预期：19 行 4 列：数据中台一期 李思远 项目负责人 16、数据中台一期 刘洋 后端开发 24、报销系统升级 韩露 产品经理 8

-- 【查询 7】TODO：从 projects 出发，连上 departments（归属部门）和 employees（负责人 lead_id），
--               列出每个项目的 项目、归属部门、负责人、负责人职位，按 p.id 排序
-- 预期：8 行 4 列：星链支付网关 研发部 李思远 架构师、品牌焕新计划 市场部 邓宇 品牌经理、海外市场调研 市场部 谢雨欣 市场总监

-- 【查询 8】自连接：employees 和它自己连接。一张表当两份用（e 是员工，m 是上级），
--          条件是「员工的 manager_id 等于另一份里某个员工的 id」
-- 预期：30 行 3 列：李思远 王振华 架构师、王强 李思远 高级工程师、王振华 NULL 技术总监
SELECT e.name AS 员工, m.name AS 直属上级, e.title AS 职位
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
ORDER BY e.id;
