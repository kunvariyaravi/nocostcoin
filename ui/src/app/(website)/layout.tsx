import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function WebsiteLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <WebsiteNavbar />
            {children}
        </>
    );
}
