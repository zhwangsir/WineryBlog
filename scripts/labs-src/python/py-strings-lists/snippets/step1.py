msg = "  Hello, Python 世界  "
print(msg.strip())                         # Hello, Python 世界

sentence = "python java go rust"
print(sentence.split())                    # ['python', 'java', 'go', 'rust']
print(sentence.replace("go", "golang"))    # python java golang rust
print("-".join(["python", "java", "go"]))  # python-java-go
