// app/components/Scoreboard.tsx
type CaptionRow = {
    id: string;
    text: string;
    score: number;
};

type ImageRow = {
    id: string;
    url: string;
    image_description?: string | null;
};

export default function Scoreboard({
                                       images,
                                       captionsByImage,
                                   }: {
    images: ImageRow[];
    captionsByImage: Record<string, CaptionRow[]>;
}) {
    const rows = images
        .map((img) => {
            const caps = captionsByImage[img.id] ?? [];
            if (caps.length === 0) return null;

            // pick the top caption for this image
            const best = [...caps].sort((a, b) => b.score - a.score)[0];
            return { img, cap: best, score: best.score };
        })
        .filter(Boolean) as Array<{ img: ImageRow; cap: CaptionRow; score: number }>;

    // Sort images by best caption score (desc)
    rows.sort((a, b) => b.score - a.score);

    if (rows.length === 0) {
        return (
            <div style={styles.emptyCard}>
                <h2 style={{ margin: 0 }}>No ratings yet</h2>
                <p style={{ marginTop: 10, opacity: 0.8 }}>
                    Rate some captions first, then this scoreboard will populate.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.wrap}>
            <div style={styles.headerRow}>
                <div>
                    <div style={styles.title}>Scoreboard</div>
                    <div style={styles.subtitle}>Best caption per image, ranked by total votes</div>
                </div>
                <div style={styles.pill}>{rows.length} ranked</div>
            </div>

            <div style={styles.list}>
                {rows.map((r, idx) => (
                    <div key={`${r.img.id}:${r.cap.id}`} style={styles.itemCard}>
                        <div style={styles.rank}>{idx + 1}</div>

                        <div style={styles.thumbWrap}>
                            <img src={r.img.url} style={styles.thumb} alt="" />
                        </div>

                        <div style={styles.body}>
                            <div style={styles.caption}>{r.cap.text}</div>
                            <div style={styles.metaRow}>
                                <div style={styles.score}>Score: {r.score}</div>
                                <div style={styles.muted}>imageId: {r.img.id}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    wrap: {
        width: "100%",
        borderRadius: 22,
        padding: 18,
        background: "rgba(30,41,59,0.55)",
        border: "1px solid rgba(51,65,85,0.7)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: 900, letterSpacing: 0.2 },
    subtitle: { marginTop: 6, color: "var(--text-muted)", fontWeight: 600 },
    pill: {
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(167,139,250,0.18)",
        border: "1px solid rgba(167,139,250,0.35)",
        color: "var(--text-main)",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },

    list: { display: "flex", flexDirection: "column", gap: 12 },

    itemCard: {
        display: "grid",
        gridTemplateColumns: "44px 140px 1fr",
        gap: 14,
        alignItems: "center",
        padding: 14,
        borderRadius: 18,
        background: "rgba(15,23,42,0.55)",
        border: "1px solid rgba(51,65,85,0.6)",
    },
    rank: {
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        background: "rgba(241,245,249,0.08)",
        border: "1px solid rgba(241,245,249,0.12)",
    },
    thumbWrap: {
        width: 140,
        height: 90,
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(241,245,249,0.06)",
        border: "1px solid rgba(241,245,249,0.10)",
        display: "grid",
        placeItems: "center",
    },
    thumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    body: { minWidth: 0 },
    caption: {
        fontSize: 18,
        fontWeight: 800,
        lineHeight: 1.25,
        wordBreak: "break-word",
    },
    metaRow: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 8,
        alignItems: "center",
    },
    score: {
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.22)",
        color: "rgba(187,247,208,0.95)",
        fontWeight: 800,
    },
    muted: { color: "rgba(148,163,184,0.85)", fontWeight: 700, fontSize: 12 },

    emptyCard: {
        width: "100%",
        borderRadius: 22,
        padding: 22,
        background: "rgba(30,41,59,0.55)",
        border: "1px solid rgba(51,65,85,0.7)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
    },
};