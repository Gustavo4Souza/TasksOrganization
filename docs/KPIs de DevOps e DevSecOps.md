# KPIs de DevOps e DevSecOps

Este documento é o catálogo oficial de métricas do TasksOrg. Ele existe para
que o time e futuras IAs possam identificar os mesmos indicadores, aplicar as
mesmas fórmulas e encontrar os dados nas mesmas fontes.

## Como usar este catálogo

Toda coleta deve preservar, no mínimo:

| Campo | Descrição |
|---|---|
| `metric_id` | Identificador canônico deste documento |
| `period_start` | Início da janela de medição em UTC |
| `period_end` | Fim da janela de medição em UTC |
| `value` | Valor calculado |
| `unit` | Unidade: `count`, `percentage`, `minutes`, `hours` ou `days` |
| `source` | Fonte bruta do dado |
| `collected_at` | Momento da coleta em UTC |
| `owner` | Responsável pela qualidade da métrica |
| `data_quality` | `complete`, `partial` ou `unavailable` |

Não se deve inventar valores ausentes. Quando a fonte ainda não existir,
registrar `data_quality: unavailable` e explicar a dependência.

## Status de implementação

- **Planejado agora:** definição e contrato dos Grupos 1 e 2 na Fase 1;
  persistência e integração na Fase 2.
- **Dependente de CI:** métricas de workflow podem começar quando os dados do
  GitHub Actions forem coletados.
- **Dependente de deploy:** frequência, change failure rate, rollback/hotfix e
  lead time completo exigem deploy real.
- **Dependente de backend/produção:** MTTR, disponibilidade, erros e latência
  exigem incidentes e observabilidade.
- **Dependente de segurança:** SAST, SCA e secret scanning entram na Fase 5.

## Grupo 1 — DORA e entrega

| ID | KPI | Fórmula | Fonte | Responsável |
|---|---|---|---|---|
| `deployment_frequency` | Frequência de implantação | Deploys concluídos / período | Deployments do GitHub | Guilhermo |
| `lead_time_for_changes` | Lead Time for Changes | Deploy concluído - primeiro commit | Git + GitHub Actions | Guilhermo + Gustavo |
| `change_failure_rate` | Taxa de falha de alterações | Deploys com incidente, rollback ou hotfix / total de deploys × 100 | Deploy + incidentes | Guilhermo + Gustavo |
| `mttr` | Tempo médio de recuperação | Tempo detecção→recuperação / incidentes | Incidentes + monitoramento | Guilhermo |

### Regras do Grupo 1

- Uma execução de CI não é um deploy.
- Build de imagem não é deploy até que a imagem seja publicada e executada em
  um ambiente.
- Change Failure Rate considera falha após a entrega; falhas de CI ficam em
  `pipeline_success_rate`.
- MTTR deve usar detecção e recuperação em UTC.

## Grupo 2 — Qualidade e eficiência do CI

| ID | KPI | Fórmula | Fonte | Responsável |
|---|---|---|---|---|
| `pipeline_success_rate` | Taxa de sucesso do pipeline | Workflows aprovados / executados × 100 | GitHub Actions | Guilhermo + Gustavo |
| `pipeline_duration` | Duração do pipeline | Fim - início; também por etapa | GitHub Actions | Guilhermo |
| `test_success_rate` | Taxa de sucesso dos testes | Testes aprovados / executados × 100 | Vitest e CI | Gustavo + Guilhermo |
| `test_coverage` | Cobertura de testes | Código coberto / executável × 100 | Relatório de cobertura | Gustavo + Guilhermo |
| `escaped_defect_rate` | Taxa de defeitos escapados | Defeitos após CI / alterações entregues | Issues + incidentes | Gustavo + Higor |
| `rollback_hotfix_rate` | Taxa de rollback/hotfix | Deploys com rollback/hotfix / deploys × 100 | Deploy + incidentes | Guilhermo |
| `flaky_test_rate` | Taxa de testes instáveis | Execuções instáveis / execuções totais × 100 | GitHub Actions | Gustavo + Guilhermo |

