import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    await supabase.auth.exchangeCodeForSession(
        new URL(request.url).searchParams.get("code")!
    );

    return NextResponse.redirect(new URL("/protected", request.url));
}
