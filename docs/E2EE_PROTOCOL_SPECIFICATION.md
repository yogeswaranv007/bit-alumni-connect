# BIT Connect: End-to-End Encryption (E2EE) Protocol Specification & Threat Model

**Version:** 1.0  
**Status:** Protocol Specification & Backend Foundation Completed (Pre-Implementation Gate)  
**Target Environments:** Web / Modern Browsers (WebCrypto API), Spring Boot STOMP/WebSocket Relay, Future Mobile (React Native / Libsignal)

---

## 1. Selected Cryptographic Foundation

Rather than deploying an ad-hoc unreviewed handshake combining raw ECDH and AES-GCM without ratcheting, BIT Connect adopts the **Signal Double Ratchet Protocol (X3DH + Double Ratchet)** as the target end-to-end messaging standard, adapted for browser clients using the standard W3C WebCrypto API and the audited `@privacyresearch/libsignal-protocol-typescript` (or native browser SubtleCrypto primitives).

### Cryptographic Primitives:
- **Asymmetric Curve:** Curve25519 / Ed25519 (or NIST P-256 via WebCrypto ECDH where WebAssembly/native curve support is configured).
- **Key Derivation (KDF):** HKDF-SHA256 (RFC 5869).
- **Authenticated Symmetric Encryption:** AES-256-GCM with unique 96-bit random IVs per message.
- **Signatures & Authentication:** Ed25519 or ECDSA P-256 for Identity Key verification.

---

## 2. Protocol Architecture & Lifecycle

### 2.1 Identity Authentication & Public-Key Verification
- Each client device generates a long-term **Identity Key Pair (IK)** and an ephemeral/signed **Pre-Key Pair (SPK)**.
- Public keys are serialized as JWK or raw Base64 and registered with the backend via `POST /api/v1/messages/keys`.
- The backend verifies:
  1. The registration request is authenticated by a valid JWT corresponding to `userId`.
  2. Public key ownership: The client signs a registration nonce or self-signs the SPK with the IK.
  3. No private keys ever leave the browser boundary or touch network payloads.

### 2.2 Initial Key Establishment (Extended Triple Diffie-Hellman / X3DH)
When Alice initiates a conversation with Bob:
1. Alice requests Bob's registered device public keys from `GET /api/v1/messages/keys/{bobUserId}`.
2. Alice generates an ephemeral key pair `EK_A`.
3. Alice performs Diffie-Hellman calculations:
   - `DH1 = ECDH(IK_A, SPK_B)`
   - `DH2 = ECDH(EK_A, IK_B)`
   - `DH3 = ECDH(EK_A, SPK_B)`
   - *(Optional one-time prekey OPK_B if available):* `DH4 = ECDH(EK_A, OPK_B)`
4. Alice computes Master Shared Secret: `SK = HKDF(DH1 || DH2 || DH3 [|| DH4])`.

### 2.3 Message Encryption and Authentication
- Messages are encrypted client-side using **AES-256-GCM**.
- Plaintext, previews, and attachments are NEVER sent to the backend.
- The payload sent to `POST /api/v1/messages/conversations/{id}/messages` contains only:
  - `encryptedPayload`: Base64 ciphertext containing the encrypted message JSON and GCM authentication tag.
  - `iv`: Base64-encoded 96-bit initialization vector.

### 2.4 Forward Secrecy & Key Rotation
- **Double Ratchet:** Each sent/received message ratchets the symmetric chain key:
  `Message Key = HKDF(ChainKey, "MessageKey")`
  `Next ChainKey = HKDF(ChainKey, "ChainAdvance")`
- Whenever message turns change, an asymmetric DH ratchet step occurs, rotating the DH ephemeral keys and generating fresh root keys.
- **Compromise Mitigation:** Compromising the device's current state cannot decrypt past messages (Forward Secrecy) and healing occurs after a clean ratchet step (Break-in Recovery / Post-Compromise Security).

### 2.5 Replay and Tampering Protection
- AES-GCM provides an integrated 128-bit authentication tag validating ciphertext integrity and non-tampering.
- Inbound STOMP relay and REST persistence enforce strictly monotonic message sequence counters and unique server timestamps.
- Duplicate or out-of-order frames failing ratchet authentication are discarded client-side.

