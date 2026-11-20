---
title: Git 高级技巧与团队工作流
category: 编程基础与工具
order: 12
tags: [Git, rebase, 团队协作, 工作流]
summary: rebase 与 merge 的真相、交互式变基改写历史、解决冲突的章法、团队分支模型——从会用 Git 到驾驭 Git。
---

## 1. 心智模型升级：Git 是提交图

入门时把 Git 当"快照备份"，进阶要换成正确的模型：

> **Git 是一张有向无环图（DAG），每个 commit 是一个节点，分支只是指向某个节点的可移动指针。**

```
main:     A───B───C
                    \
feature:             D───E     （从 B 分叉）
```

理解这张图，rebase/merge/cherry-pick 全部豁然开朗——它们都是"节点与指针的搬运操作"。

## 2. merge vs rebase：同一件事的两种历史观

把 feature 分支合回 main：

```
merge:   A─B─C─F─────      F 是合并提交，有两个父节点
          \   /
feature:   D─E              历史如实记录"真的分叉过"

rebase:   A─B─C─D'─E'       D/E 被"搬家"到 C 之后
                            历史变成一条直线，仿佛从未分叉
```

- **rebase 重写了 commit 身份**（新节点 D'/E'，旧的 D/E 成孤儿）——**已推送到共享分支的提交绝不能 rebase**（别人基于旧节点的工作会全部冲突）
- 团队守则（黄金法则）：**rebase 只用于"整理自己的未推送提交"**；合并进主分支用 merge（或 PR 的 squash merge）

## 3. 交互式变基：改写自己的提交历史

PR 提交前把 8 个 "fix" "wip" 垃圾提交整理成 3 个干净的：

```bash
git rebase -i HEAD~8
# 打开编辑器：
pick   a1b2c3 feat: 用户登录接口
squash d4e5f6 fix typo              # squash 并入上一条
squash f6a5b7 wip
pick   7c8d9e feat: 登录页表单校验
drop   0aa11b debug log             # 直接丢弃
```

常用动词：`pick`（保留）、`squash`（并入上条）、`reword`（改信息）、`edit`（停下修改内容）、`drop`（删除）。

救急三连：

```bash
git commit --amend          # 改最后一个提交的信息/内容（未推送时）
git reset --soft HEAD~1     # 撤销提交但保留改动在暂存区
git reflog                  # 后悔药：所有 HEAD 移动记录都在
git reset --hard <reflog序号>   # 回到任意历史点（包括"被删除"的提交）
```

**reflog 是 Git 的时光机**——只要 30 天内动过，几乎一切都能找回来。

## 4. 冲突解决章法

冲突 = 两个分支改了同一区域，Git 不知道听谁的：

```
<<<<<<< HEAD
你的改动
=======
对方的改动
>>>>>>> feature-x
```

章法：
1. **理解双方意图再合并**，别无脑选一边（`git log --merge -- <file>` 看两边各自的提交）
2. 小冲突手动编辑；大范围冲突用 `git checkout --ours/--theirs <file>` 整体取一边
3. 解决后 `git add <file>` 标记已解决，全部完成后 `git rebase --continue`（或 `git commit`）
4. 逃课键：`git rebase --abort` / `git merge --abort` 完全回到冲突前

预防大于治疗：**小步提交、勤拉主线**（feature 分支存活越久冲突越大）。

## 5. 团队分支模型

中小团队的实用主义方案（GitHub Flow）：

```
main          永远可部署，受 PR 保护
  └── feature/xxx   每个 PR 一个短命分支（存活 ≤3 天）
```

规则：
1. 从 main 拉 feature 分支 → 开发 → PR → **必须 code review** → squash merge 回 main → 删分支
2. `main` 设分支保护：禁止直接 push、必须过 CI
3. 提交信息规范：`feat:/fix:/docs:/refactor:` 前缀（Conventional Commits），自动生成 CHANGELOG
4. 上线出问题 → `git revert <commit>`（生成反向提交，不改历史）——**生产回滚永远用 revert 不用 reset**

大团队/需要多版本维护（如移动端发版）再加 release 分支（Git Flow）；持续部署的公司 GitHub Flow 就够。

## 6. 高频救急场景速查

```bash
# 把某个 commit 单独"摘"到当前分支
git cherry-pick <hash>

# 暂存手头工作切去救火
git stash push -m "登录页改到一半"
git stash pop                # 回来恢复

# 找出哪次提交改坏的（二分定位）
git bisect start
git bisect bad               # 当前是坏的
git bisect good v1.2.0       # 这个版本是好的 → 自动二分，你只需反复 bad/good

# 看某行的最后修改者
git blame -L 42,45 file.ts

# 只提交文件的部分改动（交互式挑 hunk）
git add -p
```

## 7. 团队 Git 卫生清单

- [ ] 分支保护 + 必须 PR review
- [ ] CI 通过才能 merge
- [ ] Conventional Commits 提交规范
- [ ] `.gitignore` 覆盖密钥/构建产物（提交过密钥要立刻轮换，光删文件没用——历史里还在！）
- [ ] feature 分支短命（≤3 天）
- [ ] 生产回滚用 revert

## 延伸阅读

- 站内相关：《Git 分支、合并与团队协作工作流》《Gitee 与远程仓库协作》《Git 安装与基础配置》
- 《Pro Git》（git-scm.com/book 免费中文版）——第 7 章讲透 rebase/reflog
- Oh Shit, Git!?!（git 排错场景合集，诙谐实用）
