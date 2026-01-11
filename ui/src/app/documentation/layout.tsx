import type { Metadata } from 'next';
import DocsShell from './DocsShell';

export const metadata: Metadata = {
    title: 'Documentation - Nocostcoin',
    description: 'Learn how to run a node, integrate with the API, and contribute to Nocostcoin.',
};

export default function DocumentationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DocsShell>{children}</DocsShell>;
}
