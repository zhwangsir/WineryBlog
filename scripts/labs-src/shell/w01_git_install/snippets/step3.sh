# 编辑 app.txt 为：
# main 版本
# feature 版本
# feature 追加行

git add app.txt
git commit -m "merge: 合并 feature，手工解决冲突"
git log --oneline --graph | head -5