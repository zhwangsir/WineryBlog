count.entrySet().stream()
    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
    .limit(2)
    .forEach(e -> System.out.println(e.getKey() + " × " + e.getValue()));
// 期望：三体 × 3 / 红楼梦 × 2