import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle(request: Request) {
    const supabase = await createClient();
    const origin = new URL(request.url).origin;

    const { data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    return NextResponse.redirect(data?.url ?? origin);
}

export async function GET(request: Request) {
    return handle(request);
}
