import {
  type KeyValueStorage,
  type PomodoroConfig,
  type PomodoroPhaseListener,
  type PomodoroSnapshot,
  DEFAULT_POMODORO_CONFIG,
  POMODORO_CONFIG_KEY,
  POMODORO_STATE_KEY,
  PomodoroTimer,
  catchUpSeconds,
  loadPomodoroConfig,
  loadPomodoroState,
  normalizePomodoroConfig,
  savePomodoroConfig,
  savePomodoroState,
} from "@tasksorg/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** localStorage quando existe (navegador, renderer do Electron); null no servidor (SSR do Next). */
function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null; // acesso bloqueado pelo navegador
  }
}

export interface UsePomodoroOptions {
  /** Tempos do Pomodoro (normalmente vindos de usePomodoroSettings). Trocar aplica na próxima fase. */
  config?: PomodoroConfig;
  /** Onde salvar o relógio. Padrão: localStorage. `null` desliga a persistência. */
  storage?: KeyValueStorage | null;
  storageKey?: string;
  /** Chamado a cada troca de fase (som, notificação). */
  onPhaseChange?: PomodoroPhaseListener;
  /**
   * Liga o timer a outras regras antes de descontar o tempo de quando o app estava
   * fechado, ex.: `(timer) => creditFocusToBattle(timer, store, salvarTarefa)`.
   * Lido só na montagem; pode devolver uma função de limpeza.
   */
  attach?: (timer: PomodoroTimer) => void | (() => void);
  /** Relógio em ms. Testes passam um relógio falso. */
  now?: () => number;
  /** De quanto em quanto tempo conferir o relógio. Padrão: 1000 ms. */
  intervalMs?: number;
}

export interface UsePomodoroResult {
  snapshot: PomodoroSnapshot;
  start: () => void;
  pause: () => void;
  /** Inicia ou pausa (botão principal e atalho Espaço). */
  toggle: () => void;
  reset: () => void;
  /** Pula para a próxima fase; um Foco pulado não credita pomodoro. */
  skip: () => void;
}

/**
 * Timer Pomodoro para React (T1.3.1), em cima do PomodoroTimer do core.
 *
 * - Mede o tempo pelo relógio real, não pela contagem do setInterval: abas em
 *   segundo plano (o caso do monitor secundário) têm o intervalo desacelerado
 *   pelo navegador e mesmo assim o relógio fica certo.
 * - Salva o estado a cada mudança e, ao montar de novo (recarregar a página,
 *   reabrir o app), retoma descontando o tempo que passou, no máximo até o fim
 *   da fase em que parou (ver catchUpSeconds).
 */
