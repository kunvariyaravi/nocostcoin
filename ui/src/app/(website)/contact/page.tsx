"use client";

import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";
import { useState } from "react";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setErrorMessage("");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", message: "" });
            } else {
                setStatus("error");
                setErrorMessage(data.error || "Something went wrong.");
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage("Failed to connect to the server.");
        }
    };

    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold text-white mb-6">Get in Touch</h1>
                    <p className="text-xl text-slate-400 mb-12">
                        Have questions? Want to contribute? We&apos;d love to hear from you.
                    </p>

                    <div className="card">
                        {status === "success" ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-slate-400">Thanks for reaching out. We&apos;ll get back to you shortly.</p>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="btn-secondary mt-6"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="input bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 w-full"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="input bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 w-full"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        className="input bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 w-full"
                                        placeholder="Tell us what you're thinking..."
                                    ></textarea>
                                </div>

                                {status === "error" && (
                                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                        ❌ {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === "submitting"}
                                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === "submitting" ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>


                </div>
            </main>
        </>
    );
}

