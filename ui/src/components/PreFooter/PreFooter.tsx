import Link from 'next/link';

export default function PreFooter() {
    return (
        <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Ready to Launch?</h2>
                <p className="text-xl text-white/90 mb-8">
                    Join the thousands of developers building on the future of deterministic consensus.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/testnet" className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                        Launch Testnet
                    </Link>
                    <Link href="/contact" className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                        Contact Sales
                    </Link>
                </div>
            </div>
        </section>
    );
}
