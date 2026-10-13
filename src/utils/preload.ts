/**
 * Baixa um módulo carregado sob demanda (next/dynamic) quando o navegador estiver ocioso.
 * Assim o código não pesa na abertura da tela, mas já está pronto quando o usuário tocar.
 * O iOS (WKWebView) não tem requestIdleCallback: lá usamos um pequeno atraso.
 */
export function preloadWhenIdle(load: () => Promise<unknown>) {
  if (typeof window === 'undefined') return;
  const run = () => void load().catch(() => undefined);
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}
