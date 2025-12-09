
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LEVELS, ASSETS } from "./gameConfig";
import { initAudio, startMusic, updateAssetAudio, loadAudioAssets, getMissingAudioAssets } from "./audio";
import { loadGraphicsAssets, getMissingAssets, updateAssetImage, resetAssetToDefault } from "./graphics";
import { Entity, Particle, FloatingText } from "./types";
import { WorldMap } from "./components";
import { updateGame, drawGame } from "./gameLoop"; 
import { SettingsMenu } from "./settings";

// --- Main Component ---

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game Flow State
  const [gameState, setGameState] = useState<"LOADING" | "MENU" | "SETTINGS" | "PLAYING" | "PAUSED" | "LEVEL_COMPLETE" | "GAMEOVER" | "VICTORY">("LOADING");
  const [level, setLevel] = useState(0); 
  const [score, setScore] = useState(0);
  const [frenzyActive, setFrenzyActive] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  // Used to force re-render when assets change
  const [assetVersion, setAssetVersion] = useState(0); 

  // Refs for Game Loop (Mutable state without re-renders)
  const playerRef = useRef<Entity>({
    id: 0, x: 0, y: 0, radius: 15, vx: 0, vy: 0, 
    color: "#FF6B6B", speed: 5, tier: 0, type: "normal", stunTimer: 0, hasShield: false
  });
  
  const enemiesRef = useRef<Entity[]>([]);
  const bubblesRef = useRef<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const keysPressed = useRef(new Set<string>());
  const inputMode = useRef<"mouse" | "keyboard">("mouse");
  
  const dashCooldownRef = useRef(0);
  const frenzyMeterRef = useRef(0);
  const lastEatTimeRef = useRef(0);
  const comboCountRef = useRef(0);

  const gameStateRef = useRef(gameState);

  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // --- Init ---
  useEffect(() => {
      const loadAll = async () => {
          // Load BOTH graphics and audio assets from folders
          await Promise.all([loadGraphicsAssets(), loadAudioAssets()]); 
          // Check for any missing files to warn the user
          setMissingFiles([...getMissingAssets(), ...getMissingAudioAssets()]);
          setGameState("MENU");
      };
      loadAll();
  }, []);

  // --- Input Setup ---
  useEffect(() => {
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      inputMode.current = "mouse";
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        inputMode.current = "mouse";
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyP") {
          const state = gameStateRef.current;
          if (state === "PLAYING") setGameState("PAUSED");
          else if (state === "PAUSED") setGameState("PLAYING");
      }
      if (e.code === "Escape") {
          const state = gameStateRef.current;
          if (["PLAYING", "PAUSED", "SETTINGS", "GAMEOVER", "VICTORY"].includes(state)) {
              setGameState("MENU");
          }
      }
      keysPressed.current.add(e.key.toLowerCase());
      inputMode.current = "keyboard";
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    const handleMouseDown = (e: MouseEvent) => {
        inputMode.current = "mouse";
        // Right click is button 2
        if (e.button === 2) {
             keysPressed.current.add("contextmenu");
        } else {
             keysPressed.current.add("click"); 
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 2) {
            keysPressed.current.delete("contextmenu");
        } else {
            keysPressed.current.delete("click");
        }
    };
    const handleContextMenu = (e: Event) => {
        // Prevent context menu appearing so we can use Right Click for skills
        e.preventDefault();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const startGame = (startLevel = 0) => {
    initAudio();
    startMusic();
    setGameState("PLAYING");
    setLevel(startLevel);
    
    if (startLevel === 0) {
        setScore(0);
        scoreRef.current = 0;
        playerRef.current.radius = 15;
    } else {
        const prevGoal = LEVELS[startLevel - 1].goalSize;
        playerRef.current.radius = prevGoal;
        const starterScore = startLevel * 1000;
        setScore(starterScore);
        scoreRef.current = starterScore;
    }
    
    // Reset Entity Positions
    playerRef.current.x = window.innerWidth / 2;
    playerRef.current.y = window.innerHeight / 2;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.stunTimer = 0;
    playerRef.current.hasShield = false;
    
    enemiesRef.current = [];
    particlesRef.current = [];
    bubblesRef.current = [];
    textsRef.current = [];
    
    dashCooldownRef.current = 0;
    frenzyMeterRef.current = 0;
    comboCountRef.current = 0;
    
    setFrenzyActive(false);
    setCombo(0);
  };

  const nextLevel = () => {
      if (level < LEVELS.length - 1) {
          startGame(level + 1);
      } else {
          setGameState("VICTORY");
      }
  };

  // --- Logic Loop ---
  const tick = () => {
    if (gameState === "PLAYING") {
        updateGame({
            canvas: canvasRef.current!,
            player: playerRef.current,
            enemies: enemiesRef.current,
            bubbles: bubblesRef.current,
            particles: particlesRef.current,
            texts: textsRef.current,
            input: {
                keys: keysPressed.current,
                mouse: mouseRef.current,
                mode: inputMode.current
            },
            refs: {
                dashCooldown: dashCooldownRef,
                frenzyMeter: frenzyMeterRef,
                comboCount: comboCountRef,
                lastEatTime: lastEatTimeRef,
                score: scoreRef
            },
            level,
            setScore,
            setCombo,
            setFrenzyActive,
            setGameState,
            setGrowthProgress
        });
    }

    drawGame({
        canvas: canvasRef.current,
        ctx: canvasRef.current?.getContext("2d"),
        gameState,
        level,
        player: playerRef.current,
        enemies: enemiesRef.current,
        bubbles: bubblesRef.current,
        particles: particlesRef.current,
        texts: textsRef.current,
        frenzyActive,
        inputMode: inputMode.current,
        mouse: mouseRef.current
    });

    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
      requestRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, level, frenzyActive, assetVersion]);

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // --- Helper Callbacks for Settings ---
  const handleAssetUpload = (key: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    const isAudio = ASSETS.sounds.hasOwnProperty(key);
    
    if (isAudio) {
        reader.onload = (e) => {
             if (e.target?.result instanceof ArrayBuffer) {
                 updateAssetAudio(key, e.target.result);
             }
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                updateAssetImage(key, e.target.result, () => {
                    setAssetVersion(v => v + 1);
                });
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleReset = (key: string) => {
      resetAssetToDefault(key, () => {
          setAssetVersion(v => v + 1);
      });
  };

  // --- UI RENDER ---

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(5px)",
    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
    zIndex: 10
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: "15px 40px", fontSize: "20px", fontWeight: "bold",
    color: "#fff", background: "linear-gradient(to bottom, #FF6B6B, #EE5253)",
    border: "2px solid white", borderRadius: "50px", cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "2px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
    transition: "transform 0.1s",
    pointerEvents: "auto",
    minWidth: "200px"
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: "'Segoe UI', sans-serif" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      
      {/* HUD */}
      {gameState === "PLAYING" && (
        <div style={{ position: "absolute", top: 10, left: 0, width: "100%", padding: "0 20px", display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
            <div style={{ color: "white", textShadow: "0 2px 4px black" }}>
                <div style={{ fontSize: "24px", fontWeight: "900" }}>SCORE: {score}</div>
                {combo > 1 && <div style={{ color: "#76ff03", fontWeight: "bold" }}>COMBO x{combo}!</div>}
            </div>
            
            <div style={{ flex: 1, maxWidth: "400px", margin: "0 20px" }}>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "bold", textShadow: "0 2px 4px black", textAlign: "center" }}>GROWTH</div>
                <div style={{ height: "16px", background: "rgba(0,0,0,0.6)", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.8)", overflow: "hidden" }}>
                    <div style={{ width: `${growthProgress * 100}%`, height: "100%", background: "linear-gradient(90deg, #FF6B6B, #FFE66D)" }} />
                </div>
            </div>

            <div style={{ width: "150px" }}>
                <div style={{ textAlign: "right", color: frenzyActive ? "#FFD700" : "white", fontWeight: "bold", textShadow: "0 2px 4px black" }}>
                    {frenzyActive ? "FRENZY!" : "FRENZY METER"}
                </div>
                <div style={{ height: "10px", background: "rgba(0,0,0,0.6)", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.4)" }}>
                     <div style={{ width: `${frenzyMeterRef.current}%`, height: "100%", background: frenzyActive ? "#FFD700" : "#4ECDC4" }} />
                </div>
            </div>
        </div>
      )}

      {/* STATES */}
      {gameState === "LOADING" && (
        <div style={overlayStyle}>
            <h1 style={{ color: "#fff" }}>Loading...</h1>
        </div>
      )}

      {gameState === "MENU" && (
        <div style={overlayStyle}>
            <h1 style={{ fontSize: "5rem", color: "#4ECDC4", textShadow: "0 4px 10px black", margin: 0 }}>OCEAN FRENZY</h1>
            <h2 style={{ color: "#fff", fontWeight: "300", marginBottom: "40px" }}>EVOLVE OR DIE</h2>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", maxWidth: "800px" }}>
                {LEVELS.map((lvl, idx) => (
                    <button 
                        key={idx}
                        onClick={() => startGame(idx)} 
                        style={{
                            ...buttonStyle,
                            fontSize: idx === 0 ? "24px" : "18px",
                            padding: idx === 0 ? "20px 50px" : "15px 30px",
                            background: idx === 0 ? "linear-gradient(to bottom, #FF6B6B, #EE5253)" : "rgba(255,255,255,0.1)",
                            border: idx === 0 ? "4px solid white" : "2px solid rgba(255,255,255,0.5)"
                        }}
                    >
                        {idx === 0 ? "PLAY GAME" : `${lvl.name}`}
                    </button>
                ))}
            </div>
            
            <div style={{ marginTop: "30px" }}>
                <button onClick={() => setGameState("SETTINGS")} style={{...buttonStyle, background: "#556270", fontSize: "16px", padding: "10px 30px"}}>SETTINGS</button>
            </div>
            
            <div style={{ marginTop: "40px", transform: "scale(0.8)" }}>
                <WorldMap currentLevel={0} completed={false} />
            </div>
        </div>
      )}

      {gameState === "SETTINGS" && (
        <SettingsMenu 
            onClose={() => {
                setGameState("MENU");
                // Refresh missing files logic when closing settings in case something changed
                setMissingFiles([...getMissingAssets(), ...getMissingAudioAssets()]);
            }}
            missingFiles={missingFiles}
            onAssetUpload={handleAssetUpload}
            onResetAsset={handleReset}
            onAssetsChanged={() => {
                setMissingFiles([...getMissingAssets(), ...getMissingAudioAssets()]);
                setAssetVersion(v => v + 1);
            }}
        />
      )}

      {gameState === "PAUSED" && (
        <div style={overlayStyle}>
            <h1 style={{ color: "#fff", letterSpacing: "5px", fontSize: "3rem", textShadow: "0 2px 4px black" }}>PAUSED</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
                 <button onClick={() => setGameState("PLAYING")} style={buttonStyle}>RESUME</button>
                 <button onClick={() => setGameState("MENU")} style={{...buttonStyle, background: "#556270"}}>EXIT TO MENU</button>
            </div>
        </div>
      )}

      {(gameState === "LEVEL_COMPLETE" || gameState === "VICTORY") && (
        <div style={overlayStyle}>
            <h1 style={{ fontSize: "4rem", color: "#FFE66D", textShadow: "0 4px 10px black" }}>
                {gameState === "VICTORY" ? "VICTORY!" : "LEVEL COMPLETE"}
            </h1>
            <div style={{ fontSize: "2rem", color: "white", marginBottom: "20px" }}>Score: {score}</div>
            
            <WorldMap currentLevel={level} completed={true} />
            
            <div style={{ marginTop: "30px", display: "flex", gap: "20px" }}>
                <button onClick={() => setGameState("MENU")} style={{...buttonStyle, background: "#556270", fontSize: "18px"}}>MENU</button>
                
                {gameState === "VICTORY" ? (
                    <button onClick={() => startGame(0)} style={buttonStyle}>PLAY AGAIN</button>
                ) : (
                    <button onClick={nextLevel} style={buttonStyle}>NEXT LEVEL</button>
                )}
            </div>
        </div>
      )}
      
      {gameState === "GAMEOVER" && (
        <div style={overlayStyle}>
            <h1 style={{ fontSize: "5rem", color: "#FF6B6B", textShadow: "0 4px 10px black" }}>GAME OVER</h1>
            <div style={{ fontSize: "2rem", color: "white", marginBottom: "30px" }}>Final Score: {score}</div>
            <div style={{ display: "flex", gap: "20px" }}>
                <button onClick={() => setGameState("MENU")} style={{...buttonStyle, background: "#556270", fontSize: "18px"}}>MENU</button>
                <button onClick={() => startGame(level)} style={buttonStyle}>TRY AGAIN</button>
            </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
