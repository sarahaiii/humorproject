"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

export default function RateCard({
                                     images,
                                     captionsByImage,
                                 }: {
    images: ImageRow[];
    captionsByImage: Record<string, CaptionRow[]>;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [isPending, startTransition] = useTransition();

    // ✅ local copy so votes update instantly (optimistic)
    const [localCaptions, setLocalCaptions] =
        useState<Record<string, CaptionRow[]>>(captionsByImage);

    useEffect(() => {
        setLocalCaptions(captionsByImage);
    }, [captionsByImage]);

    const pairs = useMemo(() => {
        const out: Array<{ img: ImageRow; cap: CaptionRow }> = [];
        for (const img of images) {
            const caps = localCaptions[img.id] ?? [];
            for (const cap of caps) out.push({ img, cap });
        }
        return out;
    }, [images, localCaptions]);

    const [pickIndex, setPickIndex] = useState<number | null>(null);

    useEffect(() => {
        if (pairs.length === 0) {
            setPickIndex(null);
            return;
        }
        setPickIndex(Math.floor(Math.random() * pairs.length));
    }, [pairs.length]);

    const pick = pickIndex === null ? null : pairs[pickIndex];

    function pickNextIndex() {
        if (pairs.length === 0) return null;
        if (pairs.length === 1) return 0;

        // avoid repeating the same one if possible
        let next = Math.floor(Math.random() * pairs.length);
        if (pickIndex !== null) {
            while (next === pickIndex) next = Math.floor(Math.random() * pairs.length);
        }
        return next;
    }

    async function vote(v: 1 | -1) {
        if (!pick || pickIndex === null) return;

        setBusy(true);

        const imgId = pick.img.id;
        const capId = pick.cap.id;

        // ✅ optimistic score update
        setLocalCaptions((prev) => {
            const copy = { ...prev };
            const list = (copy[imgId] ?? []).map((c) =>
                c.id === capId ? { ...c, score: c.score + v } : c
            );
            copy[imgId] = list;
            return copy;
        });

        // ✅ immediately go to next caption (no button)
        const nextIdx = pickNextIndex();
        setPickIndex(nextIdx);

        // ✅ call API in background
        const res = await fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ captionId: capId, vote: v }),
        });

        if (!res.ok) {
            // rollback if vote fails
            setLocalCaptions((prev) => {
                const copy = { ...prev };
                const list = (copy[imgId] ?? []).map((c) =>
                    c.id === capId ? { ...c, score: c.score - v } : c
                );
                copy[imgId] = list;
                return copy;
            });

            alert("Vote failed");
            setBusy(false);
            return;
        }

        // ✅ update server-rendered pages (scoreboard) WITHOUT blocking UI
        startTransition(() => {
            router.refresh();
        });

        setBusy(false);
    }

    if (!pick) {
        return (
            <div style={styles.card}>
                <div style={{ padding: 30 }}>
                    <h2 style={{ margin: 0 }}>No captions yet</h2>
                    <p style={{ marginTop: 10, opacity: 0.85, color: "var(--text-muted)" }}>
                        Add captions first, then you can rate them.
                    </p>
                </div>
            </div>
        );
    }

    const { img, cap } = pick;

    return (
        <div style={styles.card}>
            <div style={styles.imageWrapper}>
                <img
                    src={img.url}
                    alt={img.image_description ?? "Uploaded image"}
                    style={styles.image}
                />
            </div>

            <div style={styles.content}>
                <div style={styles.topRow}>
                    <div style={styles.badge}>Rate</div>
                    <div style={styles.score}>
                        Score: {cap.score} {isPending ? "· updating…" : ""}
                    </div>
                </div>

                <div style={styles.caption}>{cap.text}</div>

                <div style={styles.actions}>
                    <button disabled={busy} onClick={() => vote(1)} style={styles.up}>
                        👍 Upvote
                    </button>

                    <button disabled={busy} onClick={() => vote(-1)} style={styles.down}>
                        👎 Downvote
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    card: {
        width: "min(900px, 95vw)",
        borderRadius: 28,
        overflow: "hidden",
        background: "var(--card-light)",
        border: "1px solid var(--card-border)",
        boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
        color: "var(--text-main)",
    },

    imageWrapper: {
        width: "100%",
        background: "rgba(0,0,0,0.22)",
        borderBottom: "1px solid var(--card-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
    },

    image: {
        width: "100%",
        maxHeight: "520px",
        objectFit: "contain",
        display: "block",
        borderRadius: 18,
    },

    content: {
        padding: 24,
    },

    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },

    badge: {
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(167,139,250,0.12)",
        border: "1px solid rgba(167,139,250,0.30)",
        color: "var(--text-main)",
        fontWeight: 700,
        letterSpacing: 0.2,
    },

    score: {
        opacity: 0.9,
        fontSize: 14,
        color: "var(--text-muted)",
        fontWeight: 600,
    },

    caption: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 22,
        lineHeight: 1.15,
    },

    actions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
    },

    up: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid rgba(34,197,94,0.35)",
        background: "rgba(34,197,94,0.12)",
        color: "var(--text-main)",
        fontWeight: 700,
        cursor: "pointer",
    },

    down: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid rgba(239,68,68,0.35)",
        background: "rgba(239,68,68,0.12)",
        color: "var(--text-main)",
        fontWeight: 700,
        cursor: "pointer",
    },
};