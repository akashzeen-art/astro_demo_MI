import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "my" : "en")}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 text-xs font-medium text-amber-300 transition-all duration-200 hover:bg-orange-500/20 hover:text-amber-100"
      title={language === "en" ? "Switch to Burmese" : "Switch to English"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{language === "en" ? "မြန်မာ" : "EN"}</span>
    </button>
  );
};

export default LanguageSwitcher;
