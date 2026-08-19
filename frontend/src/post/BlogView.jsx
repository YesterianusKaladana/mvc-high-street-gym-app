import { useEffect, useState, useCallback } from "react";
import { fetchAPI } from "../api.mjs";
import { MdDelete } from "react-icons/md";

function BlogView() {
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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

        // Re-check when user comes back to this page/window
        window.addEventListener("focus", checkLogin);

        return () => {
            window.removeEventListener("focus", checkLogin);
        };
    }, []);

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    // Ask for confirmation
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

    return (
        <section className="flex flex-col items-center p-4 gap-4">

            <h1 className="text-3xl font-bold self-start">
                Blog Posts
            </h1>

            {status && (
                <span className="text-error self-start">
                    {status}
                </span>
            )}

            {posts.length === 0 && !status && (
                <span className="loading loading-spinner loading-xl mt-8"></span>
            )}

            {/* Blog post list */}
            <ul className="list self-stretch">
                {posts.map((post) => (
                    <li
                        key={post.id}
                        className="flex flex-col gap-2 p-4 border-b border-base-200"
                    >
                        <div className="flex justify-between w-full items-start gap-4">

                            <span className="font-semibold text-base">
                                {post.title}
                            </span>

                            {/* SHOW DELETE IF LOGGED IN */}
                            {isLoggedIn && (
                                <button
                                    type="button"
                                    onClick={() => askDeletePost(post.id)}
                                    className="btn btn-ghost"
                                >
                                    <MdDelete />
                                    Delete
                                </button>
                            )}

                        </div>

                        <p className="text-sm text-base-content leading-relaxed break-words overflow-hidden w-full">
                            {post.content}
                        </p>

                        <span className="text-xs opacity-50">
                            {new Date(
                                post.created_at
                            ).toLocaleDateString("en-AU", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">

                        <h3 className="font-bold text-lg">
                            Delete Blog Post
                        </h3>

                        <p className="py-4">
                            Are you sure you want to delete this blog post?
                            This cannot be undone.
                        </p>

                        <div className="modal-action">

                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDeletePost}
                                className="btn btn-error"
                            >
                                Delete
                            </button>

                        </div>
                    </div>

                    <div
                        className="modal-backdrop"
                        onClick={() => setConfirmDelete(null)}
                    />
                </div>
            )}
        </section>
    );
}

export default BlogView;