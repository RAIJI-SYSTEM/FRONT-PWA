import { describe, expect, it } from "vitest";
import {
  ACCEPT_DOCUMENTS,
  ACCEPT_IMAGES,
  attachmentTypeFor,
  baseMimeType,
  fileExtension,
  formatBytes,
  formatDuration,
} from "@/utils/attachments";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDayLabel, formatMessageTime, formatTime } from "@/utils/formatDate";
import { distanceKm } from "@/utils/geo";
import { parseMoney, sanitizeMoneyInput } from "@/utils/money";
import { formatPhone, fromE164, toE164 } from "@/utils/phone";
import { CUSTOMER_RATING_TAGS, MAX_RATING_COMMENT, RATING_TAGS, customerTagsFor, tagsFor } from "@/utils/ratingTags";
import { routes } from "@/utils/routes";
import { simplifyRoute } from "@/utils/simplifyRoute";
import { stableLink } from "@/utils/stableLinks";
import { normalize } from "@/utils/text";

describe("attachments", () => {
  it("normaliza e classifica MIME", () => {
    expect(baseMimeType(" Audio/WebM;codecs=opus ")).toBe("audio/webm");
    expect(attachmentTypeFor("image/jpeg")).toBe("image");
    expect(attachmentTypeFor("application/pdf")).toBe("document");
    expect(attachmentTypeFor("audio/ogg")).toBe("audio");
    expect(attachmentTypeFor("image/svg+xml")).toBeNull();
    expect(attachmentTypeFor("text/html")).toBeNull();
  });

  it("monta os accepts dos inputs de arquivo", () => {
    expect(ACCEPT_IMAGES).toContain("image/jpeg");
    expect(ACCEPT_DOCUMENTS).toContain(".pdf");
    expect(ACCEPT_DOCUMENTS).toContain("application/pdf");
  });

  it("formata tamanho", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });

  it("formata duração", () => {
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(-10)).toBe("0:00");
  });

  it("extrai a extensão do documento", () => {
    expect(fileExtension("contrato.PDF")).toBe("PDF");
    expect(fileExtension("arquivo")).toBe("ARQUIVO");
    expect(fileExtension("sem.ext.invalido")).toBe("INVALIDO");
  });
});

describe("formatCurrency", () => {
  it("converte centavos em reais", () => {
    expect(formatCurrency(1234)).toMatch(/12,34/);
    expect(formatCurrency(0)).toMatch(/0,00/);
    expect(formatCurrency(1000, "en-US", "USD")).toContain("$");
  });
});

describe("formatDate", () => {
  const iso = "2026-10-12T14:32:00-03:00";

  it("formata data e hora", () => {
    expect(formatDate(iso)).toMatch(/12/);
    expect(formatTime(iso)).toMatch(/14:32|2:32/);
  });

  it("usa 'Hoje'/'Ontem' e horário na lista de conversas", () => {
    const now = new Date();
    expect(formatMessageTime(now.toISOString())).toBe(formatTime(now.toISOString()));

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(formatMessageTime(yesterday.toISOString())).toBe("Ontem");

    expect(formatMessageTime(iso)).toMatch(/\d{2}\/\d{2}/);
  });

  it("usa rótulos de dia no chat", () => {
    const now = new Date();
    expect(formatDayLabel(now.toISOString())).toBe("Hoje");

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(formatDayLabel(yesterday.toISOString())).toBe("Ontem");

    expect(formatDayLabel(iso)).toMatch(/outubro/);
  });
});

describe("geo", () => {
  it("calcula distância em km (Haversine)", () => {
    // São Paulo -> Rio de Janeiro (~360 km)
    const km = distanceKm([-46.6333, -23.5505], [-43.1729, -22.9068]);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(400);
    expect(distanceKm([0, 0], [0, 0])).toBe(0);
  });
});

describe("money", () => {
  it("converte texto em centavos", () => {
    expect(parseMoney("12,50")).toBe(1250);
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("")).toBeUndefined();
    expect(parseMoney("   ")).toBeUndefined();
    expect(parseMoney("abc")).toBeNaN();
    expect(parseMoney("-1")).toBeNaN();
  });

  it("mantém só dígitos, ponto e vírgula", () => {
    expect(sanitizeMoneyInput("R$ 1a2,3.4")).toBe("12,3.4");
  });
});

