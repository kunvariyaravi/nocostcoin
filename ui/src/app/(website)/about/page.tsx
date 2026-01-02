import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function About() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold text-white mb-6">About Nocostcoin</h1>
                    <p className="text-xl text-slate-400 mb-12">
                        Building the world&apos;s first truly zero-fee blockchain with deterministic consensus.
                    </p>

                    <div className="prose prose-lg prose-invert max-w-none">
                        <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-slate-300 mb-6">
                            Nocostcoin was created to solve the fundamental problems plaguing modern blockchains:
                            high transaction fees, slow confirmation times, and vulnerability to attacks. We believe
                            that blockchain technology should be accessible to everyone, without the burden of gas fees.
                        </p>

                        <h2 className="text-3xl font-bold text-white mb-4 mt-12">The Technology</h2>
                        <p className="text-slate-300 mb-6">
                            Our innovative Proof of Determinism consensus mechanism ensures that every block has
                            exactly one valid producer, eliminating forks and providing instant finality. Combined
                            with Hidden Leader Election, we&apos;ve created a blockchain that&apos;s both secure and efficient.
                        </p>

                        <h2 className="text-3xl font-bold text-white mb-4 mt-12">Why Zero Fees?</h2>
                        <p className="text-slate-300 mb-6">
                            Transaction fees create barriers to adoption and limit use cases. By implementing a
                            unique Proof-of-Work puzzle system for spam prevention, we&apos;ve eliminated the need
                            for fees entirely while maintaining network security.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
