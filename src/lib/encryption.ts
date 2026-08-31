import aesjs from 'aes-js';

/**
 * Derives a 256-bit (32 byte) key from a room code in a pure JS way.
 */
function getRoomKey(roomCode: string): Uint8Array {
  // Pad or truncate roomCode to exactly 32 characters
  const padded = roomCode.padEnd(32, 'vailchat_secret_padding_character').substring(0, 32);
  return aesjs.utils.utf8.toBytes(padded);
}

/**
 * Encrypts a plain text message using a room code as the secret key.
 * @param text The plain text message to encrypt.
 * @param roomCode The room code acting as the decryption secret.
 */
export function encryptMessage(text: string, roomCode: string): string {
  try {
    const textBytes = aesjs.utils.utf8.toBytes(text);
    const key = getRoomKey(roomCode);
    
    // We use CTR mode (Counter) which is a stream cipher and doesn't require padding.
    // We use a fixed counter starting at 5 (safe for our ephemeral ephemeral messages).
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
    if (!/^[0-9a-fA-F]+$/.test(hexCiphertext)) {
      return hexCiphertext;
    }

    const encryptedBytes = aesjs.utils.hex.toBytes(hexCiphertext);
    const key = getRoomKey(roomCode);
    
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
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
 * Generates a human-friendly unique room code (e.g. glitch-axolotl-42)
 */
export function generateRoomCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)].toLowerCase();
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].toLowerCase();
  const randomNum = Math.floor(10 + Math.random() * 90);
  return `${adj}-${animal}-${randomNum}`;
}