## Grupo 3 — DevSecOps

| ID | KPI | Fórmula ou critério | Fonte | Responsável |
|---|---|---|---|---|
| `sast_findings_by_severity` | Achados SAST por severidade | Contagem por crítica, alta, média e baixa | Ferramenta SAST | Guilhermo |
| `vulnerability_remediation_time` | Tempo de correção de vulnerabilidade | Correção - identificação | SAST/SCA + issues | Guilhermo + responsável técnico |
| `dependency_vulnerability_count` | Vulnerabilidades de dependências | Contagem por severidade | SCA/auditoria pnpm | Guilhermo |
| `secret_scan_findings` | Achados de secret scanning | Contagem de segredos expostos | Secret scanning | Guilhermo |
| `sast_false_positive_rate` | Taxa de falsos positivos SAST | Falsos positivos / alertas × 100 | Revisões SAST | Guilhermo |

SAST analisa o código estático. SCA analisa dependências de terceiros.
Secret scanning procura credenciais e tokens. Essas métricas não devem ser
misturadas em um único número.

## Grupo 4 — Operação e produto

| ID | KPI | Fórmula ou critério | Fonte | Responsável |
|---|---|---|---|---|
| `availability` | Disponibilidade | Tempo disponível / tempo observado × 100 | Monitoramento | Guilhermo |
| `application_error_rate` | Taxa de erro | Erros / requisições ou operações × 100 | Logs e APM | Guilhermo + Gustavo |
| `latency_p50_p95_p99` | Latência | Percentis de tempo de resposta | APM e métricas web/API | Guilhermo |
| `critical_operation_success_rate` | Sucesso de operações críticas | Operações bem-sucedidas / totais × 100 | API e frontend | Gustavo + Higor |

Essas métricas dependem de backend, deploy e observabilidade. Antes disso,
devem permanecer como planejamento, sem dados simulados.

## Periodicidade e agregação

- Coleta bruta: por workflow, commit, pull request, deploy, teste, alerta ou
  incidente.
- Agregação operacional: semanal.
- Relatório de evolução: mensal.
- Valores de duração: armazenar em segundos ou milissegundos; exibir em
  minutos, horas ou dias.
- Percentuais: armazenar com precisão suficiente e exibir com duas casas.
- DORA: usar mediana e percentis do Lead Time, além de contagens.

## Mapa de fontes

| Fonte | Dados esperados |
|---|---|
| GitHub Actions | status, timestamps, duração e etapas dos workflows |
| Git/PRs | commits, autor, abertura, revisão e merge |
| Deployments/registry | versão, ambiente, início e conclusão do deploy |
| Vitest/coverage | testes executados, aprovados, falhos e cobertura |
| Issues/incidentes | defeitos, severidade, detecção, correção e recuperação |
| SAST/SCA/secret scanning | achados, severidade, falso positivo e remediação |
| Logs/APM/monitoramento | disponibilidade, erros, latência e operações |

## Contrato recomendado para registros brutos

Uma implementação futura pode persistir eventos com esta forma:

```json
{
  "metric_id": "pipeline_duration",
  "event_id": "unique-event-id",
  "repository": "Gustavo4Souza/TasksOrganization",
  "environment": "ci",
  "commit_sha": "sha",
  "workflow_run_id": "github-run-id",
  "period_start": "2026-10-16T00:00:00Z",
  "period_end": "2026-10-16T23:59:59Z",
  "value": 420,
  "unit": "seconds",
  "source": "github-actions",
  "collected_at": "2026-10-17T00:05:00Z",
  "owner": "Guilhermo",
  "data_quality": "complete",
  "notes": ""
}
```

Esse exemplo é um contrato documental, não um dado real. IAs que trabalharem
com os KPIs devem consultar este catálogo antes de calcular ou interpretar
métricas e devem preservar a origem, a janela e a qualidade dos dados.
