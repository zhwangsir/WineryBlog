import java.util.*;

public class BorrowStats {
    public static void main(String[] args) {
        String[] records = { "三体", "三体", "红楼梦", "三体", "红楼梦", "活着" };

        // Step 1：统计——查询多用 ArrayList、去重用 Set、键值映射用 Map
        Map<String, Integer> count = new HashMap<>();
        for (String book : records) count.merge(book, 1, Integer::sum);
        System.out.println(count);                 // {三体=3, 红楼梦=2, 活着=1}

        // Step 2：排行——Map 本身不能排序，先接成 Stream 再按值降序
        count.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(2)
            .forEach(e -> System.out.println(e.getKey() + " × " + e.getValue()));   // 三体 × 3 / 红楼梦 × 2

        // Step 3：交集——Set 的 retainAll 只保留两边都有的元素
        Set<String> alice = new HashSet<>(List.of("三体", "活着"));
        Set<String> bob = new HashSet<>(List.of("三体", "红楼梦"));
        alice.retainAll(bob);
        System.out.println(alice);                 // [三体]
    }
}
