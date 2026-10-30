/**
 * BIT Connect Client-Side Cryptographic Service.
 * Implements browser-based WebCrypto primitives:
 * - Asymmetric Curve: NIST P-256 (ECDH)
 * - Key Derivation: HKDF with SHA-256 (RFC 5869)
 * - Authenticated Symmetric Encryption: AES-256-GCM with unique 96-bit random IVs
 * - Key Persistence: IndexedDB (Private keys never leave client or touch network)
 */

const DB_NAME = 'bit_crypto_db';
const DB_VERSION = 1;
const STORE_NAME = 'device_keys';
const KEY_PAIR_ALIAS = 'ecdh_p256_identity_key';

// ── IndexedDB Key Storage ───────────────────────────────────────────────────

function openCryptoDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredKeyPair() {
  try {
    const db = await openCryptoDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_PAIR_ALIAS);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB key store:', err);
    return null;
  }
}

async function saveStoredKeyPair(keyPair) {
  const db = await openCryptoDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(keyPair, KEY_PAIR_ALIAS);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Base64 & Buffer Conversion ──────────────────────────────────────────────

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Device Identity & Keys ──────────────────────────────────────────────────

export const cryptoService = {
  /**
   * Get or generate a persistent local device ID.
   */
  getDeviceId: () => {
    let deviceId = localStorage.getItem('bit_device_id');
    if (!deviceId) {
      deviceId = 'web-' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      localStorage.setItem('bit_device_id', deviceId);
    }
    return deviceId;
  },

  /**
   * Retrieve existing ECDH key pair from IndexedDB or generate a new one.
   * @returns {Promise<CryptoKeyPair>}
   */
  getOrCreateDeviceKeyPair: async () => {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API is not available in this browser environment');
    }

    const existing = await getStoredKeyPair();
    if (existing && existing.publicKey && existing.privateKey) {
      return existing;
    }

    // Generate new ECDH P-256 Key Pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable (needed to export public key and persist keypair in IDB)
      ['deriveKey', 'deriveBits']
    );

    await saveStoredKeyPair(keyPair);
    return keyPair;
  },

  /**
   * Export public key as a serialized JWK string for registration.
   */
  exportPublicKeyJwk: async (publicKey) => {
    const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
    return JSON.stringify(jwk);
  },

  /**
   * Import peer's JWK public key.
   */
  importPeerPublicKey: async (jwkString) => {
    const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  },

  /**
   * Derive an AES-256-GCM symmetric session key using ECDH + HKDF-SHA256.
   * @param {CryptoKey} myPrivateKey
   * @param {CryptoKey} peerPublicKey
   * @param {string} [saltInfo='bit-connect-v1']
   */
  deriveSharedAesKey: async (myPrivateKey, peerPublicKey, saltInfo = 'bit-connect-v1') => {
    // 1. Compute ECDH shared bits
    const sharedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      myPrivateKey,
      256
    );

    // 2. Import raw bits as HKDF key
    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      sharedBits,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    // 3. Derive AES-256-GCM key via HKDF with SHA-256
    const salt = new TextEncoder().encode('bit-alumni-connect-kdf-salt');
    const info = new TextEncoder().encode(saltInfo);

    return await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      hkdfKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // non-extractable AES session key
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypt plaintext string into Base64 ciphertext + Base64 96-bit random IV.
   * @param {string} plainText
   * @param {CryptoKey} aesKey
   * @returns {Promise<{ encryptedPayload: string, iv: string }>}
   */
  encryptMessage: async (plainText, aesKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for AES-GCM
    const encodedData = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      encodedData
    );

    return {
      encryptedPayload: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv),
    };
  },

  /**
   * Decrypt Base64 ciphertext + Base64 IV back into plaintext string.
   * @param {string} encryptedPayloadBase64
   * @param {string} ivBase64
   * @param {CryptoKey} aesKey
   * @returns {Promise<string>}
   */
  decryptMessage: async (encryptedPayloadBase64, ivBase64, aesKey) => {
    try {
      const ciphertextBuffer = base64ToArrayBuffer(encryptedPayloadBase64);
      const ivBuffer = base64ToArrayBuffer(ivBase64);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(ivBuffer),
        },
        aesKey,
        ciphertextBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.warn('Client-side AES-GCM decryption failed:', err.message);
      return '[Encrypted message cannot be decrypted: invalid key or tampered payload]';
    }
  },
};
