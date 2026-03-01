import UploadPanel from "@/app/components/UploadPanel";
import NavTabs from "@/app/components/NavTabs";


export default function UploadPage() {
    return (
        <div style={{ padding: 28, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "min(1100px, 95vw)" }}>
                <NavTabs />
                <UploadPanel />
            </div>
        </div>
    );
}