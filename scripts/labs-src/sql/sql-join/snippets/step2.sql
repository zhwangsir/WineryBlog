-- LEFT JOIN：左表的行全部保留，右表没有匹配时补 NULL
SELECT p.name AS 项目, a.role AS 角色
FROM projects AS p
LEFT JOIN assignments AS a ON a.project_id = p.id
WHERE p.id IN (7, 8);
