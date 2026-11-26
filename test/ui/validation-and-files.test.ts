import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MIN_VEHICLE_YEAR,
  VEHICLE_TYPES,
  clearFieldErrors,
  formatPlate,
  isValidPlate,
  normalizePlate,
  validateCnh,
  validateVehicle,
} from "@/utils/driverValidation";
import { preloadWhenIdle } from "@/utils/preload";
import { shrinkImage } from "@/utils/shrinkImage";

describe("driverValidation — placa", () => {
  it("normaliza para maiúsculas, sem símbolos e com 7 caracteres", () => {
    expect(normalizePlate("abc-1d23")).toBe("ABC1D23");
    expect(normalizePlate("ab.c 1d23456")).toBe("ABC1D23");
  });

  it("aceita placa antiga e Mercosul", () => {
    expect(isValidPlate("ABC1234")).toBe(true);
    expect(isValidPlate("abc-1d23")).toBe(true);
    expect(isValidPlate("AB12345")).toBe(false);
    expect(isValidPlate("")).toBe(false);
  });

  it("formata a placa para leitura", () => {
    expect(formatPlate("ABC1D23")).toBe("ABC-1D23");
    expect(formatPlate("ABC")).toBe("ABC");
  });
});

describe("driverValidation — CNH", () => {
  const valid = {
    number: "12345678901",
    category: "B" as const,
    expiresAt: "2099-12-31",
    ear: true,
  };

  it("não aponta erros quando está tudo certo", () => {
    expect(validateCnh(valid)).toEqual({});
  });

  it("valida número (11 dígitos, sem sequência repetida)", () => {
    expect(validateCnh({ ...valid, number: "123" }).number).toBeDefined();
    expect(validateCnh({ ...valid, number: "11111111111" }).number).toBeDefined();
    expect(validateCnh({ ...valid, number: "12345678901" }).number).toBeUndefined();
  });

  it("exige categoria válida", () => {
    expect(validateCnh({ ...valid, category: undefined }).category).toBeDefined();
    expect(validateCnh({ ...valid, category: "Z" as never }).category).toBeDefined();
  });

  it("exige validade futura", () => {
    expect(validateCnh({ ...valid, expiresAt: "não é data" }).expiresAt).toBeDefined();
    expect(validateCnh({ ...valid, expiresAt: "2000-01-01" }).expiresAt).toBeDefined();
    expect(validateCnh({ ...valid, expiresAt: "2099-01-01" }).expiresAt).toBeUndefined();
  });

  it("exige a observação EAR", () => {
    expect(validateCnh({ ...valid, ear: false }).ear).toBeDefined();
  });
});

describe("driverValidation — veículo", () => {
  const valid = { type: "car" as const, model: "Onix", year: 2020, color: "Prata", plate: "ABC1D23", seats: 4 };

  it("não aponta erros quando está tudo certo", () => {
    expect(validateVehicle(valid, 2026)).toEqual({});
  });

  it("valida tipo, modelo, ano, cor, placa e lugares", () => {
    const errors = validateVehicle(
      { type: "car", model: "  ", year: MIN_VEHICLE_YEAR - 1, color: "", plate: "X", seats: 0 },
      2026,
    );
    expect(Object.keys(errors).sort()).toEqual(["color", "model", "plate", "seats", "year"]);
    expect(validateVehicle({ type: "barco" as never, model: "Ok", year: 2020, color: "Azul", plate: "ABC1D23", seats: 4 }, 2026).type)
      .toBeDefined();
  });

  it("respeita o máximo de lugares de cada tipo", () => {
    expect(validateVehicle({ ...valid, type: "motorcycle", seats: 2 }, 2026).seats).toBeDefined();
    expect(validateVehicle({ ...valid, type: "motorcycle", seats: 1 }, 2026).seats).toBeUndefined();
    expect(validateVehicle({ ...valid, type: "van", seats: 16 }, 2026).seats).toBeDefined();
    expect(validateVehicle({ ...valid, year: 2028 }, 2026).year).toBeDefined();
    expect(VEHICLE_TYPES.map((t) => t.value)).toEqual(["car", "van", "motorcycle"]);
  });
});

describe("clearFieldErrors", () => {
  it("remove os erros dos campos alterados", () => {
    expect(clearFieldErrors({ plate: "x", model: "y", color: "z" }, { plate: "ABC1D23" })).toEqual({ model: "y", color: "z" });
  });
});

describe("shrinkImage", () => {
  const makeFile = (bytes: number, type = "image/jpeg", name = "foto.jpeg") =>
    new File([new Uint8Array(bytes)], name, { type });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
  });

  it("devolve o mesmo arquivo quando é pequeno", async () => {
    const file = makeFile(1024);
    await expect(shrinkImage(file)).resolves.toBe(file);
  });

  it("devolve o mesmo arquivo quando não é imagem", async () => {
    const file = makeFile(4 * 1024 * 1024, "application/pdf", "doc.pdf");
    await expect(shrinkImage(file)).resolves.toBe(file);
  });

  it("reduz uma foto grande para JPEG", async () => {
    const bitmap = { width: 4800, height: 2400, close: vi.fn() };
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = vi.fn(async () => bitmap);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(((cb: BlobCallback) => {
      cb(new Blob([new Uint8Array(500)], { type: "image/jpeg" }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob);

    const result = await shrinkImage(makeFile(5 * 1024 * 1024, "image/jpeg", "praia.jpeg"));
    expect(result.name).toBe("praia.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(bitmap.close).toHaveBeenCalled();
  });

  it("mantém o original quando o JPEG não compensa", async () => {
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = vi.fn(async () => ({ width: 3000, height: 2000, close: vi.fn() }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(((cb: BlobCallback) => {
      cb(new Blob([new Uint8Array(9 * 1024 * 1024)], { type: "image/jpeg" }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob);

    const file = makeFile(5 * 1024 * 1024);
    await expect(shrinkImage(file)).resolves.toBe(file);
  });

  it("mantém o original quando não consegue abrir a imagem (HEIC, por exemplo)", async () => {
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = vi.fn(async () => {
      throw new Error("formato");
    });
    const file = makeFile(5 * 1024 * 1024, "image/heic", "foto.heic");
    await expect(shrinkImage(file)).resolves.toBe(file);
  });
});

describe("preloadWhenIdle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { requestIdleCallback?: unknown }).requestIdleCallback;
    vi.useRealTimers();
  });

  it("usa requestIdleCallback quando existe", () => {
    const idle = vi.fn();
    (window as { requestIdleCallback?: unknown }).requestIdleCallback = idle;
    const load = vi.fn(async () => ({}));
    preloadWhenIdle(load);
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 4000 });
    (idle.mock.calls[0]![0] as () => void)();
    expect(load).toHaveBeenCalled();
  });

  it("cai para setTimeout no iOS e ignora falhas", () => {
    vi.useFakeTimers();
    const load = vi.fn(async () => {
      throw new Error("offline");
    });
    preloadWhenIdle(load);
    expect(load).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(load).toHaveBeenCalled();
  });
});
