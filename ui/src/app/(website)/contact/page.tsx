"use client";

import styles from "./page.module.css";

export default function ContactPage() {
    return (
        <main className={styles.main}>
            <section className={styles.hero}>
                <h1 className={styles.title}>Contact Us</h1>
                <p className={styles.subtitle}>
                    Have questions or want to contribute? Reach out to the Nocostcoin team.
                </p>
            </section>

            <section className={styles.container}>
                <div className={styles.info}>
                    <div className={styles.infoItem}>
                        <h3>Email</h3>
                        <p>hello@nocostcoin.org</p>
                    </div>
                    <div className={styles.infoItem}>
                        <h3>Twitter</h3>
                        <p>@Nocostcoin</p>
                    </div>
                    <div className={styles.infoItem}>
                        <h3>GitHub</h3>
                        <p>github.com/kunvariyaravi/nocostcoin</p>
                    </div>

                    <div className={styles.infoBox}>
                        <p>
                            We are an open-community project. The best way to get involved is to join our
                            Discord server or contribute directly to our GitHub repository.
                        </p>
                        <a href="https://github.com/kunvariyaravi/nocostcoin" className={styles.ctaButton} target="_blank" rel="noopener noreferrer">
                            View on GitHub
                        </a>
                    </div>
                </div>

                <form className={styles.form} action="#" onSubmit={(e) => e.preventDefault()}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" placeholder="Your name" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="your@email.com" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="subject">Subject</label>
                        <select id="subject">
                            <option value="general">General Inquiry</option>
                            <option value="partnership">Partnership</option>
                            <option value="technical">Technical Support</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="message">Message</label>
                        <textarea id="message" rows={5} placeholder="How can we help?"></textarea>
                    </div>

                    <button type="submit" className={styles.submitButton}>Send Message</button>
                </form>
            </section>
        </main>
    );
}
