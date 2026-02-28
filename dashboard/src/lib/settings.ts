/**
 * Settings management — persists to localStorage
 */

export interface AppSettings {
  backendUrl: string;
  apiKey: string;
  ownerAddress: string;
  privateKey: string;
  // Derived from /init
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

const STORAGE_KEY = "uniagent_settings";

const DEFAULTS: AppSettings = {
  backendUrl: "http://localhost:3069",
  apiKey: "",
  ownerAddress: "",
  privateKey: "",
  evmSmartAccount: "",
  solanaSmartAccount: "",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // Dispatch event so other tabs / components can react
  window.dispatchEvent(new Event("uniagent_settings_changed"));
  return merged;
}

export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("uniagent_settings_changed"));
}
