import java.util.*;

public class BorrowStats {
    public static void main(String[] args) {
        String[] records = { "三体", "三体", "红楼梦", "三体", "红楼梦", "活着" };

        // Step 1：用 HashMap 统计借阅次数
        Map<String, Integer> count = new HashMap<>();
        for (String book : records) {
            count.merge(book, 1, Integer::sum);   // 没有就放 1，有就累加
        }
        System.out.println(count);

        // TODO（Step 2）：把 entrySet 接成 Stream，按值降序，取前 2 名输出「书名 × 次数」
        // TODO（Step 3）：用 Set 的 retainAll（交集）找出两个人共同借过的书
    }
}
