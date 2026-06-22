import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { IoMdCreate, IoMdTrash } from "react-icons/io";
import { fetchAPI } from "../api.mjs";

function BlogView() {
    const navigate = useNavigate();
    const location = useLocation();

    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadPosts = () => {
        const authKey = localStorage.getItem("authKey");

        fetchAPI("GET", "/post/", null, authKey)
            .then((res) => {
                const data = res.body;
                setBlogs(data);
                setError(data.length ? null : "No blog posts found.");
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Failed to fetch blog posts.");
                setIsLoading(false);
            });
    };

    useEffect(() => {
        loadPosts();
    }, [location.key]); // refresh when coming back

    return (
        <section className="flex flex-col items-center p-6 min-h-screen bg-b-200">
            <div className="w-full max-w-4xl flex justify-between mb-6">
                <h2 className="text-3xl font-bold">Blog Posts</h2>

                <button
                    onClick={() => navigate("/create")}
                    className="btn btn-success text-white flex items-center gap-2"
                >
                    <IoMdCreate />
                    Create
                </button>
            </div>

            {isLoading ? (
                <span className="loading loading-spinner loading-lg"></span>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <ul className="w-full max-w-4xl space-y-4">
                    {blogs.map((post) => (
                        <li key={post.id} className="p-4 bg-blue rounded-xl shadow">
                            <h3 className="text-xl font-bold">{post.title}</h3>
                            <p className="text-sm text-gray-500">{post.date}</p>
                            <p className="mt-2">{post.content}</p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => navigate(`/delete/${post.id}`)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default BlogView;