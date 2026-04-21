"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

export default function NavTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: "Rate",       icon: "🔥", href: "/protected",            description: "Vote"         },
        { name: "Scoreboard", icon: "🏆", href: "/protected/scoreboard", description: "Top captions" },
        { name: "Upload",     icon: "📸", href: "/protected/upload",     description: "Add image"    },
    ];

    return (
        <div style={styles.outer}>
            <div style={styles.grid}>
                {tabs.map((t) => {
                    const active = pathname === t.href || pathname.startsWith(t.href + "/");
                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            style={{ ...styles.tab, ...(active ? styles.active : styles.inactive) }}
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
        width: "min(1100px, 94vw)",
        margin: "0 auto 6px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10,
    },
    tab: {
        height: 70,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textDecoration: "none",
        transition: "0.15s",
    },
    active: {
        background: "rgba(96,165,250,0.22)",
        border: "1px solid rgba(96,165,250,0.55)",
        boxShadow: "0 4px 16px rgba(59,130,246,0.15)",
    },
    inactive: {
        background: "rgba(255,255,255,0.50)",
        border: "1px solid rgba(150,200,255,0.45)",
        boxShadow: "0 2px 8px rgba(60,120,220,0.06)",
    },
    icon: {
        fontSize: 18,
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: 700,
        color: "#1a3a5c",
    },
    subtitle: {
        fontSize: 10,
        color: "#6a9cbf",
    },
};
