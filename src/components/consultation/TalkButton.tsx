import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TalkButtonProps {
  onClick: () => void;
}

const TalkButton = ({ onClick }: TalkButtonProps) => (
  <Button
    onClick={onClick}
    className="relative rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-500 hover:to-red-600 text-white font-bold px-8 py-4 text-base md:text-lg shadow-[0_8px_32px_hsl(24_90%_50%/0.35)] hover:shadow-[0_12px_40px_hsl(24_90%_50%/0.45)] transition-all duration-300 hover:scale-[1.03] border border-amber-400/20"
  >
    <span className="absolute inset-0 rounded-full bg-amber-400/15 animate-ping opacity-40" />
    <span className="relative flex items-center">
      <Phone className="w-5 h-5 mr-2" />
      Talk Now
    </span>
  </Button>
);

export default TalkButton;
