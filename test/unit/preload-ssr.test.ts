import { describe, expect, it, vi } from "vitest";
import { preloadWhenIdle } from "@/utils/preload";

describe("preloadWhenIdle sem window (SSR)", () => {
  it("não faz nada", () => {
    const load = vi.fn();
    expect(() => preloadWhenIdle(load)).not.toThrow();
    expect(load).not.toHaveBeenCalled();
  });
});
