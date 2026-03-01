"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PipelineResult = {
    imageId: string;
    cdnUrl: string;
    captions: any[];
};

export default function UploadPanel() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    const [imageUrl, setImageUrl] = useState("");
    const [caption, setCaption] = useState("");

    const [generated, setGenerated] = useState<string[]>([]);
    const [lastImageId, setLastImageId] = useState<string | null>(null);
    const [lastCdnUrl, setLastCdnUrl] = useState<string | null>(null);

    function extractCaptionTexts(captions: any[]): string[] {
        const out: string[] = [];
        for (const c of captions || []) {
            const t =
                (typeof c === "string" ? c : null) ||
                c?.text ||
                c?.caption ||
                c?.content ||
                c?.body;

            if (typeof t === "string" && t.trim()) out.push(t.trim());
        }
        return Array.from(new Set(out));
    }

    async function uploadAndGenerate() {
        if (!file) return;

        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/captions", {
                method: "POST",
                body: fd,
            });

            const data = (await res.json().catch(() => ({}))) as Partial<PipelineResult>;

            if (!res.ok) {
                // show detail if present
                alert((data as any)?.error ?? "Upload failed");
                console.log("upload error detail:", (data as any)?.detail);
                return;
            }

            const texts = extractCaptionTexts(data.captions || []);
            setGenerated(texts);
            setLastImageId(data.imageId || null);
            setLastCdnUrl(data.cdnUrl || null);

            if (data.cdnUrl) setImageUrl(data.cdnUrl);
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function addMemeManually() {
        const cap = caption.trim();
        if (!cap) return;

        if (!lastImageId) {
            alert("Upload an image first (so we have an imageId), then add captions.");
            return;
        }

        setBusy(true);
        try {
            const res = await fetch("/api/captions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // IMPORTANT: DB column is `content`, not `text`
                body: JSON.stringify({ imageId: lastImageId, content: cap }),
            });

            const j = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(j.error ?? "Failed to add caption");
                console.log("db insert error detail:", j);
                return;
            }

            setCaption("");
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function saveGeneratedToDb() {
        if (!lastImageId || generated.length === 0) return;

        setBusy(true);
        try {
            for (const captionText of generated) {
                const res = await fetch("/api/captions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageId: lastImageId, content: captionText }),
                });

                const j = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert(j.error ?? "Failed while saving generated captions");
                    console.log("db insert error detail:", j);
                    return;
                }
            }

            alert("Saved generated captions!");
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={styles.card}>
                <div style={styles.cardInner}>
                    <div style={styles.title}>Upload Image to Auto-Generate Captions</div>
                    <div style={styles.label}>CHOOSE IMAGE</div>

                    <div style={styles.row}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            style={styles.file}
                        />
                        <button
                            disabled={busy || !file}
                            onClick={uploadAndGenerate}
                            style={{
                                ...styles.primaryBtn,
                                opacity: busy || !file ? 0.6 : 1,
                            }}
                        >
                            {busy ? "Working..." : "Generate"}
                        </button>
                    </div>

                    {lastCdnUrl && (
                        <div style={{ marginTop: 16 }}>
                            <div style={styles.previewRow}>
                                <img src={lastCdnUrl} alt="Uploaded preview" style={styles.previewImg} />
                                <div style={{ flex: 1 }}>
                                    <div style={styles.small}>Uploaded URL</div>
                                    <div style={styles.mono}>{lastCdnUrl}</div>
                                    <div style={{ height: 10 }} />
                                    <div style={styles.small}>imageId</div>
                                    <div style={styles.mono}>{lastImageId}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {generated.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={styles.label}>GENERATED CAPTIONS</div>

                            <div style={styles.genBox}>
                                {generated.map((t, i) => (
                                    <div key={i} style={styles.genItem}>
                                        {t}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                                <button
                                    disabled={busy || !lastImageId}
                                    onClick={saveGeneratedToDb}
                                    style={{
                                        ...styles.secondaryBtn,
                                        opacity: busy || !lastImageId ? 0.6 : 1,
                                    }}
                                >
                                    Save generated captions to DB
                                </button>
                                <button
                                    disabled={busy}
                                    onClick={() => setGenerated([])}
                                    style={{
                                        ...styles.ghostBtn,
                                        opacity: busy ? 0.6 : 1,
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.card}>
                <div style={styles.cardInner}>
                    <div style={styles.title}>Add New Meme</div>

                    <div style={styles.label}>IMAGE URL</div>
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        style={styles.input}
                    />

                    <div style={{ height: 16 }} />

                    <div style={styles.label}>CAPTION</div>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a funny caption..."
                        style={styles.textarea}
                    />

                    <button
                        disabled={busy}
                        onClick={addMemeManually}
                        style={{
                            ...styles.bigBtn,
                            opacity: busy ? 0.6 : 1,
                        }}
                    >
                        Add Meme
                    </button>

                    <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
                        Tip: Upload first so you have an{" "}
                        <span style={styles.monoInline}>imageId</span>. Then “Add Meme” saves a caption
                        for that image.
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    card: {
        borderRadius: 22,
        padding: 2,
        background: "rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    },
    cardInner: {
        borderRadius: 20,
        padding: 24,
        background: "#0b1220",
        color: "white",
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 18,
    },
    label: {
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: 700,
        opacity: 0.7,
        marginBottom: 8,
    },
    row: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
    },
    file: {
        flex: 1,
        minWidth: 260,
        padding: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
    },
    primaryBtn: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: "#7c3aed",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    secondaryBtn: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(124,58,237,0.4)",
        background: "rgba(124,58,237,0.15)",
        color: "#c4b5fd",
        fontWeight: 700,
        cursor: "pointer",
    },
    ghostBtn: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    input: {
        width: "100%",
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        outline: "none",
    },
    textarea: {
        width: "100%",
        minHeight: 110,
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        outline: "none",
        resize: "vertical",
    },
    bigBtn: {
        width: "100%",
        marginTop: 18,
        padding: "14px 16px",
        borderRadius: 14,
        border: "none",
        background: "#7c3aed",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        fontSize: 16,
    },
    previewRow: {
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        flexWrap: "wrap",
    },
    previewImg: {
        width: 260,
        maxWidth: "100%",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
    },
    small: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 6,
    },
    mono: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 12,
        opacity: 0.9,
        wordBreak: "break-all",
    },
    monoInline: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    genBox: {
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    genItem: {
        padding: 12,
        borderRadius: 12,
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
};