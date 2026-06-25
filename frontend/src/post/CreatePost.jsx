import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAPI } from "../api.mjs";

function CreatePost() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const authKey = localStorage.getItem("authKey");

        try {
            const res = await fetchAPI(
                "POST",
                "/post/",
                {
                    title,
                    content,
                },
                authKey
            );

            if (!res || res.error) {
                throw new Error(res?.message || "Failed to create post");
            }

            navigate("/blog");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex justify-center p-6 min-h-screen bg-base-200">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-md"
            >
                <h2 className="text-2xl font-bold mb-4">Create Post</h2>

                {error && (
                    <p className="text-red-500 mb-3">{error}</p>
                )}

                <input
                    type="text"
                    placeholder="Title"
                    className="input input-bordered w-full mb-4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <textarea
                    placeholder="Content"
                    className="textarea textarea-bordered w-full mb-4 h-40"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="btn btn-success w-full"
                    disabled={loading}
                >
                    {loading ? "Creating..." : "Create Post"}
                </button>
            </form>
        </section>
    );
}

export default CreatePost;