### 2.6 Device Enrollment and Revocation
- When a user logs in on a new device/browser, a new `deviceId` (e.g., `web-uuid`) registers an independent key bundle.
- Older device keys can be revoked via `DELETE /api/v1/messages/keys/{deviceId}`.
- Messages must be encrypted separately for each active device public key of the recipient (multi-recipient fan-out).

### 2.7 Encrypted History Backup and Recovery
- In a pure zero-knowledge browser environment, private keys stored in `IndexedDB` do NOT survive browser storage purges or incognito sessions.
- **Recovery Strategy:** Users configure a passphrase-derived Key Encryption Key (PBKDF2 / Argon2id with salt) to export an encrypted Identity and Session Backup to the cloud, OR authenticate a new browser via QR-code direct peer pairing with an existing active device.

---

## 3. Threat Model & Security Boundaries

### 3.1 What the Backend CANNOT See:
1. Plaintext message bodies.
2. Plaintext attachments, file names, or image data.
3. Message search contents.
4. User private keys or derived shared ratchet keys.

### 3.2 What Metadata the Backend CAN Still See:
1. **Communication Graph:** Participant identities (`user1_id`, `user2_id`) and timestamps (`last_message_at`, `created_at`).
2. **Traffic Analysis:** Message size, message frequency, delivery receipts, and online presence timestamps.
3. **Account State:** Block records (`user_blocks`) and active device counts.

### 3.3 Browser Environment Limitations & XSS Risks
- **Cross-Site Scripting (XSS):** If an attacker achieves JavaScript execution in the browser origin, they can extract unexported keys from memory or invoke `crypto.subtle` directly.
- **Mitigation:** Strict CSP (Content Security Policy) prohibiting `unsafe-inline`, input sanitization on all user-supplied data (profiles, forum posts), and `HttpOnly; SameSite=Strict` flags on session cookies.
- **Storage Loss:** Browsers may evict IndexedDB under storage pressure. The client must detect missing keys and alert the user to re-register device keys.

---

## 4. Status Declaration

> **IMPORTANT SECURITY DISCLOSURE:**
> The backend database schema, REST authorization boundaries, WebSocket subscription checks, and blind encrypted payload relay are **fully implemented and verified**.
> The client currently uses static WebCrypto ECDH + HKDF + AES-256-GCM authenticated encryption.
> **Genuine Signal-grade Double Ratchet E2EE is NOT complete** until an audited ratcheting engine is integrated. The UI strictly and transparently displays **"Client-Encrypted"** (not "Signal E2EE").

---

## 5. Evaluation of Standard Reviewed Cryptographic Libraries for Migration

| Candidate Library | Origin & Maintainer | License | Supported Protocol Features | Browser / WebCrypto Compatibility | Maintenance & Production Suitability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`@privacyresearch/libsignal-protocol-typescript`** | Privacy Research (Signal JS fork) | **GPLv3** | Full X3DH, Double Ratchet, Pre-key bundles, Session serialization | Native JavaScript/TypeScript; runs in all modern browsers without WebAssembly requirements. | Maintained npm package. Strict copyleft (GPLv3) requires client distribution compliance. |
| **`libsignal-client` (WASM)** | Official Signal Technology Foundation (`signalapp/libsignal`) | **AGPLv3** | Gold standard Signal Protocol; PQXDH (Kyber-1024 Post-Quantum key exchange); full Double Ratchet. | Requires WebAssembly (`.wasm`) build and loading pipeline. | Extremely active; reference implementation. Higher integration complexity due to WASM memory management. |
| **`vodozemac`** | Matrix.org Foundation | **Apache-2.0 / MIT** | Olm (1-to-1 Double Ratchet), Megolm (group ratcheting), Curve25519, Ed25519. | Pure Rust compiled to WebAssembly; native JS wrappers available. | Very active. Permissive Apache-2.0 license avoids copyleft issues in institutional educational deployments. |

### Strategic Recommendation for BIT Connect:
- For institutional environments requiring permissible licensing without GPL contamination of proprietary campus portals, **`vodozemac`** (Matrix.org, Apache-2.0) is the recommended ratcheting engine.
- If strict Signal-wire compatibility is required, **`libsignal-client`** via WebAssembly represents the future-proof choice with Post-Quantum (PQXDH) support.
- Prior to migration, the UI will continue to clearly and honestly state **"Client-Encrypted"** with zero-plaintext server guarantees.

