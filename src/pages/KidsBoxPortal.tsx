import React, { useState } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stories = [
  { title: "The Magic Rainbow", preview: "Once upon a time, there was a rainbow that could grant wishes...", full: "Once upon a time, there was a rainbow that could grant wishes to all the children who believed in magic." },
  { title: "Friendly Dragon", preview: "In a faraway land lived a dragon who loved to help children...", full: "In a faraway land lived a dragon named Sparkles who loved to help children learn new things." },
  { title: "Dancing Stars", preview: "Every night, the stars would come down to dance with the moon...", full: "Every night, the stars would come down to dance with the moon, creating the most beautiful light show." },
  { title: "The Talking Tree", preview: "Deep in the forest stood a wise old tree that could speak...", full: "Deep in the forest stood a wise old tree that could speak to all the animals and children." },
  { title: "The Brave Little Explorer", preview: "A curious little explorer set out on an adventure...", full: "A curious little explorer named Alex set out on an adventure to discover new places." },
  { title: "The Colorful Garden", preview: "In a magical garden, flowers could sing and dance...", full: "In a magical garden, flowers could sing and dance every morning!" },
];

const KidsBoxPortal = () => {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  return (
    <Layout>
      <div className="sutra-page max-w-6xl mx-auto space-y-8 pb-8">
        <div className="text-center">
          <Badge className="mb-3 bg-orange-500/15 text-amber-300 border-orange-500/30">Kids Zone</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-amber-50 mb-2">Kids Box Portal</h1>
          <p className="text-orange-100/55">Stories, puzzles, and learning fun for young explorers</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: "🅰️", title: "Alphabet", desc: "A is for Apple!" },
            { emoji: "🔢", title: "Numbers", desc: "Let's count together!" },
            { emoji: "🌈", title: "Colors", desc: "What's your favorite?" },
            { emoji: "🔺", title: "Shapes", desc: "Spot the shapes!" },
          ].map((item) => (
            <GlassCard key={item.title} className="p-5 text-center">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <h3 className="font-display text-lg text-amber-100 mb-1">{item.title}</h3>
              <p className="text-orange-100/50 text-sm">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-6">
          <h2 className="font-display text-2xl text-amber-50 mb-5 text-center">Story Time</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <GlassCard key={story.title} className="p-4">
                <h3 className="font-medium text-amber-100 mb-2">{story.title}</h3>
                <p className="text-orange-100/50 text-sm mb-3">{story.preview}</p>
                <Button size="sm" className="w-full sutra-btn-primary"
                  onClick={() => setSelectedStory(selectedStory === story.title ? null : story.title)}>
                  {selectedStory === story.title ? "Hide Story" : "Read Story"}
                </Button>
                {selectedStory === story.title && (
                  <p className="mt-3 text-sm text-orange-100/70 p-3 rounded-lg bg-orange-950/30 border border-orange-800/30">{story.full}</p>
                )}
              </GlassCard>
            ))}
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default KidsBoxPortal;
