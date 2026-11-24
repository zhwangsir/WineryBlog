import java.util.*;
import java.util.stream.*;

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

// Step 1：filter 筛选 + map 转换——只留单价不低于 150 的商品，再把每个商品换成它的名称
System.out.println("== 单价 150 元以上的商品 ==");
products.stream()
    .filter(p -> p.price() >= 150)
    .map(Product::name)
    .forEach(System.out::println);
// 机械键盘
// 蓝牙耳机
// 显示器
// 挂耳咖啡礼盒

// Step 2：sorted 排序 + limit 截取——按单价从高到低，只取前 3 件
System.out.println("== 单价最高的 3 件商品 ==");
products.stream()
    .sorted(Comparator.comparingDouble(Product::price).reversed())
    .limit(3)
    .map(p -> p.name() + " " + p.price())
    .forEach(System.out::println);
// 显示器 1299.0
// 蓝牙耳机 299.0
// 机械键盘 199.0

// Step 3：collect 收集——按分类分组，并对每组的单价求和
Map<String, Double> totalByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::category,                            // 按什么分组
        LinkedHashMap::new,                           // 用 LinkedHashMap 承装：保持出现顺序，输出稳定
        Collectors.summingDouble(Product::price)));   // 每组怎么汇总
System.out.println("== 各分类的总价 ==");
System.out.println(totalByCategory);
// {数码=1886.0, 图书=152.0, 食品=226.0}
