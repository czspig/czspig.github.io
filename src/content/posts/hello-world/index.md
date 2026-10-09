---
title: 你好，世界 ⚡
published: 2026-10-09
description: czspig's blog 正式开张！这里记录一下博客是怎么搭起来的，以及以后怎么写文章。
image: ./cover.webp
tags: [博客, Astro, 奇犽]
category: 随笔
draft: false
pinned: true
---

欢迎来到 **czspig's blog**！

这个博客基于开源主题 [Mizuki](https://github.com/LyraVoid/Mizuki)（Astro + Tailwind CSS）搭建，换上了奇犽的「神速·雷光」配色。

## 怎么写一篇新文章

在 `src/content/posts/` 下新建一个文件夹，里面放一个 `index.md`（封面图也可以放在同一个文件夹里）：

```markdown
---
title: 文章标题
published: 2026-10-09
description: 一句话简介，会显示在首页卡片上
image: ./cover.webp
tags: [标签1, 标签2]
category: 分类
draft: false
---

正文从这里开始……
```

也可以直接运行 `pnpm new-post 文件名` 自动生成。

## 一些小技巧

> [!TIP]
> 支持 GitHub 风格的提示框，比如 `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`。

数学公式也没问题：$E = mc^2$

> 小杰，你就是光。 —— 奇犽
