"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Spinner } from "~/components/Spinner";
import { PlusCircle } from "lucide-react";

interface CreatePostFormProps {
    onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const utils = api.useUtils();

    const createMutation = api.post.create.useMutation({
        onSuccess: () => {
            setTitle("");
            setContent("");
            setIsExpanded(false);
            utils.post.getAll.invalidate();
            onPostCreated?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        createMutation.mutate({ title, content });
    };

    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-lg shadow-violet-200/30 dark:from-violet-950/20 dark:to-indigo-950/20 dark:shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PlusCircle className="h-5 w-5 text-violet-600" />
                    Create a Post
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isExpanded ? (
                        <Input
                            placeholder="What's on your mind?"
                            onFocus={() => setIsExpanded(true)}
                            className="bg-white dark:bg-gray-900"
                        />
                    ) : (
                        <>
                            <Input
                                placeholder="Post title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white dark:bg-gray-900"
                                autoFocus
                            />
                            <Textarea
                                placeholder="Share your thoughts..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                className="bg-white dark:bg-gray-900 resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setTitle("");
                                        setContent("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        !title.trim() ||
                                        !content.trim()
                                    }
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <Spinner size="sm" className="mr-2" />
                                            Posting...
                                        </>
                                    ) : (
                                        "Post"
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
