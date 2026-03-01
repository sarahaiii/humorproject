import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavTabs from "@/app/components/NavTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RankedRow = {
    captionId: string;
    imageId: string;
    imageUrl: string;
    caption: string;
    score: number;
};

export default async function ScoreboardPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/");

    /**
     * We pull votes joined to captions joined to images in ONE query
     * and aggregate score client-side (no DB changes needed).
     *
     * Requires FK relationships:
     * - caption_votes.caption_id -> captions.id
     * - captions.image_id -> images.id
     */
    const { data, error } = await supabase
        .from("caption_votes")
        .select(
            `
      caption_id,
      vote_value,
      captions!inner (
        id,
        content,
        image_id,
        images!inner (
          id,
          url
        )
      )
    `
        )
        .limit(5000); // keep it reasonable; adjust up if you have more votes

    if (error) {
        return (
            <main style={styles.page}>
                <TopBar />
                <div style={styles.center}>
                    <div style={styles.shell}>
                        <NavTabs />
                        <div style={{ height: 14 }} />
                        <div style={styles.card}>
                            <div style={styles.error}>Error loading scoreboard: {error.message}</div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Aggregate: score per captionId + keep caption text + image url
    const map = new Map<string, RankedRow>();

    for (const row of data ?? []) {
        const captionId = String((row as any)?.caption_id ?? "");
        const voteValue = Number((row as any)?.vote_value ?? 0);

        const cap = (row as any)?.captions;
        const capId = String(cap?.id ?? "");
        const capContent = String(cap?.content ?? "");
        const imageId = String(cap?.image_id ?? "");

        const img = cap?.images;
        const imageUrl = String(img?.url ?? "");

        if (!captionId || !capId || !imageId || !imageUrl || !capContent) continue;

        const existing = map.get(captionId);
        if (!existing) {
            map.set(captionId, {
                captionId,
                imageId,
                imageUrl,
                caption: capContent,
                score: Number.isFinite(voteValue) ? voteValue : 0,
            });
        } else {
            existing.score += Number.isFinite(voteValue) ? voteValue : 0;
        }
    }

    const ranked = Array.from(map.values()).sort((a, b) => b.score - a.score);

    return (
        <main style={styles.page}>
            <TopBar />

            <div style={styles.center}>
                <div style={styles.shell}>
                    <NavTabs />
                    <div style={{ height: 14 }} />

                    <div style={styles.card}>
                        <div style={styles.headerRow}>
                            <div style={styles.title}>Scoreboard</div>
                        </div>

                        {ranked.length === 0 ? (
                            <div style={styles.empty}>No ranked captions yet.</div>
                        ) : (
                            <div style={styles.list}>
                                {ranked.map((r, idx) => (
                                    <div key={r.captionId} style={styles.row}>
                                        <div style={styles.rank}>{idx + 1}</div>

                                        <div style={styles.thumbWrap}>
                                            <img src={r.imageUrl} alt="image" style={styles.thumb} />
                                        </div>

                                        <div style={styles.body}>
                                            <div style={styles.caption}>{r.caption}</div>
                                            <div style={styles.score}>Score: {r.score}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ height: 10 }} />
                </div>
            </div>
        </main>
    );
}

function TopBar() {
    return (
        <div style={styles.topBar}>
            <div style={styles.brand}>Humor Project</div>
            <a href="/auth/logout" style={styles.link}>
                Logout
            </a>
        </div>
    );
}

const styles: Record<string, any> = {
    page: {
        minHeight: "100vh",
        padding: 24,
        background: "var(--bg-dark)",
        color: "var(--text-main)",
        fontFamily: "system-ui",
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
    brand: { fontWeight: 900, letterSpacing: 0.2 },
    link: {
        color: "var(--text-main)",
        textDecoration: "none",
        fontWeight: 700,
        opacity: 0.9,
    },
    center: { display: "grid", placeItems: "center" },
    shell: { width: "min(900px, 95vw)" },

    card: {
        borderRadius: 22,
        background: "rgba(30,41,59,0.55)",
        border: "1px solid rgba(51,65,85,0.75)",
        boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
        overflow: "hidden",
    },
    headerRow: {
        padding: 18,
        borderBottom: "1px solid rgba(51,65,85,0.75)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    title: { fontSize: 18, fontWeight: 900 },
    subtle: { color: "var(--text-muted)", fontSize: 13 },
    code: {
        padding: "2px 6px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(51,65,85,0.7)",
    },

    empty: { padding: 18, color: "var(--text-muted)" },
    error: { padding: 18, color: "#fecaca", fontWeight: 700 },

    list: { display: "flex", flexDirection: "column" },
    row: {
        display: "grid",
        gridTemplateColumns: "52px 96px 1fr",
        gap: 14,
        alignItems: "center",
        padding: 14,
        borderTop: "1px solid rgba(51,65,85,0.55)",
    },
    rank: {
        width: 38,
        height: 38,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        background: "rgba(167,139,250,0.12)",
        border: "1px solid rgba(167,139,250,0.35)",
    },
    thumbWrap: {
        width: 96,
        height: 72,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(51,65,85,0.8)",
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
    },
    thumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    body: { display: "flex", flexDirection: "column", gap: 6 },
    caption: { fontSize: 15, fontWeight: 800, lineHeight: 1.25 },
    score: { fontSize: 13, color: "var(--text-muted)", fontWeight: 700 },
};