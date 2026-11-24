-- 相关子查询：内层引用了外层的行（e.dept_id），外层每取一行，内层就重新算一次
SELECT e.name, e.salary
FROM employees AS e
WHERE e.salary = (SELECT MAX(salary) FROM employees WHERE dept_id = e.dept_id)
ORDER BY e.dept_id;
