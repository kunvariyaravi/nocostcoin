export default function NodeGuidePage() {
    return (
        <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">
                How to Run a Nocostcoin Node
            </h1>

            <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                    Running a node is the best way to support the Nocostcoin network.
                    As a node operator, you validate transactions, secure the blockchain, and become an integral part of the decentralized infrastructure.
                </p>

                {/* Quick Start Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-8 mb-12 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">🚀</span>
                        Quick Start (Docker)
                    </h2>
                    <p className="text-slate-400 mb-6">
                        If you already have Docker installed, you can be up and running in seconds:
                    </p>

                    <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto mb-4 border border-slate-700">
                        docker run -d --name nocostcoin-node -p 8000:8000 -p 9000:9000 ghcr.io/kunvariyaravi/nocostcoin:latest
                    </div>
                    <p className="text-xs text-slate-500">
                        This command maps port 8000 (API) and 9000 (P2P) to your host machine.
                    </p>
                </div>

                {/* Requirements */}
                <h2 className="text-3xl font-bold text-white mb-6">Hardware Requirements</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-lg text-white mb-2">Minimum</h3>
                        <ul className="text-slate-400 text-sm space-y-2">
                            <li>2 CPU Cores</li>
                            <li>4GB RAM</li>
                            <li>50GB SSD</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/30">
                        <h3 className="font-bold text-lg text-blue-400 mb-2">Recommended</h3>
                        <ul className="text-slate-300 text-sm space-y-2">
                            <li>4 CPU Cores</li>
                            <li>8GB RAM</li>
                            <li>100GB NVMe SSD</li>
                        </ul>
                    </div>
                </div>

                <hr className="border-slate-800 my-12" />

                {/* Comprehensive Guide */}
                <h2 className="text-3xl font-bold text-white mb-8">Step-by-Step Installation</h2>

                <div className="space-y-12">
                    {/* Step 1 */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sm">1</span>
                            Prepare Your Environment
                        </h3>
                        <p className="text-slate-400 mb-4">
                            We recommend running Nocostcoin on a Linux server (Ubuntu 22.04 LTS is preferred).
                            You can use a VPS provider like DigitalOcean, Linode, or AWS.
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <code className="text-blue-400 block mb-2"># Update your system packages</code>
                            <code className="text-slate-300">sudo apt update && sudo apt upgrade -y</code>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sm">2</span>
                            Install Docker
                        </h3>
                        <p className="text-slate-400 mb-4">
                            Install Docker Engine and Docker Compose plugin.
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg mb-4">
                            <code className="text-slate-300 block mb-2">curl -fsSL https://get.docker.com -o get-docker.sh</code>
                            <code className="text-slate-300 block">sudo sh get-docker.sh</code>
                        </div>
                        <p className="text-slate-400 mb-2">Verify the installation:</p>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <code className="text-slate-300">docker --version</code>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sm">3</span>
                            Run the Node
                        </h3>
                        <p className="text-slate-400 mb-4">
                            Pull the latest image and start the container.
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <code className="text-emerald-400">
                                docker run -d \<br />
                                &nbsp;&nbsp;--name nocostcoin-node \<br />
                                &nbsp;&nbsp;--restart always \<br />
                                &nbsp;&nbsp;-p 8000:8000 \<br />
                                &nbsp;&nbsp;-p 9000:9000 \<br />
                                &nbsp;&nbsp;-v nocostcoin_data:/root/.nocostcoin \<br />
                                &nbsp;&nbsp;ghcr.io/kunvariyaravi/nocostcoin:latest
                            </code>
                        </div>
                        <ul className="mt-4 space-y-2 text-slate-400 text-sm pl-4 list-disc marker:text-slate-600">
                            <li><code className="text-slate-300">--restart always</code>: Ensures the node restarts if the server reboots.</li>
                            <li><code className="text-slate-300">-v nocostcoin_data...</code>: Persists your blockchain data so you don't have to resync on restart.</li>
                        </ul>
                    </div>

                    {/* Step 4 */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sm">4</span>
                            Verify Status
                        </h3>
                        <p className="text-slate-400 mb-4">
                            Check if your node is running correctly by viewing the logs.
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg mb-4">
                            <code className="text-slate-300">docker logs -f nocostcoin-node</code>
                        </div>
                        <p className="text-slate-400">
                            You can also check the API status by visiting: <br />
                            <code className="text-blue-400">http://YOUR_SERVER_IP:8000/stats</code>
                        </p>
                    </div>
                </div>

                <hr className="border-slate-800 my-12" />

                <h2 className="text-3xl font-bold text-white mb-6">Troubleshooting</h2>
                <div className="bg-red-900/10 border border-red-900/20 rounded-xl p-6">
                    <h3 className="font-bold text-red-400 mb-2">Ports Not Open?</h3>
                    <p className="text-slate-400 mb-4">
                        If you cannot connect, ensure your firewall (UFW) allows traffic on ports 8000 and 9000.
                    </p>
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <code className="text-slate-300">sudo ufw allow 8000/tcp && sudo ufw allow 9000/tcp</code>
                    </div>
                </div>

                <hr className="border-slate-800 my-12" />

                {/* Updating Node */}
                <h2 className="text-3xl font-bold text-white mb-6">Updating Your Node</h2>
                <p className="text-slate-400 mb-6">
                    We release updates frequently to improve performance and fix bugs. To update your node to the latest version:
                </p>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-12">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Update Commands</h3>
                    <code className="text-blue-400 block mb-2"># 1. Stop and remove the current container</code>
                    <code className="text-slate-300 block mb-6">docker stop nocostcoin-node && docker rm nocostcoin-node</code>

                    <code className="text-blue-400 block mb-2"># 2. Pull the latest image</code>
                    <code className="text-slate-300 block mb-6">docker pull ghcr.io/kunvariyaravi/nocostcoin:latest</code>

                    <code className="text-blue-400 block mb-2"># 3. Start the node again</code>
                    <code className="text-emerald-400 block">
                        docker run -d --name nocostcoin-node --restart always -p 8000:8000 -p 9000:9000 -v nocostcoin_data:/root/.nocostcoin ghcr.io/kunvariyaravi/nocostcoin:latest
                    </code>
                </div>

                {/* FAQ */}
                <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                        <h3 className="font-bold text-white mb-2">Can I run this on Windows?</h3>
                        <p className="text-slate-400">
                            Yes! Install <strong>Docker Desktop for Windows</strong> and run the exact same command in PowerShell or Command Prompt.
                            Ensure WSL 2 is enabled for best performance.
                        </p>
                    </div>

                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                        <h3 className="font-bold text-white mb-2">How do I view my Private Key?</h3>
                        <p className="text-slate-400">
                            The node auto-generates a wallet stored inside the container. To export it:
                            <br />
                            <code className="bg-black/30 px-2 py-1 rounded mt-2 inline-block text-sm">docker exec nocostcoin-node cat /root/.nocostcoin/wallet/default_wallet.json</code>
                        </p>
                    </div>

                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                        <h3 className="font-bold text-white mb-2">Is the Testnet Incentivized?</h3>
                        <p className="text-slate-400">
                            Yes, early node operators on the Testnet will be eligible for future rewards.
                            Make sure to backup your wallet data!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
