"use server";

import { z } from "zod";
import { db } from "~/server/db";
import {
    verifyPassword,
    signToken,
    setAuthCookie,
    removeAuthCookie
} from "~/lib/auth";

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginState = {
    error?: string;
    success?: boolean;
};

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedFields = LoginSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                error: validatedFields.error.flatten().fieldErrors.email?.[0] ||
                    validatedFields.error.flatten().fieldErrors.password?.[0] ||
                    "Invalid input",
            };
        }

        const { email, password } = validatedFields.data;

        // Find user by email
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Invalid email or password" };
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return { error: "Invalid email or password" };
        }

        // Create and set JWT token
        const token = await signToken({ userId: user.id, email: user.email });
        await setAuthCookie(token);

        return { success: true };
    } catch (error) {
        console.error("Login error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}

export async function logoutAction() {
    await removeAuthCookie();
    return { success: true };
}
