git init demo && cd demo
echo "v1" > app.txt && git add . && git commit -m init

git switch -c feature
echo "feature 版本" > app.txt && git commit -am "feat: feature 版本"
echo "feature 追加行" >> app.txt && git commit -am "feat: 追加"

git switch main
echo "main 版本" > app.txt && git commit -am "main: 修改同一文件"