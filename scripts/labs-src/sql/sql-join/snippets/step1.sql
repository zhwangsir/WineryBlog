-- INNER JOIN：ON 的条件成立，两边的行才拼在一起
SELECT e.name AS 员工, d.name AS 部门
FROM employees AS e
INNER JOIN departments AS d ON e.dept_id = d.id
WHERE e.title = '会计';
