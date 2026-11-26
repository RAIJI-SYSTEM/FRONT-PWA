import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  hydrated: true,
  session: null as null | { user: { id: string } },
  pushProps: null as null | { userId: string },
}));

vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => state.hydrated }));
vi.mock("@/hooks/useSession", () => ({ useSession: () => state.session }));
vi.mock("@/features/push/PushRegistrar", () => ({
  default: (props: { userId: string }) => {
    state.pushProps = props;
    return null;
  },
}));

import * as nav from "../stubs/next-navigation";
import AuthGate from "@/components/AuthGate";
import RatingDialog from "@/components/RatingDialog";

beforeEach(() => {
  nav.resetNavigation();
  state.hydrated = true;
  state.session = { user: { id: "u1" } };
  state.pushProps = null;
});

const ratingProps = () => ({
  person: { id: "driver-1", name: "Carlos" },
  title: "Como foi a viagem?",
  subtitle: "Avalie Carlos",
  tagsFor: (stars: number) => (stars >= 4 ? ["Pontual", "Educado"] : ["Atrasou", "Direção perigosa"]),
  onSubmit: vi.fn(async () => {}),
  onClose: vi.fn(),
});

function star(_container: HTMLElement, value: number) {
  const input = document.querySelector(`input[name="driver-rating"][value="${value}"]`) as HTMLInputElement;
  fireEvent.click(input);
}

function chip(name: string) {
  return screen.getByRole("button", { name });
}

describe("RatingDialog", () => {
  it("começa sem nota, com o envio desabilitado", () => {
    const props = ratingProps();
    render(<RatingDialog {...props} />);

    expect(screen.getByText("Como foi a viagem?")).toBeInTheDocument();
    expect(screen.getByText("Avalie Carlos")).toBeInTheDocument();
    expect(screen.getByText("Toque nas estrelas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar avaliação/ })).toBeDisabled();
    expect(screen.queryByText("O que foi bom?")).toBeNull();
  });

  it("mostra elogios para 4–5 estrelas e envia nota, etiquetas e comentário", async () => {
    const props = ratingProps();
    const { container } = render(<RatingDialog {...props} />);

    star(container, 5);
    expect(screen.getByText("Excelente")).toBeInTheDocument();
    expect(screen.getByText("O que foi bom?")).toBeInTheDocument();

    fireEvent.click(chip("Pontual"));
    expect(chip("Pontual")).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(screen.getByLabelText("Comentário (opcional)"), { target: { value: "Muito bom" } });
    expect(screen.getByText("9/300")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Enviar avaliação/ }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({ stars: 5, tags: ["Pontual"], comment: "Muito bom" }),
    );
  });

  it("mostra problemas para 1–3 estrelas e limpa etiquetas ao cruzar a faixa", () => {
    const props = ratingProps();
    const { container } = render(<RatingDialog {...props} />);

    star(container, 5);
    fireEvent.click(chip("Pontual"));
    expect(chip("Pontual")).toHaveAttribute("aria-pressed", "true");

    star(container, 2);
    expect(screen.getByText("O que pode melhorar?")).toBeInTheDocument();
    expect(screen.getByText("Atrasou")).toBeInTheDocument();
    expect(chip("Atrasou")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Pontual")).toBeNull();
  });

  it("desmarca uma etiqueta já escolhida", () => {
    const props = ratingProps();
    const { container } = render(<RatingDialog {...props} />);
    star(container, 4);

    fireEvent.click(chip("Educado"));
    expect(chip("Educado")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip("Educado"));
    expect(chip("Educado")).toHaveAttribute("aria-pressed", "false");
  });

  it("mostra o erro quando o envio falha", async () => {
    const props = ratingProps();
    props.onSubmit.mockRejectedValueOnce(new Error("Sem conexão"));
    const { container } = render(<RatingDialog {...props} />);

    star(container, 5);
    fireEvent.click(screen.getByRole("button", { name: /Enviar avaliação/ }));

    await waitFor(() => expect(screen.getByText("Sem conexão")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Enviar avaliação/ })).toBeEnabled();
  });

  it("mensagem padrão quando o erro não é Error e permite cancelar", async () => {
    const props = ratingProps();
    props.onSubmit.mockRejectedValueOnce("texto");
    const { container } = render(<RatingDialog {...props} />);

    star(container, 3);
    fireEvent.click(screen.getByRole("button", { name: /Enviar avaliação/ }));
    await waitFor(() => expect(screen.getByText("Não foi possível enviar a avaliação.")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(props.onClose).toHaveBeenCalled();
  });

});

describe("AuthGate", () => {
  it("mostra carregando antes da hidratação", () => {
    state.hydrated = false;
    state.session = null;
    render(<AuthGate><p>Conteúdo</p></AuthGate>);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo")).toBeNull();
  });

  it("manda para o login (voltando para a tela atual) quando não há sessão", () => {
    window.history.replaceState({}, "", "/corridas?filtro=hoje");
    nav.usePathname.mockReturnValue("/corridas");
    state.session = null;

    render(<AuthGate><p>Conteúdo</p></AuthGate>);
    expect(nav.replace).toHaveBeenCalledWith(`/login?voltar=${encodeURIComponent("/corridas?filtro=hoje")}`);
    expect(screen.queryByText("Conteúdo")).toBeNull();
  });

  it("libera o conteúdo e registra o push do usuário", () => {
    render(<AuthGate><p>Conteúdo</p></AuthGate>);
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(state.pushProps).toEqual({ userId: "u1" });
  });
});
