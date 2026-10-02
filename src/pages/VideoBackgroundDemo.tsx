import VideoBackground from "@/components/VideoBackground";
import GlassCard from "@/components/GlassCard";
import Layout from "@/components/Layout";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Stars, Sparkles } from "lucide-react";

const VideoBackgroundDemo = () => (
  <Layout fullBleed>
    <div className="relative min-h-[70vh]">
      <VideoBackground src={BRAND.VIDEO_HERO} overlay />
      <div className="relative z-20 sutra-page py-12 max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center">
          <Badge className="mb-4 bg-orange-500/15 text-amber-300 border-orange-500/30">
            <Sparkles className="h-4 w-4 mr-2 inline" />
            Video Background
          </Badge>
          <h1 className="font-display text-3xl font-bold text-amber-50 mb-3">
            Immersive <span className="sutra-text">Vedic Experience</span>
          </h1>
          <p className="text-orange-100/55 mb-4">Hero and preloader video from {BRAND.NAME}</p>
          <div className="flex justify-center gap-6 text-sm text-amber-300/80">
            <span className="flex items-center gap-1"><Stars className="w-4 h-4" /> 720p HD</span>
            <span>GPU Optimized</span>
            <span>Mobile Ready</span>
          </div>
        </GlassCard>
      </div>
    </div>
  </Layout>
);

export default VideoBackgroundDemo;
