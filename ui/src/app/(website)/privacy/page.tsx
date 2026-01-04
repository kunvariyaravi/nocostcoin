import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function Privacy() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">Privacy Policy</h1>
                    <div className="prose prose-lg prose-invert max-w-none text-slate-300">
                        <p className="lead text-xl text-slate-400">
                            Last Updated: January 2026
                        </p>

                        <h3>1. We Don&apos;t Want Your Data</h3>
                        <p>
                            Nocostcoin is built on the principles of privacy and decentralization. We do not maintain a database of user personal information, IP addresses, or wallet associations.
                        </p>

                        <h3>2. Local Storage</h3>
                        <p>
                            <strong>Your Keys, Your Device:</strong> When you generate a wallet on our interface, your private keys and seed phrases are generated locally in your browser and stored in your browser&apos;s encrypted LocalStorage. They are never transmitted to our servers.
                        </p>

                        <h3>3. Public Blockchain Data</h3>
                        <p>
                            Please be aware that Nocostcoin is a public blockchain. Any transaction you send is permanently recorded on the public ledger and is visible to anyone. Do not embed personal information in transaction data fields.
                        </p>

                        <h3>4. Node Telemetry</h3>
                        <p>
                            If you run a Nocostcoin Node, it may gossip basic network health data (block height, peer count) to the network to maintain consensus. This data is anonymous and necessary for the functioning of the decentralized protocol.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
