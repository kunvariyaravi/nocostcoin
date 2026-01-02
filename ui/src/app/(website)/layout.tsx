import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function WebsiteLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary-500/30">
            <WebsiteNavbar />
            {children}
        </div>
    );
}
