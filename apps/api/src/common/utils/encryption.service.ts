import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, CipherGCM, DecipherGCM } from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(private config: ConfigService) {
    const keyHex  = this.config.getOrThrow<string>('ENCRYPTION_KEY');

    // Ensure key is 32 bytes (256 bits)
    if (keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes hex (64 chars)');
    }
    this.key = Buffer.from(keyHex, 'hex'); 
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(12); // GCM standard = 96bit IV

    const cipher = createCipheriv(
      this.algorithm,
      this.key,
      iv
    ) as CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, authTagHex, encryptedHex] = payload.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      iv
    ) as DecipherGCM;

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}