-- 先按入职日期从早到晚排序，再取前 3 行：最早入职的 3 个人
SELECT name, hire_date FROM employees ORDER BY hire_date LIMIT 3;

-- LIMIT n OFFSET m：跳过前 m 行，再取 n 行
SELECT name, hire_date FROM employees ORDER BY hire_date LIMIT 3 OFFSET 3;
