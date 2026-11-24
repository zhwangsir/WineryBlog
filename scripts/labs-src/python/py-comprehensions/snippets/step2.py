words = ["python", "java", "go", "rust"]
word_len = {w: len(w) for w in words}
print(word_len)    # {'python': 6, 'java': 4, 'go': 2, 'rust': 4}

inverted = {length: w for w, length in word_len.items()}   # 反转：长度 → 单词
print(inverted)    # {6: 'python', 4: 'rust', 2: 'go'}
