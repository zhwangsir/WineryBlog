text = "苹果 香蕉 苹果 橙子 苹果 香蕉"
counter = {}
for word in text.split():
    counter[word] = counter.get(word, 0) + 1   # 没出现过先当作 0
print(counter)  # {'苹果': 3, '香蕉': 2, '橙子': 1}
