import 'server-only'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { getLoyverseEnv } from './env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_BYTES = 12 // recommended IV length for GCM

/**
 * Encrypts a token (access_token / refresh_token) for storage.
 * Output layout (all base64, concatenated with `.`): iv.authTag.ciphertext
 */
export function encryptToken(plaintext: string): string {
  const { LOYVERSE_TOKEN_ENCRYPTION_KEY } = getLoyverseEnv()
  const key = Buffer.from(LOYVERSE_TOKEN_ENCRYPTION_KEY, 'base64')

  const iv = randomBytes(IV_LENGTH_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(
    '.',
  )
}

/**
 * Decrypts a token previously produced by encryptToken.
 * Throws if the payload is malformed or the auth tag doesn't verify
 * (tampering, wrong key, or corrupted data) — callers should treat any
 * thrown error as "this token can no longer be trusted."
 */
export function decryptToken(payload: string): string {
  const { LOYVERSE_TOKEN_ENCRYPTION_KEY } = getLoyverseEnv()
  const key = Buffer.from(LOYVERSE_TOKEN_ENCRYPTION_KEY, 'base64')

  const parts = payload.split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted token payload')
  }
  const [ivB64, authTagB64, ciphertextB64] = parts

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
