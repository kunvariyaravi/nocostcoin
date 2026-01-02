import Link from 'next/link';

export default function PreFooter() {
    return (
        <section className="py-20 bg-slate-900 border-t border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Ready to Launch?</h2>
                <p className="text-xl text-slate-400 mb-8">
                    Join the thousands of developers building on the future of deterministic consensus.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/testnet" className="btn-primary flex items-center justify-center">
                        Launch Testnet
                    </Link>
                    <Link href="/contact" className="px-8 py-3 bg-transparent text-white border border-slate-700 rounded-lg font-semibold hover:bg-white/5 transition-colors">
                        Contact Sales
                    </Link>
                </div>
            </div>
        </section>
    );
}
