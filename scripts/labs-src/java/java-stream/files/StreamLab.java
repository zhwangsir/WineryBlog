import java.util.*;
import java.util.stream.*;

// 点右上角的「运行」：下面的代码会被粘贴进右侧的 jshell 逐段求值，System.out.println 的内容原样显示

// 商品：name 名称、category 分类、price 单价
// record 会自动生成构造器、访问器 name() / category() / price()，以及可读的 toString
record Product(String name, String category, double price) {}

// 商品清单
List<Product> products = List.of(
    new Product("机械键盘", "数码", 199.0),
    new Product("无线鼠标", "数码", 89.0),
    new Product("蓝牙耳机", "数码", 299.0),
    new Product("显示器", "数码", 1299.0),
    new Product("三体", "图书", 23.0),
    new Product("深入理解Java虚拟机", "图书", 129.0),
    new Product("咖啡豆", "食品", 68.0),
    new Product("挂耳咖啡礼盒", "食品", 158.0)
);

// 示例（已写好）：起一个流，逐个打印商品——点「运行」就能看到 8 行输出
System.out.println("== 全部商品 ==");
products.stream().forEach(System.out::println);

// TODO（Step 1）：filter + map
//   先打印小标题「== 单价 150 元以上的商品 ==」，然后从 products.stream() 开始：
//   用 filter 只保留单价不低于 150 的商品，用 map 把每个商品换成它的名称，最后 forEach 逐行打印

// TODO（Step 2）：sorted + limit
//   打印小标题「== 单价最高的 3 件商品 ==」：按单价从高到低排序，只取前 3 件，
//   每件用 map 拼成「名称 单价」的形式打印（例如：显示器 1299.0）

// TODO（Step 3）：collect
//   用 Collectors.groupingBy 按分类分组、Collectors.summingDouble 对每组的单价求和，
//   收集成 Map<String, Double>（用 LinkedHashMap 承装，保持出现顺序）；
//   打印小标题「== 各分类的总价 ==」后输出这个 Map
