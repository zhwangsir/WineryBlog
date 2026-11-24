-- 选出两列，并用 AS 给它们起中文别名
SELECT id AS 编号, budget AS 预算 FROM departments;

-- AS 的左边也可以是一个算式
SELECT name, budget * 2 AS 明年预算 FROM departments;
