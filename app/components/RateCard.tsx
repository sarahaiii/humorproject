"use client";

import {
    useEffect,
    useMemo,
    useState,
    useTransition,
    type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    useAnimationControls,
} from "framer-motion";

type CaptionRow = {
    id: string;
    text: string;
    score: number;
};

type ImageRow = {
    id: string;
    url: string;
    image_description?: string | null;
};

type Pair = {
    img: ImageRow;
    cap: CaptionRow;
};

type FeedbackType = "up" | "down" | null;

type BurstEmoji = {
    id: number;
    emoji: string;
    x: number;
    y: number;
    rotate: number;
    size: number;
    duration: number;
};

export default function RateCard({
                                     images,
                                     captionsByImage,
                                 }: {
    images: ImageRow[];
    captionsByImage: Record<string, CaptionRow[]>;
}) {
    const router = useRouter();

    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackType>(null);
    const [burst, setBurst] = useState<BurstEmoji[]>([]);
    const [isPending, startTransition] = useTransition();

    const [localCaptions, setLocalCaptions] =
        useState<Record<string, CaptionRow[]>>(captionsByImage);

    useEffect(() => {
        setLocalCaptions(captionsByImage);
    }, [captionsByImage]);

    const pairs = useMemo(() => {
        const arr: Pair[] = [];

        for (const img of images) {
            const caps = localCaptions[img.id] ?? [];
            for (const cap of caps) {
                arr.push({ img, cap });
            }
        }

        return arr;
    }, [images, localCaptions]);

    const [index, setIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!pairs.length) {
            setIndex(null);
            return;
        }
        setIndex(Math.floor(Math.random() * pairs.length));
    }, [pairs.length]);

    const current = index === null ? null : pairs[index];

    function nextIndex(exclude: number[] = []) {
        if (pairs.length <= 1) return 0;

        const banned = new Set<number>(
            [index, ...exclude].filter((v): v is number => v !== null)
        );

        const options = pairs.map((_, i) => i).filter((i) => !banned.has(i));
        return options[Math.floor(Math.random() * options.length)];
    }

    const preview1Index = index === null ? null : nextIndex([]);
    const preview2Index =
        preview1Index === null ? null : nextIndex([preview1Index]);

    const preview1 = preview1Index === null ? null : pairs[preview1Index];
    const preview2 = preview2Index === null ? null : pairs[preview2Index];

    function emojiBurst(type: FeedbackType) {
        const emojis =
            type === "up"
                ? ["❤️", "💖", "🎉", "✨", "🎈"]
                : ["😐", "🥱", "🙄"];

        const arr: BurstEmoji[] = Array.from(
            { length: type === "up" ? 14 : 6 },
            (_, i) => {
                const dir = Math.random() < 0.5 ? -1 : 1;

                return {
                    id: Date.now() + i,
                    emoji: emojis[Math.floor(Math.random() * emojis.length)],
                    x: dir * (60 + Math.random() * 180),
                    y: -(60 + Math.random() * 160),
                    rotate: dir * (15 + Math.random() * 30),
                    size: 26 + Math.random() * 16,
                    duration: 0.9 + Math.random() * 0.3,
                };
            }
        );

        setBurst(arr);
        window.setTimeout(() => setBurst([]), 1100);
    }

    function showFeedback(type: FeedbackType) {
        setFeedback(type);
        emojiBurst(type);
        window.setTimeout(() => setFeedback(null), 700);
    }

    async function vote(v: 1 | -1, triggerFeedback = true) {
        if (!current || busy) return;

        setBusy(true);

        const imgId = current.img.id;
        const capId = current.cap.id;

        setLocalCaptions((prev) => {
            const copy = { ...prev };

            copy[imgId] = (copy[imgId] ?? []).map((c) =>
                c.id === capId ? { ...c, score: c.score + v } : c
            );

            return copy;
        });

        if (triggerFeedback) {
            showFeedback(v === 1 ? "up" : "down");
        }

        setIndex(nextIndex());

        try {
            await fetch("/api/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    captionId: capId,
                    vote: v,
                }),
            });
        } finally {
            startTransition(() => router.refresh());
            setBusy(false);
        }
    }

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-250, 0, 250], [-10, 0, 10]);
    const controls = useAnimationControls();

    async function dragEnd(
        _: MouseEvent | TouchEvent | PointerEvent,
        info: { offset: { x: number }; velocity: { x: number } }
    ) {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        const right = offset > 110 || velocity > 650;
        const left = offset < -110 || velocity < -650;

        if (right) {
            showFeedback("up");

            await controls.start({
                x: 700,
                opacity: 0,
                rotate: 14,
                transition: { duration: 0.32 },
            });

            x.set(0);
            controls.set({
                x: 0,
                opacity: 1,
                rotate: 0,
            });

            void vote(1, false);
            return;
        }

        if (left) {
            showFeedback("down");

            await controls.start({
                x: -700,
                opacity: 0,
                rotate: -14,
                transition: { duration: 0.32 },
            });

            x.set(0);
            controls.set({
                x: 0,
                opacity: 1,
                rotate: 0,
            });

            void vote(-1, false);
            return;
        }

        await controls.start({
            x: 0,
            rotate: 0,
        });
    }

    if (!current) return null;

    return (
        <div style={styles.stage}>
            <div style={styles.deck}>
                {preview2 && <div style={styles.cardBack2} />}
                {preview1 && <div style={styles.cardBack1} />}

                <motion.div
                    drag="x"
                    dragElastic={0.18}
                    onDragEnd={dragEnd}
                    animate={controls}
                    style={{
                        ...styles.card,
                        x,
                        rotate,
                    }}
                >
                    <div style={styles.imageArea}>
                        <div style={styles.leftLabel}>
                            <div style={styles.sideArrow}>⬅</div>
                            <div>Swipe left</div>
                            <div>downvote</div>
                        </div>

                        <div style={styles.imgWrap}>
                            <img
                                src={current.img.url}
                                style={styles.image}
                                draggable={false}
                                alt={current.img.image_description ?? "caption image"}
                            />
                        </div>

                        <div style={styles.rightLabel}>
                            <div style={styles.sideArrow}>➡</div>
                            <div>Swipe right</div>
                            <div>upvote</div>
                        </div>
                    </div>

                    <div style={styles.captionArea}>
                        <div style={styles.scoreRow}>
                            <div style={styles.badge}>now rating</div>

                            <div style={styles.score}>
                                score {current.cap.score}
                                {isPending ? " · updating..." : ""}
                            </div>
                        </div>

                        <div style={styles.caption}>{current.cap.text}</div>
                    </div>

                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                style={styles.box}
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {feedback === "up" ? "🎁" : "📦"}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {burst.map((e) => (
                            <motion.div
                                key={e.id}
                                style={{
                                    ...styles.emoji,
                                    fontSize: e.size,
                                }}
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                    x: e.x,
                                    y: e.y,
                                    rotate: e.rotate,
                                    scale: [0.3, 1],
                                }}
                                transition={{ duration: e.duration }}
                            >
                                {e.emoji}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    stage: {
        height: "calc(100vh - 104px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 0,
    },

    deck: {
        position: "relative",
        width: "min(780px, 92vw)",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
    },

    card: {
        width: "min(780px, 92vw)",
        height: "min(640px, 72vh)",
        borderRadius: 20,
        background: "rgba(20,24,42,0.98)",
        border: "1px solid rgba(255,255,255,0.10)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 10,
        boxShadow:
            "0 0 0 1px rgba(99,102,241,0.18), 0 20px 70px rgba(0,0,0,0.62), 0 0 70px rgba(99,102,241,0.10)",
        position: "absolute",
        overflow: "hidden",
    },

    cardBack1: {
        width: "min(780px, 92vw)",
        height: "min(640px, 72vh)",
        transform: "scale(.965)",
        opacity: 0.42,
        borderRadius: 20,
        background: "rgba(28,34,58,0.95)",
        position: "absolute",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },

    cardBack2: {
        width: "min(780px, 92vw)",
        height: "min(640px, 72vh)",
        transform: "scale(.93)",
        opacity: 0.26,
        borderRadius: 20,
        background: "rgba(32,38,64,0.92)",
        position: "absolute",
        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    },

    imageArea: {
        display: "grid",
        gridTemplateColumns: "82px 1fr 82px",
        alignItems: "center",
        gap: 4,
        flex: "0 0 auto",
    },

    imgWrap: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 4,
    },

    image: {
        maxHeight: "48vh",
        width: "100%",
        objectFit: "contain",
        borderRadius: 14,
    },

    leftLabel: {
        fontSize: 18,
        fontWeight: 700,
        color: "#ff5a5a",
        textAlign: "center",
        opacity: 0.95,
        lineHeight: 1.2,
    },

    rightLabel: {
        fontSize: 18,
        fontWeight: 700,
        color: "#2ee66b",
        textAlign: "center",
        opacity: 0.95,
        lineHeight: 1.2,
    },

    sideArrow: {
        fontSize: 22,
        marginBottom: 2,
        lineHeight: 1,
    },

    captionArea: {
        marginTop: 0,
        paddingTop: 0,
    },

    caption: {
        fontSize: 20,
        fontWeight: 650,
        lineHeight: 1.3,
        color: "rgba(255,255,255,0.97)",
    },

    scoreRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 4,
        fontSize: 14,
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
    },

    badge: {
        background: "rgba(99,102,241,0.24)",
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 12,
        color: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(99,102,241,0.18)",
    },

    score: {
        opacity: 0.82,
        fontSize: 14,
        color: "rgba(255,255,255,0.88)",
    },

    box: {
        position: "absolute",
        left: "50%",
        top: "48%",
        transform: "translate(-50%,-50%)",
        fontSize: 42,
        pointerEvents: "none",
    },

    emoji: {
        position: "absolute",
        left: "50%",
        top: "48%",
        pointerEvents: "none",
    },
};