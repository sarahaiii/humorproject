import Link from "next/link";

export default function HomePage() {
    return (
        <main style={styles.page}>
            <div style={styles.bgGlowOne} />
            <div style={styles.bgGlowTwo} />

            <section style={styles.card}>
                <div style={styles.badge}>Humor Project</div>

                <h1 style={styles.title}>Rank the funniest captions</h1>

                <p style={styles.subtitle}>
                    Upload an image, generate captions, and help decide which ones are the
                    funniest through quick voting.
                </p>

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
        background:
            "radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 30%), linear-gradient(180deg, #04122c 0%, #061938 45%, #071a33 100%)",
    },

    bgGlowOne: {
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "rgba(59,130,246,0.12)",
        filter: "blur(80px)",
        top: 80,
        left: -80,
        pointerEvents: "none",
    },

    bgGlowTwo: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "rgba(167,139,250,0.10)",
        filter: "blur(80px)",
        bottom: 60,
        right: -60,
        pointerEvents: "none",
    },

    card: {
        position: "relative",
        zIndex: 1,
        width: "min(680px, 92vw)",
        borderRadius: 28,
        padding: "42px 36px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(8, 20, 48, 0.72)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
        backdropFilter: "blur(14px)",
    },

    badge: {
        display: "inline-block",
        padding: "8px 14px",
        borderRadius: 999,
        marginBottom: 18,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.9)",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.14)",
    },

    title: {
        margin: 0,
        fontSize: 46,
        lineHeight: 1.05,
        fontWeight: 800,
        color: "#f8fafc",
    },

    subtitle: {
        margin: "18px auto 0 auto",
        maxWidth: 560,
        fontSize: 18,
        lineHeight: 1.55,
        color: "rgba(226,232,240,0.86)",
    },

    featureRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 24,
        marginBottom: 28,
    },

    featurePill: {
        padding: "10px 14px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        color: "rgba(241,245,249,0.95)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
    },

    loginButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 260,
        padding: "16px 24px",
        borderRadius: 16,
        textDecoration: "none",
        fontSize: 18,
        fontWeight: 800,
        color: "#0f172a",
        background: "linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)",
        boxShadow: "0 12px 30px rgba(255,255,255,0.16)",
    },

    helperText: {
        marginTop: 16,
        marginBottom: 0,
        fontSize: 14,
        color: "rgba(148,163,184,0.95)",
    },
};