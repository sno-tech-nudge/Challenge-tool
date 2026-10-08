export type Theme = 'light' | 'dark';
const KEY = 'aahaar-theme';

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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

/** Runs in <head> before first paint so a stored dark choice never flashes light. The login page
 *  always stays light. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(KEY)})==="dark"&&location.pathname!=="/login")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;
