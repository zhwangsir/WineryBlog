// Java / Kotlin 环境：代码会交给 jshell 风格的交互终端执行，点「在终端运行」看结果
import java.util.*;

var names = List.of("林小满", "陈大文", "周小雨");
names.stream().filter(n -> n.length() == 3).count();
System.out.println("你好，Java");
