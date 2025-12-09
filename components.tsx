
import React, { useEffect, useRef } from "react";
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
        <div style={{ maxHeight: "150px", overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "5px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
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

// --- World Map (Pearl Style) ---

interface WorldMapProps {
    currentLevel: number;
    completed: boolean;
    onLevelSelect?: (levelIndex: number) => void;
}

export const WorldMap = ({ currentLevel, completed, onLevelSelect }: WorldMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to the current level on mount
        if (activeRef.current && containerRef.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, []);

    const renderZoneHeader = (idx: number) => {
        if (idx === 0) return "ZONE 1: SHALLOW REEF";
        if (idx === 4) return "ZONE 2: TWILIGHT";
        if (idx === 8) return "ZONE 3: ABYSS";
        if (idx === 12) return "ZONE 4: SHIPWRECK";
        if (idx === 16) return "ZONE 5: THE TRENCH";
        return null;
    };

    return (
        <div style={{ 
            display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
            padding: "15px", background: "rgba(0, 20, 40, 0.8)", borderRadius: "20px",
            border: "4px double rgba(78, 205, 196, 0.5)", backdropFilter: "blur(10px)",
            width: "100%", maxWidth: "500px", height: "60vh", maxHeight: "600px", overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
            <h3 style={{ 
                color: "#4ECDC4", margin: 0, textTransform: "uppercase", letterSpacing: "3px", 
                borderBottom: "1px solid #444", paddingBottom: "10px", width: "100%", textAlign: "center",
                textShadow: "0 0 10px rgba(78, 205, 196, 0.5)"
            }}>
                Ocean Map
            </h3>
            
            <div 
                ref={containerRef}
                style={{ 
                    position: "relative", display: "flex", flexDirection: "column", gap: "0px", 
                    padding: "20px 20px", width: "100%", overflowY: "auto", scrollbarWidth: "thin",
                    alignItems: "center"
                }}
            >
                {/* String for the Pearls */}
                <div style={{ 
                    position: "absolute", left: "50%", transform: "translateX(-50%)", top: "20px", bottom: "20px", width: "2px", 
                    background: "rgba(255,255,255,0.3)", zIndex: 0 
                }} />

                {LEVELS.map((lvl, idx) => {
                    const status = idx < currentLevel ? "completed" : (idx === currentLevel ? (completed ? "completed" : "current") : "locked");
                    const isNext = completed && idx === currentLevel + 1;
                    const isActive = idx === currentLevel;
                    const canPlay = onLevelSelect && (status !== "locked" || isNext || idx === 0);
                    const zoneTitle = renderZoneHeader(idx);

                    // Pearl Styling
                    let pearlBackground = "radial-gradient(circle at 30% 30%, #555, #222)"; // Locked (Dark Grey)
                    if (status === "completed") {
                        pearlBackground = "radial-gradient(circle at 30% 30%, #4ECDC4, #2A9D8F)"; // Completed (Teal)
                    } else if (isActive || isNext) {
                         // Current (Theme color + Shine)
                        pearlBackground = `radial-gradient(circle at 30% 30%, #fff, ${lvl.bgTop}, ${lvl.bgBottom})`; 
                    }

                    const pearlSize = (isActive || isNext) ? "50px" : "40px";
                    const pearlGlow = (isActive || isNext) ? "0 0 15px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(0,0,0,0.3)" : "inset -2px -2px 5px rgba(0,0,0,0.5), 0 5px 10px rgba(0,0,0,0.3)";

                    return (
                        <div key={idx} ref={isActive ? activeRef : null} style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            
                            {zoneTitle && (
                                <div style={{ 
                                    color: "#FFD700", fontSize: "12px", fontWeight: "bold", 
                                    margin: "20px 0 10px 0", letterSpacing: "1px", textShadow: "0 1px 2px black",
                                    background: "rgba(0,0,0,0.5)", padding: "2px 10px", borderRadius: "10px"
                                }}>
                                    {zoneTitle}
                                </div>
                            )}

                            <div 
                                onClick={() => canPlay && onLevelSelect && onLevelSelect(idx)}
                                style={{ 
                                    display: "flex", alignItems: "center", gap: "15px", 
                                    opacity: status === "locked" && !isNext ? 0.5 : 1,
                                    padding: "8px 0",
                                    cursor: canPlay ? "pointer" : "default",
                                    transition: "transform 0.2s",
                                    width: "100%",
                                    justifyContent: "center"
                                }}
                                onMouseEnter={(e) => canPlay && (e.currentTarget.style.transform = "scale(1.05)")}
                                onMouseLeave={(e) => canPlay && (e.currentTarget.style.transform = "scale(1)")}
                            >
                                {/* Left Side Info (Alternating layout could be cool, but sticking to centered for string effect) */}
                                <div style={{ flex: 1, textAlign: "right", fontSize: "14px", color: (isActive||isNext) ? "#fff" : "#888", fontWeight: "bold" }}>
                                    {lvl.name}
                                </div>

                                {/* Pearl Node */}
                                <div style={{ 
                                    width: pearlSize, height: pearlSize, borderRadius: "50%", 
                                    background: pearlBackground,
                                    boxShadow: pearlGlow,
                                    display: "flex", justifyContent: "center", alignItems: "center",
                                    fontSize: "16px",
                                    flexShrink: 0,
                                    border: (isActive || isNext) ? "2px solid white" : "none",
                                    color: (status === "locked" && !isNext) ? "#888" : "#fff",
                                    fontWeight: "bold",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                                }}>
                                    {status === "completed" && "✓"}
                                    {status === "locked" && !isNext && (idx + 1)}
                                    {(isActive && !completed) && (idx + 1)}
                                    {isNext && "▶"}
                                </div>

                                {/* Right Side Info */}
                                <div style={{ flex: 1, textAlign: "left", fontSize: "11px", color: "#666" }}>
                                    Target: {lvl.goalSize}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
             {onLevelSelect && <div style={{marginTop: "10px", fontSize: "10px", color: "#aaa", textTransform: "uppercase"}}>Scroll & Click to Play</div>}
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
    
    if (!isImage && !isAudio) return null;

    return (
        <div style={{ 
            background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px", 
            display: "flex", flexDirection: "column", alignItems: "center",
            border: "1px solid rgba(255,255,255,0.05)"
        }}>
            <div style={{ color: "#ddd", fontWeight: "bold", fontSize: "12px", marginBottom: "8px", textAlign: "center", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {label}
            </div>
            
            <div style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", marginBottom: "8px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                {isImage ? (
                    currentUrl ? (
                        <img src={currentUrl} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt={label} />
                    ) : (
                        <span style={{color: "#666", fontSize: "10px"}}>Default</span>
                    )
                ) : (
                    <span style={{color: "#4ECDC4", fontSize: "20px"}}>🎵</span>
                )}
            </div>
            
            <div style={{display: "flex", gap: "5px", width: "100%"}}>
                <label style={{ 
                    flex: 1, cursor: "pointer", background: "#4ECDC4", color: "#000", 
                    padding: "6px 0", borderRadius: "4px", textAlign: "center", 
                    fontSize: "11px", fontWeight: "bold", transition: "background 0.2s" 
                }}>
                    UPLOAD
                    <input 
                        type="file" 
                        accept={isImage ? "image/png, image/jpeg" : "audio/*"}
                        style={{ display: "none" }} 
                        onClick={(e) => (e.target as HTMLInputElement).value = ''}
                        onChange={(e) => onUpload(assetKey, e.target.files?.[0] || null)}
                    />
                </label>
                <button 
                    onClick={() => onReset(assetKey)}
                    style={{ background: "#FF6B6B", border: "none", color: "white", borderRadius: "4px", cursor: "pointer", padding: "0 8px", fontSize: "12px" }}
                    title="Reset to Default"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
