"use client";

import { useMemo, useState } from "react";
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
    const [captionText, setCaptionText] = useState("");

    const pick = useMemo(() => {
        const pairs: Array<{ img: ImageRow; cap: CaptionRow }> = [];

        for (const img of images) {
            const caps = captionsByImage[img.id] ?? [];
            for (const cap of caps) {
                pairs.push({ img, cap });
            }
        }

        if (pairs.length === 0) return null;
        const idx = Math.floor(Math.random() * pairs.length);
        return pairs[idx];
    }, [images, captionsByImage]);

    async function vote(v: 1 | -1) {
        if (!pick) return;

        setBusy(true);

        const res = await fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ captionId: pick.cap.id, vote: v }),
        });

        setBusy(false);

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j.error ?? "Vote failed");
            return;
        }

        router.refresh();
    }

    async function postCaption(imageId: string) {
        const t = captionText.trim();
        if (!t) return;

        setBusy(true);

        const res = await fetch("/api/captions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId, text: t }),
        });

        setBusy(false);

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j.error ?? "Failed to post caption");
            return;
        }

        setCaptionText("");
        router.refresh();
    }

    if (!pick) {
        return (
            <div style={styles.card}>
                <div style={{ padding: 30 }}>
                    <h2 style={{ margin: 0 }}>No captions yet</h2>
                    <p style={{ marginTop: 10, opacity: 0.8 }}>
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
                <img src={img.url} style={styles.image} />
            </div>

            <div style={styles.content}>
                <div style={styles.topRow}>
                    <div style={styles.badge}>Rate</div>
                    <div style={styles.score}>Score: {cap.score}</div>
                </div>

                <div style={styles.caption}>{cap.text}</div>

                <div style={styles.actions}>
                    <button disabled={busy} onClick={() => vote(1)} style={styles.up}>
                        👍 Upvote
                    </button>

                    <button disabled={busy} onClick={() => vote(-1)} style={styles.down}>
                        👎 Downvote
                    </button>

                    <button disabled={busy} onClick={() => router.refresh()} style={styles.next}>
                        Next
                    </button>
                </div>

                <div style={styles.divider} />

                <div style={styles.captionInputRow}>
                    <input
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        placeholder="Add a new caption..."
                        style={styles.input}
                    />
                    <button disabled={busy} onClick={() => postCaption(img.id)} style={styles.post}>
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    card: {
        width: "min(900px, 95vw)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        background: "#111827",
        color: "white",
    },

    imageWrapper: {
        width: "100%",
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    image: {
        width: "100%",
        maxHeight: "520px",
        objectFit: "contain",
        display: "block",
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
        background: "#1f2937",
        color: "#9ca3af",
    },

    score: {
        opacity: 0.8,
        fontSize: 14,
    },

    caption: {
        fontSize: 24,
        fontWeight: 600,
        marginBottom: 22,
    },

    actions: {
        display: "flex",
        gap: 12,
        marginBottom: 18,
        flexWrap: "wrap",
    },

    // ✅ pastel buttons (your preferred style)
    up: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid rgba(34,197,94,0.4)",
        background: "rgba(34,197,94,0.15)",
        color: "#22c55e",
        fontWeight: 600,
        cursor: "pointer",
    },

    down: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid rgba(239,68,68,0.4)",
        background: "rgba(239,68,68,0.15)",
        color: "#ef4444",
        fontWeight: 600,
        cursor: "pointer",
    },

    next: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid rgba(59,130,246,0.4)",
        background: "rgba(59,130,246,0.15)",
        color: "#3b82f6",
        fontWeight: 600,
        cursor: "pointer",
    },

    divider: {
        height: 1,
        background: "#1f2937",
        margin: "20px 0",
    },

    captionInputRow: {
        display: "flex",
        gap: 10,
    },

    input: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #374151",
        background: "#1f2937",
        color: "white",
        outline: "none",
    },

    post: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: "#2563eb",
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
    },
};
