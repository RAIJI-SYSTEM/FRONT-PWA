import { vi } from "vitest";

/** Stub de next/navigation: cada teste ajusta o retorno conforme precisa. */
export const push = vi.fn();
export const replace = vi.fn();
export const back = vi.fn();
export const prefetch = vi.fn();
export const refresh = vi.fn();

export const useRouter = vi.fn(() => ({ push, replace, back, prefetch, refresh }));
export const usePathname = vi.fn(() => "/homepage");
export const useSearchParams = vi.fn(() => new URLSearchParams());
export const useParams = vi.fn(() => ({}));
export const useSelectedLayoutSegment = vi.fn(() => null);
export const redirect = vi.fn();
export const notFound = vi.fn();
export const permanentRedirect = vi.fn();

export function resetNavigation() {
  push.mockReset();
  replace.mockReset();
  back.mockReset();
  prefetch.mockReset();
  refresh.mockReset();
  usePathname.mockReturnValue("/homepage");
  useSearchParams.mockReturnValue(new URLSearchParams());
}
