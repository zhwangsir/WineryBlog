// 在下面写代码，然后点「运行」——右侧终端会像 Kotlin 交互式环境一样求值并输出 println 的内容

// TODO（Step 1）：空安全
//   声明 val name: String? = null，分别用 name?.length 和 name ?: "默认名" 访问它，各 println 一次

// TODO（Step 2）：数据类
//   定义 data class User(val name: String, val age: Int)，创建一个实例并打印；再用 copy 改一个字段

// TODO（Step 3）：扩展函数 + 集合操作符
//   给 String 扩展一个 shout() 方法（uppercase() + "!!!"）；
//   对 listOf(1, 2, 3, 4, 5) 先 filter 出偶数、再 map 乘以 10
