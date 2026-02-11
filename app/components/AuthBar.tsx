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

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setEmail(null);
    };

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            {!email ? (
                <>
                    <span style={{ fontSize: 14 }}>Not logged in</span>
                    <button onClick={signInWithGoogle}>Login with Google</button>
                </>
            ) : (
                <>
                    <span style={{ fontSize: 14 }}>Logged in as: {email}</span>
                    <a href="/protected">Protected</a>
                    <button onClick={signOut}>Logout</button>
                </>
            )}
        </div>
    );
}
