import { ReactNode } from 'react';
import styles from './FeatureRow.module.css';

interface FeatureRowProps {
    title: string;
    description: string;
    visual: ReactNode;
    reversed?: boolean;
}

export default function FeatureRow({ title, description, visual, reversed = false }: FeatureRowProps) {
    return (
        <section className={styles.section}>
            <div className={`${styles.container} ${reversed ? styles.reversed : ''}`}>
                <div className={styles.content}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>{description}</p>
                </div>
                <div className={styles.visual}>
                    {visual}
                </div>
            </div>
        </section>
    );
}
