import TestnetNavbar from "@/components/Navbar/TestnetNavbar";

export default function TestnetLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <TestnetNavbar />
            {children}
        </>
    );
}
