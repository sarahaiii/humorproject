import { supabase } from "../lib/supabase";

export default async function Home() {
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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: 16,
                }}
            >
                {(data ?? []).map((img) => (
                    <div
                        key={img.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            padding: 12,
                        }}
                    >
                        <img
                            src={img.url}
                            style={{
                                width: "100%",
                                borderRadius: 8,
                            }}
                        />

                        <p style={{ fontSize: 12, marginTop: 8 }}>
                            {img.image_description?.slice(0, 120)}...
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}
