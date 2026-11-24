val name: String? = null
println(name?.length)               // null（不崩）
println(name ?: "默认名")           // 默认名（Elvis 操作符）
