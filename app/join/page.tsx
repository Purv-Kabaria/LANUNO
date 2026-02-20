"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

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
      const check = await fetch(`/api/rooms?roomId=${encodeURIComponent(rid)}`);
      if (!check.ok) {
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
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-secondary selection:text-white">
      <motion.div
        className="w-full max-w-sm md:max-w-md relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {/* Decorative elements bg */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_4s_infinite]" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-[bounce_5s_infinite_reverse]" />

        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-card overflow-hidden">
          <CardHeader className="text-center pt-8 bg-accent text-accent-foreground border-b-4 border-foreground pb-6">
            <div className="mx-auto w-24 h-24 bg-white border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 -rotate-6">
              <Gamepad2 className="w-12 h-12 text-foreground" />
            </div>
            <CardTitle className="text-4xl font-black uppercase">Join Game</CardTitle>
            <CardDescription className="text-lg font-bold text-foreground/80 mt-2">
              Enter room details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="space-y-3">
              <Label htmlFor="room" className="text-lg font-bold uppercase">Room Code</Label>
              <Input
                id="room"
                placeholder="e.g. ABC123"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="font-mono text-2xl uppercase h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:translate-x-1 focus-visible:translate-y-1 transition-all"
                maxLength={8}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg font-bold uppercase">Your Name</Label>
              <Input
                id="name"
                placeholder="Player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:translate-x-1 focus-visible:translate-y-1 transition-all"
                maxLength={15}
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive text-destructive-foreground p-3 rounded-xl border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-center"
              >
                {error}
              </motion.div>
            )}
            <Button
              size="lg"
              onClick={join}
              disabled={joining}
              className="w-full text-xl h-16 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-primary text-white transition-all font-black uppercase tracking-wider relative overflow-hidden group cursor-pointer"
            >
              {joining ? "Joining…" : "Let's Go!"}
            </Button>

            <Link href="/" className="block outline-none mt-4">
              <Button variant="outline" className="w-full text-lg h-14 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold uppercase hover:bg-secondary hover:text-white cursor-pointer">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-8 border-foreground border-t-primary rounded-full animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
      </main>
    }>
      <JoinForm />
    </Suspense>
  );
}
