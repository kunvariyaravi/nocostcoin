import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";
import Footer from "@/components/Footer/Footer";

export default function WebsiteLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary-500/30">
            <WebsiteNavbar />
            {children}
            <Footer />
        </div>
    );
}
