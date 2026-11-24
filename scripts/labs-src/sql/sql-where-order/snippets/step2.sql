-- BETWEEN：闭区间，包含两端
SELECT name, salary FROM employees WHERE salary BETWEEN 10000 AND 13000;

-- IN：等于其中任意一个就保留
SELECT name, location FROM departments WHERE id IN (1, 3, 5);
