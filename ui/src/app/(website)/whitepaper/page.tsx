import styles from './page.module.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Whitepaper | Nocostcoin',
    description: 'Technical details of Nocostcoin: Proof of Determinism, Hidden Leader Election, and Zero Fees.',
};

export default function Whitepaper() {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Whitepaper</h1>
                <p className={styles.subtitle}>Version 1.0 — December 2025</p>
            </header>

            <article className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Abstract</h2>
                    <p>
                        Cryptocurrencies notoriously suffer from the &quot;blockchain trilemma&quot;: the difficulty of achieving decentralization, security, and scalability simultaneously. Nocostcoin proposes a novel solution using **Proof of Determinism (PoD)**, a consensus mechanism that eliminates probabilistic forks and competition. By combining this with **Hidden Leader Election (SLE)** and a **Zero-Fee** model protected by client-side Proof-of-Work, Nocostcoin achieves instant finality, robust DoS resistance, and infinite economic accessibility.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Introduction</h2>
                    <p>
                        Traditional blockchains like Bitcoin and Ethereum rely on probabilistic consensus. Miners or validators race to produce blocks, leading to temporary forks and wasted energy (in PoW) or complex slashable conditions (in PoS).
                    </p>
                    <p>
                        Nocostcoin fundamentally changes this by making the blockchain **deterministic**. Given a set of validators and a random seed, the protocol mathematically pre-determines exactly who will produce the next block. There is no race. There is no confusion.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. Proof of Determinism (PoD)</h2>
                    <p>
                        PoD relies on a verifiable random function (VRF) to select leaders. In each slot (2 seconds), every validator computes a VRF output using their private key and the current epoch&apos;s randomness.
                    </p>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Determinism Equation</h3>
                        <div className={styles.codeBlock}>
                            Score = VRF(ValidationKey, EpochSeed, SlotNumber)
                        </div>
                    </div>
                    <p>
                        The validator with the **lowest VRF score** is the legal leader for that slot. This check is performed locally by every node. If a block is received from a validator who does not have the lowest score, it is rejected immediately. This eliminates forks by design—there is only ever one correct history.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Hidden Leader Election (SLE)</h2>
                    <p>
                        Knowing the leader in advance is a security risk; an attacker could DDoS the leader to halt the chain. Nocostcoin implements **Secret Leader Election**.
                    </p>
                    <p>
                        Until the block is actually produced and propagated, **no one knows who the leader is except the leader themselves**. The VRF proof is included in the block header. Upon receiving the block, other nodes verify the VRF proof against the validator&apos;s public key to confirm they were indeed the rightful leader. By the time the attacker identifies the leader, the block is already finalized.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Zero-Fee Architecture</h2>
                    <p>
                        Fees create friction. Nocostcoin removes transaction fees entirely. To prevent spam, we utilize a small, client-side **Proof-of-Work (PoW)** puzzle attached to every transaction.
                    </p>
                    <p>
                        The difficulty of this puzzle scales dynamically with network load. For a legitimate user sending one transaction, the calculation is trivial (milliseconds). For a spammer trying to send millions, the computational cost becomes prohibitive.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Conclusion</h2>
                    <p>
                        Nocostcoin represents the next evolution in distributed ledger technology. By prioritizing determinism and privacy, we have created a system that is not only secure and scalable but also truly free for the end user.
                    </p>
                </section>
            </article>
        </main>
    );
}
