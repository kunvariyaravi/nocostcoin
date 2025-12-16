import styles from "./page.module.css";

export default function AboutPage() {
    return (
        <main className={styles.main}>
            <section className={styles.hero}>
                <h1 className={styles.title}>About Nocostcoin</h1>
                <p className={styles.subtitle}>
                    Pioneering the future of deterministic, zero-fee blockchain technology.
                </p>
            </section>

            <section className={styles.content}>
                <div className={styles.card}>
                    <h2>Our Mission</h2>
                    <p>
                        To democratize access to blockchain technology by eliminating transaction fees
                        and ensuring absolute predictability in consensus. We believe the future of
                        decentralized finance should be accessible to everyone, cost-free.
                    </p>
                </div>

                <div className={styles.card}>
                    <h2>The Technology</h2>
                    <p>
                        Built on Rust, Nocostcoin leverages a unique Proof of Determinism consensus
                        mechanism. This allows for lightning-fast, predictable block production without
                        the resource-intensive competition of traditional Proof of Work or the wealth
                        concentration of Proof of Stake.
                    </p>
                </div>

                <div className={styles.card}>
                    <h2>Open Source</h2>
                    <p>
                        Nocostcoin is fully open source. We believe in transparency and community-driven
                        development. Every line of code is available for audit and contribution on GitHub.
                    </p>
                </div>
            </section>
        </main>
    );
}
