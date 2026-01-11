import TestnetShell from './TestnetShell';

export default function TestnetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <TestnetShell>{children}</TestnetShell>;
}
