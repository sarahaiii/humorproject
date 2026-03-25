import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    const code = new URL(request.url).searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const user = data.user;

    const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (!existingProfile) {
        await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            created_by_user_id: user.id,
            modified_by_user_id: user.id,
        });
    }

    return NextResponse.redirect(new URL("/protected", request.url));
}