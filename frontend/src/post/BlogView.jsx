import { useEffect, useState, useCallback } from "react";
import { fetchAPI } from "../api.mjs";
import { MdDelete } from "react-icons/md";

function BlogView() {
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const getPosts = useCallback(() => {
        setPosts([]);
        setStatus(null);

        const authKey = localStorage.getItem("auth-key");

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

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    // Ask for confirmation
    const askDeletePost = (postId) => {
        setConfirmDelete(postId);
    };

    // Delete post
    const confirmDeletePost = useCallback(() => {
        if (!confirmDelete) return;

        const authKey = localStorage.getItem("auth-key");

        fetchAPI(
            "DELETE",
            "/post/" + confirmDelete,
            null,
            authKey
        )
            .then((response) => {
                if (response.status === 200) {
                    getPosts();
                } else {
                    setStatus(
                        response.body?.message ||
                        "Failed to delete post."
                    );
                }
            })
            .catch((error) => {
                setStatus(String(error));
            });

        setConfirmDelete(null);
    }, [confirmDelete, getPosts]);

    return (
        <section className="flex flex-col items-center p-4 gap-4">
            <h1 className="text-3xl font-bold self-start">
                My Posts
            </h1>

            {status && (
                <span className="text-error self-start">
                    {status}
                </span>
            )}

            {!status && posts.length === 0 && (
                <span className="loading loading-spinner loading-xl mt-8"></span>
            )}

            {/* Blog post list */}
            <ul className="list self-stretch">
                {posts.map((post) => (
                    <li
                        key={post.id}
                        className="flex flex-col gap-2 p-4 border-b border-base-200"
                    >
                        <div className="flex justify-between w-full items-start">
                            <span className="font-semibold text-base">
                                {post.title}
                            </span>

                            <button
                                type="button"
                                onClick={() => askDeletePost(post.id)}
                                className="btn btn-ghost btn-xs text-error"
                            >
                                <MdDelete />
                                Delete
                            </button>
                        </div>

                        <p className="text-sm text-base-content leading-relaxed break-words overflow-hidden w-full">
                            {post.content}
                        </p>

                        <span className="text-xs opacity-50">
                            {new Date(post.created_at).toLocaleDateString(
                                "en-AU",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }
                            )}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 p-5 shadow-xl">
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
                    ></div>
                </div>
            )}
        </section>
    );
}

export default BlogView;