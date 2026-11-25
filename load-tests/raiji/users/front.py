"""Front-end: páginas do Next e o BFF (/api/raiji/*, /api/chat/*).

O Next aqui é um proxy: ele bufferiza request+response e repassa ao Kong. Medir
o BFF separado do Kong mostra se o gargalo está no Node ou no backend.

ATENÇÃO: rode o Next em modo produção (`npm run build && npm start`) para que os
números valham. Em `next dev` cada rota compila sob demanda e o resultado é
ficção — ver README.
"""

from __future__ import annotations

import random

from locust import between, tag, task

from raiji import config, flows
from raiji.base import RaijiBase

PAGES = [
    "/",
    "/homepage",
    "/corridas",
    "/encomendas",
    "/buscar",
    "/mensagens",
    "/notificacoes",
    "/perfil",
    "/viagem/busca",
    "/mural",
]

_conversations: dict[str, list[str]] = {}


class FrontPages(RaijiBase):
    """HTML/RSC das telas. Em produção é arquivo; em dev é compilação."""

    weight = 2
    wait_time = between(1.0, 3.0)

    @tag("front", "read")
    @task
    def page(self) -> None:
        path = random.choice(PAGES)
        resp = self.front("GET", path, name=f"front: GET {path}")
        self.check_ok(resp)

    @tag("front", "read")
    @task(1)
    def static_asset(self) -> None:
        # Um asset público: mede o servidor de arquivos do Next, não o backend.
        resp = self.front("GET", "/next.svg", name="front: GET /next.svg")
        self.check_ok(resp)


class BffUser(RaijiBase):
    """Chamadas que o navegador faz nas telas (o "backend do front")."""

    weight = 3
    wait_time = between(0.5, 2.0)

    def _conversations_for_me(self) -> list[str]:
        cached = _conversations.get(self.cred.username)
        if cached:
            return cached
        resp = self.bff(
            "GET",
            "/api/chat/conversations",
            name="front(bff): GET /api/chat/conversations",
            params={"limit": 100},
        )
        if resp.status_code != 200:
            self.check_ok(resp)
            return []
        ids = [c["_id"] for c in resp.json()]
        _conversations[self.cred.username] = ids
        return ids

    @tag("front", "read", "api")
    @task(5)
    def search_rides(self) -> None:
        origin = random.choice(config.CITIES)
        lat, lng = flows.COORDS[origin[0]]
        resp = self.bff(
            "GET",
            "/api/raiji/rides/search",
            name="front(bff): GET /api/raiji/rides/search",
            params={
                "originLat": round(lat + random.uniform(-0.02, 0.02), 6),
                "originLng": round(lng + random.uniform(-0.02, 0.02), 6),
                "radiusMeters": 5000,
            },
        )
        self.check_ok(resp)

    @tag("front", "read", "api")
    @task(3)
    def notifications_poll(self) -> None:
        # O header busca notificações a cada 30s, duas vezes no modo passageiro.
        for audience in ("PASSENGER", "DRIVER"):
            resp = self.bff(
                "GET",
                "/api/raiji/notifications",
                name="front(bff): GET /api/raiji/notifications",
                params={"audience": audience},
            )
            self.check_ok(resp)

    @tag("front", "read", "api")
    @task(3)
    def history(self) -> None:
        resp = self.bff(
            "GET",
            "/api/raiji/rides/bookings/mine",
            name="front(bff): GET /api/raiji/rides/bookings/mine",
        )
        self.check_ok(resp)
        resp = self.bff(
            "GET",
            "/api/raiji/deliveries/mine",
            name="front(bff): GET /api/raiji/deliveries/mine",
        )
        self.check_ok(resp)

    @tag("front", "read", "chat")
    @task(4)
    def chat_inbox(self) -> None:
        if not config.CHAT_ENABLED:
            return
        resp = self.bff(
            "GET",
            "/api/chat/conversations",
            name="front(bff): GET /api/chat/conversations",
            params={"limit": 100},
        )
        self.check_ok(resp)

    @tag("front", "read", "chat")
    @task(2)
    def chat_open(self) -> None:
        if not config.CHAT_ENABLED:
            return
        ids = self._conversations_for_me()
        if not ids:
            return
        cid = random.choice(ids)
        self.bff(
            "GET",
            f"/api/chat/conversations/{cid}",
            name="front(bff): GET /api/chat/conversations/{id}",
            ok=(200, 404),
        )
        self.bff(
            "GET",
            f"/api/chat/conversations/{cid}/messages",
            name="front(bff): GET /api/chat/conversations/{id}/messages",
            ok=(200, 404),
            params={"limit": 100},
        )

    @tag("front", "write", "chat")
    @task(1)
    def chat_send(self) -> None:
        """Abre a conversa E envia — tudo pelo BFF, como o navegador faz."""
        if not config.ENABLE_WRITES or not config.CHAT_ENABLED:
            return
        peer = flows.peer_subject(self)
        if not peer:
            return
        resp = self.bff(
            "POST",
            "/api/chat/conversations/direct",
            name="front(bff): POST /api/chat/conversations/direct",
            ok=(200, 201),
            json={"userId": peer, "role": "passenger", "myRole": "passenger"},
        )
        if resp.status_code not in (200, 201):
            return
        cid = resp.json()["_id"]
        self.bff(
            "POST",
            f"/api/chat/conversations/{cid}/messages",
            name="front(bff): POST /api/chat/conversations/{id}/messages",
            json={"text": "mensagem via BFF (teste de carga)"},
        )

    @tag("front", "read", "api")
    @task(1)
    def profile(self) -> None:
        resp = self.bff(
            "GET", "/api/raiji/users/me", name="front(bff): GET /api/raiji/users/me"
        )
        self.check_ok(resp)

    @tag("front", "write", "auth")
    @task(1)
    def auth_token_passthrough(self) -> None:
        """O login do front passa por /api/auth/token (mesma origem)."""
        cred = self.cred
        resp = self.front(
            "POST",
            "/api/auth/token",
            name="front(bff): POST /api/auth/token",
            data={
                "grant_type": "password",
                "client_id": config.CLIENT_ID,
                "username": cred.username,
                "password": cred.password,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.check_ok(resp)
