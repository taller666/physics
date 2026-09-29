# taller666 的笔记

这里是用 Markdown 文件夹维护的个人笔记网站。分类自动来自 `content/` 下的文件夹；章节可采用左右独立滚动的对照布局，也可只显示正文。支持数学公式、图片、PDF 附件和自排右栏。

## 日常使用

1. 双击 **新增章节.cmd**，输入分类、章节名，生成草稿。
2. 编辑 `content/<分类>/<章节>/index.md`，把原图放进 `right/`，附件放进 `files/`。
3. 需要查看新章时，将 `draft: true` 改为 `draft: false`。
4. 双击 **本地预览.cmd**；修改保存后会自动更新。此时只影响本地，发布后才更新线上网站。
5. 双击 **发布网站.cmd**，检查改动摘要，输入 `Y` 后提交并推送；Cloudflare 自动部署。

详细操作见 [使用说明.md](使用说明.md)。站名与描述可在 `site.config.json` 修改。

## 首次安装与命令

需要 Node.js **22.16.0**；发布还需要 Git 和已有的 GitHub 登录权限。在项目目录执行：

```sh
npm ci
npm run dev
```

新增章节也可用命令：

```sh
npm run new:chapter -- "电磁学" "02-静磁场"
```

章节不存在 `right.md` 时，右栏按自然顺序展示 `right/` 中的图片。需要题干、证明和图片混排时，再从 `templates/章节模板/right.md` 复制到章节目录编辑。**已有 `right.md` 会取代自动图片画廊，空文件也一样。**

当前静电场笔记位于 `content/电磁学/01-静电场/index.md`。旧 `sources/` 文件仅作历史备份，网站不再读取它们，也不依赖本机 AFB 文件夹。

## Cloudflare Workers

GitHub 仓库：[taller666/physics](https://github.com/taller666/physics)。既有自动部署命令不变：

| 设置 | 值 |
|---|---|
| 生产分支 | `main` |
| Build command | `npm run build:workers` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| `NODE_VERSION` | `22.16.0` |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` |

构建输出在 `dist/`，不提交生成产物或 `node_modules/`。发布工具仅加入 `content/`、`site.config.json` 中的新文件及本项目已跟踪文件的改动；遇到远端领先或分叉会停止，不强推、不自动合并。

只检查发布计划，不执行构建、网络操作或 Git 写入：

```sh
node scripts/publish-site.mjs --dry-run
```
