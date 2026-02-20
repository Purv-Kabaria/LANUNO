"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw, Users, Tv, Key, QrCode } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Member = { id: string; name: string; role: string };

export default function HostPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const createRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      const rid = data.roomId as string;

      const netRes = await fetch("/api/network");
      const net = await netRes.json();
      const baseUrl = net.baseUrl || (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "");
      const url = `${baseUrl}/join?room=${rid}`;

      setRoomId(rid);
      setJoinUrl(url);

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "JOIN",
            roomId: rid,
            role: "host",
            name: "Host",
            connectionId: `host_${rid}_${Date.now()}`,
          })
        );
      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "JOINED") {
          setConnectionId(msg.connectionId);
          setMembers(msg.members || []);
        }
        if (msg.type === "LOBBY_STATE") {
          setMembers(msg.members || []);
        }
      };
      socket.onerror = () => setError("WebSocket error");
      socket.onclose = () => {
        wsRef.current = null;
      };
      wsRef.current = socket;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  };

  const copyJoinUrl = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  const popIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 200, damping: 12 }
    }
  };

  if (roomId && joinUrl) {
    return (
      <main className="min-h-screen bg-background p-6 selection:bg-secondary selection:text-white">
        <motion.div
          className="mx-auto max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
            <Link href="/">
              <Button variant="outline" className="border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold">
                ← Home
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <span className="font-bold flex items-center gap-2 px-4 py-2 bg-secondary border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full text-white">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                LIVE
              </span>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            <motion.div variants={itemVariants} className="space-y-8">
              <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-card overflow-hidden">
                <div className="bg-primary p-6 border-b-4 border-foreground text-white flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-black uppercase flex items-center gap-3">
                      <QrCode className="h-10 w-10" />
                      How to Join
                    </CardTitle>
                    <CardDescription className="text-white/80 font-medium text-lg mt-2">
                      Players can scan the QR code or enter the Room ID
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="p-8 grid md:grid-cols-2 gap-8 items-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                  <motion.div variants={popIn} className="flex justify-center">
                    <div className="bg-white p-6 rounded-3xl border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <QRCodeSVG value={joinUrl} size={240} level="M" />
                    </div>
                  </motion.div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <Key className="w-6 h-6 text-accent" />
                        Room ID
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="bg-white px-6 py-4 rounded-xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-4xl font-mono font-black tracking-widest flex-1 text-center">
                          {roomId}
                        </div>
                        <Button variant="outline" className="h-[76px] w-[76px] rounded-xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-accent transition-all" onClick={copyRoomId} title="Copy room ID">
                          <Copy className="h-8 w-8" />
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full text-lg h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-secondary hover:text-white transition-all font-bold uppercase cursor-pointer" onClick={copyJoinUrl}>
                      Copy Join Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-card flex flex-col">
                <div className="bg-secondary p-6 border-b-4 border-foreground text-white">
                  <CardTitle className="text-3xl font-black uppercase flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8" />
                      Lobby
                    </div>
                    <span className="bg-white text-secondary px-3 py-1 rounded-full text-xl">
                      {members.filter(m => m.role !== "host").length}
                    </span>
                  </CardTitle>
                </div>
                <CardContent className="flex-1 p-6 overflow-hidden">
                  <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                    {members.filter(m => m.role !== "host").length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-8 text-center space-y-4">
                        <Users className="w-16 h-16 animate-pulse" />
                        <p className="text-lg font-bold">Waiting for players...</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        <AnimatePresence>
                          {members.filter(m => m.role !== "host").map((m, i) => (
                            <motion.li
                              key={m.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between rounded-xl border-4 border-foreground bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black border-2 border-foreground">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-lg">{m.name}</span>
                              </div>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-white">
      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-accent rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_4s_infinite]" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_5s_infinite_reverse]" />

        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-card relative z-10">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-24 h-24 bg-primary border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center mb-6 text-white rotate-3">
              <Tv className="w-12 h-12" />
            </div>
            <CardTitle className="text-4xl font-black uppercase">Host</CardTitle>
            <CardDescription className="text-lg font-medium mt-2">
              Generate a room code and QR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 pb-8">
            {error && (
              <div className="bg-destructive text-destructive-foreground p-3 rounded-lg border-2 border-foreground font-bold text-center">
                {error}
              </div>
            )}
            <Button
              size="lg"
              className="w-full text-xl h-16 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-primary transition-all font-black uppercase tracking-wider cursor-pointer"
              onClick={createRoom}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                "Create Room"
              )}
            </Button>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full text-lg h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-accent transition-all font-bold uppercase cursor-pointer">
                Cancel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
