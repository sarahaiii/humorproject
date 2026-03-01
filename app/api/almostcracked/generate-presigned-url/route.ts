import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();

    // Get the current logged-in session (from cookies)
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
        return NextResponse.json({ error: "Not logged in / missing session" }, { status: 401 });
    }

    const body = await req.json(); // expects { contentType: "image/jpeg" } etc.

    const r = await fetch("https://api.almostcrackd.ai/pipeline/generate-presigned-url", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
}