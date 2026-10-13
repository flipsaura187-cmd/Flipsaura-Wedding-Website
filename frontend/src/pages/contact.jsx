"use client";
import { useState } from "react";

import api from "@/api/axios";
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
            const { data } = await api.post("/api/contact", form);
            if (!data.ok) throw new Error(data.error || "Failed to send");
            setStatus({ type: "success", message: "Message sent! We'll get back to you soon." });
            setForm({ name: "", email: "", phone: "", message: "" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 md:py-20 bg-brand-50/40 min-h-[85vh]">
            <div className="max-w-container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-xl mx-auto mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
                        Get in touch
                    </span>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">
                        We'd love to hear from you
                    </h1>
                    <p className="text-muted text-sm md:text-base">
                        Have questions about your wedding planning? Our team is here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Contact form */}
                    <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-brand-100 shadow-xl shadow-brand-500/5">
                        <h2 className="font-serif text-2xl font-bold text-ink mb-6">
                            Send us a message
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                                    Full name *
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                                    Phone (optional)
                                </label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                                    Message *
                                </label>
                                <textarea
                                    name="message"
                                    rows="5"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                />
                            </div>
                            {status.message && (
                                <div
                                    className={`p-3.5 rounded-xl text-sm font-medium ${
                                        status.type === "success"
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                            : "bg-rose-50 border border-rose-200 text-rose-700"
                                    }`}
                                >
                                    {status.message}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send message"}
                            </button>
                        </form>
                    </div>

                    {/* Contact info & map */}
                    <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-brand-100 shadow-xl shadow-brand-500/5 space-y-6">
                        <div className="flex items-start gap-3.5">
                            <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg text-brand-600 shrink-0">
                                ✉️
                            </span>
                            <div>
                                <h4 className="font-bold text-ink text-sm mb-0.5">Email</h4>
                                <a
                                    href="mailto:flipsaura187@gmail.com"
                                    className="text-brand-700 font-semibold text-sm hover:underline"
                                >
                                    flipsaura187@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg text-brand-600 shrink-0">
                                📞
                            </span>
                            <div>
                                <h4 className="font-bold text-ink text-sm mb-0.5">Phone</h4>
                                <a
                                    href="tel:+917016973928"
                                    className="text-brand-700 font-semibold text-sm hover:underline"
                                >
                                    +91 7016973928
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg text-brand-600 shrink-0">
                                📍
                            </span>
                            <div>
                                <h4 className="font-bold text-ink text-sm mb-0.5">Address</h4>
                                <p className="text-muted text-sm m-0">
                                    Khudwan, Daudnagar Aurangabad Bihar
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg text-brand-600 shrink-0">
                                ⏰
                            </span>
                            <div>
                                <h4 className="font-bold text-ink text-sm mb-0.5">Support hours</h4>
                                <p className="text-muted text-sm m-0">Always Open</p>
                            </div>
                        </div>

                        {/* Google Maps embed */}
                        <div className="rounded-2xl overflow-hidden border border-brand-100 shadow-sm mt-4">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.123456789!2d72.845!3d19.076!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c7e5a5b5b5b5%3A0x123456789abcdef!2sMumbai!5e0!3m2!1sen!2sin!4v1234567890"
                                width="100%"
                                height="200"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="FlipsAura location"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
