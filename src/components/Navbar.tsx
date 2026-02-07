"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Spinner } from "~/components/Spinner";

export function Navbar() {
    const router = useRouter();
    const { data: session, isLoading } = api.auth.getSession.useQuery();
    const utils = api.useUtils();



    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                        <span className="text-sm font-bold text-white">SP</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        SocialPosts
                    </span>
                </Link>

                <nav className="flex items-center gap-4">
                    {isLoading ? (
                        <Spinner size="sm" />
                    ) : session ? (
                        <>
                            <Link href={`/profile/${session.id}`}>
                                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-violet-500/20 hover:ring-violet-500/50 transition-all">
                                    <AvatarImage src={session.image ?? undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs">
                                        {getInitials(session.name ?? "U")}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    const { logoutAction } = await import("~/app/login/actions");
                                    await logoutAction();
                                    utils.auth.getSession.invalidate();
                                    window.location.href = "/login";
                                }}
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                asChild
                            >
                                <Link href="/register">Register</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
