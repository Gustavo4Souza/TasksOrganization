import type { ElementType, ReactNode } from "react";

export type NativeThemeName = "castelo" | "pergaminho";
export type NativeButtonVariant = "primary" | "secondary" | "danger";
export type NativeTone = "gold" | "mana" | "moss" | "crimson" | "arcane";

const palettes = {
  castelo: {
    bg: "#0e0c1d",
    surface: "#1b1733",
    surfaceRaised: "#272144",
    surfaceSunken: "#0a0916",
    edge: "#8a7fc4",
    edgeSoft: "#3d355f",
    ink: "#f1e9d2",
    inkMuted: "#aba2c9",
    gold: "#f4c542",
    mana: "#4fd3e3",
    moss: "#93dd62",
    crimson: "#ff6b78",
    arcane: "#b897ff",
    onAccent: "#120e22",
    shadowInk: "#06050d",
  },
  pergaminho: {
    bg: "#e6d8b5",
    surface: "#f4ecd5",
    surfaceRaised: "#fffaeb",
    surfaceSunken: "#d9c99f",
    edge: "#6b5a3e",
    edgeSoft: "#c4b28a",
    ink: "#231933",
    inkMuted: "#5a4c68",
    gold: "#7f5200",
    mana: "#075f6b",
    moss: "#30631a",
    crimson: "#b01f3a",
    arcane: "#6a3cc2",
    onAccent: "#fffaeb",
    shadowInk: "#3b2f22",
  },
} as const;

export const nativeTokens = {
  colors: palettes,
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  border: { pixel: 3, thin: 2 },
  radius: 0,
  typography: {
    display: { fontFamily: "Silkscreen", fontSize: 16, lineHeight: 24 },
    body: { fontFamily: "Pixelify Sans", fontSize: 18, lineHeight: 24 },
    bodySmall: { fontFamily: "Pixelify Sans", fontSize: 15, lineHeight: 20 },
    label: { fontFamily: "Pixelify Sans", fontSize: 13, lineHeight: 16, fontWeight: "600" },
    timer: { fontFamily: "Jersey 10", fontSize: 112, lineHeight: 112 },
  },
} as const;

export function createNativeTheme(name: NativeThemeName = "castelo") {
  const colors = palettes[name];
  const pixelBorder = { borderWidth: 3, borderColor: colors.edge, borderRadius: 0 };
  return {
    name,
    colors,
    styles: {
      screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
      panel: { ...pixelBorder, backgroundColor: colors.surface, padding: 16 },
      panelTitle: { ...nativeTokens.typography.display, color: colors.ink, textTransform: "uppercase" },
      button: { ...pixelBorder, minHeight: 44, paddingHorizontal: 16, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
      buttonPrimary: { backgroundColor: colors.gold },
      buttonSecondary: { backgroundColor: colors.surfaceRaised },
      buttonDanger: { backgroundColor: colors.crimson },
      buttonText: { ...nativeTokens.typography.label, color: colors.onAccent, textTransform: "uppercase" },
      buttonTextSecondary: { color: colors.ink },
      tag: { borderWidth: 2, borderRadius: 0, paddingHorizontal: 8, paddingVertical: 4 },
      tagText: { ...nativeTokens.typography.label },
      taskCard: { ...pixelBorder, backgroundColor: colors.surfaceRaised, padding: 12, gap: 8 },
      taskTitle: { ...nativeTokens.typography.body, color: colors.ink },
      taskMeta: { ...nativeTokens.typography.bodySmall, color: colors.inkMuted },
      statTrack: { height: 12, borderWidth: 2, borderColor: colors.edge, backgroundColor: colors.surfaceSunken },
      statFill: { height: "100%", backgroundColor: colors.gold },
    },
  } as const;
}

type NativeProps = {
  children?: ReactNode;
  style?: unknown;
  [key: string]: unknown;
};

export interface NativePrimitives {
  View: ElementType;
  Text: ElementType;
  Pressable: ElementType;
}

const mergeStyles = (...styles: unknown[]) => styles.filter(Boolean);

/**
 * Cria componentes React Native sem importar `react-native` no pacote Web.
 * O app Expo injeta View, Text e Pressable uma vez na inicialização.
 */
export function createNativeComponents(primitives: NativePrimitives, themeName: NativeThemeName = "castelo") {
  const { View, Text, Pressable } = primitives;
  const theme = createNativeTheme(themeName);

  function Panel({ title, children, style, ...props }: NativeProps & { title?: string }) {
    return <View {...props} style={mergeStyles(theme.styles.panel, style)} accessibilityRole="summary">
      {title ? <Text style={theme.styles.panelTitle}>{title}</Text> : null}
      {children}
    </View>;
  }

  function Button({ children, variant = "primary", disabled = false, style, ...props }: NativeProps & { variant?: NativeButtonVariant; disabled?: boolean }) {
    const variantStyle = variant === "danger" ? theme.styles.buttonDanger : variant === "secondary" ? theme.styles.buttonSecondary : theme.styles.buttonPrimary;
    return <Pressable {...props} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={mergeStyles(theme.styles.button, variantStyle, disabled && { opacity: 0.55 }, style)}>
      <Text style={mergeStyles(theme.styles.buttonText, variant === "secondary" && theme.styles.buttonTextSecondary)}>{children}</Text>
    </Pressable>;
  }

  function Tag({ children, tone = "gold", style, ...props }: NativeProps & { tone?: NativeTone }) {
    const color = theme.colors[tone];
    return <View {...props} style={mergeStyles(theme.styles.tag, { borderColor: color }, style)}>
      <Text style={mergeStyles(theme.styles.tagText, { color })}>{children}</Text>
    </View>;
  }

  function StatBar({ label, value, max = 100, tone = "gold", style, ...props }: NativeProps & { label: string; value: number; max?: number; tone?: NativeTone }) {
    const limit = Number.isFinite(max) && max > 0 ? max : 100;
    const amount = Number.isFinite(value) ? Math.min(limit, Math.max(0, value)) : 0;
    return <View {...props} style={style} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: limit, now: amount }}>
      <Text style={theme.styles.taskMeta}>{label} · {amount}/{limit}</Text>
      <View style={theme.styles.statTrack}><View style={mergeStyles(theme.styles.statFill, { width: `${(amount / limit) * 100}%`, backgroundColor: theme.colors[tone] })} /></View>
    </View>;
  }

  function TaskCard({ title, status = "todo", priority = "medium", pomodoros = 0, children, style, ...props }: NativeProps & { title: string; status?: "todo" | "doing" | "done"; priority?: "low" | "medium" | "high"; pomodoros?: number }) {
    const statusLabel = status === "done" ? "Conquistada" : status === "doing" ? "Em batalha" : "Missão";
    const tone: NativeTone = priority === "high" ? "crimson" : priority === "low" ? "moss" : "gold";
    return <View {...props} style={mergeStyles(theme.styles.taskCard, status === "doing" && { borderColor: theme.colors.mana }, status === "done" && { borderColor: theme.colors.moss }, style)} accessible accessibilityLabel={`${statusLabel}: ${title}`}>
      <Text style={theme.styles.taskTitle}>{title}</Text>
      <Tag tone={tone}>{priority === "high" ? "Alta" : priority === "low" ? "Baixa" : "Média"}</Tag>
      <Text style={theme.styles.taskMeta}>{Math.max(0, Math.floor(pomodoros))} focos</Text>
      {children}
    </View>;
  }

  return { theme, Panel, Button, Tag, StatBar, TaskCard };
}
