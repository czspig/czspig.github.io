# czspig-blog

my home

czspig 的个人博客，基于 [Mizuki](https://github.com/LyraVoid/Mizuki) 主题（Astro + Tailwind CSS），奇犽「神速·雷光」风格，部署在 GitHub Pages。

## 本地运行

```bash
npx -y pnpm@11 install
npx -y pnpm@11 dev
```

然后打开 http://localhost:3000

## 个人工作台

双击根目录的 **`个人工作台.bat`**（或运行 `npx -y pnpm@11 workbench`），浏览器会打开本地后台：

- **日记**：写文字、贴图片、选心情
- **文章**：拖入飞书导出的 `.md` / `.zip`，自动匹配图片，在线编辑和预览
- **追番**：添加番剧、上传封面、一键 +1 集
- **相册**：新建相册、批量上传照片（支持 zip）、设封面

改完点右上角「发布到网站」，会自动提交并推送，GitHub Actions 随后重新部署。

数据位置：文章 `src/content/posts/`，日记 `src/data/diary.json`，追番 `src/data/anime.json`，相册 `public/images/albums/`。

## 许可

主题代码遵循 Mizuki 的 Apache-2.0 / MIT 许可，详见 `LICENSE` 与 `LICENSE.MIT`。
