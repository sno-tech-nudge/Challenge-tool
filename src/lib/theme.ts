export type Theme = 'light' | 'dark';
const KEY = 'aahaar-theme';

/** Dark is the default for everyone. Only an explicit choice of light (made with the toggle) is kept. */
export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // storage blocked: the choice just will not survive a reload
  }
}

export function applyTheme(t: Theme) {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

/** Runs in <head> before first paint, so the page opens dark (the default) and a stored choice of
 *  light never flashes dark. It applies to every page, the login page included. */
export const THEME_BOOT_SCRIPT = `var d=true;try{d=localStorage.getItem(${JSON.stringify(KEY)})!=="light"}catch(e){}if(d)document.documentElement.setAttribute("data-theme","dark")`;
