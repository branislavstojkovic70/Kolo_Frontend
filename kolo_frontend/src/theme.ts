export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export const darkTheme: ThemeColors = {
  primary: "#FF6500",
  secondary: "#1E3E62",
  background: "#000000",
  surface: "#0B192C",
  text: "#FFFFFF",
  textSecondary: "#B0B8C1",
  border: "#1E3E62",
};

export const lightTheme: ThemeColors = {
  primary: "#FF6500",
  secondary: "#5C86B8",
  background: "#FFFFFF",
  surface: "#F4F6F9",
  text: "#0B192C",
  textSecondary: "#3F5872",
  border: "#D6DEE7",
};

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
};

export const rgb = {
  dark: {
    primary: "rgb(255, 101, 0)",
    secondary: "rgb(30, 62, 98)",
    surface: "rgb(11, 25, 44)",
    background: "rgb(0, 0, 0)",
  },
  light: {
    primary: "rgb(255, 101, 0)",
    secondary: "rgb(92, 134, 184)",
    surface: "rgb(244, 246, 249)",
    background: "rgb(255, 255, 255)",
  },
};

export function getTheme(mode: ThemeMode): ThemeColors {
  return themes[mode];
}
