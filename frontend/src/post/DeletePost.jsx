import { useNavigate, useParams } from "react-router-dom";
import { fetchAPI } from "../api.mjs";

function DeletePost() {
    const { id } = useParams();
    const navigate = useNavigate();

    const handleDelete = async () => {
        const authKey = localStorage.getItem("authKey");

        try {
            await fetchAPI(
                "DELETE",
                `/api/post/${id}`,
                null,
                authKey
            );

            navigate("/BlogView");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <section className="flex justify-center p-6">
            <div className="bg-base p-6 shadow rounded">
                <h2 className="text-2xl font-bold mb-4">
                    Delete Post
                </h2>

                <p>Are you sure you want to delete this post?</p>

                <button
                    onClick={handleDelete}
                    className="btn btn-error mt-4"
                >
                    Delete
                </button>
            </div>
        </section>
    );
}

export default DeletePost;