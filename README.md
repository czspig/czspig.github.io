# czspig-blog

my home

czspig 的个人博客，基于 [Mizuki](https://github.com/LyraVoid/Mizuki) 主题（Astro + Tailwind CSS），奇犽「神速·雷光」风格，部署在 Vercel。

## 本地运行

```bash
npx -y pnpm@11 install
npx -y pnpm@11 dev
```

然后打开 http://localhost:3000

## 写作

- 文章：在 `src/content/posts/` 下新建文件夹，放一个 `index.md`
- 日记：编辑 `src/data/diary.ts`，图片放 `public/images/diary/`
- 追番：编辑 `src/data/anime.ts`
- 相册：在 `public/images/albums/` 下新建文件夹，放图片和 `info.json`

写完后 `git push`，Vercel 会自动重新部署。

## 许可

主题代码遵循 Mizuki 的 Apache-2.0 / MIT 许可，详见 `LICENSE` 与 `LICENSE.MIT`。
