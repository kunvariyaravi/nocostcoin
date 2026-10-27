export default function BlockDetailPage({ params }: { params: { hash: string } }) {
    return (
        <main className="min-h-screen pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Block Details</h1>
                <p className="text-gray-600 mb-8 font-mono text-sm">{params.hash}</p>

                <div className="card">
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Block Information</h2>
                        <p className="text-gray-600">Detailed block viewer coming soon</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
