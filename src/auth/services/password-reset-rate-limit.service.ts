import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class PasswordResetRateLimitService {
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxRequests = 5;
  private readonly counters = new Map<string, { count: number; expiresAt: number }>();

  enforce(email: string, ip: string): void {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedIp = ip?.trim() || 'unknown';

    this.consume(`email:${normalizedEmail}`);
    this.consume(`ip:${normalizedIp}`);
  }

  private consume(key: string): void {
    const now = Date.now();
    const existing = this.counters.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.counters.set(key, { count: 1, expiresAt: now + this.windowMs });
      return;
    }

    if (existing.count >= this.maxRequests) {
      throw new HttpException(
        'Too many password reset requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    this.counters.set(key, existing);
  }
}