"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ControllerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (searchParams.get("room") ?? "").toUpperCase();
  const name = decodeURIComponent(searchParams.get("name") || "Player");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);

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
    };

    socket.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    socket.onerror = () => {
      setConnected(false);
      wsRef.current = null;
    };

    wsRef.current = socket;
  }, [roomId, name]);

  const handleLeave = useCallback(() => {
    console.log("[Controller] Initiating Leave Sequence");
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
      // Give a tiny window for packet to leave buffer
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
    if (roomId) {
      // Small delay to ensure playerIdRef is set
      const timer = setTimeout(() => connect(), 100);
      return () => clearTimeout(timer);
    }
  }, [connect, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
        }
        wsRef.current.close();
      }
    };
  }, [roomId]);

  if (!roomId) {
    return (
      <main className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 -mt-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <Card className="max-w-sm md:max-w-md w-full border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center pb-4">
            <CardHeader className="bg-destructive text-destructive-foreground border-b-4 border-foreground pb-6">
              <div className="mx-auto w-16 h-16 bg-white border-4 border-foreground rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 shrink-0">
                <WifiOff className="w-8 h-8 text-foreground" />
              </div>
              <CardTitle className="text-3xl font-black uppercase">No Room</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-foreground/80 font-bold mb-6 text-lg">
                Ask host for access code.
              </p>
              <Button className="w-full h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-primary uppercase font-black text-lg transition-all cursor-pointer" onClick={() => router.push("/join")}>
                Try To Join
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm md:max-w-md relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-card overflow-hidden">
          <CardHeader className={`border-b-4 border-foreground transition-colors duration-500 ease-in-out ${connected ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            <CardTitle className="flex items-center justify-between text-2xl font-black uppercase">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-8 h-8" />
                <span>{name}</span>
              </div>
              <motion.div
                animate={{ scale: connected ? [1, 1.2, 1] : 1 }}
                transition={{ repeat: connected ? Infinity : 0, duration: 2 }}
              >
                {connected ? <Wifi className="w-8 h-8 opacity-90" /> : <WifiOff className="w-8 h-8 opacity-90" />}
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="flex flex-col items-center justify-center p-6 border-4 border-foreground rounded-2xl bg-white shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)] text-center min-h-[160px]">
              <AnimatePresence mode="wait">
                {connected ? (
                  <motion.div
                    key="connected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="inline-flex items-center justify-center px-4 py-2 border-4 border-foreground rounded-full bg-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-accent-foreground font-black text-xl tracking-widest mb-2">
                      {roomId}
                    </div>
                    <p className="font-bold text-lg leading-tight uppercase text-foreground">
                      Ready & Waiting<br />for Host
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="disconnected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="w-12 h-12 mx-auto border-4 border-foreground border-r-transparent rounded-full animate-spin text-primary" />
                    <p className="font-black text-lg uppercase text-muted-foreground animate-pulse">
                      Reconnecting...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              {!connected && (
                <Button
                  className="w-full h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-accent font-black uppercase text-lg transition-all cursor-pointer"
                  onClick={connect}
                >
                  Force Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-destructive hover:text-white font-black uppercase text-lg transition-all cursor-pointer"
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
