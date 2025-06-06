// src/themes.ts
import type { ThemeConfig } from 'antd/es/config-provider/context';

const rootStyles = getComputedStyle(document.documentElement);

const resolveVar = (name: string): string =>
  rootStyles.getPropertyValue(name).trim() || "#000"; // fallback to black if not found

const theme: ThemeConfig = {
  token: {
    colorPrimary: resolveVar('--ps-color-4'),
    borderRadius: parseInt(resolveVar('--ps-border-radius')) || 8,
    colorBgContainer: resolveVar('--ps-background-color-light'),
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: resolveVar('--ps-color-4'),
    },
    Input: {
      colorPrimary: resolveVar('--ps-color-4'),
    },
    List: {
      colorBgContainer: resolveVar('--ps-background-color'),
    },
    Layout: {
      colorBgBody: resolveVar('--ps-background-color'),
    },
    // Add more components as needed
  },
};

export default theme;
