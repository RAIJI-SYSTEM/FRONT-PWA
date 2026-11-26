# Escalabilidade (1×N) — FRONT-PWA

Sobe N processos `next start` (portas 3201..320N), executa a mesma carga e grava
os resultados para o Grafana.

```bash
./run-scale.sh                                  # N=1,2 · 20 usuários
N_LIST="1 2 4" USERS_PER_INSTANCE=50 HOLD=20 PROCS=4 \
  RAIJI_SCALE_RESULTS=../../AVXAE-CORE-MONOLITH/observability/exporter/results/scale.json \
  ./run-scale.sh
```

| Variável | Efeito |
|---|---|
| `N_LIST` | configurações de N |
| `USERS_PER_INSTANCE` | carga por instância (total = N × valor) |
| `PROCS` | processos Locust |
| `RAIJI_SCALE_TOKEN/PATH` | rota autenticada/BFF (opcional) |
| `RAIJI_SCALE_RESULTS` | JSON lido pelo probe-exporter |

Observação: `/login` e `/` são estáticos; para medir o BFF/SSR de verdade use
`RAIJI_SCALE_PATH=/api/raiji/...` com token.
