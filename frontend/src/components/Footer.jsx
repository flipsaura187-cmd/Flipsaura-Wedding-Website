import Link from "@/compat/Link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand"><span className="brand-dot" /> FlipsAura</div>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Curated wedding venues, decor, and planners — bringing your dream day together.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link href="/categories/venues">Venues</Link></li>
            <li><Link href="/categories/home-setup-pandal-tent-dj">Home Setup</Link></li>
            <li><Link href="/categories/planning-decor">Planning & Decor</Link></li>
            <li><Link href="/categories/photographer-videographer">Photography</Link></li>
            <li><Link href="/categories/music-dance">Music & Dance</Link></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><Link href="/#about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/account">Account</Link></li>
            <li><Link href="/blogs">Blogs</Link></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><Link href="/terms-of-service">Terms of Service</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/refund-cancellation-policy">Refund & Cancellation</Link></li>
            <li><Link href="/shipping-policy">Shipping Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li>info.flipsaura@gmail.com</li>
            <li>+91 7016973928</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} FlipsAura. All rights reserved.</div>
    </footer>
  );
}
