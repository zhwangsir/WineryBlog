// Step 1：空安全——只有 String? 可以为 null，访问要用 ?. 或 !!
val name: String? = null
println(name?.length)               // null（不崩）
println(name ?: "默认名")           // 默认名（Elvis 操作符：左侧为 null 时取右侧）

// Step 2：数据类——自动生成 equals / hashCode / toString / copy
data class User(val name: String, val age: Int)
val u = User("Winery", 18)
println(u)                          // User(name=Winery, age=18)
println(u.copy(age = 20))           // User(name=Winery, age=20)

// Step 3：扩展函数 + 集合操作符
fun String.shout() = uppercase() + "!!!"
println("hello".shout())            // HELLO!!!

val nums = listOf(1, 2, 3, 4, 5)
println(nums.filter { it % 2 == 0 }.map { it * 10 })   // [20, 40]
