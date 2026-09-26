"use client";
import { useState } from "react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");
            setStatus({ type: "success", message: "Message sent! We'll get back to you soon." });
            setForm({ name: "", email: "", phone: "", message: "" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <section className="section">
                <div className="container">
                    <div className="section-head" style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <span className="eyebrow">Get in touch</span>
                        <h2>We'd love to hear from you</h2>
                        <p>Have questions about your wedding planning? Our team is here to help.</p>
                    </div>

                    <div className="contact-grid">
                        {/* Contact form */}
                        <div className="contact-form-card">
                            <h3>Send us a message</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="field">
                                    <label>Full name *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required />
                                </div>
                                <div className="field">
                                    <label>Email *</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} required />
                                </div>
                                <div className="field">
                                    <label>Phone (optional)</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Message *</label>
                                    <textarea name="message" rows="5" value={form.message} onChange={handleChange} required />
                                </div>
                                {status.message && (
                                    <div className={status.type === "success" ? "success" : "error"}>{status.message}</div>
                                )}
                                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                    {loading ? "Sending..." : "Send message"}
                                </button>
                            </form>
                        </div>

                        {/* Contact info & map */}
                        <div className="contact-info-card">
                            <div className="info-item">
                                <div>
                                    <h4>Email</h4>
                                    <a href="mailto:flipsaura187@gmail.com">flipsaura187@gmail.com</a>
                                </div>
                            </div>
                            <div className="info-item">
                                <div>
                                    <h4>Phone</h4>
                                    <a href="tel:+917016973928">+91 7016973928</a>
                                </div>
                            </div>
                            <div className="info-item">
                                <div>
                                    <h4>Address</h4>
                                    <p>Khudwan, Daudnagar Aurangabad Bihar </p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div>
                                    <h4>Support hours</h4>
                                    <p>Always Open</p>
                                </div>
                            </div>
                            {/* Google Maps embed (optional) */}
                            <div className="map-embed">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.123456789!2d72.845!3d19.076!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c7e5a5b5b5b5%3A0x123456789abcdef!2sMumbai!5e0!3m2!1sen!2sin!4v1234567890"
                                    width="100%" height="200" style={{ border: 0, borderRadius: "20px" }} allowFullScreen loading="lazy"
                                    title="FlipsAura location"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}