import {
  createTheme,
  alpha,
  lighten,
  darken,
  type Theme,
  type ThemeOptions,
} from "@mui/material/styles";
import { createContext, useContext } from "react";

export type ThemeMode = "dark" | "light";

export const navy = "#1E3E62";

const brand = {
  primary: "#FF6500",
  secondaryDark: "#1E3E62",
  surfaceDark: "#0B192C",
  backgroundDark: "#000000",
  secondaryLight: "#5C86B8",
  surfaceLight: "#F4F6F9",
  backgroundLight: "#FFFFFF",
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

function getDesignTokens(mode: ThemeMode): ThemeOptions {
  const isDark = mode === "dark";
  const secondaryMain = isDark ? brand.secondaryDark : brand.secondaryLight;
  const neutral = isDark ? "#B0B8C1" : "#3F5872";

  return {
    palette: {
      mode,
      primary: {
        main: brand.primary,
        light: lighten(brand.primary, 0.2),
        dark: darken(brand.primary, 0.25),
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: secondaryMain,
        light: lighten(secondaryMain, 0.2),
        dark: darken(secondaryMain, 0.25),
        contrastText: "#FFFFFF",
      },
      background: {
        default: isDark ? brand.backgroundDark : brand.backgroundLight,
        paper: isDark ? brand.surfaceDark : brand.surfaceLight,
      },
      text: {
        primary: isDark ? "#FFFFFF" : "#0B192C",
        secondary: alpha(neutral, 0.85),
        disabled: alpha(neutral, 0.5),
      },
      divider: alpha(neutral, 0.2),
      success: { main: isDark ? "#4CAF50" : "#2E7D32" },
      error: { main: isDark ? "#F44336" : "#D32F2F" },
      warning: { main: "#FFB400" },
      info: { main: isDark ? "#73818E" : "#5C6B73" },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "'Poppins', system-ui, sans-serif",
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        variants: [
          {
            props: { variant: "contained", color: "primary" },
            style: {
              backgroundColor: brand.primary,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: darken(brand.primary, 0.25) },
            },
          },
          {
            props: { variant: "contained", color: "secondary" },
            style: {
              backgroundColor: secondaryMain,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: darken(secondaryMain, 0.25) },
            },
          },
        ],
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? brand.surfaceDark : brand.surfaceLight,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? brand.backgroundDark : brand.backgroundLight,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(neutral, 0.2),
          },
        },
      },
    },
  };
}

export function createAppTheme(mode: ThemeMode): Theme {
  return createTheme(getDesignTokens(mode));
}

export const darkTheme = createAppTheme("dark");
export const lightTheme = createAppTheme("light");

const theme = darkTheme;
export default theme;

export interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "dark",
  toggleMode: () => {},
});

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
