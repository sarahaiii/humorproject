import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RateCard from "@/app/components/RateCard";
import NavTabs from "@/app/components/NavTabs";

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

    const scoreByCaption: Record<string, number> = {};

    for (const v of votes ?? []) {
        scoreByCaption[v.caption_id] =
            (scoreByCaption[v.caption_id] ?? 0) + Number(v.vote_value);
    }

    const captionsByImage: Record<
        string,
        { id: string; text: string; score: number }[]
    > = {};

    for (const c of captions ?? []) {
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
        <div style={styles.page}>
            <NavTabs />
            <div style={styles.gap} />
            <div style={styles.cardArea}>
                <RateCard
                    images={(images ?? []) as { id: string; url: string }[]}
                    captionsByImage={captionsByImage}
                />
            </div>
        </div>
    );
}


const styles: Record<string, CSSProperties> = {

    page: {

        width: "min(1180px, 94vw)",

        margin: "0 auto",

        padding: "2px 0 14px 0",   // tighter top spacing

        minHeight: "100vh",

        display: "flex",

        flexDirection: "column",

    },

    gap: {

        height: 2   // smaller gap between tabs and card

    },

    cardArea: {

        flexGrow: 1,

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        overflow: "hidden",

    },

};