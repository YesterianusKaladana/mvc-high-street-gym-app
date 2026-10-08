
import { useEffect, useState, useCallback } from "react";
import { fetchAPI } from "../api.mjs";
import { MdDelete } from "react-icons/md";

function BlogView() {
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Create post state
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const getAuthKey = () => {
        return localStorage.getItem("auth-key");
    };

    // Get posts
    const getPosts = useCallback(() => {
        setPosts([]);
        setStatus(null);

        const authKey = getAuthKey();

        fetchAPI("GET", "/post/", null, authKey)
            .then((response) => {
                if (response.status === 200) {
                    setPosts(response.body);
                } else {
                    setStatus(
                        response.body?.message ||
                        "Failed to load blog posts."
                    );
                }
            })
            .catch((error) => {
                setStatus(String(error));
            });
    }, []);

    // Check login
    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(Boolean(getAuthKey()));
        };

        checkLogin();

        window.addEventListener("focus", checkLogin);

        return () => {
            window.removeEventListener("focus", checkLogin);
        };
    }, []);

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    // Ask for delete confirmation
    const askDeletePost = (postId) => {
        const authKey = getAuthKey();

        if (!authKey) {
            setStatus("Please login to delete posts.");
            return;
        }

        setConfirmDelete(postId);
        setStatus(null);
    };

    // Delete post
    const confirmDeletePost = useCallback(() => {
        if (!confirmDelete) return;

        const authKey = getAuthKey();

        if (!authKey) {
            setStatus("Please login to delete posts.");
            setConfirmDelete(null);
            return;
        }

        fetchAPI(
            "DELETE",
            `/post/${confirmDelete}`,
            null,
            authKey
        )
            .then((response) => {
                if (response.status === 200) {
                    setConfirmDelete(null);
                    getPosts();
                } else {
                    setStatus(
                        response.body?.message ||
                        "Failed to delete post."
                    );
                    setConfirmDelete(null);
                }
            })
            .catch((error) => {
                setStatus(String(error));
                setConfirmDelete(null);
            });
    }, [confirmDelete, getPosts]);

    // Open create form
    const openCreatePost = () => {
        const authKey = getAuthKey();

        if (!authKey) {
            setStatus("Please login to create posts.");
            return;
        }

        setStatus(null);
        setTitle("");
        setContent("");
        setShowCreate(true);
    };

    // Create post
    const createPost = async () => {
        const authKey = getAuthKey();

        if (!authKey) {
            setStatus("Please login to create posts.");
            setShowCreate(false);
            return;
        }

        if (!title.trim()) {
            setStatus("Please enter a title.");
            return;
        }

        if (!content.trim()) {
            setStatus("Please enter some content.");
            return;
        }

        try {
            setIsCreating(true);
            setStatus(null);

            const response = await fetchAPI(
                "POST",
                "/post/",
                {
                    post: {
                        title: title.trim(),
                        content: content.trim()
                    }
                },
                authKey
            );

            if (response.status === 201) {
                setShowCreate(false);
                setTitle("");
                setContent("");
                getPosts();
            } else {
                setStatus(
                    response.body?.message ||
                    "Failed to create post."
                );
            }
        } catch (error) {
            setStatus(String(error));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <section className="flex flex-col items-center gap-4 p-4">

            {/* Navigation */}
            <div className="navbar w-full max-w-4xl rounded-xl bg-base-100 px-5 shadow-sm">
                <h1 className="text-lg font-bold">
                    Posts
                </h1>

                <div className="ml-auto">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={openCreatePost}
                        disabled={!isLoggedIn}
                    >
                        New Post
                    </button>
                </div>
            </div>

            {/* Status */}
            {status && (
                <span className="w-full max-w-4xl text-error">
                    {status}
                </span>
            )}

            {/* Loading */}
            {posts.length === 0 && !status && (
                <span className="loading loading-spinner loading-xl mt-8" />
            )}

            {/* Blog post list */}
            <ul className="w-full max-w-4xl space-y-4">
                {posts.map((post) => (
                    <li
                        key={post.id}
                        className="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm"
                    >
                        {/* Post header */}
                        <div className="flex items-start justify-between gap-4 border-b border-base-200 pb-3">
                            <div className="min-w-0">
                                <h2 className="break-words text-lg font-bold">
                                    {post.title}
                                </h2>

                                <span className="mt-1 block text-xs opacity-50">
                                    {new Date(
                                        post.created_at
                                    ).toLocaleDateString("en-AU", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            {isLoggedIn && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        askDeletePost(post.id)
                                    }
                                    className="btn btn-ghost btn-sm shrink-0 text-error"
                                >
                                    <MdDelete />

                                    <span className="hidden sm:inline">
                                        Delete
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Post content */}
                        <div className="pt-4">
                            <p className="whitespace-pre-line break-words text-sm leading-7">
                                {post.content}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Create Post Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">

                        <h3 className="text-lg font-bold">
                            Create Blog Post
                        </h3>

                        {/* Title */}
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">
                                    Title
                                </span>
                            </label>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) =>
                                    setTitle(e.target.value)
                                }
                                placeholder="Enter post title"
                                className="input input-bordered w-full"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Content */}
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">
                                    Content
                                </span>
                            </label>

                            <textarea
                                value={content}
                                onChange={(e) =>
                                    setContent(e.target.value)
                                }
                                placeholder="Write your post..."
                                className="textarea textarea-bordered h-40 w-full"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="modal-action mt-5 flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreate(false)
                                }
                                className="btn btn-ghost"
                                disabled={isCreating}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={createPost}
                                className="btn btn-primary"
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <span className="loading loading-spinner" />
                                ) : (
                                    "Create Post"
                                )}
                            </button>

                        </div>
                    </div>

                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            if (!isCreating) {
                                setShowCreate(false);
                            }
                        }}
                    />
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">

                        <h3 className="text-lg font-bold">
                            Delete Blog Post
                        </h3>

                        <p className="py-4">
                            Are you sure you want to delete this blog post?
                            This cannot be undone.
                        </p>

                        <div className="modal-action flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmDelete(null)
                                }
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDeletePost}
                                className="btn btn-error"
                            >
                                <MdDelete />
                                Delete
                            </button>

                        </div>
                    </div>

                    <div
                        className="modal-backdrop"
                        onClick={() =>
                            setConfirmDelete(null)
                        }
                    />
                </div>
            )}

        </section>
    );
}

export default BlogView;