describe("phone", () => {
  it("formata enquanto digita", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("1")).toBe("(1");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("119")).toBe("(11) 9");
    expect(formatPhone("113333")).toBe("(11) 3333");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    expect(formatPhone("11912345678")).toBe("(11) 91234-5678");
    expect(formatPhone("119123456789999")).toBe("(11) 91234-5678");
  });

  it("converte para E.164 e de volta", () => {
    expect(toE164("(11) 91234-5678")).toBe("+5511912345678");
    expect(toE164("(11) 3333-4444")).toBe("+551133334444");
    expect(toE164("123")).toBeNull();
    expect(fromE164("+5511912345678")).toBe("(11) 91234-5678");
    expect(fromE164(null)).toBe("");
  });
});

describe("ratingTags", () => {
  it("escolhe elogios ou problemas pela nota", () => {
    expect(tagsFor("rides", 5)).toBe(RATING_TAGS.rides.praise);
    expect(tagsFor("rides", 3)).toBe(RATING_TAGS.rides.issues);
    expect(tagsFor("deliveries", 4)).toBe(RATING_TAGS.deliveries.praise);
    expect(customerTagsFor(5)).toBe(CUSTOMER_RATING_TAGS.praise);
    expect(customerTagsFor(1)).toBe(CUSTOMER_RATING_TAGS.issues);
    expect(MAX_RATING_COMMENT).toBe(300);
  });
});

describe("routes", () => {
  it("monta rotas com id na query string", () => {
    expect(routes.rideSearch("a b")).toBe("/viagem/busca?id=a%20b");
    expect(routes.conversation("c1")).toBe("/mensagens/conversa?id=c1");
    expect(routes.delivery("d1")).toBe("/encomenda?id=d1");
    expect(routes.board("b1")).toBe("/mural?id=b1");
    expect(routes.deliveryDetails("x")).toBe("/encomenda/produto?id=x");
  });
});

describe("text", () => {
  it("normaliza acentos e caixa", () => {
    expect(normalize("Sírio-Libanês")).toBe("sirio-libanes");
    expect(normalize("  ABC  ")).toBe("abc");
  });
});

describe("simplifyRoute", () => {
  it("mantém traçados curtos intactos", () => {
    const two = [
      [0, 0],
      [1, 1],
    ] as [number, number][];
    expect(simplifyRoute(two)).toEqual(two);
  });

  it("remove pontos colineares", () => {
    const line = [
      [0, 0],
      [0.1, 0],
      [0.2, 0],
      [0.3, 0],
    ] as [number, number][];
    expect(simplifyRoute(line)).toEqual([
      [0, 0],
      [0.3, 0],
    ]);
  });

  it("respeita o máximo de pontos (aumenta a tolerância)", () => {
    const zigzag: [number, number][] = Array.from({ length: 200 }, (_, i) => [i * 0.001, i % 2 === 0 ? 0.001 : -0.001]);
    const result = simplifyRoute(zigzag, 5);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[0]).toEqual(zigzag[0]);
    expect(result[result.length - 1]).toEqual(zigzag[zigzag.length - 1]);
  });
});

describe("stableLinks", () => {
  const url = (seconds: number, sig = "a") => `https://s3.example/f?X-Amz-Expires=${seconds}&Signature=${sig}`;

  it("reaproveita o link enquanto vale", () => {
    const id = `att-${Math.random()}`;
    const first = stableLink(id, url(900), 1_000_000);
    const second = stableLink(id, url(900, "b"), 1_060_000); // 60 s depois
    expect(first).toBe(second);
  });

  it("troca o link quando está perto de vencer", () => {
    const id = `att-${Math.random()}`;
    const first = stableLink(id, url(900), 1_000_000);
    const second = stableLink(id, url(900, "b"), 1_000_000 + 900_000);
    expect(first).not.toBe(second);
  });

  it("usa validade curta quando a URL não informa X-Amz-Expires", () => {
    const id = `att-${Math.random()}`;
    const first = stableLink(id, "https://s3.example/f", 1_000_000);
    expect(stableLink(id, "https://s3.example/g", 1_000_000 + 200_000)).toBe(first);
    expect(stableLink(id, "https://s3.example/g", 1_000_000 + 300_000)).not.toBe(first);
  });

  it("tolera URL inválida", () => {
    const id = `att-${Math.random()}`;
    expect(stableLink(id, "não é url", 0)).toBe("não é url");
  });

  it("limita o mapa a 500 links", () => {
    for (let i = 0; i < 600; i++) stableLink(`lim-${i}`, url(900), 1_000_000 + i);
    // os primeiros saíram: pedir de novo gera um novo registro (mesmo valor, sem erro)
    expect(stableLink("lim-0", url(900), 2_000_000)).toBe(url(900));
  });
});
