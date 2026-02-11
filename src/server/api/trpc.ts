import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";
import { verifyToken, type JWTPayload } from "~/lib/auth";


export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Extract JWT token from cookies
  const cookieHeader = opts.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...val] = c.split("=");
      return [key, val.join("=")];
    })
  );

  const token = cookies["auth-token"];
  let user: JWTPayload | null = null;

  if (token) {
    user = await verifyToken(token);
  }

  return {
    db,
    user,
    ...opts,
  };
};


const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});


export const createCallerFactory = t.createCallerFactory;


export const createTRPCRouter = t.router;

/**
  Middleware for timing procedure execution and adding an artificial delay in development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Auth middleware - ensures user is authenticated
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});



export const publicProcedure = t.procedure.use(timingMiddleware);


export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware);
