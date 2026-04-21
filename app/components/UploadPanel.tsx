"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PipelineResult = {
    ok?: boolean;
    imageId?: string;
    cdnUrl?: string;
    captions?: any[];
    error?: string;
    detail?: string;
};

export default function UploadPanel() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

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

            if (typeof t === "string" && t.trim()) {
                out.push(t.trim());
            }
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

            const data = (await res.json().catch(() => ({}))) as PipelineResult;

            if (!res.ok) {
                const message = data.detail
                    ? `${data.error ?? "Upload failed"}\n\n${data.detail}`
                    : (data.error ?? "Upload failed");

                alert(message);
                return;
            }

            const texts = extractCaptionTexts(data.captions || []);
            const imgId = data.imageId || null;
            setGenerated(texts);
            setLastImageId(imgId);
            setLastCdnUrl(data.cdnUrl || null);

            if (texts.length === 0) {
                alert("Upload succeeded, but no captions were returned.");
                return;
            }

            // Auto-save generated captions to DB
            if (imgId) {
                for (const captionText of texts) {
                    await fetch("/api/captions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageId: imgId, content: captionText }),
                    });
                }
                router.refresh();
            }
        } finally {
            setBusy(false);
        }
    }

    async function addMemeManually() {
        const cap = caption.trim();
        if (!cap) return;

        if (!lastImageId) {
            alert("Upload an image first so the app has an imageId.");
            return;
        }

        setBusy(true);
        try {
            const res = await fetch("/api/captions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageId: lastImageId,
                    content: cap,
                }),
            });

            const j = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(j.error ?? "Failed to add caption");
                return;
            }

            setCaption("");
            alert("Caption saved.");
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
                    <label style={styles.dropZone}>
                        <div style={styles.dropIcon}>🖼️</div>
                        <div style={styles.dropTitle}>
                            {file ? file.name : "Choose an image to upload"}
                        </div>
                        <div style={styles.dropSub}>
                            {file ? `${(file.size / 1024).toFixed(0)} KB` : "PNG, JPG, GIF, WEBP"}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            style={{ display: "none" }}
                        />
                    </label>

                    <button
                        disabled={busy || !file}
                        onClick={uploadAndGenerate}
                        style={{
                            ...styles.primaryBtn,
                            marginTop: 12,
                            width: "100%",
                            opacity: busy || !file ? 0.5 : 1,
                        }}
                    >
                        {busy ? "Working..." : "Generate Captions"}
                    </button>

                    {generated.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={styles.label}>GENERATED CAPTIONS</div>
                            <div style={styles.genBox}>
                                {generated.map((t, i) => (
                                    <div key={i} style={styles.genItem}>{t}</div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                <button
                                    disabled={busy || !file}
                                    onClick={uploadAndGenerate}
                                    style={{
                                        ...styles.secondaryBtn,
                                        opacity: busy || !file ? 0.6 : 1,
                                    }}
                                >
                                    {busy ? "Working..." : "Regenerate"}
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
                    <div style={styles.title}>Write Your Own Caption</div>

                    <div style={styles.label}>CAPTION</div>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a funny caption..."
                        style={styles.textarea}
                    />

                    <button
                        disabled={busy || !lastImageId}
                        onClick={addMemeManually}
                        style={{
                            ...styles.bigBtn,
                            opacity: busy || !lastImageId ? 0.5 : 1,
                        }}
                    >
                        {busy ? "Saving..." : "Save Caption"}
                    </button>

                    {!lastImageId && (
                        <div style={{ marginTop: 10, fontSize: 12, color: "#6a9cbf" }}>
                            Upload an image above first to enable this.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    card: {
        borderRadius: 22,
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(28px) saturate(140%)",
        WebkitBackdropFilter: "blur(28px) saturate(140%)",
        border: "1px solid rgba(120,175,255,0.5)",
        boxShadow: "0 20px 60px rgba(60,120,220,0.13), inset 0 1px 0 rgba(255,255,255,0.9)",
    },
    cardInner: {
        borderRadius: 20,
        padding: 24,
        color: "#1a3a5c",
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 18,
        color: "#1a3a5c",
    },
    label: {
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: 700,
        color: "#6a9cbf",
        marginBottom: 8,
    },
    dropZone: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "28px 20px",
        borderRadius: 16,
        border: "2px dashed rgba(96,165,250,0.6)",
        background: "rgba(225,240,255,0.5)",
        cursor: "pointer",
        transition: "background 0.15s",
    },
    dropIcon: {
        fontSize: 36,
        lineHeight: 1,
    },
    dropTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: "#1a3a5c",
        textAlign: "center",
        wordBreak: "break-all",
    },
    dropSub: {
        fontSize: 12,
        color: "#6a9cbf",
    },
    primaryBtn: {
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: "#2563eb",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    secondaryBtn: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(96,165,250,0.5)",
        background: "rgba(96,165,250,0.15)",
        color: "#1d4ed8",
        fontWeight: 700,
        cursor: "pointer",
    },
    ghostBtn: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(225,240,255,0.5)",
        color: "#1a3a5c",
        fontWeight: 700,
        cursor: "pointer",
    },
    input: {
        width: "100%",
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(225,240,255,0.6)",
        color: "#1a3a5c",
        outline: "none",
    },
    textarea: {
        width: "100%",
        minHeight: 110,
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(225,240,255,0.6)",
        color: "#1a3a5c",
        outline: "none",
        resize: "vertical",
    },
    bigBtn: {
        width: "100%",
        marginTop: 18,
        padding: "14px 16px",
        borderRadius: 14,
        border: "none",
        background: "#2563eb",
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
        border: "1px solid rgba(120,175,255,0.4)",
        background: "rgba(225,240,255,0.4)",
    },
    small: {
        fontSize: 12,
        color: "#6a9cbf",
        marginBottom: 6,
    },
    mono: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 12,
        color: "#1a3a5c",
        wordBreak: "break-all",
    },
    monoInline: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        color: "#1d4ed8",
    },
    genBox: {
        borderRadius: 14,
        border: "1px solid rgba(120,175,255,0.35)",
        background: "rgba(225,240,255,0.5)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    genItem: {
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(120,175,255,0.3)",
        color: "#1a3a5c",
    },
};