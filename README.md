# Coverity Semantic Graph — VSCode Extension

基于 Coverity 真实编译捕获的 VSCode C/C++ 语义增强插件。
专为 **Green Hills / IAR / TI 等嵌入式工具链**设计——内置 C/C++ 插件的 IntelliSense
无法解析这些编译器的非标准选项与语言扩展，本插件跳过猜参数、直接查询编译器级
知识图谱，所有跳转与引用均经编译器验证。

后端（索引器 + MCP Server + LSP Server）见独立仓库：
[csg-mcp-server](https://github.com/yuejunwei1989/csg-mcp-server)。

## 功能

| 功能 | 说明 |
|------|------|
| **定义跳转**（F12） | 编译器解析的真实定义位置，跨文件、跨模块准确 |
| **查找引用**（Shift+F12） | 全部调用者位置，无 grep 同名误报 |
| **悬停信息** | 实体类型、定义位置、所属编译器版本、该文件 Coverity 缺陷数 |
| **调用层级**（Shift+Alt+F12） | VSCode 原生 Incoming / Outgoing Calls 视图 |
| **缺陷诊断** | 打开 C/C++ 文件自动在问题面板发布 Coverity 缺陷（CID + checker + 描述） |

## 安装

### 方式一：安装已打包的 vsix（推荐）

```bash
code --install-extension coverity-semantic-graph-0.1.0.vsix
```

或在 VSCode 中：扩展面板 → `...` → **从 VSIX 安装...**

### 方式二：源码构建

```bash
npm install
npm run compile        # tsc 编译到 out/
npx @vscode/vsce package --no-dependencies   # 重新打包 vsix
```

## 前置条件：先建图库

插件不解析代码，只查询 **csg-index 产出的 SQLite 图库**：

```bash
git clone https://github.com/yuejunwei1989/csg-mcp-server
cd csg-mcp-server && pip install .

# Coverity 环境（真实模式）
csg-index --idir /path/to/idir --db ./graph.db --coverity-home /opt/coverity
# 或无 Coverity 环境（模拟模式，体验功能）
python3 tests/mock_data.py mock_idir && csg-index --db ./graph.db --mock mock_idir
```

## 配置

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `csg.dbPath` | `${workspaceFolder}/graph.db` | CSG 图库路径（可用命令 `CSG: 选择图库文件` 图形化选择） |
| `csg.pythonPath` | `python3` | 运行 `csg-ls` 的 Python 解释器 |

插件激活时机：打开任何 C/C++ 文件时自动启动内置 LSP（`csg-ls`，随 pip install 一起安装）。

## 使用建议

- 建议与内置 C/C++ 插件**共存**：日常补全/格式化用 IntelliSense，语义导航与缺陷用本插件；
- 若出现定义跳转冲突，可调整内置插件的相关跳转设置；
- 遇到 "图库不存在" 警告：执行命令面板中的 **CSG: 选择图库文件**，或检查 `csg.dbPath`；
- 修改代码后重新运行 `csg-index` 刷新图库（CI 集成可自动化，见后端仓库 README）。

## 架构一句话

插件是薄壳（~100 行 TypeScript），核心查询能力全部在 `csg-ls` 语言服务器中；
它与其余端共享同一个 `graph.db`——开发者（VSCode）与 AI Agent（MCP）看到同一份编译器级事实。

## 已知限制

- 图库为构建时快照，代码修改后需重新运行 `csg-index`；
- 悬停中的编译器/缺陷信息依赖图库中对应 TU 与缺陷记录。
