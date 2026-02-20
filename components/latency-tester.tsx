"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Users } from "lucide-react";

export function LatencyTester({ ws, connectionId, members = [] }: { ws: WebSocket | null, connectionId: string | null, members?: any[] }) {
    const [serverLatency, setServerLatency] = useState<number | null>(null);
    const [playerLatencies, setPlayerLatencies] = useState<{ [id: string]: number }>({});
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "PONG") {
                    const rtt = Date.now() - msg.clientTime;
                    setServerLatency(rtt);
                }
                if (msg.type === "PLAYER_PONG") {
                    const rtt = Date.now() - msg.clientTime;
                    setPlayerLatencies((prev) => ({ ...prev, [msg.from]: rtt }));
                }
                if (msg.type === "PLAYER_PING") {
                    // Send back a PLAYER_PONG
                    if (ws.readyState === 1) {
                        ws.send(JSON.stringify({
                            type: "PLAYER_PONG",
                            to: msg.from,
                            clientTime: msg.clientTime
                        }));
                    }
                }
            } catch (e) {
                // ignore JSON parse error
            }
        };

        ws.addEventListener("message", handleMessage);
        return () => ws.removeEventListener("message", handleMessage);
    }, [ws]);

    const testLatency = () => {
        if (!ws || ws.readyState !== 1) return;
        setIsTesting(true);
        setServerLatency(null);
        setPlayerLatencies({});

        // Test Server Latency
        ws.send(JSON.stringify({ type: "PING", clientTime: Date.now() }));

        // Test Player-to-Player Latency (Broadcasts to all in room)
        ws.send(JSON.stringify({ type: "PLAYER_PING", clientTime: Date.now() }));

        // Reset testing state after 2 seconds
        setTimeout(() => setIsTesting(false), 2000);
    };

    if (!ws) return null;

    return (
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden rounded-2xl p-0 gap-0">
            <CardHeader className="bg-[#ffce07] p-4 sm:p-5 border-b-4 border-black text-black shrink-0">
                <CardTitle className="text-xl sm:text-2xl font-black uppercase flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="h-6 w-6 sm:h-7 sm:w-7" />
                        Network Test
                    </div>
                    <Button
                        onClick={testLatency}
                        disabled={isTesting}
                        className="border-2 border-black bg-[#ffce07] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#ffe047] active:scale-95 transition-all font-black uppercase tracking-wider h-8 px-4 text-xs sm:text-sm cursor-pointer"
                    >
                        {isTesting ? "Testing..." : "Ping"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="flex items-center justify-between bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                        <Server className="w-5 h-5 text-[#eb1c24]" /> Server
                    </div>
                    <div className="font-mono font-black text-lg">
                        {serverLatency !== null ? `${serverLatency}ms` : "--"}
                    </div>
                </div>

                {Object.entries(playerLatencies).length > 0 && (
                    <div className="pt-2">
                        <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Users className="w-4 h-4" /> Players RTT
                        </div>
                        <div className="space-y-2">
                            {Object.entries(playerLatencies).map(([id, lat]) => {
                                const m = members.find((member) => member.id === id);
                                const displayName = m ? m.name : id;
                                return (
                                    <div key={id} className="flex items-center justify-between bg-white border-2 border-black rounded-xl p-2 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="font-bold text-sm truncate max-w-[120px]" title={id}>{displayName}</div>
                                        <div className="font-mono font-black text-sm">{lat}ms</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
