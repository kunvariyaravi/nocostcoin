import DevnetNavbar from "@/components/Navbar/DevnetNavbar";

export default function DevnetLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <DevnetNavbar />
            {children}
        </>
    );
}
