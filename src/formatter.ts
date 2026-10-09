import * as vscode from 'vscode';
import { spawn } from 'child_process';

function packerFmt(text: string): Promise<string> {
  const packerPath = vscode.workspace.getConfiguration('packer').get<string>('path', 'packer');
  return new Promise((resolve, reject) => {
    const proc = spawn(packerPath, ['fmt', '-']);
    let out = '';
    let err = '';
    proc.stdout.on('data', (d: string) => (out += d));
    proc.stderr.on('data', (d: string) => (err += d));
    proc.on('error', (e: Error) => reject(new Error(`Could not run "${packerPath}": ${e.message}`)));
    proc.on('close', (code: number) => (code === 0 ? resolve(out) : reject(new Error(err || `exit code ${code}`))));
    proc.stdin.end(text);
  });
}

const provider: vscode.DocumentFormattingEditProvider = {
  async provideDocumentFormattingEdits(doc) {
    try {
      const formatted = await packerFmt(doc.getText());
      const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
      return [vscode.TextEdit.replace(fullRange, formatted)];
    } catch (e) {
      vscode.window.showErrorMessage(`packer fmt failed: ${(e as Error).message}`);
      return [];
    }
  }
};

export function activate(context: vscode.ExtensionContext) {
  for (const lang of ['packer', 'packervars']) {
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(lang, provider));
  }
}

export function deactivate() {}