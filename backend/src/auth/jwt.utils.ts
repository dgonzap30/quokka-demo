/**
 * JWT Utilities
 *
 * Token generation and verification using jose library
 * Supports access tokens (short-lived) and refresh tokens (long-lived)
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * JWT Token Payload
 */
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  type: "access" | "refresh";
}

/**
 * JWT Configuration
 */
export interface JWTConfig {
  /** Secret key for signing tokens (must be at least 32 characters) */
  secret: string;
  /** Access token expiration (e.g., "15m", "1h") */
  accessTokenExpiry?: string;
  /** Refresh token expiration (e.g., "7d", "30d") */
  refreshTokenExpiry?: string;
  /** Token issuer (e.g., "quokkaq-api") */
  issuer?: string;
  /** Token audience (e.g., "quokkaq-frontend") */
  audience?: string;
}

/**
 * Default JWT configuration
 */
const DEFAULT_CONFIG: Required<Omit<JWTConfig, "secret">> = {
  accessTokenExpiry: "15m", // 15 minutes
  refreshTokenExpiry: "7d", // 7 days
  issuer: "quokkaq-api",
  audience: "quokkaq-frontend",
};

/**
 * Get JWT secret from environment
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET or SESSION_SECRET environment variable is required");
  }

  if (secret.length < 32) {
    throw new Error("JWT secret must be at least 32 characters long");
  }

  // Convert string to Uint8Array for jose
  return new TextEncoder().encode(secret);
}

/**
 * Parse duration string to seconds
 * Examples: "15m" -> 900, "1h" -> 3600, "7d" -> 604800
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(
  payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">,
  config?: Partial<JWTConfig>
): Promise<string> {
  const secret = getSecret();
  const conf = { ...DEFAULT_CONFIG, ...config };

  const expirationTime = parseDuration(conf.accessTokenExpiry);

  const jwt = await new SignJWT({
    ...payload,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(conf.issuer)
    .setAudience(conf.audience)
    .setExpirationTime(`${expirationTime}s`)
    .sign(secret);

  return jwt;
}

/**
 * Generate a refresh token (long-lived)
 */
export async function generateRefreshToken(
  payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">,
  config?: Partial<JWTConfig>
): Promise<string> {
  const secret = getSecret();
  const conf = { ...DEFAULT_CONFIG, ...config };

  const expirationTime = parseDuration(conf.refreshTokenExpiry);

  const jwt = await new SignJWT({
    ...payload,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(conf.issuer)
    .setAudience(conf.audience)
    .setExpirationTime(`${expirationTime}s`)
    .sign(secret);

  return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string,
  expectedType?: "access" | "refresh",
  config?: Partial<JWTConfig>
): Promise<TokenPayload> {
  const secret = getSecret();
  const conf = { ...DEFAULT_CONFIG, ...config };

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: conf.issuer,
      audience: conf.audience,
    });

    // Validate token type
    if (expectedType && payload.type !== expectedType) {
      throw new Error(`Invalid token type: expected ${expectedType}, got ${payload.type}`);
    }

    return payload as TokenPayload;
  } catch (error: any) {
    // Provide clear error messages
    if (error.code === "ERR_JWT_EXPIRED") {
      throw new Error("Token has expired");
    }
    if (error.code === "ERR_JWT_INVALID") {
      throw new Error("Invalid token");
    }
    if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      throw new Error("Token signature verification failed");
    }

    throw error;
  }
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">,
  config?: Partial<JWTConfig>
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload, config),
    generateRefreshToken(payload, config),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config?: Partial<JWTConfig>
): Promise<string> {
  // Verify the refresh token
  const payload = await verifyToken(refreshToken, "refresh", config);

  // Generate a new access token with the same user data
  const accessToken = await generateAccessToken(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    },
    config
  );

  return accessToken;
}

/**
 * Decode a token without verification (for debugging only)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
