
import React from "react";
import { ASSETS, ASSET_LABELS, LEVELS } from "./gameConfig";
import { getCurrentAssetUrl } from "./graphics";

// --- Asset Status Table ---

export const AssetStatusTable = ({ missingFiles }: { missingFiles: string[] }) => {
    const getStatus = (key: string, type: 'image' | 'sound') => {
        // @ts-ignore
        const path = type === 'image' ? ASSETS.images[key] : ASSETS.sounds[key];
        const filename = path ? path.trim().split('/').pop()?.split('?')[0].trim() : "Unknown";
        // Check includes specific to key format used in loading error
        const isMissing = missingFiles.some(f => f.includes(`(Key: ${key})`));
        const label = ASSET_LABELS[key] || key.toUpperCase();
        return { label, filename, isMissing };
    };

    const images = Object.keys(ASSETS.images).map(k => getStatus(k, 'image'));
    const sounds = Object.keys(ASSETS.sounds).map(k => getStatus(k, 'sound'));
    // Sort: Missing first
    const all = [...images, ...sounds].sort((a, b) => (a.isMissing === b.isMissing ? 0 : a.isMissing ? -1 : 1));

    return (
        <div style={{ maxHeight: "200px", overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "5px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
             <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", color: "#ddd" }}>
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #555" }}>
                        <th style={{padding: "4px"}}>Asset</th>
                        <th style={{padding: "4px"}}>Expected Filename</th>
                        <th style={{padding: "4px"}}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {all.map((item, i) => (
                        <tr key={i} style={{ background: item.isMissing ? "rgba(255,0,0,0.15)" : "rgba(0,255,0,0.05)" }}>
                            <td style={{padding: "4px"}}>{item.label}</td>
                            <td style={{padding: "4px", fontFamily: "monospace", color: "#4ECDC4"}}>{item.filename}</td>
                            <td style={{padding: "4px", fontWeight: "bold", color: item.isMissing ? "#FF6B6B" : "#A8E6CF"}}>
                                {item.isMissing ? "MISSING" : "OK"}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
    );
};

// --- World Map ---

export const WorldMap = ({ currentLevel, completed }: { currentLevel: number, completed: boolean }) => {
    return (
        <div style={{ 
            display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
            padding: "20px", background: "rgba(0,0,0,0.5)", borderRadius: "15px",
            border: "2px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)"
        }}>
            <h3 style={{ color: "white", margin: 0, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #555", paddingBottom: "10px", width: "100%", textAlign: "center" }}>
                Ocean Depth Chart
            </h3>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "40px", padding: "20px" }}>
                {/* Connecting Line */}
                <div style={{ 
                    position: "absolute", left: "29px", top: "30px", bottom: "30px", width: "2px", 
                    background: "linear-gradient(to bottom, #4ECDC4, #003366)", zIndex: 0 
                }} />

                {LEVELS.map((lvl, idx) => {
                    // Logic for display state
                    let status = "locked"; 
                    if (idx < currentLevel) status = "completed";
                    else if (idx === currentLevel) status = completed ? "completed" : "current";
                    else status = "locked";
                    
                    // If we just completed the current level, the "next" visual focus is the next one
                    // But for this simple map, let's just highlight based on index
                    const isNext = completed && idx === currentLevel + 1;
                    
                    const isActive = idx === currentLevel;

                    return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "20px", zIndex: 1, opacity: status === "locked" && !isNext ? 0.5 : 1 }}>
                            {/* Node Circle */}
                            <div style={{ 
                                width: "60px", height: "60px", borderRadius: "50%", 
                                background: status === "completed" ? "#4ECDC4" : (isActive || isNext) ? lvl.bgTop : "#333",
                                border: (isActive || isNext) ? "4px solid white" : "4px solid #555",
                                display: "flex", justifyContent: "center", alignItems: "center",
                                boxShadow: (isActive || isNext) ? "0 0 15px white" : "none",
                                position: "relative",
                                transition: "all 0.5s ease"
                            }}>
                                {status === "completed" && <span style={{fontSize: "24px"}}>✓</span>}
                                {status === "locked" && !isNext && <span style={{fontSize: "24px"}}>🔒</span>}
                                {(isActive && !completed) && (
                                    <div style={{ position: "absolute", fontSize: "30px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                                        🐟
                                    </div>
                                )}
                            </div>
                            
                            {/* Text Info */}
                            <div style={{ color: "white" }}>
                                <div style={{ fontWeight: "bold", fontSize: (isActive || isNext) ? "20px" : "16px", color: (isActive || isNext) ? "#fff" : "#aaa" }}>
                                    {lvl.name}
                                </div>
                                <div style={{ fontSize: "12px", color: "#ccc" }}>
                                    Target Size: {lvl.goalSize}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Asset Card ---

export interface AssetCardProps {
    assetKey: string;
    label: string;
    onUpload: (key: string, file: File | null) => void;
    onReset: (key: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ 
    assetKey, 
    label, 
    onUpload, 
    onReset 
}) => {
    const isImage = ASSETS.images.hasOwnProperty(assetKey);
    const isAudio = ASSETS.sounds.hasOwnProperty(assetKey);
    const currentUrl = isImage ? getCurrentAssetUrl(assetKey) : null;
    
    // We don't render cards for keys that don't exist in ASSETS (safety check)
    if (!isImage && !isAudio) return null;

    return (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "white", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>{label}</div>
            <div style={{ width: "100%", height: "120px", background: "rgba(0,0,0,0.5)", borderRadius: "5px", marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                {isImage ? (
                    currentUrl ? (
                        <img src={currentUrl} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt={label} />
                    ) : (
                        <span style={{color: "#aaa", fontSize: "12px"}}>Using Default</span>
                    )
                ) : (
                    <span style={{color: "#4ECDC4", fontSize: "24px"}}>🎵</span>
                )}
            </div>
            
            <div style={{display: "flex", flexDirection: "column", gap: "5px", width: "100%"}}>
                <div style={{display: "flex", gap: "5px", width: "100%"}}>
                    <label style={{ flex: 1, cursor: "pointer", background: "#4ECDC4", color: "#000", padding: "8px", borderRadius: "5px", textAlign: "center", fontSize: "12px", fontWeight: "bold", transition: "background 0.2s" }}>
                        {isImage ? "UPLOAD IMG" : "UPLOAD MP3"}
                        <input 
                            type="file" 
                            accept={isImage ? "image/png, image/jpeg" : "audio/*"}
                            style={{ display: "none" }} 
                            onClick={(e) => (e.target as HTMLInputElement).value = ''} // allow re-uploading same file
                            onChange={(e) => onUpload(assetKey, e.target.files?.[0] || null)}
                        />
                    </label>
                    <button 
                        onClick={() => onReset(assetKey)}
                        style={{ background: "#FF6B6B", border: "none", color: "white", borderRadius: "5px", cursor: "pointer", padding: "0 10px" }}
                        title="Reset to Default"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};
