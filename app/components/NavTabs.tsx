// app/components/NavTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const tabs = [
    { label: "Rate", href: "/protected" },
    { label: "Scoreboard", href: "/protected/scoreboard" },
    { label: "Upload", href: "/protected/upload" },
];

export default function NavTabs() {
    const pathname = usePathname();

    return (
        <div style={styles.wrap}>
            {tabs.map((t) => {
                const active =
                    t.href === "/protected"
                        ? pathname === "/protected"
                        : pathname === t.href || pathname.startsWith(`${t.href}/`);

                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        style={{
                            ...styles.tab,
                            ...(active ? styles.tabActive : styles.tabInactive),
                            ...(t === tabs[tabs.length - 1] ? styles.lastTab : {}),
                        }}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}

type Styles = {
    wrap: CSSProperties;
    tab: CSSProperties;
    tabActive: CSSProperties;
    tabInactive: CSSProperties;
    lastTab: CSSProperties;
};

const styles: Styles = {
    wrap: {
        display: "inline-flex",
        gap: 0,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(51,65,85,0.7)",
        background: "rgba(15,23,42,0.55)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        backdropFilter: "blur(10px)",
    },
    tab: {
        padding: "10px 16px",
        fontWeight: 800,
        textDecoration: "none",
        transition: "all 120ms ease",
        borderRight: "1px solid rgba(51,65,85,0.6)",
        cursor: "pointer",
    },
    tabActive: {
        background: "rgba(167,139,250,0.22)",
        color: "var(--text-main)",
    },
    tabInactive: {
        background: "transparent",
        color: "rgba(241,245,249,0.8)",
    },
    lastTab: {
        borderRight: "none",
    },
};