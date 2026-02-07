import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const likeRouter = createTRPCRouter({
    // Toggle like on a post (authenticated only)
    toggle: protectedProcedure
        .input(z.object({ postId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { postId } = input;
            const userId = ctx.user.userId;

            // Check if post exists and is not deleted
            const post = await ctx.db.post.findUnique({
                where: { id: postId },
                select: { id: true, deletedAt: true },
            });

            if (!post || post.deletedAt) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Post not found",
                });
            }

            // Check if like already exists
            const existingLike = await ctx.db.like.findUnique({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });

            if (existingLike) {
                // Unlike - remove the like
                await ctx.db.like.delete({
                    where: { id: existingLike.id },
                });

                return { liked: false };
            } else {
                // Like - create new like
                await ctx.db.like.create({
                    data: {
                        userId,
                        postId,
                    },
                });

                return { liked: true };
            }
        }),

    // Check if current user liked a post
    hasLiked: protectedProcedure
        .input(z.object({ postId: z.string() }))
        .query(async ({ ctx, input }) => {
            const like = await ctx.db.like.findUnique({
                where: {
                    userId_postId: {
                        userId: ctx.user.userId,
                        postId: input.postId,
                    },
                },
            });

            return !!like;
        }),

    // Get likes for a post with user details
    getByPost: publicProcedure
        .input(z.object({ postId: z.string() }))
        .query(async ({ ctx, input }) => {
            const likes = await ctx.db.like.findMany({
                where: { postId: input.postId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 20, // Limit to recent 20 likes
            });

            const count = await ctx.db.like.count({
                where: { postId: input.postId },
            });

            return {
                likes,
                count,
            };
        }),
});
