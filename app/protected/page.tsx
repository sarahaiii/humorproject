import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RateCard from "@/app/components/RateCard";
import NavTabs from "@/app/components/NavTabs";

type ImageRow = {
    id: string;
    url: string;
};

type CaptionRow = {
    id: string;
    content: string;
    image_id: string;
};

type VoteRow = {
    caption_id: string;
    vote_value: number;
};

export default async function ProtectedPage() {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/");

    // 1️⃣ Fetch everything directly
    const { data: images, error: imgErr } = await supabase
        .from("images")
        .select("id, url");

    if (imgErr) {
        return <div>Error loading images: {imgErr.message}</div>;
    }

    const { data: captions, error: capErr } = await supabase
        .from("captions")
        .select("id, content, image_id");

    if (capErr) {
        return <div>Error loading captions: {capErr.message}</div>;
    }

    const { data: votes, error: voteErr } = await supabase
        .from("caption_votes")
        .select("caption_id, vote_value");

    if (voteErr) {
        return <div>Error loading votes: {voteErr.message}</div>;
    }

    const imgs = (images ?? []) as ImageRow[];
    const caps = (captions ?? []) as CaptionRow[];
    const voteRows = (votes ?? []) as VoteRow[];

    // 2️⃣ Build score map
    const scoreByCaption: Record<string, number> = {};

    for (const v of voteRows) {
        scoreByCaption[v.caption_id] =
            (scoreByCaption[v.caption_id] ?? 0) + Number(v.vote_value);
    }

    // 3️⃣ Group captions by image
    const captionsByImage: Record<
        string,
        { id: string; text: string; score: number }[]
    > = {};

    for (const c of caps) {
        if (!captionsByImage[c.image_id]) {
            captionsByImage[c.image_id] = [];
        }

        captionsByImage[c.image_id].push({
            id: c.id,
            text: c.content,
            score: scoreByCaption[c.id] ?? 0,
        });
    }

    return (
        <main style={pageStyles.page}>
            <div style={pageStyles.topBar}>
                <div style={pageStyles.brand}>Humor Project</div>
                <a href="/auth/logout" style={pageStyles.link}>
                    Logout
                </a>
            </div>

            <div style={pageStyles.center}>
                <div style={{ width: "min(900px, 95vw)" }}>
                    <NavTabs />
                    <div style={{ height: 14 }} />
                    <RateCard images={imgs} captionsByImage={captionsByImage} />
                </div>
            </div>
        </main>
    );
}

const pageStyles: Record<string, any> = {
    page: {
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui",
        background: "var(--bg-dark)",
        color: "var(--text-main)",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 980,
        margin: "0 auto 24px",
        padding: "14px 16px",
        borderRadius: 18,
        background: "rgba(30,41,59,0.65)",
        border: "1px solid rgba(51,65,85,0.7)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
    },
    brand: {
        fontWeight: 900,
    },
    link: {
        color: "var(--text-main)",
        textDecoration: "none",
        fontWeight: 700,
    },
    center: {
        display: "grid",
        placeItems: "center",
        paddingTop: 10,
    },
};