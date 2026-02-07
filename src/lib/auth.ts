import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "your-secret-key-min-32-characters!!"
);

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Create a signed JWT token
 */
export async function signToken(payload: {
    userId: string;
    email: string;
}): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // Validate that the payload has required fields
        if (typeof payload.userId === 'string' && typeof payload.email === 'string') {
            return {
                userId: payload.userId,
                email: payload.email,
                iat: payload.iat,
                exp: payload.exp,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Set the auth cookie with the JWT token
 */
export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: false, // process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
}

/**
 * Remove the auth cookie
 */
export async function removeAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the auth token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return token?.value ?? null;
}

/**
 * Get the current user from the auth cookie
 */
export async function getCurrentUserFromCookie(): Promise<JWTPayload | null> {
    const token = await getAuthToken();
    if (!token) return null;
    return verifyToken(token);
}
