import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function looksLikeUuid(x: any) {
    return typeof x === "string" && /^[0-9a-fA-F-]{32,36}$/.test(x);
}

function pickCaptionKey(keys: string[], sample: any) {
    // Prefer caption FK style
    const prefer = keys.find((k) => /caption/i.test(k) && /id|_id|fk/i.test(k));
    if (prefer) return prefer;

    // Next: any caption-ish key whose values look like UUIDs
    const maybe = keys.find((k) => /caption/i.test(k) && looksLikeUuid(sample[k]));
    if (maybe) return maybe;

    return null;
}

function pickVoteKey(keys: string[], sample: any) {
    // Common vote column names
    const namePrefer = keys.find((k) => /vote|value|direction|rating|score/i.test(k));
    if (namePrefer) return namePrefer;

    // Fallback: first numeric column that isn't obviously metadata
    const numeric = keys.find((k) => {
        if (/id|created|updated|time|at|profile/i.test(k)) return false;
        return typeof sample[k] === "number";
    });
    if (numeric) return numeric;

    return null;
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const captionId = body.captionId as string;
    const vote = body.vote as number;

    if (!captionId || (vote !== 1 && vote !== -1)) {
        return NextResponse.json({ error: "Bad captionId or vote" }, { status: 400 });
    }

    // Peek one row to infer caption/vote column names (since your schema differs)
    const peek = await supabase.from("caption_votes").select("*").limit(1);

    if (peek.error || !peek.data || peek.data.length === 0) {
        return NextResponse.json(
            { error: peek.error?.message ?? "caption_votes empty; can't infer schema" },
            { status: 500 }
        );
    }

    const sample = peek.data[0] as any;
    const keys = Object.keys(sample);

    const captionKey = pickCaptionKey(keys, sample);
    const voteKey = pickVoteKey(keys, sample);

    if (!captionKey || !voteKey) {
        return NextResponse.json(
            {
                error: "Could not infer caption/vote columns from caption_votes.",
                keys,
                sampleRow: sample,
            },
            { status: 500 }
        );
    }

    const payload: any = {
        [captionKey]: captionId,
        [voteKey]: vote,
        profile_id: auth.user.id,                 // ✅ required
        created_datetime_utc: new Date().toISOString(), // ✅ required
    };

    const ins = await supabase.from("caption_votes").insert(payload);
    if (ins.error) {
        return NextResponse.json(
            { error: ins.error.message, payloadKeys: Object.keys(payload) },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
