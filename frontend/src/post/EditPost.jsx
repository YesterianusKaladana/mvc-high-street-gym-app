import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAPI } from "../api.mjs";

function EditPost() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load existing post
    useEffect(() => {
        const authKey = localStorage.getItem("authKey");

        fetchAPI("GET", `/api/post/${id}`, null, authKey)
            .then((res) => {
                const post = res;

                setTitle(post.title);
                setContent(post.content);
            })
            .catch((error) => {
                setError("Failed to load post");
            });
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const authKey = localStorage.getItem("authKey");

        try {
            const res = await fetchAPI(
                "PUT",
                `/api/post/${id}`,
                {
                    post: {
                        title,
                        content
                    }
                },
                authKey
            );

            if (!res) {
                throw new Error("Failed to update post");
            }

            navigate("/BlogView");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex justify-center p-6">
            <form onSubmit={handleUpdate} className="w-full max-w-2xl bg-base p-6 shadow rounded">
                <h2 className="text-2xl font-bold mb-4">Edit Post</h2>

                {error && <p className="text-red-500">{error}</p>}

                <input
                    className="input input-bordered w-full mb-4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    className="textarea textarea-bordered w-full mb-4"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <button className="btn btn-primary w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update Post"}
                </button>
            </form>
        </section>
    );
}

export default EditPost;