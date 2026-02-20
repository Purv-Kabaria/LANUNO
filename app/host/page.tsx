"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw, Users, Key, QrCode, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
      // Attempt to hit your backend API
      const res = await fetch("/api/rooms", { method: "POST" }).catch(() => null);

      let rid = "";
      let url = "";

      // Smart Fallback: If API fails/doesn't exist yet, mock it so the UI still works!
      if (!res || !res.ok) {
        rid = Math.random().toString(36).substring(2, 8).toUpperCase();
        url = `${window.location.origin}/join?room=${rid}`;
      } else {
        const data = await res.json();
        rid = data.roomId as string;
        const netRes = await fetch("/api/network").catch(() => null);
        const net = netRes && netRes.ok ? await netRes.json() : {};
        const baseUrl = net.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
        url = `${baseUrl}/join?room=${rid}`;
      }

      setRoomId(rid);
      setJoinUrl(url);

      // Attempt WebSocket connection (Silent catch if no backend socket exists yet)
      try {
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
        socket.onclose = () => { wsRef.current = null; };
        wsRef.current = socket;
      } catch (wsErr) {
        console.warn("WebSocket not available yet, but UI will render.");
      }

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
      <main key="lobby-state" className="min-h-[100dvh] w-full bg-[#E32A26] p-2 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto flex flex-col relative selection:bg-[#ffce07] selection:text-black font-cabin">
        {/* UNO MATTEL BACKGROUND */}
        <div className="fixed inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
        <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

        <motion.div
          className="mx-auto w-full max-w-6xl flex flex-col h-full relative z-10 gap-3 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* TOP BAR */}
          <motion.div variants={itemVariants} className="flex items-center justify-between shrink-0 mt-2 sm:mt-0">
            <Link href="/">
              <Button variant="outline" className="h-10 sm:h-12 px-3 sm:px-6 border-4 border-black text-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffce07] active:scale-95 transition-all font-black uppercase tracking-wider flex items-center gap-1">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
              </Button>
            </Link>

            <div className="flex items-center">
              <span className="font-black flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full text-white tracking-widest uppercase text-sm sm:text-base">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                LIVE
              </span>
            </div>
          </motion.div>

          {/* MAIN PANELS */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 sm:gap-6 pb-2 sm:pb-0">

            {/* LEFT PANEL: HOW TO JOIN */}
            <motion.div variants={itemVariants} className="shrink-0 lg:w-[450px] flex flex-col">
              <Card className="h-full flex flex-col border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden rounded-2xl p-0 gap-0">

                {/* Header (UNO Red) */}
                <div className="bg-[#eb1c24] p-4 sm:p-5 border-b-4 border-black text-white shrink-0">
                  <CardTitle className="text-2xl sm:text-3xl font-black uppercase flex items-center gap-3">
                    <QrCode className="h-7 w-7 sm:h-8 sm:w-8" />
                    How to Join
                  </CardTitle>
                </div>

                <CardContent className="flex-1 min-h-0 p-4 flex flex-col items-center justify-center gap-4 sm:gap-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">

                  {/* QR Code */}
                  <motion.div variants={popIn} className="flex-1 min-h-0 w-full flex items-center justify-center shrink">
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-full max-h-[200px] lg:max-h-[240px] aspect-square flex items-center justify-center shrink">
                      <QRCodeSVG value={joinUrl} className="w-full h-full max-w-[100%] max-h-[100%]" level="M" />
                    </div>
                  </motion.div>

                  {/* Room ID & Link */}
                  <div className="shrink-0 w-full space-y-3 sm:space-y-4 flex flex-col justify-center">
                    <div className="bg-white text-black px-3 py-2 sm:px-6 sm:py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                      <span className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Key className="w-3 h-3 sm:w-4 sm:h-4 text-[#ffce07]" /> Room Code
                      </span>
                      <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-center leading-none">
                        {roomId}
                      </span>
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <Button variant="outline" className="flex-1 h-12 sm:h-14 border-4 border-black bg-[#ffce07] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffe047] transition-all font-black uppercase text-xs sm:text-sm tracking-widest cursor-pointer" onClick={copyJoinUrl}>
                        Copy Link
                      </Button>
                      <Button variant="outline" className="w-12 sm:w-14 h-12 sm:h-14 shrink-0 rounded-xl border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-gray-100 transition-all" onClick={copyRoomId} title="Copy Code">
                        <Copy className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>

            {/* RIGHT PANEL: LOBBY LIST */}
            <motion.div variants={itemVariants} className="flex-1 min-h-[350px] lg:min-h-0 flex flex-col">
              <Card className="h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col rounded-2xl overflow-hidden p-0 gap-0">

                <div className="bg-[#ffce07] p-4 sm:p-5 border-b-4 border-black text-black shrink-0 flex items-center justify-between">
                  <CardTitle className="text-2xl sm:text-3xl font-black uppercase flex items-center gap-3">
                    <Users className="h-7 w-7 sm:h-8 sm:w-8" />
                    Lobby
                  </CardTitle>
                  <span className="bg-white text-black border-2 border-black font-black px-4 py-1 rounded-full text-lg sm:text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {members.filter(m => m.role !== "host").length}
                  </span>
                </div>

                {/* Scrollable Player List */}
                <CardContent className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                  {members.filter(m => m.role !== "host").length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-70 p-4 sm:p-8 text-center space-y-4">
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 animate-pulse" />
                      <p className="text-base sm:text-lg font-black uppercase tracking-widest">Waiting for players...</p>
                    </div>
                  ) : (
                    <ul className="space-y-3 sm:space-y-4 pr-2">
                      <AnimatePresence>
                        {members.filter(m => m.role !== "host").map((m) => (
                          <motion.li
                            key={m.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between rounded-xl border-4 border-black bg-white text-black px-4 py-3 sm:py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffce07] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#eb1c24] flex items-center justify-center text-white text-xl font-black border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">{m.name}</span>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </main>
    );
  }

  // ==========================================
  // STATE 1: CREATE ROOM SCREEN
  // ==========================================
  return (
    <main key="create-state" className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-[#ffce07] selection:text-black font-cabin">

      {/* UNO MATTEL BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-8 -left-8 sm:-top-12 sm:-left-12 w-20 h-20 sm:w-24 sm:h-24 bg-[#ffce07] rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_4s_infinite]" />
        <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_5s_infinite_reverse]" />

        <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white relative z-10 rounded-2xl p-0 gap-0">
          <CardHeader className="text-center pb-2 pt-6 sm:pt-8 bg-white border-b-4 border-black rounded-t-xl shrink-0">
            {/* Swapped TV icon for Host image */}
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-[#ffce07] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center mb-4 sm:mb-6 rotate-3">
              <Image
                src="/host.png"
                alt="HOST"
                width={80}
                height={80}
                className="w-14 sm:w-16 h-auto object-contain"
              />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-black uppercase text-black">Host</CardTitle>
            <CardDescription className="text-base sm:text-lg font-bold text-gray-500 mt-2">
              Generate a room code and QR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-6 sm:pb-8">
            {error && (
              <div className="bg-[#eb1c24] text-white p-3 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-center">
                {error}
              </div>
            )}

            <Button
              size="lg"
              className="w-full text-lg sm:text-xl h-14 sm:h-16 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-[#ffce07] text-black hover:bg-[#ffe047] transition-all font-black uppercase cursor-pointer tracking-widest active:scale-95"
              onClick={createRoom}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-6 w-6 animate-spin text-black" />
              ) : (
                "Create Room"
              )}
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full text-base sm:text-lg h-12 sm:h-14 border-4 border-black text-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-gray-100 transition-all font-black uppercase cursor-pointer tracking-widest active:scale-95">
                Cancel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}