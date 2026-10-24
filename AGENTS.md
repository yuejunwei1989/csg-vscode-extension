# AGENTS.md — CSG-VSCode-Extension 开发指南

> 本文件面向 AI 编码代理，提供继续开发所需的全部上下文。

## 项目是什么

Coverity Semantic Graph 的 VSCode 薄壳插件：通过 LSP 连接后端 `csg-ls` 语言服务器，
为 C/C++（尤其 GHS/IAR 嵌入式工具链）提供编译器级的定义跳转、引用、悬停、调用层级、缺陷诊断。

- 后端仓库：https://github.com/yuejunwei1989/csg-mcp-server（本插件不解析代码，只做 LSP 客户端）
- 插件本体：`src/extension.ts`（~100 行），编译产物在 `out/`，已打包 `coverity-semantic-graph-0.1.0.vsix`

## 代码地图

```
package.json      # 插件清单：csg.dbPath / csg.pythonPath 配置项、csg.selectDb / csg.restart 命令
src/extension.ts  # 全部逻辑：启动 LanguageClient（python -m csg.lsp_server，env CSG_DB）
out/extension.js  # tsc 编译产物
coverity-semantic-graph-0.1.0.vsix  # 已打包发行版
```

## 常用命令

```bash
npm install
npm run compile                                  # tsc → out/
npx @vscode/vsce package --no-dependencies       # 重新打包 vsix（改代码后必须重打包）
```

## 关键设计决策（勿破坏）

1. **薄壳原则**：所有语义逻辑在后端 csg-ls，本仓库只负责生命周期管理（启动/重启/选库）；
2. 激活时机：onLanguage:c / onLanguage:cpp，打开 C/C++ 文件自动拉起 LSP；
3. dbPath 缺失时警告但不崩溃，引导用户执行 "CSG: 选择图库文件"；
4. 与内置 C/C++ 插件共存，不做编辑能力（补全/格式化交给 IntelliSense）。

## 当前状态与待办（2026-10-25）

已完成：LSP 客户端集成、vsix 打包、双端仓库部署。

**下一步（按优先级）：**
1. **P1 状态栏指示**：显示图库连接状态（TU 数/索引时间），索引过期提醒
2. **P1 代码透镜**：函数上方显示 "N callers / M calls"，点击走调用层级
3. **P2 缺陷面板增强**：CID 可点击跳转 Coverity Connect 平台链接
4. **P2 图谱视图**：Webview 可视化调用图（数据源 blast_radius/call_path）
5. **P2 发布**：Open VSX / VS Marketplace（需 publisher 账号）

## 环境约束备忘

- vsce 打包参数：`--no-dependencies --skip-license`
- node_modules 不入库；沙箱中 npm 可用，github.com:443 被阻断（推送用 Contents API）
- 后端格式校准（真实 Coverity idir）见 csg-mcp-server 仓库 AGENTS.md 的 P0 项
