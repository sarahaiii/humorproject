import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RateCard from "@/app/components/RateCard";

type ImageRow = {
    id: string;
    url: string;
    image_description?: string | null;
};

function looksLikeUuid(x: any) {
    return typeof x === "string" && /^[0-9a-fA-F-]{32,36}$/.test(x);
}

function pickCaptionVoteKeys(sample: any) {
    const keys = Object.keys(sample);

    const captionKey =
        keys.find((k) => /caption/i.test(k) && /id|_id|fk/i.test(k)) ??
        keys.find((k) => /caption/i.test(k) && looksLikeUuid(sample[k])) ??
        null;

    const voteKey =
        keys.find((k) => /vote|value|direction|rating|score/i.test(k)) ??
        keys.find(
            (k) =>
                typeof sample[k] === "number" &&
                !/id|created|updated|time|at|profile/i.test(k)
        ) ??
        null;

    return { captionKey, voteKey };
}

export default async function ProtectedPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) redirect("/");

    const { data: images, error } = await supabase
        .from("images")
        .select("*")
        .limit(50);

    if (error) return <div>Error: {error.message}</div>;

    const imgs = (images ?? []) as ImageRow[];
    const imageIds = imgs.map((i) => i.id);

    const { data: captionsData, error: captionsErr } = await supabase
        .from("captions")
        .select("*")
        .in("image_id", imageIds);

    if (captionsErr) return <div>Error loading captions: {captionsErr.message}</div>;

    const captions = (captionsData ?? []) as any[];
    const captionIds = captions.map((c) => String(c?.id ?? "")).filter(Boolean);
    const captionIdSet = new Set(captionIds);

    // votes → score per caption
    const scoreByCaption: Record<string, number> = {};
    if (captionIds.length > 0) {
        const { data: votesData, error: votesErr } = await supabase
            .from("caption_votes")
            .select("*")
            .limit(5000);

        if (votesErr) return <div>Error loading votes: {votesErr.message}</div>;

        const votes = (votesData ?? []) as any[];
        if (votes.length > 0) {
            const { captionKey, voteKey } = pickCaptionVoteKeys(votes[0]);

            if (captionKey && voteKey) {
                for (const v of votes) {
                    const cid = v?.[captionKey];
                    if (!cid) continue;

                    const cidStr = String(cid);
                    if (!captionIdSet.has(cidStr)) continue;

                    const val = Number(v?.[voteKey]);
                    if (!Number.isFinite(val)) continue;

                    scoreByCaption[cidStr] = (scoreByCaption[cidStr] ?? 0) + val;
                }
            }
        }
    }

    // captions grouped by image
    const captionsByImage: Record<string, { id: string; text: string; score: number }[]> = {};
    for (const c of captions) {
        const cid = String(c?.id ?? "");
        const imgId = String(c?.image_id ?? "");
        const text = (c?.text ?? c?.caption ?? c?.content ?? c?.body ?? "").toString();

        if (!cid || !imgId || !text) continue;

        if (!captionsByImage[imgId]) captionsByImage[imgId] = [];
        captionsByImage[imgId].push({
            id: cid,
            text,
            score: scoreByCaption[cid] ?? 0,
        });
    }

    return (
        <main style={pageStyles.page}>
            <div style={pageStyles.topBar}>
                <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Humor Project</div>
                <a href="/auth/logout" style={pageStyles.link}>
                    Logout
                </a>
            </div>

            <div style={pageStyles.center}>
                <RateCard images={imgs} captionsByImage={captionsByImage} />
            </div>
        </main>
    );
}

const pageStyles: Record<string, any> = {
    page: {
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui",
        background:
            "linear-gradient(135deg, #f3f6ff 0%, #e6ecff 40%, #fdf2ff 100%)",
        color: "#111827",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 980,
        margin: "0 auto 24px",
    },
    link: {
        color: "#374151",
        textDecoration: "none",
        fontWeight: 600,
    },
    center: {
        display: "grid",
        placeItems: "center",
        paddingTop: 10,
    },
};
