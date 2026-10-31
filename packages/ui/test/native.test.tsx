import { describe, expect, it } from "vitest";
import { createNativeComponents, createNativeTheme, nativeTokens } from "../src/native.js";

const primitive = "div";

describe("base React Native do Design System", () => {
  it("converte medidas CSS em números e mantém os dois temas", () => {
    expect(nativeTokens.spacing[4]).toBe(16);
    expect(nativeTokens.border.pixel).toBe(3);
    expect(createNativeTheme("castelo").colors.bg).toBe("#0e0c1d");
    expect(createNativeTheme("pergaminho").colors.bg).toBe("#e6d8b5");
    expect(JSON.stringify(nativeTokens)).not.toContain("var(");
    expect(JSON.stringify(nativeTokens)).not.toContain("px");
  });

  it("expõe os componentes principais sem depender do pacote react-native", () => {
    const kit = createNativeComponents({ View: primitive, Text: primitive, Pressable: primitive });
    expect(Object.keys(kit)).toEqual(["theme", "Panel", "Button", "Tag", "StatBar", "TaskCard"]);
    expect(kit.theme.styles.button.minHeight).toBe(44);
    expect(typeof kit.TaskCard).toBe("function");
  });

  it("limita valores de progresso antes de montar o componente", () => {
    const kit = createNativeComponents({ View: primitive, Text: primitive, Pressable: primitive });
    const element = kit.StatBar({ label: "Testes", value: 140, max: 100 });
    expect(element.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });
});
