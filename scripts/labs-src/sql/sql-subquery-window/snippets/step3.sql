-- 窗口函数：每一行都保留，只是多出一列「按月薪从高到低的名次」
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, id) AS 名次
FROM employees
ORDER BY salary DESC, id
LIMIT 5;
