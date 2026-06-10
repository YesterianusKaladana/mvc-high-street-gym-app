import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { IoMdCreate } from "react-icons/io";
import { fetchAPI } from "../api.mjs";

function BlogView() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {

        const authKey = localStorage.getItem("authKey");

        fetchAPI("GET","/api/post/", null, authKey)
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
    }, []);

    return (
        <section className="flex flex-col items-center p-6 min-h-screen bg-base-200">
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-center sm:text-left w-full sm:w-auto">Blog Posts</h2>
                <button
                    onClick={() => navigate("/create")}
                    className="btn btn-success text-white flex items-center gap-2"
                >
                    <IoMdCreate className="text-xl" />
                    Create
                </button>
            </div>

            {isLoading ? (
                <span className="loading loading-spinner loading-lg my-10"></span>
            ) : error ? (
                <span className="text-red-500 text-lg">{error}</span>
            ) : (
                <ul className="w-full max-w-4xl space-y-4">
                    {blogs.map((post) => (
                        <li
                            key={post.id}
                            className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                        >
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
                                {post.author && (
                                    <p className="text-sm text-gray-500">By {post.author}</p>
                                )}
                                {post.date && (
                                    <p className="text-xs text-gray-400">
                                        {new Date(post.date).toLocaleDateString()}
                                    </p>
                                )}
                                <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                                    {post.content}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/create", { state: { blog: post } })}
                                className="btn btn-outline btn-success mt-4 sm:mt-0 sm:ml-4"
                            >
                                Edit
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default BlogView;
