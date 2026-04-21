import type { CSSProperties, ReactNode } from "react";
import AuthBar from "@/app/components/AuthBar";
import NavTabs from "@/app/components/NavTabs";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <div style={styles.brand}>Humor Project</div>
                <AuthBar />
            </div>
            <NavTabs />
            <div style={styles.content}>{children}</div>
        </main>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "10px 16px 0",
        fontFamily: "system-ui",
        color: "var(--text-main)",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 1100,
        width: "100%",
        margin: "0 auto 6px",
        padding: "10px 16px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.68)",
        border: "1px solid rgba(150,200,255,0.55)",
        boxShadow: "0 4px 24px rgba(60,120,220,0.10)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        flexShrink: 0,
    },
    brand: {
        fontWeight: 900,
        fontSize: 20,
        color: "#1a3a5c",
    },
    content: {
        flex: 1,
        minHeight: 0,
        maxWidth: 1100,
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
    },
};
