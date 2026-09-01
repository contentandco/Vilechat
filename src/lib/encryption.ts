import aesjs from 'aes-js';

// Pre-allocated UTF-8 Encoder/Decoder instances for zero-allocation performance
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

// Key cache so we don't re-derive 256-bit keys repeatedly
const keyCache = new Map<string, Uint8Array>();

// Safe UTF-8 byte conversion supporting full 4-byte emoji planes (avoids aes-js UTF-8 bug with emojis)
function stringToUtf8Bytes(str: string): Uint8Array {
  if (textEncoder) {
    return textEncoder.encode(str);
  }
  
  const utf8 = unescape(encodeURIComponent(str));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    arr[i] = utf8.charCodeAt(i);
  }
  return arr;
}

function utf8BytesToString(bytes: Uint8Array): string {
  if (textDecoder) {
    return textDecoder.decode(bytes);
  }

  let encoded = '';
  for (let i = 0; i < bytes.length; i++) {
    encoded += String.fromCharCode(bytes[i]);
  }
  try {
    return decodeURIComponent(escape(encoded));
  } catch (e) {
    return encoded;
  }
}

/**
 * Derives a 256-bit (32 byte) key from a room code with instant memory caching.
 */
function getRoomKey(roomCode: string): Uint8Array {
  const cleanCode = (roomCode || '').toLowerCase().trim();
  const cached = keyCache.get(cleanCode);
  if (cached) return cached;

  const padded = cleanCode.padEnd(32, 'vailchat_secret_padding_character').substring(0, 32);
  const key = stringToUtf8Bytes(padded);
  keyCache.set(cleanCode, key);
  return key;
}

/**
 * Encrypts a plain text message using a room code as the secret key.
 * @param text The plain text message to encrypt.
 * @param roomCode The room code acting as the decryption secret.
 */
export function encryptMessage(text: string, roomCode: string): string {
  try {
    const textBytes = stringToUtf8Bytes(text);
    const key = getRoomKey(roomCode);
    
    // We use CTR mode (Counter) stream cipher (fastest stream cipher mode)
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    const encryptedBytes = aesCtr.encrypt(textBytes);
    
    // Convert to hex string for database storage
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypts an encrypted message using the room code.
 * @param hexCiphertext The encrypted hex string.
 * @param roomCode The room code acting as the decryption secret.
 */
export function decryptMessage(hexCiphertext: string, roomCode: string): string {
  try {
    // If it's not a hex string (e.g., legacy plaintext messages), return it directly
    if (!hexCiphertext || !/^[0-9a-fA-F]+$/.test(hexCiphertext)) {
      return hexCiphertext || '';
    }

    const encryptedBytes = aesjs.utils.hex.toBytes(hexCiphertext);
    const key = getRoomKey(roomCode);
    
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    
    return utf8BytesToString(decryptedBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption Failed]';
  }
}

// Animal/Adjective pairings for fun, anonymous temporary names (Gen Z vibe)
const ADJECTIVES = [
  'Neon', 'Glitch', 'Cyber', 'Hyper', 'Retro', 'Fuzzy', 'Cosmic', 'Savage', 
  'Chill', 'Toxic', 'Slay', 'Based', 'Wobbly', 'Hype', 'Drip', 'Flex'
];

const ANIMALS = [
  'Panda', 'Koala', 'Fox', 'Rabbit', 'Otter', 'Puma', 'Koala', 'Sloth', 
  'Badger', 'Dino', 'Capybara', 'Raccoon', 'Hamster', 'Axolotl', 'Ferret', 'Hedgehog'
];

/**
 * Generates a random Gen Z style nickname for anonymous chatting.
 */
export function generateAnonymousName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${adj} ${animal} #${randomNum}`;
}

/**
 * Generates a sleek, unique alphanumeric room code (e.g. VL-8492, VL-7X9K)
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VL-${randomPart}`;
}
