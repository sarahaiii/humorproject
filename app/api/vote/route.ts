import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Not logged in" },
            { status: 401 }
        );
    }

    const body = await req.json();
    const captionId = body.captionId;
    const vote = body.vote;

    if (!captionId || (vote !== 1 && vote !== -1)) {
        return NextResponse.json(
            { error: "Bad captionId or vote" },
            { status: 400 }
        );
    }

    const { data: existingVote, error: findError } = await supabase
        .from("caption_votes")
        .select("id")
        .eq("caption_id", captionId)
        .eq("profile_id", user.id)
        .maybeSingle();

    if (findError) {
        return NextResponse.json(
            { error: findError.message },
            { status: 500 }
        );
    }

    if (existingVote) {
        const { error: updateError } = await supabase
            .from("caption_votes")
            .update({
                vote_value: vote,
                modified_by_user_id: user.id,
            })
            .eq("id", existingVote.id);

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true, mode: "updated" });
    }

    const { error: insertError } = await supabase
        .from("caption_votes")
        .insert({
            caption_id: captionId,
            profile_id: user.id,
            vote_value: vote,
            created_by_user_id: user.id,
            modified_by_user_id: user.id,
        });

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, mode: "inserted" });
}