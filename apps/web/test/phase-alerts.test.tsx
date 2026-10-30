// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { usePhaseAlerts } from "../app/phase-alerts";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("avisos de fase", () => {
  it("envia notificação somente após ativação e permissão", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const notify = vi.fn();
    vi.stubGlobal("Notification", Object.assign(notify, { permission: "granted", requestPermission }));
    const { result } = renderHook(() => usePhaseAlerts());
    const change = { from: "focus", to: "shortBreak", reason: "completed", completedFocusCycles: 1 } as const;

    act(() => result.current.onPhaseChange(change));
    expect(notify).not.toHaveBeenCalled();
    await act(async () => { result.current.toggleNotifications(true); await Promise.resolve(); });
    expect(requestPermission).toHaveBeenCalledOnce();
    act(() => result.current.onPhaseChange(change));
    expect(notify).toHaveBeenCalledWith("TasksOrg", { body: "Hora de pausa curta." });

    act(() => result.current.toggleNotifications(false));
    act(() => result.current.onPhaseChange(change));
    expect(notify).toHaveBeenCalledOnce();
  });

  it("toca som 8-bit somente quando ativado", async () => {
    const oscillator = { type: "", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const context = { resume: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), createOscillator: vi.fn(() => oscillator), destination: {}, currentTime: 10 };
    const AudioContextMock = vi.fn(() => context);
    vi.stubGlobal("AudioContext", AudioContextMock);
    const { result } = renderHook(() => usePhaseAlerts());
    const change = { from: "focus", to: "shortBreak", reason: "completed", completedFocusCycles: 1 } as const;

    act(() => result.current.onPhaseChange(change));
    expect(AudioContextMock).not.toHaveBeenCalled();
    await act(async () => { result.current.toggleSound(true); await Promise.resolve(); });
    await act(async () => { result.current.onPhaseChange(change); await Promise.resolve(); });
    expect(oscillator.type).toBe("square");
    expect(oscillator.frequency.value).toBe(660);
    expect(oscillator.start).toHaveBeenCalledOnce();
    expect(oscillator.stop).toHaveBeenCalledWith(10.12);
    act(() => result.current.toggleSound(false));
    expect(context.close).toHaveBeenCalled();
  });
});
