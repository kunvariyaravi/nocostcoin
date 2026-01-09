import * as ed from '@noble/ed25519';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import CryptoJS from 'crypto-js';

export interface Wallet {
    address: string;
    publicKey: string;
    privateKey?: string; // Only available when unlocked
}

export interface StoredWallet {
    version: string;
    encryptedPrivateKey: string;
    publicKey: string;
    address: string;
    createdAt: number;
    encryptedMnemonic?: string;
}

const STORAGE_KEY = 'nocostcoin_wallet';
const SESSION_KEY = 'nocostcoin_wallet_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export interface PasswordStrength {
    score: number; // 0-4
    feedback: string[];
    isStrong: boolean;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
        return { score: 0, feedback: ['Password is required'], isStrong: false };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    else feedback.push('Use at least 12 characters');

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include both uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one special character');
    }

    // Common patterns check
    if (/^(123|abc|password|qwerty)/i.test(password)) {
        score = Math.max(0, score - 2);
        feedback.push('Avoid common patterns');
    }

    const isStrong = score >= 4;

    if (isStrong) {
        feedback.length = 0;
        feedback.push('Strong password!');
    }

    return { score: Math.min(4, score), feedback, isStrong };
}

/**
 * Generate a new Ed25519 keypair
 */
async function generateKeypair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
    // Use Web Crypto API for random key generation (browser standard)
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    return { privateKey, publicKey };
}

/**
 * Derive address from public key (hex encoded)
 */
function deriveAddress(publicKey: Uint8Array): string {
    return Buffer.from(publicKey).toString('hex');
}

/**
 * Encrypt data with AES
 */
function encrypt(data: string, password: string): string {
    return CryptoJS.AES.encrypt(data, password).toString();
}

/**
 * Decrypt data with AES
 */
function decrypt(ciphertext: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Create a new wallet with mnemonic
 */
export async function createWallet(password: string): Promise<{ wallet: Wallet; mnemonic: string }> {
    try {
        // Generate mnemonic
        const mnemonic = generateMnemonic();

        // Derive seed from mnemonic
        const seed = mnemonicToSeedSync(mnemonic);

        // Use first 32 bytes as private key
        const privateKey = seed.slice(0, 32);
        const publicKey = await ed.getPublicKeyAsync(privateKey);

        const address = deriveAddress(publicKey);

        // Encrypt private key and mnemonic
        const encryptedPrivateKey = encrypt(Buffer.from(privateKey).toString('hex'), password);
        const encryptedMnemonic = encrypt(mnemonic, password);

        // Store wallet
        const storedWallet: StoredWallet = {
            version: '1.0',
            encryptedPrivateKey,
            publicKey: Buffer.from(publicKey).toString('hex'),
            address,
            createdAt: Date.now(),
            encryptedMnemonic,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWallet));

        // Create session
        createSession(Buffer.from(privateKey).toString('hex'));

        return {
            wallet: {
                address,
                publicKey: Buffer.from(publicKey).toString('hex'),
                privateKey: Buffer.from(privateKey).toString('hex'),
            },
            mnemonic,
        };
    } catch (error) {
        throw new Error(`Failed to create wallet: ${error}`);
    }
}

/**
 * Import wallet from mnemonic
 */
export async function importWallet(mnemonic: string, password: string): Promise<Wallet> {
    try {
        // Validate and derive seed
        const seed = mnemonicToSeedSync(mnemonic.trim());

        // Use first 32 bytes as private key
        const privateKey = seed.slice(0, 32);
        const publicKey = await ed.getPublicKeyAsync(privateKey);

        const address = deriveAddress(publicKey);

        // Encrypt and store
        const encryptedPrivateKey = encrypt(Buffer.from(privateKey).toString('hex'), password);
        const encryptedMnemonic = encrypt(mnemonic, password);

        const storedWallet: StoredWallet = {
            version: '1.0',
            encryptedPrivateKey,
            publicKey: Buffer.from(publicKey).toString('hex'),
            address,
            createdAt: Date.now(),
            encryptedMnemonic,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWallet));

        // Create session
        createSession(Buffer.from(privateKey).toString('hex'));

        return {
            address,
            publicKey: Buffer.from(publicKey).toString('hex'),
            privateKey: Buffer.from(privateKey).toString('hex'),
        };
    } catch (error) {
        throw new Error(`Failed to import wallet: ${error}`);
    }
}

/**
 * Unlock wallet with password
 */
export function unlockWallet(password: string): Wallet {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        throw new Error('No wallet found');
    }

    try {
        const stored: StoredWallet = JSON.parse(storedData);

        // Decrypt private key
        const privateKeyHex = decrypt(stored.encryptedPrivateKey, password);

        if (!privateKeyHex) {
            throw new Error('Invalid password');
        }

        // Create session
        createSession(privateKeyHex);

        return {
            address: stored.address,
            publicKey: stored.publicKey,
            privateKey: privateKeyHex,
        };
    } catch (error) {
        throw new Error('Invalid password or corrupted wallet');
    }
}

/**
 * Lock wallet (clear session)
 */
