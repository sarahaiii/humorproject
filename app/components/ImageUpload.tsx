"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImageUpload() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    async function upload() {
        if (!file) return;

        setLoading(true);

        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/captions", {
            method: "POST",
            body: form,
        });

        setLoading(false);

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j.error ?? "Upload failed");
            return;
        }

        const data = await res.json();
        console.log("Pipeline result:", data);

        router.refresh();
    }

    return (
        <div style={{ marginBottom: 30 }}>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <button
                onClick={upload}
                disabled={loading || !file}
                style={{
                    marginLeft: 12,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                {loading ? "Uploading..." : "Generate Captions"}
            </button>
        </div>
    );
}