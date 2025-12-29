import Sidebar from '@/components/Sidebar/Sidebar';

export default function TestnetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            <Sidebar />
            <div className="pl-64 min-h-screen">
                {/* Top Header Area - can be made into a component later */}
                <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-8 py-4 flex items-center justify-between">
                    <div className="text-sm breadcrumbs text-slate-400">
                        Testnet Environment
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Contextual actions could go here */}
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20"></div>
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