export function usePomodoro(options: UsePomodoroOptions = {}): UsePomodoroResult {
  const { config, storageKey = POMODORO_STATE_KEY, intervalMs = 1000 } = options;
  const storage = options.storage === undefined ? defaultStorage() : options.storage;

  const storageRef = useRef(storage);
  storageRef.current = storage;
  const nowRef = useRef(options.now ?? Date.now);
  nowRef.current = options.now ?? Date.now;
  const onPhaseChangeRef = useRef(options.onPhaseChange);
  onPhaseChangeRef.current = options.onPhaseChange;
  const configRef = useRef(config);
  configRef.current = config;
  const attachRef = useRef(options.attach);

  const timerRef = useRef<PomodoroTimer | null>(null);
  /** Até onde (em ms) o relógio real já foi descontado do timer. */
  const accountedUntilRef = useRef(0);
  // Primeiro render (inclusive no servidor) mostra o timer zerado; o estado salvo entra no efeito.
  const [snapshot, setSnapshot] = useState<PomodoroSnapshot>(() => new PomodoroTimer(config).getSnapshot());

  const publish = useCallback(() => {
    const timer = timerRef.current;
    if (!timer) return;
    setSnapshot(timer.getSnapshot());
    if (storageRef.current) savePomodoroState(storageRef.current, timer.save(nowRef.current()), storageKey);
  }, [storageKey]);

  /** Desconta do timer os segundos inteiros que passaram desde a última conta. */
  const catchUp = useCallback(() => {
    const timer = timerRef.current;
    if (!timer) return;
    const elapsed = Math.floor((nowRef.current() - accountedUntilRef.current) / 1000);
    if (elapsed <= 0) return;
    accountedUntilRef.current += elapsed * 1000;
    timer.tick(elapsed);
  }, []);

  // Montagem: restaura (ou cria) o timer, inscreve os avisos e desconta o tempo fechado.
  useEffect(() => {
    const saved = storageRef.current ? loadPomodoroState(storageRef.current, storageKey) : null;
    const timer = saved ? PomodoroTimer.fromSaved(saved) : new PomodoroTimer(configRef.current);
    if (configRef.current) timer.setConfig(configRef.current);
    timerRef.current = timer;

    const unsubscribe = timer.onPhaseChange((change) => onPhaseChangeRef.current?.(change));
    const detach = attachRef.current?.(timer);
    if (saved) timer.tick(catchUpSeconds(saved, nowRef.current()));
    accountedUntilRef.current = nowRef.current();
    publish();

    return () => {
      unsubscribe();
      if (typeof detach === "function") detach();
      timerRef.current = null;
    };
  }, [storageKey, publish]);

  // Tempos novos valem a partir da próxima fase (ou já, se o timer estiver parado).
  const configKey = config ? JSON.stringify(config) : "";
  useEffect(() => {
    if (!configRef.current || !timerRef.current) return;
    timerRef.current.setConfig(configRef.current);
    publish();
  }, [configKey, publish]);

  // Enquanto roda, confere o relógio real a cada intervalo.
  useEffect(() => {
    if (snapshot.state !== "running") return;
    const id = setInterval(() => {
      catchUp();
      publish();
    }, intervalMs);
    return () => clearInterval(id);
  }, [snapshot.state, intervalMs, catchUp, publish]);

  return useMemo(() => {
    const run = (fn: (timer: PomodoroTimer) => void) => () => {
      const timer = timerRef.current;
      if (!timer) return;
      if (timer.getSnapshot().state === "running") catchUp();
      fn(timer);
      accountedUntilRef.current = nowRef.current();
      publish();
    };
    return {
      snapshot,
      start: run((t) => t.start()),
      pause: run((t) => t.pause()),
      toggle: run((t) => (t.getSnapshot().state === "running" ? t.pause() : t.start())),
      reset: run((t) => t.reset()),
      skip: run((t) => t.skip()),
    };
  }, [snapshot, catchUp, publish]);
}

export interface UsePomodoroSettingsOptions {
  storage?: KeyValueStorage | null;
  storageKey?: string;
}

export interface UsePomodoroSettingsResult {
  config: PomodoroConfig;
  /** Altera um ou mais tempos; o valor é normalizado (limites e inteiros) e salvo. */
  update: (changes: Partial<PomodoroConfig>) => void;
  /** Volta para 25/5/15 e 4 ciclos. */
  restoreDefaults: () => void;
}

/** Tempos do Pomodoro escolhidos pelo usuário, salvos localmente (T1.3.6). */
export function usePomodoroSettings(options: UsePomodoroSettingsOptions = {}): UsePomodoroSettingsResult {
  const { storageKey = POMODORO_CONFIG_KEY } = options;
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const storageRef = useRef(storage);
  storageRef.current = storage;
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_POMODORO_CONFIG);
  const configRef = useRef(config);
  configRef.current = config;

  // Lê no efeito, não no render: no servidor (SSR) não há localStorage.
  useEffect(() => {
    if (storageRef.current) setConfig(loadPomodoroConfig(storageRef.current, storageKey));
  }, [storageKey]);

  const update = useCallback(
    (changes: Partial<PomodoroConfig>) => {
      const next = normalizePomodoroConfig({ ...configRef.current, ...changes });
      if (storageRef.current) savePomodoroConfig(storageRef.current, next, storageKey);
      configRef.current = next;
      setConfig(next);
    },
    [storageKey],
  );

  return useMemo(
    () => ({ config, update, restoreDefaults: () => update(DEFAULT_POMODORO_CONFIG) }),
    [config, update],
  );
}
