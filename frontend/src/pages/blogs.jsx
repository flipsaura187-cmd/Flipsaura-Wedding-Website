"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import Image from "@/compat/Image";

export default function BlogsPage() {
    const [blogs, setBlogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/blogs?page=${page}`)
            .then(res => res.json())
            .then(data => {
                setBlogs(data.blogs);
                setTotalPages(data.totalPages);
                setLoading(false);
            });
    }, [page]);

    if (loading) return <div className="loading">Loading stories...</div>;

    return (
        <section className="section">
            <div className="container">
                <div className="section-head">
                    <div>
                        <span className="eyebrow">FlipsAura Journal</span>
                        <h2>Wedding stories & inspiration</h2>
                    </div>
                </div>
                <div className="grid grid-3">
                    {blogs.map(blog => (
                        <Link href={`/blogs/${blog.slug}`} key={blog._id} className="card">
                            <div className="card-img">
                                <Image src={blog.featuredImage} alt={blog.title} width={400} height={250} style={{ objectFit: "cover" }} />
                            </div>
                            <div className="card-body">
                                <div className="card-title">{blog.title}</div>
                                <div className="card-meta">{new Date(blog.publishedAt).toDateString()} • {blog.author}</div>
                                <p className="card-meta" style={{ marginTop: 8 }}>{blog.excerpt}</p>
                            </div>
                        </Link>
                    ))}
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </section>
    );
}