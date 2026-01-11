export default function ApiPage() {
    return (
        <div>
            <h1>API Reference</h1>
            <p className="lead">Interact with the Nocostcoin blockchain programmatically.</p>

            <div className="p-4 bg-yellow-900/20 text-yellow-200 border border-yellow-800 rounded-lg my-8">
                <strong>Work in Progress:</strong> This section is currently being written. Please check back soon.
            </div>

            <h2>Endpoints</h2>

            <h3>GET /stats</h3>
            <p>Returns current node statistics.</p>
            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                {`{
  "height": 12345,
  "head_hash": "0x...",
  "peer_count": 5
}`}
            </pre>

            <h3>POST /transaction/send</h3>
            <p>Submit a signed transaction to the network.</p>
        </div>
    );
}
