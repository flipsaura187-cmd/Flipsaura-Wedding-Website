"use client";
import { useRouter } from "@/compat/navigation";
import BlogForm from "@/components/admin/BlogForm";

export default function AdminBlogCreate() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/blogs");
  };

  const handleCancel = () => {
    router.push("/admin/blogs");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm font-semibold text-muted hover:text-ink inline-flex items-center gap-1 transition"
        >
          ← Back to Articles
        </button>
      </div>
      <BlogForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
