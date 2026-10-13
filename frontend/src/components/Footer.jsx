import Link from "@/compat/Link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-line pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 text-xl font-serif font-bold text-wine">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" /> FlipsAura
          </div>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Curated wedding venues, decor, cars, catering, and planners — bringing your dream day together with ease.
          </p>
        </div>

        <div>
          <h4 className="font-serif font-bold text-ink text-base mb-3.5">Explore</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/categories/venues" className="hover:text-brand-600 transition-colors">Venues</Link></li>
            <li><Link href="/categories/home-setup-pandal-tent-dj" className="hover:text-brand-600 transition-colors">Home Setup</Link></li>
            <li><Link href="/categories/planning-decor" className="hover:text-brand-600 transition-colors">Planning & Decor</Link></li>
            <li><Link href="/categories/photographer-videographer" className="hover:text-brand-600 transition-colors">Photography</Link></li>
            <li><Link href="/categories/music-dance" className="hover:text-brand-600 transition-colors">Music & Dance</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-bold text-ink text-base mb-3.5">Company</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/about" className="hover:text-brand-600 transition-colors">About FlipsAura</Link></li>
            <li><Link href="/contact" className="hover:text-brand-600 transition-colors">Contact Us</Link></li>
            <li><Link href="/account" className="hover:text-brand-600 transition-colors">My Account</Link></li>
            <li><Link href="/blogs" className="hover:text-brand-600 transition-colors">Wedding Blogs</Link></li>
            <li><Link href="/events" className="hover:text-brand-600 transition-colors">Events & Contests</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-bold text-ink text-base mb-3.5">Policies</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/terms-of-service" className="hover:text-brand-600 transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refund-cancellation-policy" className="hover:text-brand-600 transition-colors">Refund & Cancellation</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-brand-600 transition-colors">Shipping Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-bold text-ink text-base mb-3.5">Get in touch</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <a href="mailto:info.flipsaura@gmail.com" className="hover:text-brand-600 transition-colors break-all">
                ✉️ info.flipsaura@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+917016973928" className="hover:text-brand-600 transition-colors">
                📞 +91 7016973928
              </a>
            </li>
            <li className="pt-2 text-xs text-muted/80">
              Operational Hours: 10:00 AM - 7:00 PM IST
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted mt-12 pt-6 border-t border-line/60">
        © {new Date().getFullYear()} FlipsAura. All rights reserved. Made with love for memorable weddings.
      </div>
    </footer>
  );
}
