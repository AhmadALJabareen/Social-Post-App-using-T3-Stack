"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Spinner } from "~/components/Spinner";

interface PostCardProps {
    post: {
        id: string;
        title: string;
        content: string;
        createdAt: Date;
        author: {
            id: string;
            name: string | null;
            image: string | null;
        };
        likes: {
            user: {
                id: string;
                name: string | null;
                image: string | null;
            };
        }[];
        _count: {
            likes: number;
        };
    };
    currentUserId?: string;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

export function PostCard({
    post,
    currentUserId,
    onPostDeleted,
    onPostUpdated,
}: PostCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [isLiked, setIsLiked] = useState(
        post.likes.some((like) => like.user.id === currentUserId)
    );
    const [likeCount, setLikeCount] = useState(post._count.likes);

    const utils = api.useUtils();
    const isAuthor = currentUserId === post.author.id;

    const likeMutation = api.like.toggle.useMutation({
        onMutate: () => {
            // Optimistic update
            setIsLiked((prev) => !prev);
            setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        },
        onError: () => {
            // Revert on error
            setIsLiked((prev) => !prev);
            setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
        },
    });

    const updateMutation = api.post.update.useMutation({
        onSuccess: () => {
            setIsEditOpen(false);
            utils.post.getAll.invalidate();
            onPostUpdated?.();
        },
    });

    const deleteMutation = api.post.delete.useMutation({
        onSuccess: () => {
            setIsDeleteOpen(false);
            utils.post.getAll.invalidate();
            onPostDeleted?.();
        },
    });

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLike = () => {
        if (!currentUserId) return;
        likeMutation.mutate({ postId: post.id });
    };

    const handleUpdate = () => {
        updateMutation.mutate({
            id: post.id,
            title: editTitle,
            content: editContent,
        });
    };

    const handleDelete = () => {
        deleteMutation.mutate({ id: post.id });
    };

    return (
        <>
            <Card className="group overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg shadow-gray-200/50 transition-all hover:shadow-xl hover:shadow-violet-200/30 dark:from-gray-900 dark:to-gray-800/50 dark:shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/profile/${post.author.id}`}>
                            <Avatar className="h-10 w-10 ring-2 ring-violet-500/20 hover:ring-violet-500/50 transition-all cursor-pointer">
                                <AvatarImage src={post.author.image ?? undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-sm">
                                    {getInitials(post.author.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <Link
                                href={`/profile/${post.author.id}`}
                                className="font-semibold text-foreground hover:text-violet-600 transition-colors"
                            >
                                {post.author.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.createdAt), {
                                    addSuffix: true,
                                })}
                            </p>
                        </div>
                    </div>

                    {isAuthor && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsEditOpen(true)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="space-y-2">
                    <h3 className="text-lg font-semibold leading-tight">{post.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                        {post.content}
                    </p>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
                                    onClick={handleLike}
                                    disabled={!currentUserId || likeMutation.isPending}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                                    />
                                    <span>{likeCount}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {!currentUserId ? (
                                    <p>Login to like posts</p>
                                ) : post.likes.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        <p className="font-semibold text-xs">Liked by:</p>
                                        {post.likes.slice(0, 5).map((like) => (
                                            <div key={like.user.id} className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={like.user.image ?? undefined} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(like.user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs">{like.user.name}</span>
                                            </div>
                                        ))}
                                        {post._count.likes > 5 && (
                                            <p className="text-xs text-muted-foreground">
                                                +{post._count.likes - 5} others
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p>Be the first to like this post</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                        <DialogDescription>
                            Make changes to your post below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Post title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Post content"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600"
                        >
                            {updateMutation.isPending ? <Spinner size="sm" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Spinner size="sm" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
