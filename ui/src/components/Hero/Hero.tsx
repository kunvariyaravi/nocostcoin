import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 pt-20">
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 backdrop-blur-md mb-8 animate-fade-in">
                    <span className="relative flex h-3 w-3 mr-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-gray-300 text-sm font-medium tracking-wide">Testnet is Live</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 animate-fade-in-up">
                    Zero Fees.<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-200 to-accent-400 animate-shimmer bg-[length:200%_auto]">
                        Infinite Scale.
                    </span>
                </h1>

                {/* Subheading */}
                <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Experience the first <span className="text-white font-medium">Proof of Determinism</span> blockchain.
                    Deterministic leader election means no wasted energy, instant finality, and literally zero gas fees.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <Link href="/testnet" className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-1">
                        <span className="relative z-10">Launch App</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
                    </Link>
                    <Link href="/whitepaper" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1">
                        Read Whitepaper
                    </Link>
                </div>

                {/* Stats / Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:border-primary-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500/20 transition-colors">
                            <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Zero Gas Fees</h3>
                        <p className="text-gray-400">Transactions are free forever thanks to deterministic ordering.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:border-accent-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-accent-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-500/20 transition-colors">
                            <svg className="w-6 h-6 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Linear Scale</h3>
                        <p className="text-gray-400">Throughput increases linearly with network bandwidth.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Instant Finality</h3>
                        <p className="text-gray-400">2-second block times with immediate confirmation.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
