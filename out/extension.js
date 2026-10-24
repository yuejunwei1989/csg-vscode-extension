"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("csg.selectDb", selectDb), vscode.commands.registerCommand("csg.restart", startClient));
    startClient();
}
async function selectDb() {
    const pick = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        filters: { "CSG Graph DB": ["db"] },
    });
    if (pick && pick[0]) {
        await vscode.workspace
            .getConfiguration("csg")
            .update("dbPath", pick[0].fsPath, vscode.ConfigurationTarget.Workspace);
        startClient();
    }
}
function startClient() {
    if (client) {
        client.stop();
        client = undefined;
    }
    const cfg = vscode.workspace.getConfiguration("csg");
    let dbPath = cfg.get("dbPath", "${workspaceFolder}/graph.db");
    dbPath = dbPath.replace("${workspaceFolder}", vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? ".");
    if (!require("fs").existsSync(dbPath)) {
        vscode.window.showWarningMessage(`CSG: 图库不存在 (${dbPath})。请先运行 csg-index，或执行 "CSG: 选择图库文件"。`);
        return;
    }
    const python = cfg.get("pythonPath", "python3");
    const serverOptions = {
        command: python,
        args: ["-m", "csg.lsp_server"],
        transport: node_1.TransportKind.stdio,
        options: { env: { ...process.env, CSG_DB: path.resolve(dbPath) } },
    };
    const clientOptions = {
        documentSelector: [{ language: "c" }, { language: "cpp" }],
        synchronize: { configurationSection: "csg" },
    };
    client = new node_1.LanguageClient("csg", "Coverity Semantic Graph", serverOptions, clientOptions);
    client.start();
    vscode.window.showInformationMessage("CSG: 编译器级语义服务已启动");
}
function deactivate() {
    return client?.stop();
}
//# sourceMappingURL=extension.js.map