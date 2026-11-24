fun String.shout() = uppercase() + "!!!"
println("hello".shout())            // HELLO!!!

val nums = listOf(1, 2, 3, 4, 5)
println(nums.filter { it % 2 == 0 }.map { it * 10 })  // [20, 40]
