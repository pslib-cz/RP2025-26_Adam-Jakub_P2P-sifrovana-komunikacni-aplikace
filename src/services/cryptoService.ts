const PBKDF2_ITERATIONS = 100_000;
const SALT_PREFIX = "peerformans-e2e-v1";

async function deriveKey(userId1: string, userId2: string): Promise<CryptoKey> {
  const [a, b] = [userId1, userId2].sort();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${a}:${b}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = new TextEncoder().encode(`${SALT_PREFIX}:${a}:${b}`);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const keyCache = new Map<string, CryptoKey>();

async function getKey(userId1: string, userId2: string): Promise<CryptoKey> {
  const [a, b] = [userId1, userId2].sort();
  const cacheKey = `${a}:${b}`;
  if (!keyCache.has(cacheKey)) {
    keyCache.set(cacheKey, await deriveKey(userId1, userId2));
  }
  return keyCache.get(cacheKey)!;
}

export async function encryptMessage(
  plaintext: string,
  senderId: string,
  receiverId: string
): Promise<string> {
  const key = await getKey(senderId, receiverId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(
  cipherBase64: string,
  senderId: string,
  receiverId: string
): Promise<string | null> {
  try {
    const key = await getKey(senderId, receiverId);
    const combined = Uint8Array.from(atob(cipherBase64), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
}

export async function safeDecrypt(
  text: string,
  senderId: string,
  receiverId: string
): Promise<string> {
  const result = await decryptMessage(text, senderId, receiverId);
  return result ?? text;
}
