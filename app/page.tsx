export default function Home() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                fontFamily: "system-ui",
            }}
        >
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 16,
                    padding: 24,
                    width: 320,
                    textAlign: "center",
                }}
            >
                <h1>Humor Project</h1>
                <p>Please login with Google</p>

                <a href="/auth/login">
                    <button
                        style={{
                            marginTop: 16,
                            width: "100%",
                            padding: 12,
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        Login with Google
                    </button>
                </a>
            </div>
        </main>
    );
}
