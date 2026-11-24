System.out.println("== 单价最高的 3 件商品 ==");
products.stream()
    .sorted(Comparator.comparingDouble(Product::price).reversed())   // 按单价从高到低
    .limit(3)                                                        // 只取前 3 件
    .map(p -> p.name() + " " + p.price())                            // 拼成「名称 单价」
    .forEach(System.out::println);
// 显示器 1299.0
// 蓝牙耳机 299.0
// 机械键盘 199.0
