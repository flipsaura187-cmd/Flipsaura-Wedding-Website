"use client";
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-2 my-8">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-brand-200 bg-white text-ink font-semibold text-lg hover:bg-brand-50 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          type="button"
          key={p}
          onClick={() => onChange(p)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-semibold text-sm transition-all duration-200 ${
            p === page
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/25"
              : "bg-white border border-brand-200 text-ink hover:bg-brand-50 hover:border-brand-300"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-brand-200 bg-white text-ink font-semibold text-lg hover:bg-brand-50 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}