export function lockWallet(): void {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if wallet exists
 */
export function hasWallet(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Check if wallet is unlocked
 */
export function isWalletUnlocked(): boolean {
    const session = getSession();
    if (!session) return false;

    // Check if session expired (30 minutes)
    const now = Date.now();
    if (now > session.expiresAt) {
        lockWallet();
        return false;
    }

    return true;
}

/**
 * Get unlocked wallet from session
 */
export function getUnlockedWallet(): Wallet | null {
    if (!isWalletUnlocked()) return null;

    const session = getSession();
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!session || !storedData) return null;

    try {
        const stored: StoredWallet = JSON.parse(storedData);
        return {
            address: stored.address,
            publicKey: stored.publicKey,
            privateKey: session.privateKey,
        };
    } catch {
        return null;
    }
}

/**
 * Get wallet address (works even when locked)
 */
export function getWalletAddress(): string | null {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    try {
        const stored: StoredWallet = JSON.parse(storedData);
        return stored.address;
    } catch {
        return null;
    }
}

/**
 * Sign data with private key
 */
export async function signData(data: Uint8Array, privateKeyHex: string): Promise<Uint8Array> {
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    return await ed.signAsync(data, privateKey);
}

/**
 * Export mnemonic (requires password)
 */
export function exportMnemonic(password: string): string {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        throw new Error('No wallet found');
    }

    try {
        const stored: StoredWallet = JSON.parse(storedData);

        if (!stored.encryptedMnemonic) {
            throw new Error('Mnemonic not available for this wallet');
        }

        const mnemonic = decrypt(stored.encryptedMnemonic, password);

        if (!mnemonic) {
            throw new Error('Invalid password');
        }

        return mnemonic;
    } catch (error) {
        throw new Error('Failed to export mnemonic: ' + error);
    }
}

/**
 * Delete wallet permanently
 */
export function deleteWallet(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Refresh session timeout (extend expiration)
 */
export function refreshSession(): void {
    const session = getSession();
    if (session && isWalletUnlocked()) {
        session.expiresAt = Date.now() + SESSION_DURATION;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
}

/**
 * Export encrypted wallet data (for backup)
 */
export function exportWallet(): string | null {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData;
}

/**
 * Change wallet password
 */
export function changePassword(oldPassword: string, newPassword: string): void {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        throw new Error('No wallet found');
    }

    try {
        const stored: StoredWallet = JSON.parse(storedData);

        // Verify old password by decrypting
        const privateKeyHex = decrypt(stored.encryptedPrivateKey, oldPassword);
        if (!privateKeyHex) {
            throw new Error('Invalid password');
        }

        // Re-encrypt with new password
        const encryptedPrivateKey = encrypt(privateKeyHex, newPassword);

        let encryptedMnemonic: string | undefined;
        if (stored.encryptedMnemonic) {
            const mnemonic = decrypt(stored.encryptedMnemonic, oldPassword);
            encryptedMnemonic = encrypt(mnemonic, newPassword);
        }

        const updatedWallet: StoredWallet = {
            ...stored,
            encryptedPrivateKey,
            encryptedMnemonic,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWallet));

        // Update session with new password
        createSession(privateKeyHex);
    } catch (error) {
        throw new Error('Failed to change password: ' + error);
    }
}

// Session management helpers
interface Session {
    privateKey: string;
    expiresAt: number;
}

function createSession(privateKey: string): void {
    const session: Session = {
        privateKey,
        expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession(): Session | null {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

// --- TRANSACTION LOGIC ---

export interface Transaction {
    sender: string;       // Hex
    receiver: string;     // Hex
    nonce: number;
    amount: number;
    signature?: string;   // Hex
}

export async function createAndSignTransaction(
    wallet: Wallet,
    receiverHex: string,
    amount: number,
    nonce: number
): Promise<Transaction> {
    if (!wallet.privateKey) throw new Error('Wallet is locked or private key invalid');

    const senderBytes = Uint8Array.from(Buffer.from(wallet.publicKey, 'hex'));
    const receiverBytes = Uint8Array.from(Buffer.from(receiverHex, 'hex'));

    // Create Hash buffer
    // Layout: sender(32) + receiver(32) + nonce(8) + tag("NativeTransfer")(14) + amount(8)
    const tag = new TextEncoder().encode("NativeTransfer");
    const bufferSize = 32 + 32 + 8 + tag.length + 8;
    const buffer = new Uint8Array(bufferSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;

    // Sender
    buffer.set(senderBytes, offset);
    offset += 32;

    // Receiver
    buffer.set(receiverBytes, offset);
    offset += 32;

    // Nonce (u64 le)
    view.setBigUint64(offset, BigInt(nonce), true);
    offset += 8;

    // Tag
    buffer.set(tag, offset);
    offset += tag.length;

    // Amount (u64 le)
    view.setBigUint64(offset, BigInt(amount), true);
    offset += 8;

    // Hash (SHA-256)
    // Using CryptoJS to be consistent with other hashing if needed, or web crypto.
    // Buffer -> WordArray -> SHA256 -> Hex -> Bytes
    const wordArray = CryptoJS.lib.WordArray.create(buffer as any);
    const hash = CryptoJS.SHA256(wordArray);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    const hashBytes = Uint8Array.from(Buffer.from(hashHex, 'hex'));

    // Sign
    const privateKeyBytes = Uint8Array.from(Buffer.from(wallet.privateKey, 'hex'));
    const signatureBytes = await ed.signAsync(hashBytes, privateKeyBytes);

    return {
        sender: wallet.publicKey,
        receiver: receiverHex,
        nonce,
        amount,
        signature: Buffer.from(signatureBytes).toString('hex')
    };
}
