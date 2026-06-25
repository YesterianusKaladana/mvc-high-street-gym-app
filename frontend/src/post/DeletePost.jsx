import { useNavigate, useParams } from "react-router-dom";
import { fetchAPI } from "../api.mjs";
import { useState } from "react";

function DeletePost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        const authKey = localStorage.getItem("authKey");

        setLoading(true);

        try {
            await fetchAPI(
                "DELETE",
                `/post/${id}`,
                null,
                authKey
            );

            navigate("/blog");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex justify-center p-6">
            <div className="bg-base-100 p-6 shadow rounded">
                <h2 className="text-2xl font-bold mb-4">
                    Delete Post
                </h2>

                <p>Are you sure you want to delete this post?</p>

                <button
                    onClick={handleDelete}
                    className="btn btn-error mt-4"
                    disabled={loading}
                >
                    {loading ? "Deleting..." : "Delete"}
                </button>
            </div>
        </section>
    );
}

export default DeletePost;