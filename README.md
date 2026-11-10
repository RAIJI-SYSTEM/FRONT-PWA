# Raiji App

App de caronas e envio de encomendas: passageiro, motorista, mensagens, pagamentos (Stripe), mapas (Mapbox) e anúncios (AdMob).

Feito com **Next.js 16** (App Router), **React 19**, **MUI 9** e **Capacitor 8** (Android).

> Por enquanto as rotas `/api` deste projeto são **mocks** (dados em memória, em `src/server/`). Elas são reiniciadas sempre que o servidor reinicia.

---

## Como o app funciona

O mesmo código roda de dois jeitos:

| | Interface (telas) | Rotas `/api` (dados) |
|---|---|---|
| **Navegador** (`npm run dev`) | servida pelo Next | servidas pelo mesmo Next |
| **Celular** (app Android) | vai **dentro do APK** (exportação estática, pasta `out/`) | continuam no **Next rodando no seu PC**, acessado pelo Wi-Fi |

Por isso, para usar o app no celular, **duas coisas** precisam estar prontas:

1. O app compilado com o endereço do seu PC (`npm run build:mobile`).
2. O servidor rodando no PC, aberto para a rede (`npm run dev:lan`).

Se o servidor não estiver rodando, o app abre, mas as telas mostram erro ao carregar os dados.

---

## Pré-requisitos

