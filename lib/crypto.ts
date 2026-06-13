// lib/crypto.ts

import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// MUST be 32 bytes
const SECRET = process.env.CREDENTIAL_SECRET || "";

// derive fixed 32-byte key safely
const KEY = crypto.createHash("sha256").update(SECRET).digest();

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string) {
  const [ivHex, encryptedHex] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString();
}

/* import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const SECRET = process.env.CREDENTIAL_SECRET!; // must be 32 bytes

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(SECRET),
    iv
  );

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string) {
  const [ivHex, encryptedHex] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET),
    iv
  );

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
} */