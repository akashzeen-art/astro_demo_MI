import VideoBackground from "@/components/VideoBackground";
import Layout from "@/components/Layout";
import { BRAND } from "@/lib/brand";

const VideoTest = () => (
  <Layout fullBleed>
    <div className="relative min-h-[70vh] flex items-center justify-center">
      <VideoBackground src={BRAND.VIDEO_HERO} overlay />
      <p className="relative z-10 font-display text-2xl text-amber-100">Video playback test</p>
    </div>
  </Layout>
);

export default VideoTest;
