-- 三表连接：中间表两头各连一次，编号就换成了人名和项目名
SELECT e.name AS 员工, p.name AS 项目
FROM assignments AS a
INNER JOIN employees AS e ON e.id = a.employee_id
INNER JOIN projects AS p ON p.id = a.project_id
WHERE p.id = 6;
