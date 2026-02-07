import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    getProfile: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { id: input.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    createdAt: true,
                    _count: {
                        select: {
                            posts: {
                                where: { deletedAt: null },
                            },
                        },
                    },
                },
            });

            return user;
        }),

    getCurrentUser: publicProcedure.query(async ({ ctx }) => {
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
