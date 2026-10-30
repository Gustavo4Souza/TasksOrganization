# MVP 0 — componentes do Higor

Implementado inicialmente em 23/10/2026 na branch `Higor` e integrado à `main`
pelos PRs #14 e #16.

## Escopo

- T0.2.4: classes `px-*` portadas do `components/bundle.css` do Design System.
- T0.2.5: fontes locais já integradas à main; mantidas.
- T0.2.6: Panel, Button, Tag e PixelIcon (seis ícones).
- T0.2.7: TaskCard nos estados normal, em batalha, conquistada e compacto; StatBar.
- T0.2.8: ScopeTabs controlado, contadores, tabulação e setas/Home/End.
- T0.2.11: catálogo interativo `/design`, nos temas Castelo e Pergaminho.

## Referência visual

O `components/bundle.css` foi conferido no artefato do Design System em
23/10/2026. A portabilidade preserva os tokens versionados e inclui as molduras
chanfradas, sombras duras, botões, tags, cartões, barras e abas previstos pela
referência. As tasks do Higor deste MVP foram revisadas, integradas à `main` e
marcadas como concluídas no roadmap.

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
- Após a atualização da main, a suíte de UI passou com 34 testes (tokens,
  componentes e hooks).
- Builds de core, UI e Desktop aprovados.
- O Web havia compilado e gerado as páginas; a main posterior corrigiu o modo
  `standalone` para que ele só seja usado no build do Docker.
- Catálogo servido localmente: temas Castelo/Pergaminho, batalhar/concluir e
  abas por ArrowRight, Home e End conferidos no navegador. Na largura móvel,
  largura de conteúdo e viewport foram iguais (375px), sem rolagem horizontal.
- O `components/bundle.css` da referência externa foi comparado aos estilos do pacote.

## Roteiro de revisão visual

Abra `/design`, alterne os temas e confira os estados dos cartões e botões.
Navegue por Tab, selecione as abas com setas/Home/End e confira o painel associado.
Confira também o catálogo em largura de celular. A restrição de tela sem rolagem
é da futura tela Quadro, não do catálogo de componentes.