- **Node.js 24** (recomendado usar o [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`).
- **Android Studio** com o Android SDK (API 36). Ele já traz o Java (JBR), não precisa instalar à parte.
- **Celular Android** com a depuração USB ligada (veja abaixo) e na **mesma rede Wi-Fi** do PC.
- *(Opcional, só para o login)* **Docker**, para subir o Keycloak do backend (repositório `monolith`).

---

## 1. Primeira configuração (só uma vez)

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | Para quê | Obrigatória? |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapas e busca de endereços | Sim (sem ela o mapa não carrega) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` | Pagamentos (use as chaves de **teste** `pk_test_` / `sk_test_`) | Para pagar |
| `STRIPE_WEBHOOK_SECRET` | Confirmação de pagamentos pelo Stripe | Opcional em dev |
| `MOBILE_API_URL` | Endereço do PC visto pelo celular, ex.: `http://192.168.0.10:3000` | **Sim, para o app Android** |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Login (Keycloak atrás do Kong). No celular, use o IP do PC: `http://192.168.0.10:8000` | Para o login |
| `NEXT_PUBLIC_ADMOB_*`, `NEXT_PUBLIC_ADSENSE_*` | Anúncios. Sem eles, o app usa anúncios de teste ou promoções próprias | Não |

Para descobrir o IP do PC na rede:

```bash
hostname -I   # o primeiro número, ex.: 192.168.0.10
```

---

## 2. Rodar no navegador (desenvolvimento do dia a dia)

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). As alterações aparecem na hora.

---

## 3. Rodar no celular (app Android)

### Passo 1: compilar o app

```bash
npm run build:mobile
```

Esse comando:
1. Gera a versão estática das telas na pasta `out/`, já com o endereço do `MOBILE_API_URL` embutido.
2. Copia essa pasta para dentro do projeto Android (`android/`), usando `cap sync`.

### Passo 2: ligar o servidor para o celular

Em **outro terminal**, deixe rodando:

```bash
npm run dev:lan
```

É o `npm run dev`, só que aberto para a rede (`-H 0.0.0.0`), para o celular conseguir acessar.

Teste no **navegador do celular**: `http://IP-DO-PC:3000/homepage` precisa abrir. Se não abrir, veja [Problemas comuns](#problemas-comuns).

### Passo 3: instalar e abrir no celular

1. **Prepare o celular** (só na primeira vez):
   - Vá em *Configurações → Sobre o telefone* e toque **7 vezes** em *Número da versão* para ativar o modo desenvolvedor.
   - Vá em *Configurações → Sistema → Opções do desenvolvedor* e ligue a **Depuração USB**.
   - Conecte o cabo USB e aceite o aviso *"Permitir depuração USB?"*.
2. Abra o projeto no Android Studio:
   ```bash
   npm run android
   ```
   (ou, no Android Studio, *File → Open* e escolha a pasta **`android/`**).
3. Espere o **Gradle Sync** terminar. Na primeira vez leva alguns minutos. Se ele sugerir atualizar o Gradle ou o plugin do Android, **recuse**.
4. Escolha o seu celular na lista de dispositivos no topo e clique em **▶ Run**.

> **Sem cabo:** no Android 11+, ligue *Depuração por Wi-Fi* nas Opções do desenvolvedor e use *Device Manager → Pair Devices Using Wi-Fi* no Android Studio.

> **Sem Android Studio aberto:** dá para gerar o APK pelo terminal e instalar no celular:
> ```bash
> cd android
> JAVA_HOME=/opt/android-studio/jbr ./gradlew assembleDebug
> # APK em: android/app/build/outputs/apk/debug/app-debug.apk
> ```

---

## O que refazer depois de cada mudança

| Você mudou… | O que fazer |
|---|---|
| Telas, componentes, estilos (`src/app`, `src/features`, `src/components`…) | `npm run build:mobile` e **▶ Run** de novo |
| Só as rotas `/api` ou os mocks (`src/app/api`, `src/server`) | Nada: o `dev:lan` recarrega sozinho. Não precisa reinstalar o app |
| O `.env.local` (chaves, `MOBILE_API_URL`…) | `npm run build:mobile` e **▶ Run** (as variáveis `NEXT_PUBLIC_` ficam gravadas no build) |
| O IP do PC (trocou de rede) | Atualize `MOBILE_API_URL` (e `NEXT_PUBLIC_KEYCLOAK_URL`), depois `npm run build:mobile` e **▶ Run** |
| Instalou um plugin do Capacitor ou mexeu em `android/` | `npm run build:mobile` e **▶ Run** |

---

## Login (Keycloak)

Login, cadastro e "Entrar com Google" acontecem nas páginas do **Keycloak**, que fica atrás do **Kong** (porta `8000`) no repositório do backend:

```bash
cd ../monolith
docker compose up --build -d
```

- **No navegador**, o login volta em `http://localhost:3000/auth/callback`.
- **No app**, o login abre numa aba do Chrome por cima do app e volta para o app pelo link `com.raiji.app://auth/callback`. Os dois endereços já estão liberados no `raiji-realm.json`.
- No celular, `NEXT_PUBLIC_KEYCLOAK_URL` precisa usar o **IP do PC** (`http://192.168.0.10:8000`), não `localhost`.

O resto do app funciona com os mocks mesmo sem o backend rodando.

---

## Problemas comuns

| Sintoma | Causa provável / solução |
|---|---|
| `npm run build:mobile` dá *"Defina MOBILE_API_URL…"* | Falta `MOBILE_API_URL` no `.env.local` |
| App abre, mas aparece *"Failed to fetch"* ou fica carregando | O celular não alcança o PC: confira se o `npm run dev:lan` está rodando, se o celular está no mesmo Wi-Fi e se o IP no `MOBILE_API_URL` está certo. Teste `http://IP-DO-PC:3000/homepage` no navegador do celular |
| Nem pelo navegador do celular abre | Firewall do PC bloqueando: `sudo ufw allow 3000/tcp` (e `8000/tcp` para o login) |
| Celular não aparece no Android Studio | Troque o cabo ou a porta USB (alguns cabos só carregam), mude o USB para *Transferência de arquivos* e confira com `~/Android/Sdk/platform-tools/adb devices`. Se aparecer *unauthorized*, aceite o aviso no celular |
| Mudei a tela e nada mudou no app | Faltou `npm run build:mobile` antes do ▶ Run |
| `npm run android` não abre o Android Studio | Abra manualmente *File → Open → `android/`*, ou defina `CAPACITOR_ANDROID_STUDIO_PATH` com o caminho do `studio.sh` |
| Mapa em branco | `NEXT_PUBLIC_MAPBOX_TOKEN` vazio ou restrito por URL. No app, a origem é `http://localhost` |

**Ver o console do app no celular:** com o celular conectado, abra `chrome://inspect` no Chrome do PC e clique em *inspect* embaixo de "Raiji". Abre o DevTools completo (console, rede, elementos).

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em `localhost:3000` |
| `npm run dev:lan` | Igual, mas acessível pela rede (para o celular) |
| `npm run build` | Build de produção da versão web (inclui a checagem de tipos) |
| `npm run start` | Roda o build de produção da web |
| `npm run build:mobile` | Gera a versão estática (`out/`) e copia para o projeto Android |
| `npm run android` | Abre o projeto Android no Android Studio |
| `npm run lint` | ESLint |

---

## Para quem for mexer no código

- **Estrutura:**
  - `src/app` tem as rotas e páginas: `(main)` passageiro, `(driver)` motorista, `(flow)` telas de fluxo, `(auth)` login, `api` mocks.
  - `src/features` tem as telas e os componentes por assunto.
  - `src/components` tem os componentes compartilhados.
  - `src/services` tem as chamadas às APIs.
  - `src/server` tem os mocks (só servidor).
- **O app é uma exportação estática.** Por isso:
  - **Não use rotas dinâmicas `[id]`.** Use query string (`/mensagens/conversa?id=...`) e monte os links com `src/utils/routes.ts`.
  - **Páginas não podem ler dados no servidor** (`searchParams`, `cookies`, `redirect`, `src/server/*`). Leia a URL no cliente com `WithSearchParams` e redirecione com o componente `Redirect`.
  - **Chame a API sempre por `apiFetch`/`apiUrl`** (`src/services/api.ts`), que acrescentam o endereço do servidor no app.
- O `src/proxy.ts` libera o CORS das rotas `/api` só para origens `localhost` (é a origem do app no celular).
- Ícones: `lucide-react`. Cores e tema: `src/theme.ts` (modos claro e escuro).
