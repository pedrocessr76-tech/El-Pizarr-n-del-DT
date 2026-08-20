import ts from 'typescript';
import path from 'path';

const root = 'C:/Pedro/MetroDev/El_Pizarron_del_DT';
const clientTsConfig = path.join(root, 'apps/client/tsconfig.json');

const config = ts.readConfigFile(clientTsConfig, ts.sys.readFile);
if (config.error) { console.log('config error', config.error.messageText); process.exit(0); }

const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(clientTsConfig));
const program = ts.createProgram({
  rootNames: parsed.fileNames,
  options: parsed.options,
});
const diagnostics = ts.getPreEmitDiagnostics(program);

const filtered = diagnostics.filter(d => {
  // solo errores, ignorar "declared but never read" del cliente (6133) ruido
  return d.category === ts.DiagnosticCategory.Error || d.category === ts.DiagnosticCategory.Warning;
});

const out = [];
for (const d of filtered) {
  let msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  let file = '';
  let line = '';
  if (d.file) {
    const { line: l } = d.file.getLineAndCharacterOfPosition(d.start);
    file = d.file.fileName.replace(root, '.');
    line = String(l + 1);
  }
  out.push(`${file}:${line}: ${msg}`);
}

const fs = require('fs');
fs.writeFileSync(path.join(root, 'ts_diag.txt'), out.join('\n') + `\nTOTAL=${out.length}\n`);
console.log('wrote ts_diag.txt, count=', out.length);
