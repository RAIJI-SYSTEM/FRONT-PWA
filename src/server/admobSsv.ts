/**
 * Verificação do callback de anúncio premiado do AdMob (SSV — server-side verification).
 * https://developers.google.com/admob/android/ssv
 *
 * O Google chama nossa URL com a recompensa nos parâmetros e uma assinatura ECDSA (P-256, SHA-256).
 * Só um callback com assinatura válida pode creditar pontos — isso impede que alguém
 * "ganhe" cupons chamando a API diretamente.
 */
import 'server-only';

const KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const KEYS_CACHE_MS = 24 * 60 * 60 * 1000;

let keysCache: { fetchedAt: number; keys: Map<string, CryptoKey> } | null = null;

const base64UrlToBytes = (value: string) =>
  Uint8Array.from(Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));

/** Chaves públicas do Google (em cache por 24h, como a documentação recomenda) */
async function getPublicKeys(forceRefresh = false) {
  if (!forceRefresh && keysCache && Date.now() - keysCache.fetchedAt < KEYS_CACHE_MS) return keysCache.keys;

  const response = await fetch(KEYS_URL);
  if (!response.ok) throw new Error(`Falha ao buscar chaves do AdMob (${response.status})`);
  const { keys } = (await response.json()) as { keys: { keyId: number; base64: string }[] };

  const imported = new Map<string, CryptoKey>();
  for (const key of keys) {
    imported.set(
      String(key.keyId),
      await crypto.subtle.importKey('spki', base64UrlToBytes(key.base64), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']),
    );
  }
  keysCache = { fetchedAt: Date.now(), keys: imported };
  return imported;
}

/**
 * O AdMob envia a assinatura em DER; o WebCrypto espera r||s com 32 bytes cada.
 * DER: 0x30 len 0x02 lenR R 0x02 lenS S
 */
function derToRawSignature(der: Uint8Array) {
  let offset = 2;
  const readInt = () => {
    if (der[offset] !== 0x02) throw new Error('Assinatura DER inválida');
    const length = der[offset + 1];
    let value = der.slice(offset + 2, offset + 2 + length);
    offset += 2 + length;
    while (value.length > 32 && value[0] === 0) value = value.slice(1); // remove zero de sinal
    const padded = new Uint8Array(32);
    padded.set(value, 32 - value.length);
    return padded;
  };
  const raw = new Uint8Array(64);
  raw.set(readInt(), 0);
  raw.set(readInt(), 32);
  return raw;
}

async function resolveGoogleKey(keyId: string) {
  // Se não achar, recarrega: o Google pode ter trocado as chaves
  return (await getPublicKeys()).get(keyId) ?? (await getPublicKeys(true)).get(keyId);
}

export interface AdMobRewardCallback {
  adUnit: string;
  rewardAmount: number;
  rewardItem: string;
  transactionId: string;
  userId?: string;
  customData?: string;
}

/**
 * Valida a assinatura do callback. Recebe a query string crua (sem o "?"),
 * porque a assinatura cobre os parâmetros exatamente como o Google os enviou.
 */
export async function verifyAdMobCallback(
  rawQuery: string,
  /** Permite injetar a chave nos testes; por padrão usa as chaves públicas do Google */
  resolveKey: (keyId: string) => Promise<CryptoKey | undefined> = resolveGoogleKey,
): Promise<AdMobRewardCallback | null> {
  // Os dois últimos parâmetros são sempre signature e key_id; o resto é o conteúdo assinado
  const signatureIndex = rawQuery.indexOf('&signature=');
  if (signatureIndex === -1) return null;
  const content = rawQuery.slice(0, signatureIndex);

  const params = new URLSearchParams(rawQuery);
  const signature = params.get('signature');
  const keyId = params.get('key_id');
  if (!signature || !keyId) return null;

  const key = await resolveKey(keyId);
  if (!key) return null;

  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    derToRawSignature(base64UrlToBytes(signature)),
    new TextEncoder().encode(content),
  );
  if (!valid) return null;

  return {
    adUnit: params.get('ad_unit') ?? '',
    rewardAmount: Number(params.get('reward_amount') ?? 0),
    rewardItem: params.get('reward_item') ?? '',
    transactionId: params.get('transaction_id') ?? '',
    userId: params.get('user_id') ?? undefined,
    customData: params.get('custom_data') ?? undefined,
  };
}
