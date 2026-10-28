# taller666 的笔记

这里是用 Markdown 文件夹维护的个人笔记网站。分类自动来自 `content/` 下的文件夹；章节可采用左右独立滚动的对照布局，也可只显示正文。支持数学公式、图片、PDF 内嵌阅读与附件、自排右栏。

## 日常使用

1. 双击 **新增章节.cmd**，输入分类、章节名，生成草稿。
2. 编辑 `content/<分类>/<章节>/index.md`，把原图放进 `right/`，附件放进 `files/`。
3. 需要查看新章时，将 `draft: true` 改为 `draft: false`。
4. 双击 **本地预览.cmd**；修改保存后会自动更新。此时只影响本地，发布后才更新线上网站。
5. 维护者双击 **发布网站.cmd**，检查改动摘要，输入 `Y` 并按回车后提交并推送；输入 `N` 并按回车则取消。大小写及全角字母均可，空输入或其他内容会提示重新输入。已关联 GitHub 的托管平台自动部署。协作者请使用下面的新分支与 PR 流程。

GitHub 提交说明应写清改动的分类和章节。发布工具会按实际暂存的文件自动生成，例如 `更新笔记：电磁学/静电场`；同时修改多章会列出所有章节，右栏图片和附件也会归到所属章节。还可以追加具体改动，例如 `更新笔记：电磁学/静电场；补充高斯定理例题`。手动提交或创建 PR 时，也请使用包含章节名的标题，不要只写“更新笔记”。

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

### 在笔记里直接阅读 PDF

把 PDF 放进本章的 `files/`，在左栏 `index.md` 或右栏 `right.md` 中单独写一行：

```markdown
![[files/讲义.pdf]]
```

也支持 `![手写笔记](files/讲义.pdf)`。阅读模式和讲课模式都会显示 PDF 阅读框；翻页、缩放使用浏览器自带的 PDF 工具栏。想从某页开始，可写 `![[files/讲义.pdf#page=3]]`（取决于浏览器支持）。每个阅读框都保留“新窗口打开”链接；手机或关闭内嵌 PDF 预览的浏览器可用该链接阅读或下载。

普通的 `[打开讲义](files/讲义.pdf)` 仍然只显示链接。内嵌阅读支持本章目录内的 PDF，外部 PDF 地址会显示打开链接。文件路径相对于本章目录，PDF 必须随 Markdown 一起提交；不要写本机 `C:\...` 路径。保存后可在本地预览，发布后才更新线上网站。

当前静电场笔记位于 `content/电磁学/01-静电场/index.md`。旧 `sources/` 文件仅作历史备份，网站不再读取它们，也不依赖本机 AFB 文件夹。

## 多人协作：新增章节与本地预览（Windows）

每个人都可以在自己的电脑上新增章节、修改笔记，保存后查看完整网页效果，包括导航、公式和左右栏。**本地预览不需要等待维护者审核，也不会直接更新正式网站。**

### 1. 首次准备

安装 Node.js（本项目使用 `22.16.0`）和 Git，安装后重新打开 PowerShell，确认 `node --version` 和 `git --version` 能正常运行。

已接受仓库协作邀请的成员，在准备存放项目的文件夹中打开 PowerShell，执行：

```powershell
git clone https://github.com/taller666/physics.git
cd physics
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="1"
npm.cmd ci
```

如果通过 Fork 参与，先在 GitHub 上将仓库 Fork 到自己的账号，再把上述克隆地址替换为自己 Fork 的仓库地址。安装依赖只需首次执行；后续若 `package-lock.json` 更新，再执行 `npm.cmd ci`。使用 `npm.cmd` 可避免 PowerShell 对 `npm.ps1` 的执行策略限制。

开始自己的修改前，创建一个工作分支，例如：

```powershell
git switch -c notes/my-new-chapter
```

分支名换成能区分作者或任务的名称。下次开始新任务前，先保存当前工作并同步原仓库最新内容；Fork 用户可先在 GitHub 上使用 Sync fork，再同步到本地。

### 2. 新增章节或分类

在克隆下来的项目文件夹中，双击 **新增章节.cmd**，按提示填写。例如：

- 分类：`电磁学`
- 章节文件夹：`02-静磁场`
- 显示标题：`静磁场`

工具会创建以下结构，已有同名章节不会被覆盖；分类不存在时也会自动建立：

```text
content/电磁学/02-静磁场/
  index.md       左侧笔记及章节设置
  right/         右侧题目、手写笔记截图
  files/         PDF 等附件
```

也可以在项目目录用命令创建：

```powershell
npm.cmd run new:chapter -- "电磁学" "02-静磁场" "静磁场"
```

编辑新章的 `index.md`，将顶部的 `draft: true` 改为 `draft: false`，新章节才会出现在本地预览的分类与导航中。**这只让章节进入当前构建，并不等于已经发布到正式网站。**

把右栏截图放进本章的 `right/`，按 `01.png`、`02.png` 等命名，程序会自动展示。需要在右栏混排文字、公式和图片时，再复制 `templates/章节模板/right.md` 到本章目录编辑；存在 `right.md` 后，图片需要在该文件中逐张引用。附件放进 `files/`，并在正文中添加相对链接。

### 3. 保存后查看网页变化

双击项目根目录的 **本地预览.cmd**，或在项目目录执行：

```powershell
npm.cmd run dev
```

首次构建完成后，浏览器会自动打开本机预览地址。**保持运行窗口开启，继续编辑 Markdown、添加图片或新增章节；保存后程序会自动重新构建，成功后刷新浏览器。** 以终端显示的预览地址为准，默认通常为 `http://127.0.0.1:3032/`；端口被占用时会另选可用端口。

本机预览地址只用于当前电脑。关闭运行窗口或按 `Ctrl+C` 会停止预览；下次继续写作时重新打开即可。如果保存后没有变化，查看终端是否有构建错误，并确认新章已设置 `draft: false`。构建失败时会保留上一次成功的页面。

### 4. 写好后提交给维护者

先检查本地网页，再把自己的修改提交到工作分支。下面以新增静磁场章节为例，路径和分支名应替换成自己实际使用的名称：

```powershell
git status --short
git add -- "content/电磁学/02-静磁场"
git diff --cached --stat
git commit -m "新增静磁场章节"
git push -u origin notes/my-new-chapter
```

首次提交若提示没有作者身份，可在本仓库设置 `git config user.name "你的名字"` 和 `git config user.email "你的提交邮箱"`，再重新提交。邮箱可使用 GitHub 提供的 noreply 地址。

推送后，在 GitHub 上创建 **Pull Request（修改申请，简称 PR）**，目标选择 `taller666/physics` 的 `main` 分支。维护者审核并合并后，已关联的 EdgeOne 会自动构建；部署成功后正式网站才会更新。

**协作者提交 PR 时不要使用“发布网站.cmd”。** 这个按钮目前只支持维护者在 `main` 上直接提交并推送，不会自动创建分支或 PR。日常写作使用“新增章节.cmd”和“本地预览.cmd”即可。

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
