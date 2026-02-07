"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import { PostCard } from "~/components/PostCard";
import { CreatePostModal } from "~/components/CreatePostModal";
import { Spinner } from "~/components/Spinner";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Calendar, Mail, FileText, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const { ref, inView } = useInView();

    const { data: session, isLoading: sessionLoading } = api.auth.getSession.useQuery();

    useEffect(() => {
        if (!sessionLoading && !session) {
            router.push("/login");
        }
    }, [session, sessionLoading, router]);

    const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery({
        userId,
    });

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: postsLoading,
    } = api.post.getByUserId.useInfiniteQuery(
        { userId, limit: 10 },
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

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (profileLoading) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="text-center space-y-4 py-8">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-2xl text-center py-16">
                <h1 className="text-2xl font-bold text-muted-foreground">
                    User not found
                </h1>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex items-center">
                <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Feed
                    </Link>
                </Button>
            </div>

            {/* Profile Header */}
            <div className="text-center py-8 px-6 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-white dark:ring-gray-800 shadow-xl">
                    <AvatarImage src={profile.image ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-2xl">
                        {getInitials(profile.name)}
                    </AvatarFallback>
                </Avatar>
                <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {profile.email}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {profile._count.posts} posts
                        </div>
                    </div>
                </div>

                {session?.id === userId && (
                    <div className="mt-6">
                        <CreatePostModal />
                    </div>
                )}
            </div>

            {/* Posts Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Posts</h2>

                <div className="space-y-4">
                    {postsLoading ? (
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
                    ) : allPosts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No posts yet.
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
                                        No more posts
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
