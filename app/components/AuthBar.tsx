"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthBar() {
    const supabase = createClient();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setEmail(session?.user?.email ?? null);
        });

        return () => sub.subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {email ? (
                <>
                    <span style={{ fontSize: 14, color: "#1a3a5c", opacity: 0.85 }}>{email}</span>
                    <button
                        onClick={signOut}
                        style={{
                            background: "#2563eb",
                            border: "1px solid #1d4ed8",
                            padding: "6px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 13,
                        }}
                    >
                        Logout
                    </button>
                </>
            ) : (
                <span style={{ fontSize: 14 }}>Not logged in</span>
            )}
        </div>
    );
}