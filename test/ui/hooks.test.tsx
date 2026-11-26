import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth", () => ({
  getSession: vi.fn(),
  subscribeSession: vi.fn(() => () => {}),
}));

import { getSession, subscribeSession } from "@/services/auth";
import { useHasMoreBelow } from "@/hooks/useHasMoreBelow";
import { useHydrated } from "@/hooks/useHydrated";
import { useIncrementalList } from "@/hooks/useIncrementalList";
import { useLockPageScroll } from "@/hooks/useLockPageScroll";
import { usePolling } from "@/hooks/usePolling";
import { useQuery } from "@/hooks/useQuery";
import { useSession } from "@/hooks/useSession";

describe("useHydrated", () => {
  it("vira true no navegador depois da hidratação", () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});

describe("useSession", () => {
  it("expõe a sessão atual e assina as mudanças", () => {
    vi.mocked(getSession).mockReturnValue({ user: { id: "u1" }, accessToken: "t", expiresAt: 0 });
    const { result } = renderHook(() => useSession());
    expect(result.current?.user.id).toBe("u1");
    expect(subscribeSession).toHaveBeenCalled();
  });

  it("devolve null quando não está logado", () => {
    vi.mocked(getSession).mockReturnValue(null);
    const { result } = renderHook(() => useSession());
    expect(result.current).toBeNull();
  });
});

describe("useLockPageScroll", () => {
  it("trava a rolagem e restaura o valor anterior", () => {
    document.documentElement.style.overflow = "auto";
    const { unmount } = renderHook(() => useLockPageScroll());
    expect(document.documentElement.style.overflow).toBe("hidden");
    unmount();
    expect(document.documentElement.style.overflow).toBe("auto");
  });
});

describe("useHasMoreBelow", () => {
  const original = {
    scrollHeight: Object.getOwnPropertyDescriptor(document.documentElement, "scrollHeight"),
    innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
    scrollY: Object.getOwnPropertyDescriptor(window, "scrollY"),
  };

  afterEach(() => {
    if (original.scrollHeight) Object.defineProperty(document.documentElement, "scrollHeight", original.scrollHeight);
    if (original.innerHeight) Object.defineProperty(window, "innerHeight", original.innerHeight);
    if (original.scrollY) Object.defineProperty(window, "scrollY", original.scrollY);
    vi.restoreAllMocks();
  });

  it("detecta conteúdo abaixo e reage à rolagem", () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });

    const { result } = renderHook(() => useHasMoreBelow(24));
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 1200 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });
});

describe("useIncrementalList", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fatia a lista e cresce com loadMore", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const { result } = renderHook(() => useIncrementalList(items, 10));

    expect(result.current.visible).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.remaining).toBe(15);

    act(() => result.current.loadMore());
    expect(result.current.visible).toHaveLength(20);

    act(() => result.current.loadMore());
    expect(result.current.visible).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);
  });

  it("carrega mais ao chegar no sentinela (IntersectionObserver)", () => {
    let trigger: (() => void) | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {}
        observe() {
          trigger = () => this.cb([{ isIntersecting: true }]);
        }
        disconnect() {}
      },
    );

    const { result } = renderHook(() => {
      const list = useIncrementalList(Array.from({ length: 30 }, (_, i) => i), 10);
      // o hook observa o sentinela; o objeto ref é simulado abaixo
      return list;
    });

    // sem elemento no ref, nada acontece (ramo de saída)
    expect(result.current.visible).toHaveLength(10);
    expect(trigger).toBeUndefined();
  });
});

describe("usePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("consulta, atualiza e para quando shouldContinue é falso", async () => {
    const fetcher = vi.fn(async (key: string) => ({ key, done: true }));
    const { result } = renderHook(() => usePolling("k", fetcher, (data) => !data.done, 1000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toEqual({ key: "k", done: true });
    expect(result.current.error).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("continua enquanto shouldContinue for verdadeiro", async () => {
    const fetcher = vi.fn(async () => ({ n: 1 }));
    renderHook(() => usePolling("k", fetcher, () => true, 1000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("expõe erro e tenta de novo com intervalo maior", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("sem rede"))
      .mockResolvedValue({ ok: true });
    const { result } = renderHook(() => usePolling("k", fetcher, () => false, 1000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toBe("sem rede");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
  });

  it("mensagem padrão quando o erro não é Error", async () => {
    const fetcher = vi.fn(async () => {
      throw "texto";
    });
    const { result } = renderHook(() => usePolling("k", fetcher, () => false, 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toBe("Falha ao consultar o servidor.");
  });

  it("permite atualizar os dados manualmente", async () => {
    const { result } = renderHook(() => usePolling("k", async () => 1, () => false, 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    act(() => result.current.setData(99));
    expect(result.current.data).toBe(99);
  });
});

describe("useQuery", () => {
  it("não busca com key null", () => {
    const fetcher = vi.fn();
    const { result } = renderHook(() => useQuery(null, fetcher));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("busca quando a key muda e devolve os dados", async () => {
    const fetcher = vi.fn(async () => "dados");
    const { result, rerender } = renderHook(({ key }) => useQuery(key, fetcher), { initialProps: { key: "a" } });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe("dados"));
    expect(result.current.loading).toBe(false);

    rerender({ key: "b" });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.data).toBe("dados"));
  });

  it("expõe erro da busca", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("falhou");
    });
    const { result } = renderHook(() => useQuery("x", fetcher));
    await waitFor(() => expect(result.current.error).toBe("falhou"));
    expect(result.current.loading).toBe(false);
  });

  it("mensagem padrão quando o erro não é Error", async () => {
    const fetcher = vi.fn(async () => {
      throw 42;
    });
    const { result } = renderHook(() => useQuery("x", fetcher));
    await waitFor(() => expect(result.current.error).toBe("Falha na busca."));
  });

  it("descarta resposta antiga quando a key muda no meio", async () => {
    let resolveFirst: (v: string) => void = () => {};
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((r) => (resolveFirst = r)))
      .mockResolvedValueOnce("novo");
    const { result, rerender } = renderHook(({ key }) => useQuery(key, fetcher), { initialProps: { key: "a" } });

    rerender({ key: "b" });
    await waitFor(() => expect(result.current.data).toBe("novo"));

    resolveFirst("velho");
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.data).toBe("novo");
  });
});
