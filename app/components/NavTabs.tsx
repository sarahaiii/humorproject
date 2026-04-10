"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

export default function NavTabs() {
    const pathname = usePathname();

    const tabs = [
        {
            name: "Rate",
            icon: "🔥",
            href: "/protected",
            description: "Vote",
        },
        {
            name: "Scoreboard",
            icon: "🏆",
            href: "/protected/scoreboard",
            description: "Top captions",
        },
        {
            name: "Upload",
            icon: "📸",
            href: "/protected/upload",
            description: "Add image",
        },
    ];

    return (
        <div style={styles.outer}>
            <div style={styles.grid}>
                {tabs.map((t) => {
                    const active =
                        pathname === t.href ||
                        pathname.startsWith(t.href + "/");

                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            style={{
                                ...styles.card,
                                ...(active ? styles.active : styles.inactive),
                            }}
                        >
                            <div style={styles.icon}>{t.icon}</div>
                            <div style={styles.title}>{t.name}</div>
                            <div style={styles.subtitle}>{t.description}</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    outer: {
        width: "min(1180px, 94vw)",
        margin: "2px auto 0 auto",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
    },

    card: {
        height: 78,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textDecoration: "none",
        transition: "0.15s",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    },

    active: {
        background: "rgba(99,102,241,0.34)",
        boxShadow:
            "0 0 0 1px rgba(99,102,241,0.30), 0 12px 28px rgba(0,0,0,0.22)",
    },

    inactive: {
        background: "rgba(255,255,255,0.045)",
    },

    icon: {
        fontSize: 18,
        marginBottom: 2,
    },

    title: {
        fontSize: 13,
        fontWeight: 700,
        color: "rgba(255,255,255,0.96)",
    },

    subtitle: {
        fontSize: 10,
        opacity: 0.72,
        color: "rgba(255,255,255,0.78)",
    },
};