"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CaptionRow = {
    id: string;
    text: string;
    score: number;
};

export default function Captions({
                                     imageId,
                                     captions,
                                 }: {
    imageId: string;
    captions: CaptionRow[];
}) {
    const router = useRouter();
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);

    async function postCaption() {
        const t = text.trim();
        if (!t) return;

        setBusy(true);
        const res = await fetch("/api/captions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId, text: t }),
        });
        setBusy(false);

        if (res.ok) {
            setText("");
            router.refresh();
            return;
        }

        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to post caption");
    }

    async function vote(captionId: string, v: 1 | -1) {
        const res = await fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ captionId, vote: v }),
        });

        if (res.ok) {
            router.refresh();
            return;
        }

        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Vote failed");
    }

    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {captions.length === 0 ? (
                    <div style={{ fontSize: 13, opacity: 0.7 }}>No captions yet.</div>
                ) : (
                    captions.map((c) => (
                        <div
                            key={c.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto auto",
                                gap: 8,
                                alignItems: "center",
                                fontSize: 14,
                            }}
                        >
                            <div>{c.text}</div>
                            <div style={{ width: 24, textAlign: "right" }}>{c.score}</div>
                            <button onClick={() => vote(c.id, 1)}>👍</button>
                            <button onClick={() => vote(c.id, -1)}>👎</button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a caption..."
                    style={{ flex: 1, padding: 8 }}
                />
                <button disabled={busy} onClick={postCaption}>
                    Post
                </button>
            </div>
        </div>
    );
}
