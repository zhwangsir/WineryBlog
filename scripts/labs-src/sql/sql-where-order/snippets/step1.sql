-- 比较运算符：=、>、>=、<、<=、<>（不等于）
SELECT name, salary FROM employees WHERE salary < 12000;

-- 多个条件用 AND / OR 连接，NOT 表示取反
SELECT name, dept_id, salary FROM employees WHERE dept_id = 5 AND salary >= 14000;
