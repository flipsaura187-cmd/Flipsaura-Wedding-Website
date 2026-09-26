"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import BlogForm from "@/components/admin/BlogForm";

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);

    const fetchBlogs = async () => {
        const res = await fetch("/api/admin/blogs"); // you'll need this admin-only endpoint
        const data = await res.json();
        setBlogs(data);
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (slug) => {
        if (!confirm("Delete this blog?")) return;
        await fetch(`/api/blogs/${slug}`, { method: "DELETE" });
        fetchBlogs();
    };

    return (
        <div className="dash-main">
            <div className="section-head">
                <h2>Manage Blogs</h2>
                <button className="btn btn-primary" onClick={() => { setEditingBlog(null); setShowModal(true); }}>
                    + New Blog
                </button>
            </div>
            <table className="data">
                <thead>
                    <tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {blogs.map((blog) => (
                        <tr key={blog._id}>
                            <td>{blog.title}</td>
                            <td><span className={`tag ${blog.status}`}>{blog.status}</span></td>
                            <td>{new Date(blog.updatedAt).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => { setEditingBlog(blog); setShowModal(true); }}>✏️</button>
                                <button onClick={() => handleDelete(blog.slug)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        <BlogForm initialData={editingBlog} onSuccess={() => { setShowModal(false); fetchBlogs(); }} />
                    </div>
                </div>
            )}
        </div>
    );
}