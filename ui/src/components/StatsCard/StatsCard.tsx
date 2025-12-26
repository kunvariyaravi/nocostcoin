interface StatsCardProps {
    label: string;
    value: string | number;
    subValue?: string;
}

export default function StatsCard({ label, value, subValue }: StatsCardProps) {
    return (
        <div className="card text-center">
            <span className="text-sm text-gray-600 uppercase tracking-wide block mb-2">{label}</span>
            <span className="text-3xl font-bold text-gray-900 block">{value}</span>
            {subValue && <span className="text-sm text-gray-500 block mt-1">{subValue}</span>}
        </div>
    );
}
