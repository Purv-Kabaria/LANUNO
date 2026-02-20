"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomFromUrl = searchParams.get("room") ?? "";
  const [roomId, setRoomId] = useState(roomFromUrl);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomFromUrl) setRoomId(roomFromUrl);
  }, [roomFromUrl]);

  const join = useCallback(async () => {
    const rid = roomId.trim().toUpperCase();
    if (!rid) {
      setError("Enter a room code");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      // Allow bypassing the API check so the UI works without a backend running
      const check = await fetch(`/api/rooms?roomId=${encodeURIComponent(rid)}`).catch(() => null);
      if (check && !check.ok) {
        const data = await check.json().catch(() => ({}));
        throw new Error(data.error || "Room not found");
      }
      const nameParam = encodeURIComponent((name.trim() || "Player").slice(0, 32));
      router.push(`/controller?room=${rid}&name=${nameParam}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join room");
    } finally {
      setJoining(false);
    }
  }, [roomId, name, router]);

  return (
    <main className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden relative selection:bg-[#ffce07] selection:text-black">

      {/* --- UNO MATTEL BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="w-full max-w-sm md:max-w-md relative z-10 flex flex-col h-full max-h-[100dvh] justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {/* Decorative elements bg */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#ffce07] rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_4s_infinite]" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_5s_infinite_reverse]" />

        <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col rounded-2xl overflow-hidden shrink-0 max-h-full">

          {/* Replaced Green with UNO Red, matched structure of Host page */}
          <CardHeader className="text-center pt-4 sm:pt-5 bg-white pb-2 sm:pb-3 border-b-4 border-black shrink-0">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-[#ffce07] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center mb-2 rotate-3">
              {/* Used the original Join image graphic instead of Lucide Icon */}
              <Image
                src="/join.png"
                alt="JOIN"
                width={60}
                height={60}
                className="w-10 sm:w-12 h-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black uppercase text-black">Join Game</CardTitle>
            <CardDescription className="text-sm sm:text-base font-bold text-gray-500 mt-1">
              Enter room details below
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-2 sm:space-y-3 pt-3 sm:pt-4 pb-4 sm:pb-5 bg-white p-4 sm:p-5">

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="room" className="text-sm sm:text-base font-black uppercase text-black">Room Code</Label>
              <Input
                id="room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="bg-gray-100 text-black font-mono text-lg sm:text-xl uppercase h-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:translate-x-1 focus-visible:translate-y-1 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:tracking-widest placeholder:text-sm sm:placeholder:text-base"
                maxLength={8}
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base font-black uppercase text-black">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-100 text-black text-lg sm:text-xl uppercase h-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:translate-x-1 focus-visible:translate-y-1 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:tracking-widest placeholder:uppercase placeholder:text-sm sm:placeholder:text-base"
                maxLength={15}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#eb1c24] text-white p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2 pt-1 sm:pt-2">
              <Button
                size="lg"
                onClick={join}
                disabled={joining}
                className="w-full text-base sm:text-lg h-12 sm:h-14 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-[#ffce07] hover:bg-[#ffe047] text-black transition-all font-black uppercase tracking-widest relative overflow-hidden active:scale-95 cursor-pointer"
              >
                {joining ? "Joining…" : "Let's Go!"}
              </Button>

              <Link href="/" className="block outline-none">
                <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-12 border-4 border-black text-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-black uppercase hover:bg-gray-100 active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Home
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="h-[100dvh] flex items-center justify-center bg-[#E32A26]">
        <div className="w-16 h-16 border-8 border-black border-t-[#ffce07] rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
      </main>
    }>
      <JoinForm />
    </Suspense>
  );
}