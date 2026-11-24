import java.util.*;

public class BorrowStats {
    public static void main(String[] args) {
        String[] records = {
            "三体", "三体", "红楼梦", "三体", "红楼梦", "活着"
        };
        Map<String, Integer> count = new HashMap<>();
        for (String book : records) {
            count.merge(book, 1, Integer::sum);   // 不存在放 1，存在则累加
        }
        System.out.println(count);
        // 期望：{三体=3, 红楼梦=2, 活着=1}
    }
}