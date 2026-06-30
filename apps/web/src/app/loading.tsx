import { HeartbeatLoader } from "@/components/ui/heartbeat-loader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <HeartbeatLoader />
      <p className="text-white/40 font-mono tracking-widest text-sm uppercase animate-pulse">Loading Lore...</p>
    </div>
  );
}
