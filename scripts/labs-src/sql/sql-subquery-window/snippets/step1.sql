-- 子查询当一个值：先算出全公司的最高月薪，再和每个员工比较
SELECT name, salary
FROM employees
WHERE salary >= (SELECT MAX(salary) FROM employees) - 5000
ORDER BY salary DESC, id;

-- 子查询当一个集合：IN 的右边放一条查询
SELECT name, budget
FROM projects
WHERE dept_id IN (SELECT id FROM departments WHERE location = '上海')
ORDER BY id;
