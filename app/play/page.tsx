"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, ArrowLeft, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Member = { id: string; name: string; role: string; playerId: string };

function PlayContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomId = (searchParams.get("room") ?? "").toUpperCase();
    const role = searchParams.get("role") || "player";
    const name = decodeURIComponent(searchParams.get("name") || (role === "host" ? "Host" : "Player"));

    const [members, setMembers] = useState<Member[]>([]);
    const [actions, setActions] = useState<Record<string, string>>({});
    const [connected, setConnected] = useState(false);
    const [topCard, setTopCard] = useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const playerIdRef = useRef<string | null>(null);

    useEffect(() => {
        let pid = localStorage.getItem("uno_player_id");
        if (!pid) {
            pid = `p_${Math.random().toString(36).slice(2, 11)}`;
            localStorage.setItem("uno_player_id", pid);
        }
        playerIdRef.current = pid;
    }, []);

    useEffect(() => {
        if (!roomId) return;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const socket = new WebSocket(`${protocol}//${host}/ws`);

        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: "JOIN",
                    roomId,
                    role,
                    name,
                    playerId: playerIdRef.current,
                    connectionId: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                })
            );
        };

        socket.addEventListener("message", (e) => {
            const msg = JSON.parse(e.data as string);
            if (msg.type === "JOINED") {
                setConnected(true);
                setMembers(msg.members || []);
            }
            if (msg.type === "LOBBY_STATE") {
                setMembers(msg.members || []);
            }
            if (msg.type === "GAME_STARTED") {
                if (msg.topCard) setTopCard(msg.topCard);
            }
            if (msg.type === "PLAYER_ACTION") {
                setActions(prev => ({ ...prev, [msg.connectionId]: msg.action }));
            }
            if (msg.type === "ERROR") {
                setConnected(false);
            }
        });

        socket.addEventListener("close", () => {
            setConnected(false);
            wsRef.current = null;
        });

        wsRef.current = socket;

        return () => {
            if (wsRef.current) {
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
                }
                wsRef.current.close();
            }
        };
    }, [roomId, role, name]);

    const handleExit = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "LEAVE", roomId }));
        }
        router.push("/");
    };

    if (!roomId) {
        return (
            <main className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-4 selection:bg-[#ffce07] selection:text-black">
                <Card className="w-full max-w-sm border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl text-center overflow-hidden p-0 isolate">
                    <CardHeader className="bg-[#eb1c24] text-white border-b-4 border-black pb-6 pt-6">
                        <CardTitle className="text-3xl font-black uppercase text-white tracking-wide">Error</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 px-6 pb-6">
                        <p className="text-gray-600 font-bold mb-6 text-lg">No room code provided.</p>
                        <Button className="w-full h-14 border-4 border-black bg-[#ffce07] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffe047] uppercase font-black tracking-widest text-lg transition-all active:scale-95" onClick={() => router.push("/")}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] w-full bg-[#E32A26] p-4 md:p-8 flex flex-col relative selection:bg-[#ffce07] selection:text-black font-cabin overflow-x-hidden overflow-y-auto">
            {/* UNO MATTEL BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
            <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

            <motion.div
                className="w-full max-w-4xl mx-auto relative z-10 flex flex-col gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
            >
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={handleExit} className="h-10 sm:h-12 px-4 sm:px-6 border-4 border-black text-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffce07] active:scale-95 transition-all font-black uppercase tracking-wider flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> Exit
                    </Button>

                    <div className="bg-black text-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full font-black flex items-center gap-2 tracking-widest uppercase text-sm sm:text-base">
                        {!connected && <WifiOff className="w-4 h-4 text-[#eb1c24]" />}
                        {connected ? "LIVE" : "DISCONNECTED"}
                    </div>
                </div>

                <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col rounded-2xl overflow-hidden p-0 gap-0">
                    <div className="bg-[#00c3e3] p-5 sm:p-6 border-b-4 border-black text-black flex items-center justify-between shrink-0">
                        <CardTitle className="text-3xl sm:text-4xl font-black uppercase flex items-center gap-3 tracking-wide">
                            <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10" />
                            Game Arena
                        </CardTitle>
                        <div className="bg-white px-4 py-2 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                            <span className="font-bold text-gray-500 uppercase text-xs tracking-widest">Room </span>
                            <span className="font-mono font-black text-xl">{roomId}</span>
                        </div>
                    </div>
                    <CardContent className="p-6 sm:p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] min-h-[400px]">
                        <div className="bg-white border-4 border-black shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)] rounded-xl p-4 sm:p-6 h-full flex flex-col">
                            {topCard && (
                                <div className="flex flex-col items-center justify-center mb-6 pt-4">
                                    <div className="font-black text-xl uppercase tracking-widest text-[#eb1c24] mb-3">Top Card</div>
                                    <div className="w-32 sm:w-40 aspect-[2/3] drop-shadow-[6px_6px_0_rgba(0,0,0,1)] relative flex items-center justify-center">
                                        <Image src={`/cards/${topCard.image}`} alt={`${topCard.color} ${topCard.value}`} fill className="object-contain" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4 pb-4 border-b-4 border-gray-100">
                                <span className="font-black text-xl sm:text-2xl uppercase tracking-widest flex items-center gap-2 text-black">
                                    <Users className="w-6 h-6 text-[#eb1c24]" /> Active Players
                                </span>
                                <span className="bg-[#ffce07] text-black border-2 border-black font-black px-4 py-1 rounded-full text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {members.filter(m => m.role !== 'host').length}
                                </span>
                            </div>

                            {members.filter(m => m.role !== 'host').length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 space-y-4">
                                    <div className="w-16 h-16 border-[6px] border-black border-r-transparent rounded-full animate-spin text-[#ffce07]" />
                                    <p className="font-black uppercase tracking-widest text-lg">Waiting for players...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence>
                                        {members.filter(m => m.role !== 'host').map((m) => (
                                            <motion.div
                                                key={m.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ type: "spring", bounce: 0.4 }}
                                                className={`flex items-center justify-between p-4 rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffce07] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#eb1c24] text-white">
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-black text-lg uppercase tracking-wide truncate max-w-[120px]">{m.name}</span>
                                                </div>
                                                {actions[m.id] && (
                                                    <span className={`text-sm font-black text-white px-3 py-1.5 rounded-lg uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${actions[m.id] === 'A' ? 'bg-[#eb1c24]' : 'bg-[#00c3e3] text-black'}`}>
                                                        {actions[m.id] === 'A' ? 'Button A' : 'Button B'}
                                                    </span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={
            <main className="h-[100dvh] flex items-center justify-center bg-[#E32A26]">
                <div className="w-16 h-16 border-8 border-black border-t-[#ffce07] rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            </main>
        }>
            <PlayContent />
        </Suspense>
    );
}
