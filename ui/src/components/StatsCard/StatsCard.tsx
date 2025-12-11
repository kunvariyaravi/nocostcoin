import styles from './StatsCard.module.css';

interface StatsCardProps {
    label: string;
    value: string | number;
    subValue?: string;
}

export default function StatsCard({ label, value, subValue }: StatsCardProps) {
    return (
        <div className={styles.card}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {subValue && <span className={styles.subValue}>{subValue}</span>}
        </div>
    );
}
