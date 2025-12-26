import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function Contact() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">Get in Touch</h1>
                    <p className="text-xl text-gray-600 mb-12">
                        Have questions? Want to contribute? We&apos;d love to hear from you.
                    </p>

                    <div className="card">
                        <form className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="input"
                                    placeholder="Your name"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="input"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={6}
                                    className="input"
                                    placeholder="Tell us what you're thinking..."
                                ></textarea>
                            </div>

                            <button type="submit" className="btn-primary w-full">
                                Send Message
                            </button>
                        </form>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card text-center">
                            <div className="text-4xl mb-3">📧</div>
                            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                            <p className="text-gray-600">contact@nocostcoin.org</p>
                        </div>
                        <div className="card text-center">
                            <div className="text-4xl mb-3">💬</div>
                            <h3 className="font-semibold text-gray-900 mb-2">Discord</h3>
                            <p className="text-gray-600">Join our community</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
