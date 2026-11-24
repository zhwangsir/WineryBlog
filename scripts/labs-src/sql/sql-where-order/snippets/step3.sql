-- LIKE：% 匹配任意多个字符，以「总监」结尾的职位都算
SELECT name, title FROM employees WHERE title LIKE '%总监';

-- ORDER BY 多列：先按第 1 个键排，相同的再按第 2 个键排。DESC 是降序，ASC（可省略）是升序
SELECT name, dept_id, salary FROM employees WHERE dept_id = 5 ORDER BY salary DESC;
