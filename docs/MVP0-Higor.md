# MVP 0 — componentes do Higor

Implementação local em 23/10/2026, na branch `Higor`.

## Escopo

- T0.2.4: classes `px-*` baseadas nos tokens e na decisão visual versionada.
- T0.2.5: fontes locais já integradas à main; mantidas.
- T0.2.6: Panel, Button, Tag e PixelIcon (seis ícones).
- T0.2.7: TaskCard nos estados normal, em batalha, conquistada e compacto; StatBar.
- T0.2.8: ScopeTabs controlado, contadores, tabulação e setas/Home/End.
- T0.2.11: catálogo interativo `/design`, nos temas Castelo e Pergaminho.

## Limite da referência visual

O `bundle.css` original não está no repositório e o artefato externo não pôde
ser acessado nesta sessão. Os estilos foram implementados a partir do
`tokens.json` e da decisão de identidade visual, sem introduzir novas cores.
A T0.2.4 permanece parcial até comparar/ajustar as classes com o bundle original.
As demais implementações precisam da revisão do PR e do aceite visual previsto
na Definition of Done. Não são marcadas como concluídas automaticamente.

PomodoroHUD, RoomMap e a suíte completa de componentes são tarefas do Gustavo
(T0.2.9/T0.2.10); o catálogo atual mostra os componentes entregues pelo Higor.

## Uso

Importe `@tasksorg/ui/styles.css` e os componentes de `@tasksorg/ui` ou
`@tasksorg/ui/components`. As fontes são responsabilidade do aplicativo.
Os componentes são controlados por props: não salvam tarefas nem alteram o core.

ScopeTabs precisa de um `id` exclusivo. Cada painel associado usa
`id="PREFIXO-panel-daily"`, `role="tabpanel"` e
`aria-labelledby="PREFIXO-tab-daily"` (idem weekly/yearly). O consumidor mantém
os painéis inativos com `hidden`. A rota `/design` contém um exemplo completo.

PixelIcon é decorativo por padrão; passe `label` quando ele transmitir informação.
Botões contendo apenas ícone precisam de `aria-label`.
StatBar limita valores ao intervalo válido, inclusive para entradas não finitas.

## Resultados desta sessão

- Instalação concluída com `npx --yes pnpm@9.12.0 install --frozen-lockfile`.
- `npx --yes pnpm@9.12.0 exec turbo run lint typecheck test build`: 15 de 16
  tarefas passaram. Lint e typecheck aprovados em todos os pacotes.
- 88 testes passaram (68 core, 11 tokens e 9 contratos de componentes).
- Builds de core, UI e Desktop aprovados.
- Web compilou e gerou as páginas, mas o empacotamento `standalone` falhou com
  `EPERM` ao criar symlinks no Windows. O pacote Docker não foi validado nesta
  sessão; não houve mudança na configuração de produção para ocultar a falha.
- Catálogo servido localmente: temas Castelo/Pergaminho, batalhar/concluir e
  abas por ArrowRight, Home e End conferidos no navegador. Na largura móvel,
  largura de conteúdo e viewport foram iguais (375px), sem rolagem horizontal.
- A referência externa foi tentada também no navegador e exige login.

## Roteiro de revisão visual

Abra `/design`, alterne os temas e confira os estados dos cartões e botões.
Navegue por Tab, selecione as abas com setas/Home/End e confira o painel associado.
Confira também o catálogo em largura de celular. A restrição de tela sem rolagem
é da futura tela Quadro, não do catálogo de componentes.
