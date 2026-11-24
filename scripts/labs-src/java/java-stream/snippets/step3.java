System.out.println("== 各分类的总价 ==");
Map<String, Double> totalByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::category,                            // 按什么分组
        LinkedHashMap::new,                           // 用什么 Map 承装（保持出现顺序）
        Collectors.summingDouble(Product::price)));   // 每组怎么汇总
System.out.println(totalByCategory);
// {数码=1886.0, 图书=152.0, 食品=226.0}
