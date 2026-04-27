import Link from "next/link";

export default function HomePage() {
    return (
        <main style={styles.page}>
            <div style={styles.bgGlowOne} />
            <div style={styles.bgGlowTwo} />

            <section style={styles.card}>
                <div style={styles.badge}>Humor Project</div>

                <h1 style={styles.title}>Rank the funniest captions</h1>

                <div style={styles.featureRow}>
                    <div style={styles.featurePill}>📸 Upload images</div>
                    <div style={styles.featurePill}>✍️ Generate captions</div>
                    <div style={styles.featurePill}>🔥 Rate the funniest</div>
                </div>

                <Link href="/auth/login" style={styles.loginButton}>
                    Continue with Google
                </Link>

                <p style={styles.helperText}>
                    Sign in to start uploading, rating, and viewing the scoreboard.
                </p>
            </section>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        position: "relative",
        overflow: "hidden",
    },

    bgGlowOne: {
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "rgba(96,165,250,0.18)",
        filter: "blur(90px)",
        top: 60,
        left: -80,
        pointerEvents: "none",
    },

    bgGlowTwo: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "rgba(96,165,250,0.12)",
        filter: "blur(90px)",
        bottom: 60,
        right: -60,
        pointerEvents: "none",
    },

    card: {
        position: "relative",
        zIndex: 1,
        width: "min(560px, 92vw)",
        borderRadius: 28,
        padding: "42px 36px",
        textAlign: "center",
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(255,255,255,0.75)",
        boxShadow: "0 18px 50px rgba(60,120,220,0.10)",
        backdropFilter: "blur(14px)",
    },

    badge: {
        display: "inline-block",
        padding: "6px 14px",
        borderRadius: 999,
        marginBottom: 18,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#6a9cbf",
    },

    title: {
        margin: 0,
        fontSize: 42,
        lineHeight: 1.05,
        fontWeight: 800,
        color: "#0c1a2e",
    },

    subtitle: {
        margin: "16px auto 0 auto",
        maxWidth: 480,
        fontSize: 17,
        lineHeight: 1.6,
        color: "#6a9cbf",
    },

    featureRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 22,
        marginBottom: 28,
    },

    featurePill: {
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 20,
        fontWeight: 800,
        color: "#0c1a2e",
        background: "rgba(120,175,255,0.12)",
        border: "1px solid rgba(120,175,255,0.35)",
    },

    loginButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 240,
        padding: "14px 24px",
        borderRadius: 9999,
        textDecoration: "none",
        fontSize: 16,
        fontWeight: 700,
        color: "#ffffff",
        background: "#60a5fa",
    },

    helperText: {
        marginTop: 14,
        marginBottom: 0,
        fontSize: 13,
        color: "#6a9cbf",
    },
};