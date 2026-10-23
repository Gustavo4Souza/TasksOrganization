// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { usePomodoro, usePomodoroSettings } from "../src/hooks.js";

function Timer() {
  const { config } = usePomodoroSettings();
  const { snapshot } = usePomodoro({ config });
  return createElement("span", null, `${snapshot.phase} ${snapshot.remainingSeconds}`);
}

describe("hooks no servidor (SSR do Next)", () => {
  it("renderizam sem window nem localStorage, mostrando o timer zerado", () => {
    expect(typeof window).toBe("undefined");
    expect(renderToString(createElement(Timer))).toContain("focus 1500");
  });
});
