import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
    hashPassword,
    verifyPassword,
    signToken,
    setAuthCookie,
    removeAuthCookie,
} from "~/lib/auth";

export const authRouter = createTRPCRouter({
    register: publicProcedure
        .input(
            z.object({
                name: z.string().min(2, "Name must be at least 2 characters"),
                email: z.string().email("Invalid email address"),
                password: z.string().min(6, "Password must be at least 6 characters"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if user already exists
            const existingUser = await ctx.db.user.findUnique({
                where: { email: input.email },
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User with this email already exists",
                });
            }

            // Hash password and create user
            const hashedPassword = await hashPassword(input.password);
            const user = await ctx.db.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    password: hashedPassword,
                },
            });

            // Create and set JWT token
            const token = await signToken({ userId: user.id, email: user.email });
            await setAuthCookie(token);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            };
        }),

    login: publicProcedure
        .input(
            z.object({
                email: z.string().email("Invalid email address"),
                password: z.string().min(1, "Password is required"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Find user by email
            const user = await ctx.db.user.findUnique({
                where: { email: input.email },
            });

            if (!user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password",
                });
            }

            // Verify password
            const isValid = await verifyPassword(input.password, user.password);
            if (!isValid) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password",
                });
            }

            // Create and set JWT token
            const token = await signToken({ userId: user.id, email: user.email });
            await setAuthCookie(token);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            };
        }),

    logout: publicProcedure.mutation(async () => {
        await removeAuthCookie();
        return { success: true };
    }),

    getSession: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
            return null;
        }

        const user = await ctx.db.user.findUnique({
            where: { id: ctx.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        return user;
    }),
});
