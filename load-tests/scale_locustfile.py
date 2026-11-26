"""Locust — comparativo 1×N do FRONT-PWA (Next.js).

Cada usuário escolhe uma instância de ``RAIJI_SCALE_URLS`` (ex.: várias portas
`next start`). Para carga autenticada/BFF, defina ``RAIJI_SCALE_TOKEN`` e
``RAIJI_SCALE_PATH``.
"""

from __future__ import annotations

import os
import random

from locust import HttpUser, between, task

URLS = [u.strip().rstrip("/") for u in os.getenv("RAIJI_SCALE_URLS", "http://127.0.0.1:3201").split(",") if u.strip()]
TOKEN = os.getenv("RAIJI_SCALE_TOKEN", "").strip()
EXTRA_PATH = os.getenv("RAIJI_SCALE_PATH", "").strip()


class FrontScaleUser(HttpUser):
    host = URLS[0] if URLS else ""
    wait_time = between(float(os.getenv("RAIJI_SCALE_WAIT_MIN", "0.1")), float(os.getenv("RAIJI_SCALE_WAIT_MAX", "0.4")))

    def on_start(self) -> None:
        self.base = random.choice(URLS)
        self.instance = self.base.rsplit(":", 1)[-1]
        self.headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

    @task(6)
    def login_page(self) -> None:
        self.client.get(f"{self.base}/login", name=f"front[{self.instance}] GET /login")

    @task(4)
    def root(self) -> None:
        self.client.get(f"{self.base}/", name=f"front[{self.instance}] GET /")

    @task(2)
    def extra(self) -> None:
        if not EXTRA_PATH or not TOKEN:
            return
        self.client.get(f"{self.base}{EXTRA_PATH}", name=f"front[{self.instance}] GET {EXTRA_PATH}", headers=self.headers)
