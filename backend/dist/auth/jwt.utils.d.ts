import { type JWTPayload } from "jose";
export interface TokenPayload extends JWTPayload {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    type: "access" | "refresh";
}
export interface JWTConfig {
    secret: string;
    accessTokenExpiry?: string;
    refreshTokenExpiry?: string;
    issuer?: string;
    audience?: string;
}
export declare function generateAccessToken(payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">, config?: Partial<JWTConfig>): Promise<string>;
export declare function generateRefreshToken(payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">, config?: Partial<JWTConfig>): Promise<string>;
export declare function verifyToken(token: string, expectedType?: "access" | "refresh", config?: Partial<JWTConfig>): Promise<TokenPayload>;
export declare function generateTokenPair(payload: Omit<TokenPayload, "type" | "iat" | "exp" | "iss" | "aud">, config?: Partial<JWTConfig>): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function refreshAccessToken(refreshToken: string, config?: Partial<JWTConfig>): Promise<string>;
export declare function decodeToken(token: string): TokenPayload | null;
//# sourceMappingURL=jwt.utils.d.ts.map