import Link from "@/compat/Link";

export default function ItemCard({ item }) {
  return (
    <Link href={`/product/${item._id}`} className="card">
      <div className="card-img">
        {item.images?.[0] ? <img src={item.images[0]} alt={item.title} loading="lazy" /> : null}
      </div>
      <div className="card-body">
        {item.featured && <span className="badge">Featured</span>}
        <h3 className="card-title">{item.title}</h3>
        <div className="card-meta">{item.city || "India"}</div>
        <div className="card-foot">
          <span className="price">₹{item.price?.toLocaleString("en-IN")}</span>
          <span className="card-meta">★ {item.rating?.toFixed?.(1) || "—"}</span>
        </div>
      </div>
    </Link>
  );
}
