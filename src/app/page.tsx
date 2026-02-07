"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "~/trpc/react";
import { PostCard } from "~/components/PostCard";
import { Spinner } from "~/components/Spinner";
import { Skeleton } from "~/components/ui/skeleton";

export default function HomePage() {
  const { ref, inView } = useInView();

  const { data: session } = api.auth.getSession.useQuery();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = api.post.getAll.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Social Posts
        </h1>
        <p className="text-muted-foreground mt-2">
          Share your thoughts with the world
        </p>
      </div>

      {/* CreatePostForm moved to Profile page */}

      {!session && (
        <div className="text-center py-4 px-6 rounded-lg bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950/30 dark:to-indigo-950/30">
          <p className="text-muted-foreground">
            <a href="/login" className="text-violet-600 font-semibold hover:underline">
              Login
            </a>
            {" "}or{" "}
            <a href="/register" className="text-violet-600 font-semibold hover:underline">
              Register
            </a>
            {" "}to create posts and like content
          </p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))
        ) : isError ? (
          <div className="text-center py-10 text-destructive">
            Something went wrong. Please try again.
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          <>
            {allPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session?.id}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={ref} className="flex justify-center py-4">
              {isFetchingNextPage && <Spinner size="lg" />}
              {!hasNextPage && allPosts.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  You've reached the end
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
