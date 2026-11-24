student = {"name": "林小满", "age": 24, "city": "杭州"}
student["age"] = 25             # 键已存在：修改
student["major"] = "计算机"      # 键不存在：新增

print(student.get("phone"))             # None
print(student.get("phone", "未填写"))    # 未填写
