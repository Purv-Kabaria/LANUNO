"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const floatingVariants = {
    hover: {
      y: -10,
      rotate: [-1, 1, -1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      }
    }
  };

  return (
    <main className="h-[100dvh] w-full bg-[#E32A26] flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden relative selection:bg-[#ffce07] selection:text-black">

      {/* --- UNO MATTEL BACKGROUND --- */}
      {/* 1. Deep Red Diagonal Stripes */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,#b81b17_0,#b81b17_12px,transparent_12px,transparent_24px)]" />
      {/* 2. Central Sunburst Glow (Behind Logo) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,#ff6b68_0%,transparent_60%)] opacity-40 pointer-events-none mix-blend-screen" />
      {/* 3. Dark Edge Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="w-full max-w-3xl flex flex-col justify-center h-full max-h-[100dvh] gap-4 sm:gap-5 md:gap-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* HEADER SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col items-center shrink">
          <motion.div
            initial={{ scale: 0, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring" as const, stiffness: 150, damping: 12 }}
            className="flex justify-center w-full"
          >
            <div className="relative flex justify-center w-full">
              <Image
                src="/title.png"
                alt="LAN UNO"
                width={1800}
                height={600}
                className="w-full max-w-[260px] sm:max-w-[320px] md:max-w-[400px] max-h-[12vh] sm:max-h-[16vh] md:max-h-[18vh] object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] relative z-10 hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </motion.div>

          <p className="text-[14px] cursor-default sm:text-base md:text-xl font-black text-white max-w-lg mx-auto px-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mt-3 sm:mt-4 md:mt-5 relative z-20 text-center leading-tight">
            Play UNO on one screen. Phones as controllers. Fully offline.
          </p>
        </motion.div>

        {/* ACTION SECTION */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-2xl mx-auto shrink">

          {/* HOST */}
          <motion.div variants={itemVariants} whileHover="hover" className="h-full">
            <Link href="/host" className="block outline-none h-full group">

              {/* MOBILE VIEW */}
              <div className="sm:hidden relative flex items-center justify-center bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all h-[72px] overflow-hidden">
                <Image
                  src="/host.png"
                  alt="HOST"
                  width={400}
                  height={150}
                  className="h-10 w-32 z-10 object-contain"
                />
              </div>

              {/* DESKTOP/TABLET VIEW */}
              <motion.div variants={floatingVariants} className="hidden sm:block h-full cursor-pointer transition-all duration-200 group-hover:-translate-y-2 group-hover:-translate-x-2">
                {/* Card lifts up and shadow expands heavily on hover */}
                <Card className="h-full flex flex-col justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 bg-white overflow-hidden relative rounded-xl">

                  <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 flex-1">
                    <CardTitle className="flex justify-center items-center">
                      <Image
                        src="/host.png"
                        alt="HOST"
                        width={400}
                        height={150}
                        className="h-12 md:h-16 w-32 md:w-40 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                    {/* Tactile UNO Red Button */}
                    <div className="w-full flex items-center justify-center text-[13px] md:text-base h-10 md:h-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 uppercase font-black tracking-widest rounded-md bg-[#eb1c24] text-white hover:bg-[#ff2a33] hover:translate-y-1 hover:translate-x-1 hover:shadow-none active:scale-95">
                      Start Match
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </Link>
          </motion.div>

          {/* JOIN */}
          <motion.div variants={itemVariants} whileHover="hover" className="h-full">
            <Link href="/join" className="block outline-none h-full group">

              {/* MOBILE VIEW */}
              <div className="sm:hidden relative flex items-center justify-center bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all h-[72px] overflow-hidden">
                <Image
                  src="/join.png"
                  alt="JOIN"
                  width={400}
                  height={150}
                  className="h-10 w-32 z-10 object-contain"
                />
              </div>

              {/* DESKTOP/TABLET VIEW */}
              <motion.div variants={floatingVariants} className="hidden sm:block h-full cursor-pointer transition-all duration-200 group-hover:-translate-y-2 group-hover:-translate-x-2">
                {/* Card lifts up and shadow expands heavily on hover */}
                <Card className="h-full flex flex-col justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 bg-white overflow-hidden relative rounded-xl">

                  <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 flex-1">
                    <CardTitle className="flex justify-center items-center">
                      <Image
                        src="/join.png"
                        alt="JOIN"
                        width={400}
                        height={150}
                        className="h-12 md:h-16 w-32 md:w-40 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                    {/* Tactile UNO Yellow Button */}
                    <div className="w-full flex items-center justify-center text-[13px] md:text-base h-10 md:h-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 uppercase font-black tracking-widest rounded-md bg-[#ffce07] text-black hover:bg-[#ffe047] hover:translate-y-1 hover:translate-x-1 hover:shadow-none active:scale-95">
                      Enter Code
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </Link>
          </motion.div>

        </div>
      </motion.div>
    </main>
  );
}