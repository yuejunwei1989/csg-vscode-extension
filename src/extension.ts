import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("csg.selectDb", selectDb),
    vscode.commands.registerCommand("csg.restart", startClient)
  );
  startClient();
}

async function selectDb(): Promise<void> {
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

function startClient(): void {
  if (client) {
    client.stop();
    client = undefined;
  }
  const cfg = vscode.workspace.getConfiguration("csg");
  let dbPath = cfg.get<string>("dbPath", "${workspaceFolder}/graph.db");
  dbPath = dbPath.replace(
    "${workspaceFolder}",
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "."
  );
  if (!require("fs").existsSync(dbPath)) {
    vscode.window.showWarningMessage(
      `CSG: 图库不存在 (${dbPath})。请先运行 csg-index，或执行 "CSG: 选择图库文件"。`
    );
    return;
  }
  const python = cfg.get<string>("pythonPath", "python3");
  const serverOptions: ServerOptions = {
    command: python,
    args: ["-m", "csg.lsp_server"],
    transport: TransportKind.stdio,
    options: { env: { ...process.env, CSG_DB: path.resolve(dbPath) } },
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "c" }, { language: "cpp" }],
    synchronize: { configurationSection: "csg" },
  };
  client = new LanguageClient(
    "csg",
    "Coverity Semantic Graph",
    serverOptions,
    clientOptions
  );
  client.start();
  vscode.window.showInformationMessage("CSG: 编译器级语义服务已启动");
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
