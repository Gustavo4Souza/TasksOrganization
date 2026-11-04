import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function highSeverityFindings(sarif, threshold = 7) {
  const findings = [];
  for (const run of sarif?.runs ?? []) {
    const rules = new Map((run.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule]));
    for (const result of run.results ?? []) {
      const rule = rules.get(result.ruleId);
      const severity = Number(rule?.properties?.["security-severity"] ?? 0);
      if (Number.isFinite(severity) && severity >= threshold) findings.push({ ruleId: result.ruleId, severity });
    }
  }
  return findings;
}

export async function checkSarif(file) {
  const sarif = JSON.parse(await readFile(file, "utf8"));
  const findings = highSeverityFindings(sarif);
  if (findings.length) throw new Error(`CodeQL encontrou vulnerabilidades altas/críticas: ${JSON.stringify(findings)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) throw new Error("Informe o arquivo SARIF.");
  await checkSarif(file);
  console.log("Security gate aprovado: nenhum achado alto ou crítico.");
}
