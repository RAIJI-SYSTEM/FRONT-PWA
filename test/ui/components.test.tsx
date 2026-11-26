import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; name?: string } } }));

vi.mock("@/hooks/useSession", () => ({ useSession: () => session.current }));
vi.mock("@/features/messages/hooks/useUnreadMessages", () => ({ useUnreadMessages: () => 2 }));
vi.mock("@/features/notifications/hooks", () => ({ useUnreadNotifications: () => 3 }));

import * as nav from "../stubs/next-navigation";
import ActionBar from "@/components/ActionBar";
import AdSlot from "@/components/AdSlot";
import Carousel from "@/components/Carousel";
import FlowTopBar from "@/components/FlowTopBar";
import Footer from "@/components/Footer";
import GoogleIcon from "@/components/GoogleIcon";
import Header from "@/components/Header";
import Redirect from "@/components/Redirect";
import StatusScreen from "@/components/StatusScreen";
import WithSearchParams from "@/components/WithSearchParams";

beforeEach(() => {
  nav.resetNavigation();
  session.current = { user: { id: "u1", name: "Ana Souza" } };
  delete (window as { adsbygoogle?: unknown }).adsbygoogle;
});

describe("Footer", () => {
  it("mostra o menu do passageiro e marca o item ativo", () => {
    nav.usePathname.mockReturnValue("/corridas");
    render(<Footer />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Encomendas")).toBeInTheDocument();
    expect(screen.getByText("Corridas").closest("a")).toHaveAttribute("href", "/corridas");
    expect(screen.getByText("Corridas").closest("a")).toHaveClass("Mui-selected");
  });

  it("mostra o menu do motorista e considera os caminhos alternativos", () => {
    nav.usePathname.mockReturnValue("/motorista/perfil");
    render(<Footer mode="driver" />);

    expect(screen.getByText("Rotas")).toBeInTheDocument();
    expect(screen.getByText("Fretes")).toBeInTheDocument();
    const more = screen.getByText("Mais").closest("a");
    expect(more).toHaveClass("Mui-selected");
  });

  it("aceita itens customizados", () => {
    nav.usePathname.mockReturnValue("/x/y");
    render(<Footer items={[{ label: "Custom", href: "/x", icon: null, also: ["/x/y"] }]} />);
    expect(screen.getByText("Custom").closest("a")).toHaveClass("Mui-selected");
  });

  it("não marca nada quando nenhum caminho combina", () => {
    nav.usePathname.mockReturnValue("/desconhecido");
    render(<Footer />);
    expect(document.querySelector(".Mui-selected")).toBeNull();
  });
});

describe("Header", () => {
  it("cumprimenta pelo nome da sessão, mostra contadores e links do passageiro", () => {
    nav.usePathname.mockReturnValue("/homepage");
    render(<Header location="São Paulo" modeLabel="Passageiro" />);

    expect(screen.getByText("Olá, Ana")).toBeInTheDocument();
    expect(screen.getByText("Passageiro")).toBeInTheDocument();
    expect(screen.getByText("São Paulo")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagens (2 não lidas)").closest("a")).toHaveAttribute("href", "/mensagens");
    expect(screen.getByLabelText("Notificações (3 não lidas)").closest("a")).toHaveAttribute("href", "/notificacoes");
  });

  it("usa os contadores informados, nome explícito e avatar", () => {
    render(<Header userName="Carlos Silva" notificationsCount={0} messagesCount={0} avatarSrc="/foto.png" />);
    expect(screen.getByText("Olá, Carlos Silva")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagens")).toBeInTheDocument();
    expect(screen.getByAltText("Carlos Silva")).toHaveAttribute("src", "/foto.png");
  });

  it("modo motorista aponta para as caixas do motorista", () => {
    render(<Header mode="driver" />);
    expect(screen.getByLabelText("Mensagens (2 não lidas)").closest("a")).toHaveAttribute("href", "/motorista/mensagens");
    expect(screen.getByLabelText("Notificações (3 não lidas)").closest("a")).toHaveAttribute("href", "/motorista/notificacoes");
  });

  it("sem sessão usa 'Usuário'", () => {
    session.current = null;
    render(<Header />);
    expect(screen.getByText("Olá, Usuário")).toBeInTheDocument();
  });
});

describe("ActionBar", () => {
  it("renderiza ações e o aviso acima da barra", () => {
    render(
      <ActionBar above={<span>Mais abaixo</span>}>
        <button>Continuar</button>
      </ActionBar>,
    );
    expect(screen.getByText("Mais abaixo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });
});

describe("AdSlot", () => {
  it("sem configuração mostra anúncio da própria Raiji", () => {
    render(<AdSlot />);
    expect(screen.getByLabelText("Publicidade")).toBeInTheDocument();
    expect(screen.getByText("Precisa enviar algo?")).toBeInTheDocument();
    expect(screen.getByText("Encomendas entregues no mesmo dia na sua cidade.")).toBeInTheDocument();
    expect(screen.getByText("Precisa enviar algo?").closest("a")).toHaveAttribute("href", "/encomenda/nova");
  });

  it("com AdSense configurado renderiza o bloco do Google", async () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-123";
    vi.resetModules();
    const { default: AdSlotFresh } = await import("@/components/AdSlot");
    const { container } = render(<AdSlotFresh adSlotId="slot-1" minHeight={90} />);

    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toBeTruthy();
    expect(ins).toHaveAttribute("data-ad-client", "ca-pub-123");
    expect(ins).toHaveAttribute("data-ad-slot", "slot-1");
    expect((window as { adsbygoogle?: unknown[] }).adsbygoogle).toEqual([{}]);
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  });
});

describe("Carousel", () => {
  it("renderiza os slides e os controles quando há mais de uma página", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 620 });
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => 1240 });
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        return (this.parentElement ? Array.from(this.parentElement.children).indexOf(this) : 0) * 620;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", { configurable: true, writable: true, value: 0 });

    render(
      <Carousel aria-label="Destaques">
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Carousel>,
    );

    expect(screen.getByRole("region", { name: "Destaques" })).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByLabelText("Anterior")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Próximo"));
    fireEvent.click(screen.getByLabelText("Ir para o item 2"));
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  it("não mostra controles com um slide só", () => {
    render(
      <Carousel aria-label="Único">
        <div>Único</div>
      </Carousel>,
    );
    expect(screen.queryByLabelText("Próximo")).toBeNull();
  });
});

describe("FlowTopBar", () => {
  it("volta pela ação, pelo href ou pelo histórico", () => {
    const onBack = vi.fn();
    const { rerender } = render(<FlowTopBar title="Nova viagem" onBack={onBack} />);
    expect(screen.getByRole("heading", { name: "Nova viagem" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Voltar"));
    expect(onBack).toHaveBeenCalled();

    rerender(<FlowTopBar title="Busca" backHref="/homepage" />);
    fireEvent.click(screen.getByLabelText("Voltar"));
    expect(nav.push).toHaveBeenCalledWith("/homepage");

    rerender(<FlowTopBar title="Pagamento" />);
    fireEvent.click(screen.getByLabelText("Voltar"));
    expect(nav.back).toHaveBeenCalled();
  });
});

describe("StatusScreen", () => {
  it("mostra ícone, título, descrição, conteúdo e ações", () => {
    const Icon = (props: { size?: number }) => <svg data-testid="icone" width={props.size} />;
    render(
      <StatusScreen icon={Icon as never} title="Tudo certo" description="Sua reserva foi feita." tone="success" actions={<button>Voltar</button>}>
        <p>Detalhe extra</p>
      </StatusScreen>,
    );
    expect(screen.getByTestId("icone")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tudo certo" })).toBeInTheDocument();
    expect(screen.getByText("Sua reserva foi feita.")).toBeInTheDocument();
    expect(screen.getByText("Detalhe extra")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });

  it("descrição é opcional", () => {
    const Icon = () => <svg />;
    render(<StatusScreen icon={Icon as never} title="Sem descrição" />);
    expect(screen.getByRole("heading", { name: "Sem descrição" })).toBeInTheDocument();
  });
});

describe("GoogleIcon", () => {
  it("desenha o logo no tamanho pedido", () => {
    const { container } = render(<GoogleIcon size={32} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Redirect", () => {
  it("navega no cliente", () => {
    render(<Redirect to="/homepage" />);
    expect(nav.replace).toHaveBeenCalledWith("/homepage");
  });
});

describe("WithSearchParams", () => {
  it("entrega a query string para o conteúdo", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams("id=abc"));
    render(
      <WithSearchParams>
        {(params: URLSearchParams) => <span>id={params.get("id")}</span>}
      </WithSearchParams>,
    );
    expect(screen.getByText("id=abc")).toBeInTheDocument();
  });
});
