import assert from "node:assert/strict";
import test from "node:test";
import { highSeverityFindings } from "./check-sarif.mjs";

function sarif(severity) {
  return { runs: [{ tool: { driver: { rules: [{ id: "rule/test", properties: { "security-severity": String(severity) } }] } }, results: [{ ruleId: "rule/test" }] }] };
}

test("permite achados abaixo do limite", () => {
  assert.deepEqual(highSeverityFindings(sarif(6.9)), []);
});

test("bloqueia achados altos e críticos", () => {
  assert.deepEqual(highSeverityFindings(sarif(7)), [{ ruleId: "rule/test", severity: 7 }]);
  assert.deepEqual(highSeverityFindings(sarif(9.8)), [{ ruleId: "rule/test", severity: 9.8 }]);
});

test("ignora resultados sem severidade de segurança", () => {
  assert.deepEqual(highSeverityFindings({ runs: [{ tool: { driver: { rules: [] } }, results: [{ ruleId: "other" }] }] }), []);
});
