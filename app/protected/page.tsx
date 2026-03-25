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

    const scoreByCaption: Record<string, number> = {};

    for (const v of voteRows) {
        scoreByCaption[v.caption_id] =
            (scoreByCaption[v.caption_id] ?? 0) + Number(v.vote_value);
    }

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
        <div style={{ width: "min(900px, 95vw)", margin: "0 auto" }}>
            <NavTabs />
            <div style={{ height: 14 }} />
            <RateCard images={imgs} captionsByImage={captionsByImage} />
        </div>
    );
}