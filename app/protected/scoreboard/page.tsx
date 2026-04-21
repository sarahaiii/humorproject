import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RankedRow = {
    captionId: string;
    imageId: string;
    imageUrl: string;
    caption: string;
    score: number;
};

type VoteRow = {
    caption_id?: string;
    vote_value?: number;
    captions?: {
        id?: string;
        content?: string;
        image_id?: string;
        images?: {
            id?: string;
            url?: string;
        };
    };
};

export default async function ScoreboardPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/");

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
        .limit(5000);

    if (error) {
        return (
            <div style={styles.center}>
                <div style={styles.shell}>
                    <div style={styles.card}>
                        <div style={styles.error}>Error loading scoreboard: {error.message}</div>
                    </div>
                </div>
            </div>
        );
    }

    const map = new Map<string, RankedRow>();
    const rows: VoteRow[] = Array.isArray(data) ? (data as unknown as VoteRow[]) : [];

    for (const row of rows) {
        const captionId = String(row.caption_id ?? "");
        const voteValue = Number(row.vote_value ?? 0);

        const cap = row.captions;
        const capId = String(cap?.id ?? "");
        const capContent = String(cap?.content ?? "");
        const imageId = String(cap?.image_id ?? "");
        const imageUrl = String(cap?.images?.url ?? "");

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
        <div style={styles.center}>
            <div style={styles.shell}>
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
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    center: { display: "grid", placeItems: "start center", paddingTop: 16 },
    shell: { width: "min(900px, 95vw)" },

    card: {
        borderRadius: 22,
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(120,175,255,0.45)",
        boxShadow: "0 16px 50px rgba(60,120,220,0.11)",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
    },
    headerRow: {
        padding: 18,
        borderBottom: "1px solid rgba(120,175,255,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    title: { fontSize: 18, fontWeight: 900, color: "#1a3a5c" },

    empty: { padding: 18, color: "#6a9cbf" },
    error: { padding: 18, color: "#f472b6", fontWeight: 700 },

    list: { display: "flex", flexDirection: "column" },
    row: {
        display: "grid",
        gridTemplateColumns: "52px 96px 1fr",
        gap: 14,
        alignItems: "center",
        padding: 14,
        borderTop: "1px solid rgba(120,175,255,0.22)",
    },
    rank: {
        width: 38,
        height: 38,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        color: "#1d4ed8",
        background: "rgba(96,165,250,0.15)",
        border: "1px solid rgba(96,165,250,0.4)",
    },
    thumbWrap: {
        width: 96,
        height: 72,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(225,240,255,0.5)",
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
    caption: { fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: "#1a3a5c" },
    score: { fontSize: 13, color: "#6a9cbf", fontWeight: 700 },
};