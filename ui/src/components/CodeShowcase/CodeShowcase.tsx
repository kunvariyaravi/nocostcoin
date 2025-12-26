export default function CodeShowcase() {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Simplicity for Developers</h2>
                    <p className="text-xl text-gray-600">Interact with the blockchain using a clean, modern JSON-RPC API.</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="ml-4 text-sm text-gray-400">curl-request.sh</span>
                        </div>
                        <pre className="p-6 overflow-x-auto">
                            <code className="text-sm text-gray-300">
                                <span className="text-purple-400">curl</span> -X POST http://localhost:8000/api/node/transaction/create \<br />
                                &nbsp;&nbsp;-H <span className="text-green-400">&quot;Content-Type: application/json&quot;</span> \<br />
                                &nbsp;&nbsp;-d <span className="text-green-400">&apos;{`{`}<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&quot;receiver&quot;: &quot;abcd1234...&quot;,<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&quot;amount&quot;: 100<br />
                                    &nbsp;&nbsp;{`}`}&apos;</span>
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
}
