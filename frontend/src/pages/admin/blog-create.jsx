"use client";
import { useRouter } from "@/compat/navigation";
import BlogForm from "@/components/admin/BlogForm";

export default function AdminBlogCreate() {
  const router = useRouter();

  const handleSuccess = (blog) => {
    router.push("/admin/blogs");
  };

  const handleCancel = () => {
    router.push("/admin/blogs");
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleCancel}
          className="btn btn-ghost"
          style={{ fontSize: 13, color: "#666", padding: 0, background: "none", border: "none", cursor: "pointer" }}
        >
          ← Back to Articles
        </button>
      </div>
      <BlogForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
