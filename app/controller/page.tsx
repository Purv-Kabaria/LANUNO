"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

function ControllerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (searchParams.get("room") ?? "").toUpperCase();
  const name = decodeURIComponent(searchParams.get("name") || "Player");
  const [connected, setConnected] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [hand, setHand] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize unique identity (Distributed Computing: Unique Node ID)
  useEffect(() => {
    let pid = localStorage.getItem("uno_player_id");
    if (!pid) {
      pid = `p_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem("uno_player_id", pid);
    }
    playerIdRef.current = pid;
  }, []);

  const connect = useCallback(() => {
    if (!roomId || !playerIdRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws`);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "JOIN",
          roomId,
          role: "player",
          name: name || "Player",
          playerId: playerIdRef.current,
          connectionId: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        })
      );
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.type === "JOINED") setConnected(true);
      if (msg.type === "ERROR") setConnected(false);

      // Respond to Latency Tester pings from Host
      if (msg.type === "PLAYER_PING" && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "PLAYER_PONG",
          to: msg.from,
          clientTime: msg.clientTime
        }));
      }

      // Retrieve Game Started triggers
      if (msg.type === "GAME_STARTED") {
        setInGame(true);
        if (msg.hand) setHand(msg.hand);
      }
    };

    socket.onclose = () => {
      wsRef.current = null;
      setConnected(false);
      if (!isCancelledRef.current) {
        console.log("Player socket closed. Reconnecting...");
        reconnectTimerRef.current = setTimeout(connect, 1000);
      }
    };

    socket.onerror = () => {
      wsRef.current = null;
      setConnected(false);
    };

    wsRef.current = socket;
  }, [roomId, name]);

  const handleLeave = useCallback(() => {
    console.log("[Controller] Initiating Leave Sequence");
    isCancelledRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
      setTimeout(() => {
        if (wsRef.current) wsRef.current.close();
        router.push("/");
      }, 50);
    } else {
      router.push("/");
    }
    setConnected(false);
  }, [roomId, router]);

  useEffect(() => {
    isCancelledRef.current = false;
    if (roomId) {
      const timer = setTimeout(() => connect(), 100);
      return () => clearTimeout(timer);
    }
  }, [connect, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId]);

  if (!roomId) {
    return (
      <main className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden relative selection:bg-[#ffce07] selection:text-black">
        {/* --- UNO MATTEL BACKGROUND --- */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Added isolate and p-0 gap-0 to aggressively clip background bleed */}
          <Card className="w-full border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl text-center overflow-hidden p-0 gap-0 isolate">
            {/* Swapped Black header to UNO Red */}
            <CardHeader className="bg-[#eb1c24] m-0 text-white border-b-4 border-black pb-6 pt-6 rounded-t-xl">
              <div className="mx-auto w-16 h-16 bg-[#ffce07] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center mb-4 shrink-0 -rotate-3">
                <WifiOff className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">No Room</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <p className="text-gray-600 font-bold mb-6 text-lg sm:text-xl">
                Ask host for access code.
              </p>
              <Button className="w-full h-14 border-4 border-black bg-[#ffce07] text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffe047] uppercase font-black tracking-widest text-lg transition-all active:scale-95 cursor-pointer" onClick={() => router.push("/join")}>
                Try To Join
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden relative selection:bg-[#ffce07] selection:text-black">

      {/* --- UNO MATTEL BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="w-full max-w-sm md:max-w-md relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffce07] rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_4s_infinite]" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_5s_infinite_reverse]" />

        {/* Isolate and rigid p-0 added to force proper rounded clipping on mobile Safari/Chrome */}
        <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden rounded-2xl flex flex-col max-h-[90vh] p-0 gap-0 isolate">

          {/* Header toggles strictly between UNO Yellow (Connected) and UNO Red (Disconnected) */}
          <CardHeader className={`m-0 border-b-4 border-black transition-colors duration-500 ease-in-out py-5 px-6 shrink-0 rounded-t-xl ${connected ? 'bg-[#ffce07] text-black' : 'bg-[#eb1c24] text-white'}`}>
            <CardTitle className="flex items-center justify-between text-2xl sm:text-3xl font-black uppercase tracking-wide">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 -rotate-3 ${connected ? 'bg-[#eb1c24]' : 'bg-[#ffce07]'}`}>
                  <Image
                    src="/title.png"
                    alt="Player"
                    width={40}
                    height={40}
                    // Using brightness/invert CSS filters to make the PNG white when the background is red
                    className={`w-8 h-8 object-contain`}
                  />
                </div>
                <span className="truncate max-w-[150px]">{name}</span>
              </div>

              <motion.div
                animate={{ scale: connected ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: connected ? Infinity : 0, duration: 2 }}
                className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 ${connected ? 'bg-white text-black' : 'bg-white text-[#eb1c24]'}`}
              >
                {connected ? <Wifi className="w-6 h-6 stroke-[3px]" /> : <WifiOff className="w-6 h-6 stroke-[3px]" />}
              </motion.div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] custom-scrollbar">
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-4 border-black rounded-2xl bg-white shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)] text-center min-h-[180px]">
              <AnimatePresence mode="wait">
                {inGame ? (
                  <motion.div
                    key="ingame"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-full h-full flex flex-col"
                  >
                    <div className="font-black text-xl uppercase tracking-widest text-[#eb1c24] mb-3">Your Cards</div>
                    <div className="relative flex justify-center items-center h-[200px] sm:h-[240px] w-full mt-2">
                      {[...hand].sort((a, b) => {
                        const colorOrder: Record<string, number> = { "Red": 1, "Blue": 2, "Green": 3, "Yellow": 4, "Wild": 5 };
                        if (colorOrder[a.color] !== colorOrder[b.color]) {
                          return (colorOrder[a.color] || 99) - (colorOrder[b.color] || 99);
                        }
                        return String(a.value).localeCompare(String(b.value));
                      }).map((card, idx, arr) => {
                        const total = arr.length;
                        const maxSpread = 60; // Max angle difference
                        const angle = total > 1 ? (idx - (total - 1) / 2) * (maxSpread / (total - 1)) : 0;
                        const baseOffsetY = 20; // push down baseline slightly
                        const archY = Math.abs(angle) * 0.5; // arc shape
                        const yOffset = baseOffsetY + archY;
                        const xOffset = total > 1 ? (idx - (total - 1) / 2) * 25 : 0;

                        return (
                          <div
                            key={card.id || idx}
                            className="absolute origin-bottom cursor-pointer hover:-translate-y-6 hover:scale-110 hover:z-50 transition-all duration-300 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] hover:drop-shadow-[6px_6px_0_rgba(0,0,0,0.6)]"
                            style={{
                              transform: `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${angle}deg)`,
                              zIndex: idx,
                            }}
                          >
                            {/* ADDED: rounded-[6px] sm:rounded-[8px] and overflow-hidden to clip the corners */}
                            <div className="w-[72px] sm:w-[88px] aspect-[2/3] relative flex items-center justify-center pointer-events-none rounded-[6px] sm:rounded-[8px] overflow-hidden bg-white">
                              {/* CHANGED: object-contain to object-fill to ensure the image hits the clipped edges */}
                              <Image
                                src={`/cards/${card.image}`}
                                alt={`${card.color} ${card.value}`}
                                fill
                                className="object-fill"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : connected ? (
                  <motion.div
                    key="connected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Swapped Black tag for UNO Red tag */}
                    <div className="inline-flex items-center justify-center px-6 py-2 border-4 border-black rounded-xl bg-[#eb1c24] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono font-black text-2xl tracking-widest mb-2">
                      {roomId}
                    </div>
                    <p className="font-black text-xl sm:text-2xl uppercase tracking-wider text-black">
                      Ready & Waiting<br />for Host
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="disconnected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Spinner changed to UNO Yellow to pop inside the content area */}
                    <div className="w-14 h-14 mx-auto border-[6px] border-black border-r-transparent rounded-full animate-spin text-[#ffce07]" />
                    <p className="font-black text-xl sm:text-2xl uppercase tracking-widest text-gray-500 animate-pulse">
                      Reconnecting...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4 pt-2">
              {!connected && (
                <Button
                  className="w-full h-14 sm:h-16 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-[#ffce07] hover:bg-[#ffe047] text-black font-black tracking-widest uppercase text-lg sm:text-xl transition-all active:scale-95 cursor-pointer"
                  onClick={connect}
                >
                  Force Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full h-12 sm:h-14 border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#eb1c24] hover:text-white font-black tracking-widest uppercase text-base sm:text-lg transition-all active:scale-95 cursor-pointer"
                onClick={handleLeave}
              >
                Exit Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function ControllerWrapper() {
  return (
    <Suspense fallback={
      <main className="h-[100dvh] flex items-center justify-center bg-[#E32A26]">
        <div className="w-16 h-16 border-8 border-black border-t-[#ffce07] rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
      </main>
    }>
      <ControllerContent />
    </Suspense>
  );
}