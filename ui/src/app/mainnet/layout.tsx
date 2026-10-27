import MainnetShell from './MainnetShell';

export default function MainnetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainnetShell>{children}</MainnetShell>;
}
