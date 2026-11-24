// 先打印一行小标题
System.out.println("== 单价 150 元以上的商品 ==");
products.stream()                       // 起一个流
    .filter(p -> p.price() >= 150)      // 只留单价不低于 150 的
    .map(Product::name)                 // 商品 → 名称
    .forEach(System.out::println);      // 逐行打印
// 机械键盘
// 蓝牙耳机
// 显示器
// 挂耳咖啡礼盒
