import { ReactNode } from 'react';

interface FeatureRowProps {
    title: string;
    description: string;
    visual: ReactNode;
    reversed?: boolean;
}

export default function FeatureRow({ title, description, visual, reversed = false }: FeatureRowProps) {
    return (
        <section className="py-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
                    <p className="text-lg text-gray-600">{description}</p>
                </div>
                <div className="flex-1">
                    {visual}
                </div>
            </div>
        </section>
    );
}
