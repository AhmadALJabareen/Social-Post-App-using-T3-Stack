import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  // Create a new post (authenticated only)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        content: z.string().min(1, "Content is required").max(5000, "Content too long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.user.userId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: { likes: true },
          },
        },
      });

      return post;
    }),

  // Update a post (author only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        content: z.string().min(1, "Content is required").max(5000, "Content too long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        select: { authorId: true, deletedAt: true },
      });

      if (!post || post.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.authorId !== ctx.user.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts",
        });
      }

      const updatedPost = await ctx.db.post.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: { likes: true },
          },
        },
      });

      return updatedPost;
    }),

  // Soft delete a post (author only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        select: { authorId: true, deletedAt: true },
      });

      if (!post || post.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.authorId !== ctx.user.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      // Soft delete by setting deletedAt
      await ctx.db.post.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // Get all posts with pagination (public, excludes soft-deleted)
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const posts = await ctx.db.post.findMany({
        where: { deletedAt: null },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          likes: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 5, // First 5 users who liked
          },
          _count: {
            select: { likes: true },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  // Get posts by user ID (public, excludes soft-deleted)
  getByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const posts = await ctx.db.post.findMany({
        where: {
          authorId: userId,
          deletedAt: null,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          likes: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 5,
          },
          _count: {
            select: { likes: true },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),
});
