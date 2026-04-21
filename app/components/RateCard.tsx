"use client";

import {
    useEffect,
    useMemo,
    useRef,
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
    const [burst, setBurst] = useState<BurstEmoji[]>([]);
    const [isPending, startTransition] = useTransition();

    const isDraggingRef = useRef(false);
    const lastBurstAtRef = useRef(0);

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

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-250, 0, 250], [-10, 0, 10]);
    const likeOpacity = useTransform(x, [30, 130], [0, 1]);
    const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
    const controls = useAnimationControls();

    function triggerBurst(dir: "left" | "right") {
        const now = Date.now();
        const emojis =
            dir === "right"
                ? ["❤️", "💖", "💕", "💝", "😍", "🥰", "✨"]
                : ["👎", "😂", "💀", "😐", "🙄", "😑", "😬"];
        setBurst(
            Array.from({ length: 18 }, (_, i) => {
                const side = Math.random() < 0.5 ? -1 : 1;
                return {
                    id: now + i,
                    emoji: emojis[Math.floor(Math.random() * emojis.length)],
                    x: side * (80 + Math.random() * 380),
                    y: -(80 + Math.random() * 340),
                    rotate: side * (10 + Math.random() * 45),
                    size: 36 + Math.random() * 32,
                    duration: 0.75 + Math.random() * 0.4,
                };
            })
        );
        window.setTimeout(() => setBurst([]), 1100);
    }

    // Real-time emoji burst while dragging
    useEffect(() => {
        const unsubscribe = x.on("change", (latest) => {
            if (!isDraggingRef.current) return;
            const now = Date.now();
            if (now - lastBurstAtRef.current < 140) return;

            let dir: "left" | "right" | null = null;
            if (latest > 50) dir = "right";
            else if (latest < -50) dir = "left";
            if (!dir) return;

            lastBurstAtRef.current = now;
            triggerBurst(dir);
        });
        return unsubscribe;
    }, [x]);

    async function like() {
        if (!current || busy) return;
        setBusy(true);

        const imgId = current.img.id;
        const capId = current.cap.id;

        setLocalCaptions((prev) => {
            const copy = { ...prev };
            copy[imgId] = (copy[imgId] ?? []).map((c) =>
                c.id === capId ? { ...c, score: c.score + 1 } : c
            );
            return copy;
        });

        setIndex(nextIndex());

        try {
            await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ captionId: capId, vote: 1 }),
            });
        } finally {
            startTransition(() => router.refresh());
            setBusy(false);
        }
    }

    function pass() {
        if (busy) return;
        setIndex(nextIndex());
    }

    async function swipeRight() {
        if (busy) return;
        triggerBurst("right");
        await controls.start({ x: 700, opacity: 0, rotate: 14, transition: { duration: 0.32 } });
        x.set(0);
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        void like();
    }

    async function swipeLeft() {
        if (busy) return;
        triggerBurst("left");
        await controls.start({ x: -700, opacity: 0, rotate: -14, transition: { duration: 0.32 } });
        x.set(0);
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        pass();
    }

    async function dragEnd(
        _: MouseEvent | TouchEvent | PointerEvent,
        info: { offset: { x: number }; velocity: { x: number } }
    ) {
        isDraggingRef.current = false;
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 110 || velocity > 650) { void swipeRight(); return; }
        if (offset < -110 || velocity < -650) { void swipeLeft(); return; }

        await controls.start({ x: 0, rotate: 0 });
    }

    if (!current) return null;

    return (
        <div style={styles.stage}>
            <div style={styles.deckRow}>
                {/* Left arrow — not so funny */}
                <div style={{ ...styles.arrowSide, cursor: "pointer" }} onClick={() => void swipeLeft()}>
                    <span style={styles.arrowIconLeft}>←</span>
                    <span style={{ ...styles.arrowLabel, color: "#f472b6" }}>
                        not so<br />funny
                    </span>
                </div>

                {/* Card deck */}
                <div style={styles.deck}>
                    {preview2 && <div style={styles.cardBack2} />}
                    {preview1 && <div style={styles.cardBack1} />}

                    <motion.div
                        drag="x"
                        dragElastic={0.18}
                        onDragStart={() => { isDraggingRef.current = true; }}
                        onDragEnd={dragEnd}
                        animate={controls}
                        style={{ ...styles.card, x, rotate }}
                    >
                        <motion.div style={{ ...styles.stamp, ...styles.likeStamp, opacity: likeOpacity }}>
                            FUNNY ❤️
                        </motion.div>
                        <motion.div style={{ ...styles.stamp, ...styles.nopeStamp, opacity: nopeOpacity }}>
                            👎 NOT FUNNY
                        </motion.div>

                        <div style={styles.imgWrap}>
                            <img
                                src={current.img.url}
                                style={styles.image}
                                draggable={false}
                                alt={current.img.image_description ?? "caption image"}
                            />
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
                    </motion.div>

                    {/* Emoji burst layer — outside the card so emojis aren't clipped */}
                    <div style={styles.burstLayer}>
                        <AnimatePresence>
                            {burst.map((e) => (
                                <motion.div
                                    key={e.id}
                                    style={{ ...styles.burstEmoji, fontSize: e.size }}
                                    initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                                    animate={{
                                        opacity: [0, 1, 1, 0],
                                        x: e.x,
                                        y: e.y,
                                        rotate: e.rotate,
                                        scale: [0.3, 1.15],
                                    }}
                                    transition={{ duration: e.duration }}
                                >
                                    {e.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right arrow — funny */}
                <div style={{ ...styles.arrowSide, cursor: "pointer" }} onClick={() => void swipeRight()}>
                    <span style={styles.arrowIconRight}>→</span>
                    <span style={{ ...styles.arrowLabel, color: "#34d399" }}>funny</span>
                </div>
            </div>

        </div>
    );
}

const CARD_W = "min(780px, 92vw)";
const CARD_H = "min(640px, 72vh)";

const styles: Record<string, CSSProperties> = {
    stage: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 6,
        marginTop: -5,
    },

    deckRow: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        gap: 8,
    },

    arrowSide: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: 88,
        flexShrink: 0,
        userSelect: "none",
    },

    arrowIconLeft: {
        fontSize: 68,
        fontWeight: 900,
        color: "#f472b6",
        lineHeight: 1,
        textShadow: "0 0 14px rgba(244,114,182,0.4)",
    },

    arrowIconRight: {
        fontSize: 68,
        fontWeight: 900,
        color: "#34d399",
        lineHeight: 1,
        textShadow: "0 0 14px rgba(52,211,153,0.4)",
    },

    arrowLabel: {
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
        opacity: 0.85,
        lineHeight: 1.35,
    },

    deck: {
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        flexShrink: 0,
    },

    card: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(28px) saturate(140%)",
        WebkitBackdropFilter: "blur(28px) saturate(140%)",
        border: "1px solid rgba(120,175,255,0.5)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 10,
        boxShadow:
            "0 20px 60px rgba(60,120,220,0.13), inset 0 1px 0 rgba(255,255,255,0.9)",
        position: "absolute",
        overflow: "hidden",
        cursor: "grab",
    },

    cardBack1: {
        width: CARD_W,
        height: CARD_H,
        transform: "scale(.965)",
        opacity: 0.65,
        borderRadius: 24,
        background: "rgba(230, 243, 255, 0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(120,175,255,0.35)",
        position: "absolute",
        boxShadow: "0 10px 28px rgba(60,120,220,0.09)",
    },

    cardBack2: {
        width: CARD_W,
        height: CARD_H,
        transform: "scale(.93)",
        opacity: 0.4,
        borderRadius: 24,
        background: "rgba(220, 238, 255, 0.60)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(120,175,255,0.25)",
        position: "absolute",
        boxShadow: "0 6px 20px rgba(60,120,220,0.07)",
    },

    burstLayer: {
        position: "fixed",
        left: "50%",
        top: "50%",
        pointerEvents: "none",
        zIndex: 9999,
    },

    burstEmoji: {
        position: "absolute",
        pointerEvents: "none",
    },

    stamp: {
        position: "absolute",
        top: 24,
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: 1.5,
        borderRadius: 8,
        padding: "6px 16px",
        zIndex: 10,
        pointerEvents: "none",
        border: "3px solid",
        textTransform: "uppercase",
    },

    likeStamp: {
        right: 24,
        color: "#16a34a",
        borderColor: "#16a34a",
        transform: "rotate(10deg)",
    },

    nopeStamp: {
        left: 24,
        color: "#f472b6",
        borderColor: "#f472b6",
        transform: "rotate(-10deg)",
    },

    imgWrap: {
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        minHeight: 0,
    },

    image: {
        maxHeight: "100%",
        maxWidth: "100%",
        objectFit: "contain",
        borderRadius: 14,
        userSelect: "none",
    },

    captionArea: {
        flexShrink: 0,
        paddingTop: 4,
    },

    caption: {
        fontSize: 20,
        fontWeight: 650,
        lineHeight: 1.3,
        color: "#1a3a5c",
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
        background: "rgba(96,165,250,0.18)",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        color: "#1d4ed8",
        border: "1px solid rgba(96,165,250,0.45)",
    },

    score: {
        fontSize: 14,
        color: "#6a9cbf",
    },

};
