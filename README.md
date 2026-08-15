<p align="center">
  <img src="docs/黑色大肥鱼.png" width="120" alt="dsh-desktop-zero logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
  <img src="https://github.com/LambProgrammer/dsh-desktop-zero/actions/workflows/build.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/github/v/release/LambProgrammer/dsh-desktop-zero" alt="Release" />
</p>

> ⚠️ **非官方社区封装版（Unofficial community build）**
> 本项目与 DeepSeek 官方无任何隶属关系，非 DeepSeek 官方发布，仅为社区爱好者对 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面化封装。DeepSeek Harness 及其官方标识的版权归原作者所有，本项目仅作封装与识别用途。

# Dsh Desktop Zero——即插即用 · 零配置 · 开箱即用

**下载 → 双击 → 开聊。** dsh-desktop-zero 是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 桌面封装应用，双击 `.exe` 直接打开 DSH 图形界面，**无需安装 Node.js、无需联网下载任何依赖**。

项目名中的 **"zero"** 代表：**零配置、零依赖、开箱即用**。

### ✨ 特点

- 🚀 **即插即用** — 双击 `.exe` 直接运行，无需安装 Node.js、无需联网下载依赖
- 📦 **零依赖** — 内置完整运行时与 DSH 全套依赖，开箱即用
- 🖥️ **双形态** — 安装版（长期使用）+ 便携版（U 盘携带）
- 🎨 **品牌闪屏** — 优雅的鲸鱼娘启动画面
- 🔒 **数据隔离** — 与官方 DSH 数据完全隔离，多实例互不干扰
- ⚡ **CI 自动发布** — 推送版本标签即自动打包并发布到 Releases

## 📸 效果预览

<p align="center">
  <img src="docs/鲸鱼娘-黑色.png" width="180" alt="鲸鱼娘" />
</p>

| 安装版启动闪屏 | 便携版加载画面 | DSH 主界面 |
|:---:|:---:|:---:|
| ![安装版启动闪屏](docs/安装版-加载.png) | ![便携版加载画面](docs/便携版-加载.png) | ![DSH 主界面](docs/GUI界面.png) |

## 两种使用方式

| 版本 | 适用场景 |
|---|---|
| **安装版（Setup）** `dsh-desktop-zero-Setup-x.y.z.exe` | **推荐使用（首选）**。双击安装到系统，自动生成桌面快捷方式和开始菜单，可在"设置→应用"中卸载。启动快，数据随安装目录，卸载即清。 |
| **便携版（Portable）** `dsh-desktop-zero-Portable-x.y.z.exe` | 临时使用或 U 盘携带。单文件免安装，不写注册表，删除文件即完成卸载。**注意**：由于便携版需要先自解压（约 1-2 分钟，期间显示启动画面），启动速度明显慢于安装版，**日常长期使用请优先选择安装版**。 |

> 两种版本功能完全相同，仅安装形态与启动速度不同。

## 首次使用

1. 下载并运行安装版或便携版。
2. 安装版安装时，如提示"为谁安装"，选择 **"仅为我安装"** 即可（无需管理员权限；自定义安装目录仍可自由选择）。
3. 首次运行需要**自行配置 DeepSeek API Key**：在打开的 DSH 界面中进入设置，填入你的 API Key（可从 DeepSeek 开放平台获取）。
4. 开始使用。

## 常见问题

- **Windows SmartScreen 提示"未知发布者"？**
  本项目为社区非签名构建，属正常现象。点击 **"更多信息" → "仍要运行"** 即可。

- **安装包体积很大？**
  正常现象。应用内置了完整的 Node.js 运行时（独立 node.exe）、Electron 桌面框架和 DSH 全套依赖（安装版/便携版约 150MB），这是"零依赖开箱即用"的代价。

- **杀毒软件误报？**
  未签名的 Electron 应用偶有误报，添加信任即可。项目完全开源，可自行审查源码后构建。

- **端口冲突？**
  应用每次启动会自动分配可用端口，无需手动处理。

- **目录选择器怎么用？**
  设置工作区时弹出的选择器为浏览器风格（官方 DSH 设计）：点击列表逐层进入目录；顶部的路径面包屑可点击跳转，也可直接点击路径文本手动输入（换盘符请直接输入 `D:\` 之类路径后回车）。

- **数据存在哪里？**
  本封装版使用**独立数据目录**，与官方 DSH 的 `~/.dsh` 完全隔离，多实例同时运行互不干扰、不会损坏数据：
  - 安装版：`<安装目录>\data`（跟随你选择的安装位置，卸载应用时数据一并清除，不留隐私痕迹）
  - 便携版：`%LOCALAPPDATA%\dsh-desktop-zero-portable\data`（删除便携版 exe 后如需彻底清理，手动删除此目录即可）
  - 官方 npx DSH 数据仍在 `~/.dsh`，不受影响

- **部分 Windows 10 机器上 PowerShell/目录选择器崩溃？**
  这是 DSH 官方依赖的原生模块 koffi 与特定机器环境的兼容性问题（官方仓库已确认：[Discussion #197](https://github.com/deepseek-ai/deepseek-harness/discussions/197)），表现为退出码 `0xC0000005` 或 `0xC0000142` 的原生崩溃，官方 npx 版本同样受影响。本封装版已通过内置独立 Node 运行时规避了大多数场景，但少数机器仍可能触发该底层问题，**需等待 DeepSeek 官方发布修复 koffi 兼容性的 DSH 新版本**。作为临时规避，可在应用内将权限模式切换为"完全访问（danger-full-access）"后使用。

## 技术栈

- [Electron](https://www.electronjs.org/) — 桌面容器（自绘标题栏）
- [electron-builder](https://www.electron.build/) — 打包（NSIS 安装版 + Portable 便携版）
- [@deepseek-ai/dsh](https://www.npmjs.com/package/@deepseek-ai/dsh) — DeepSeek Harness 本体
- 内置独立 Node.js 运行时，DSH 以标准 Node 进程运行（保证 koffi 等原生模块在正确 ABI 下工作），渲染进程用 iframe 承载界面，启动时自动分配空闲端口

## 从源码构建

```bash
npm install
npm run build   # 产出 dist/dsh-desktop-zero-Setup-*.exe 与 dist/dsh-desktop-zero-Portable-*.exe
```

GitHub Actions 已配置：推送 `v*` 标签即自动构建并发布到 Releases。

## 许可证

本项目源码以 [MIT License](LICENSE) 开源。DeepSeek Harness 及其关联组件（`@deepseek-ai/*` 系列包、官方标识等）的版权归其各自所有者所有，不受本项目许可证约束。

## 免责声明

- 本项目仅供学习交流，使用风险自负。
- 请遵守 DeepSeek 服务条款与所在地法律法规。
- 本项目与 DeepSeek 官方无任何关系，请勿用于商业用途混淆官方产品。
