
import React, { useState } from "react";
import { ASSET_LABELS } from "./gameConfig";
import { AssetCard, AssetStatusTable } from "./components";
import { scanUserFolder, ScanResult } from "./scanner";
import { getMissingAssets } from "./graphics";

interface SettingsMenuProps {
    onClose: () => void;
    missingFiles: string[];
    onAssetUpload: (key: string, file: File | null) => void;
    onResetAsset: (key: string) => void;
    onAssetsChanged: () => void; // Callback to force parent to refresh state
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    onClose, 
    missingFiles, 
    onAssetUpload, 
    onResetAsset,
    onAssetsChanged 
}) => {
    const [scanStatus, setScanStatus] = useState<{msg: string, type: 'info'|'success'|'error' | null}>({msg: "", type: null});
    const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

    const handleFolderSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setScanStatus({ msg: "Scanning folder...", type: "info" });
        setLastScanResult(null);

        try {
            const result = await scanUserFolder(files);
            setLastScanResult(result);
            
            if (result.matchedCount > 0) {
                setScanStatus({ 
                    msg: `Success! Matched ${result.matchedCount} assets (${result.autoFilledCount} auto-filled).`, 
                    type: "success" 
                });
                onAssetsChanged(); // Refresh missing files list in parent
            } else {
                setScanStatus({ 
                    msg: "Found files, but couldn't match any to game assets. Check filenames or ensure they are images.", 
                    type: "error" 
                });
            }
        } catch (e) {
            setScanStatus({ msg: "Error scanning folder.", type: "error" });
            console.error(e);
        }
    };

    return (
        <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
        }}>
            <div style={{
                width: "90%", maxWidth: "1000px", height: "85%",
                background: "#222", borderRadius: "20px",
                border: "2px solid #4ECDC4",
                boxShadow: "0 0 50px rgba(78, 205, 196, 0.2)",
                display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
                {/* Header */}
                <div style={{ padding: "20px 30px", background: "#333", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ margin: 0, color: "#4ECDC4", fontSize: "2rem", textShadow: "0 2px 4px black" }}>ASSET MANAGER</h1>
                        <p style={{ margin: "5px 0 0 0", color: "#aaa", fontSize: "0.9rem" }}>Customize your game experience</p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: "#FF6B6B", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
                    >
                        CLOSE
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "30px" }}>
                    
                    {/* Folder Scanner Section */}
                    <div style={{ background: "rgba(78, 205, 196, 0.1)", border: "1px dashed #4ECDC4", borderRadius: "15px", padding: "20px", marginBottom: "30px", textAlign: "center" }}>
                        <h3 style={{ marginTop: 0, color: "white" }}>📁 Batch Import from Folder</h3>
                        <p style={{ color: "#ccc", fontSize: "0.9rem", maxWidth: "600px", margin: "0 auto 20px auto" }}>
                            Select a folder containing your PNG images. We will try to match them by name (e.g. "player.png"). 
                            If names don't match, we will automatically assign unused images to empty slots.
                        </p>
                        
                        <label style={{ 
                            display: "inline-block", background: "#4ECDC4", color: "#000", 
                            padding: "12px 30px", borderRadius: "50px", fontSize: "1.1rem", 
                            fontWeight: "bold", cursor: "pointer", transition: "transform 0.1s" 
                        }}>
                            SELECT ASSETS FOLDER
                            <input 
                                type="file" 
                                // @ts-ignore
                                webkitdirectory=""
                                directory=""
                                multiple
                                style={{ display: "none" }} 
                                onClick={(e) => (e.target as HTMLInputElement).value = ''}
                                onChange={(e) => handleFolderSelect(e.target.files)}
                            />
                        </label>

                        {/* Scan Feedback */}
                        {scanStatus.msg && (
                            <div style={{ 
                                marginTop: "20px", padding: "10px", borderRadius: "8px", 
                                background: scanStatus.type === 'error' ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.1)',
                                color: scanStatus.type === 'error' ? '#ff8888' : '#aaffaa',
                                border: `1px solid ${scanStatus.type === 'error' ? 'red' : 'green'}`
                            }}>
                                {scanStatus.msg}
                            </div>
                        )}
                        
                        {lastScanResult && lastScanResult.messages.length > 0 && (
                            <div style={{ marginTop: "10px", textAlign: "left", maxHeight: "150px", overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "5px", fontSize: "0.8rem", color: "#aaa" }}>
                                {lastScanResult.messages.map((m, i) => <div key={i}>{m}</div>)}
                            </div>
                        )}
                    </div>

                    {/* Missing Assets Warning */}
                    {missingFiles.length > 0 && (
                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ color: "#FF6B6B" }}>⚠️ Missing Assets</h3>
                            <AssetStatusTable missingFiles={missingFiles} />
                        </div>
                    )}

                    {/* Asset Grid */}
                    <h3 style={{ color: "white", borderBottom: "1px solid #444", paddingBottom: "10px" }}>Individual Assets</h3>
                    <div style={{ 
                        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginTop: "20px" 
                    }}>
                        {Object.keys(ASSET_LABELS).map((key) => (
                            <AssetCard 
                                key={key} 
                                assetKey={key} 
                                label={ASSET_LABELS[key]} 
                                onUpload={(k, f) => { onAssetUpload(k, f); onAssetsChanged(); }} 
                                onReset={(k) => { onResetAsset(k); onAssetsChanged(); }} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
