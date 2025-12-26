import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <div className="text-2xl font-bold mb-4">
                            Nocost<span className="text-gradient">coin</span>
                        </div>
                        <p className="text-gray-400 mb-4 text-sm">
                            The world&apos;s first zero-fee, deterministic blockchain.
                        </p>
                        <div className="text-sm text-gray-500">
                            © 2025 Nocostcoin Foundation
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Foundation</h3>
                        <div className="flex flex-col space-y-2">
                            <Link href="/about" className="text-sm hover:text-primary-400 transition-colors">
                                About Us
                            </Link>
                            <Link href="/contact" className="text-sm hover:text-primary-400 transition-colors">
                                Contact
                            </Link>
                            <Link href="/whitepaper" className="text-sm hover:text-primary-400 transition-colors">
                                Whitepaper
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Community</h3>
                        <div className="flex flex-col space-y-2">
                            <Link href="#" className="text-sm hover:text-primary-400 transition-colors">
                                Twitter
                            </Link>
                            <Link href="#" className="text-sm hover:text-primary-400 transition-colors">
                                Discord
                            </Link>
                            <Link href="#" className="text-sm hover:text-primary-400 transition-colors">
                                Governance
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <div className="flex flex-col space-y-2">
                            <Link href="#" className="text-sm hover:text-primary-400 transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="#" className="text-sm hover:text-primary-400 transition-colors">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
