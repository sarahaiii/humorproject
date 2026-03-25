import type { CSSProperties, ReactNode } from "react";
import AuthBar from "@/app/components/AuthBar";

export default function ProtectedLayout({
                                            children,
                                        }: {
    children: ReactNode;
}) {
    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <div style={styles.brand}>Humor Project</div>
                <AuthBar />
            </div>

            <div style={styles.content}>{children}</div>
        </main>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui",
        background: "var(--bg-dark)",
        color: "var(--text-main)",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 980,
        margin: "0 auto 24px",
        padding: "14px 16px",
        borderRadius: 18,
        background: "rgba(30,41,59,0.65)",
        border: "1px solid rgba(51,65,85,0.7)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
    },
    brand: {
        fontWeight: 900,
        fontSize: 20,
    },
    content: {
        maxWidth: 1100,
        margin: "0 auto",
    },
};