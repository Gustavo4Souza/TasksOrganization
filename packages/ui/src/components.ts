import type { ComponentPropsWithoutRef, ElementType } from "react";

export * from "./pixel.js";
export * from "./pomodoro-ui.js";
export * from "./pomodoro-ui.js";

export type PolymorphicProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;
