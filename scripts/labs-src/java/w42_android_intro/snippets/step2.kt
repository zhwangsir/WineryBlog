data class User(val name: String, val age: Int)
val u = User("Winery", 18)
println(u)                    // User(name=Winery, age=18)
println(u.copy(age = 20))     // 复制并改字段：User(name=Winery, age=20)
