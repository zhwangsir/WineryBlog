-- 数据库环境：想查什么就写什么，点右上角「运行」看结果
-- 右侧列出了练习库里的表，点表名可以查看数据

-- 每个部门有多少人？
SELECT d.name AS 部门, COUNT(*) AS 人数
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.id
ORDER BY 人数 DESC;
