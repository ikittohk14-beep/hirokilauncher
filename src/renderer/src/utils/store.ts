export function saveLocalData(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function loadLocalData(key: string, fallback: any) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

export const StoreKeys = {
  PLAYTIME: 'hiroki_playtime', // Record<string, Record<string, number>>
  ICONS: 'hiroki_icons',       // Record<string, string>
  THEME: 'hiroki_theme',       // string (hex)
  LAYOUT: 'hiroki_layout',     // string[]
};

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 122, g: 162, b: 247 };
}

export function applyTheme(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  document.documentElement.style.setProperty('--blue', hex);
  document.documentElement.style.setProperty('--blue-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
}
