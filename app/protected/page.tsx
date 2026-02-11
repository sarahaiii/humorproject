import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
        redirect("/");
    }

    const { data, error } = await supabase
        .from("images")
        .select("*")
        .limit(24);

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <main style={{ padding: 24 }}>
            <h1>Images</h1>

            <a href="/auth/logout">Logout</a>

            <div
                style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: 16,
                }}
            >
                {(data ?? []).map((img: any) => (
                    <div key={img.id}>
                        <img src={img.url} style={{ width: "100%" }} />
                        <p>{img.image_description?.slice(0, 120)}...</p>
                    </div>
                ))}
            </div>
        </main>
    );
}
