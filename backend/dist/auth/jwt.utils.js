import { SignJWT, jwtVerify } from "jose";
const DEFAULT_CONFIG = {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    issuer: "quokkaq-api",
    audience: "quokkaq-frontend",
};
function getSecret() {
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET or SESSION_SECRET environment variable is required");
    }
    if (secret.length < 32) {
        throw new Error("JWT secret must be at least 32 characters long");
    }
    return new TextEncoder().encode(secret);
}
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    return value * multipliers[unit];
}
export async function generateAccessToken(payload, config) {
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
export async function generateRefreshToken(payload, config) {
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
export async function verifyToken(token, expectedType, config) {
    const secret = getSecret();
    const conf = { ...DEFAULT_CONFIG, ...config };
    try {
        const { payload } = await jwtVerify(token, secret, {
            issuer: conf.issuer,
            audience: conf.audience,
        });
        if (expectedType && payload.type !== expectedType) {
            throw new Error(`Invalid token type: expected ${expectedType}, got ${payload.type}`);
        }
        return payload;
    }
    catch (error) {
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
export async function generateTokenPair(payload, config) {
    const [accessToken, refreshToken] = await Promise.all([
        generateAccessToken(payload, config),
        generateRefreshToken(payload, config),
    ]);
    return { accessToken, refreshToken };
}
export async function refreshAccessToken(refreshToken, config) {
    const payload = await verifyToken(refreshToken, "refresh", config);
    const accessToken = await generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
    }, config);
    return accessToken;
}
export function decodeToken(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        return payload;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.utils.js.map