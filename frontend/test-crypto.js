// Unit test for BIT Connect WebCrypto encryption and decryption logic
import { webcrypto } from 'node:crypto';

// Polyfill global window.crypto if needed in Node
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
if (!globalThis.window) {
  globalThis.window = {
    crypto: webcrypto,
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  };
}

import { cryptoService } from './src/utils/cryptoService.js';

async function runCryptoVerification() {
  console.log('Testing WebCrypto ECDH + HKDF + AES-256-GCM Cryptographic Implementation...\n');

  // 1. Generate Alice and Bob key pairs
  const aliceKeyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const bobKeyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  console.log('✓ Generated ECDH P-256 key pairs for Alice and Bob');

  // 2. Export & Import Public Keys (simulate network registration)
  const aliceJwk = await cryptoService.exportPublicKeyJwk(aliceKeyPair.publicKey);
  const bobJwk = await cryptoService.exportPublicKeyJwk(bobKeyPair.publicKey);

  const aliceImportedBob = await cryptoService.importPeerPublicKey(bobJwk);
  const bobImportedAlice = await cryptoService.importPeerPublicKey(aliceJwk);

  console.log('✓ Exported and imported peer public keys (JWK serialization verified)');

  // 3. Derive symmetric shared AES-256-GCM session keys
  const conversationId = 'test-conv-1234';
  const aliceSharedKey = await cryptoService.deriveSharedAesKey(
    aliceKeyPair.privateKey,
    aliceImportedBob,
    conversationId
  );

  const bobSharedKey = await cryptoService.deriveSharedAesKey(
    bobKeyPair.privateKey,
    bobImportedAlice,
    conversationId
  );

  console.log('✓ Derived symmetric AES-256-GCM session keys via ECDH + HKDF-SHA256');

  // 4. Encrypt message from Alice
  const secretMessage = 'Hello Bob! This is an end-to-end encrypted message from Alice.';
  const { encryptedPayload, iv } = await cryptoService.encryptMessage(secretMessage, aliceSharedKey);

  console.log('✓ Alice encrypted message:');
  console.log('  Ciphertext (Base64):', encryptedPayload.substring(0, 32) + '...');
  console.log('  IV (Base64):', iv);

  // 5. Decrypt message on Bob side
  const decrypted = await cryptoService.decryptMessage(encryptedPayload, iv, bobSharedKey);
  if (decrypted !== secretMessage) {
    throw new Error(`Decrypted message mismatch! Expected "${secretMessage}", got "${decrypted}"`);
  }
  console.log('✓ Bob successfully decrypted message matching original plaintext:', decrypted);

  // 6. Test Tampered Message Rejection
  const tamperedPayload = Buffer.from(encryptedPayload, 'base64');
  tamperedPayload[0] ^= 0xff; // flip a bit
  const tamperedBase64 = tamperedPayload.toString('base64');

  const tamperedResult = await cryptoService.decryptMessage(tamperedBase64, iv, bobSharedKey);
  if (!tamperedResult.includes('invalid key or tampered payload') && !tamperedResult.includes('cannot be decrypted')) {
    throw new Error('Tampered message was not rejected!');
  }
  console.log('✓ Tampered ciphertext was rejected by AES-GCM authentication tag verification');

  // 7. Test Wrong Key Rejection (Eve tries to decrypt with her own key)
  const eveKeyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const eveSharedKey = await cryptoService.deriveSharedAesKey(
    eveKeyPair.privateKey,
    aliceImportedBob,
    conversationId
  );

  const eveResult = await cryptoService.decryptMessage(encryptedPayload, iv, eveSharedKey);
  if (!eveResult.includes('invalid key or tampered payload') && !eveResult.includes('cannot be decrypted')) {
    throw new Error('Wrong key was not rejected!');
  }
  console.log('✓ Unauthorized third-party key was rejected by AES-GCM');

  console.log('\nAll 7 Cryptographic Tests Passed Successfully!');
}

runCryptoVerification().catch((err) => {
  console.error('Crypto verification failed:', err);
  process.exit(1);
});
