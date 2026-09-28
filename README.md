# 静电场习题课 · Slidev 双栏滚动版

左栏显示《静电场.md》的原稿正文，右栏按原顺序显示 20 张习题截图。两栏独立滚动，各有“回到顶部”；点击截图可放大，按 Escape 或点击“关闭”退出放大。

## 本地运行与编辑

使用 **Node.js 22.16.0**（版本记录在 `.node-version`），在项目根目录执行：

```sh
npm ci
npm run prepare:notes -- "sources/静电场-原稿.md"
npm run dev
```

后续直接编辑仓库中的 [sources/静电场-原稿.md](sources/静电场-原稿.md)。修改后重新执行上面的 `prepare:notes` 命令，开发服务器会更新展示。请保留原稿中的三个主要标题和截图引用，以维持章节分组与图片顺序。

**发布以仓库文件为准。** Cloudflare 无法访问本机 `AFB` 文件夹；本地外部原稿的修改不会自动同步到 GitHub。`build:pages` 会强制选用仓库原稿，不依赖外部文件路径。

制作正式展示版本：

```sh
npm run build:pages
node scripts/launch.mjs
```

构建后也可在 Windows 双击 **启动课件.cmd**，启动本机服务并打开浏览器。保留命令窗口，关闭窗口即可停止服务。`dist/` 是生成产物，不提交到 Git；新克隆的仓库需要先构建。不要直接双击 `dist/index.html`。

## Cloudflare Workers · GitHub 集成

如果控制台中有 **Deploy command**、**Build token** 等字段，使用下面的 Workers 配置：

| 配置项 | 值 |
|---|---|
| Worker 名称 | `physics`（与 `wrangler.jsonc` 一致） |
| 生产分支 | `main` |
| Build command | `npm run build:workers` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/`（仓库根目录） |
| Build variable `NODE_VERSION` | `22.16.0` |
| Build variable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` |

命令中的 `build:workers` 必须连在一起，冒号后没有空格。`wrangler preview` 用于预览；正式发布使用 `wrangler deploy`。Build variables 是构建环境变量，请在构建设置中添加。

`build:workers` 先生成原稿展示数据并编译课件，再移除仅用于 Pages 的重写文件。`wrangler.jsonc` 配置静态资源与单页应用回退，支持直接访问或刷新 `/1`、`/2`、`/presenter/1` 等地址。

## Cloudflare Pages · GitHub 集成（另一种部署方式）

连接仓库 [taller666/physics](https://github.com/taller666/physics)，按以下配置部署：

| 配置项 | 值 |
|---|---|
| 框架预设 | `None` |
| 根目录 | 留空（项目文件位于仓库根目录） |
| 构建命令 | `npm run build:pages` |
| 构建输出目录 | `dist` |
| 环境变量 `NODE_VERSION` | `22.16.0` |
| 环境变量 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` |

`build:pages` 先由仓库原稿生成展示数据，再构建 Slidev。静态网站构建不需要下载 Playwright 浏览器。后续将修改提交并推送到所选生产分支，Pages 会重新构建。

请提交 `package.json`、`package-lock.json`、`.node-version`、课件源码、`scripts/`、`sources/`、`data/` 与 `public/`。20 张截图也必须入库；`.gitignore` 已排除依赖目录、构建产物和本地检查文件。

## 内容文件

- `sources/静电场-原稿.md`：当前左栏内容的编辑源。
- `public/originals/01.png` 至 `20.png`：原题截图，编号按原笔记的嵌入顺序。
- `data/notes.json`、`data/screenshots.json`：生成后的笔记展示数据与截图对应关系。
- `slides.md`：四个视图的入口。
- `layouts/scroll-notes.vue`、`scroll.css`：独立滚动布局与样式。

截图已保存在仓库中，因此部署不需要 AFB 文件夹或两份参考 PDF。右栏只展示原图。

本机保留的 `sources/静电场-补全-old.md` 与 `sources/补全说明.md` 属于历史备份，不自动加载，也不纳入发布仓库。

## 讲课操作与打印

四个页签为“全部内容、库仑定律、基本性质、数学”。鼠标移入哪一栏，就滚动哪一栏；左栏的小节定位不会改变右栏位置。过长公式可横向滚动，浏览器 F11 可进入全屏，Slidev 的 `P` 打开演讲者视图。

这是长内容滚动课件，普通 Slidev PDF 导出只会截取当前可见区域。完整正文见 `sources/静电场-原稿.md`，完整原图见 `public/originals/`。
