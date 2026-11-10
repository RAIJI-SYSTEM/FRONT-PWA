/**
 * Rotas com identificador. Usam query string (?id=) em vez de segmentos dinâmicos ([id])
 * porque o app Android é uma exportação estática: só existem as páginas geradas no build.
 */
const withId = (path: string, id: string) => `${path}?id=${encodeURIComponent(id)}`;

export const routes = {
  rideSearch: (id: string) => withId('/viagem/busca', id),
  conversation: (id: string) => withId('/mensagens/conversa', id),
  delivery: (id: string) => withId('/encomenda', id),
  deliveryDetails: (id: string) => withId('/encomenda/produto', id),
};
