Set<String> alice = new HashSet<>(List.of("三体", "活着"));
Set<String> bob = new HashSet<>(List.of("三体", "红楼梦"));
alice.retainAll(bob);
System.out.println(alice);   // 期望：[三体]