import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer/Footer';
import { WalletProvider } from '@/contexts/WalletContext';

export default function TestnetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-slate-950 text-slate-50 flex">
                <Sidebar />
                <div className="flex-1 ml-64 flex flex-col min-h-screen">
                    {/* Top Header Area */}
                    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-8 py-4 flex items-center justify-between">
                        <div className="text-sm breadcrumbs text-slate-400">
                            Testnet Environment
                        </div>
                    </header>

                    <main className="flex-1 p-8">
                        {children}
                    </main>

                    <Footer />
                </div>
            </div>
        </WalletProvider>
    );
}
