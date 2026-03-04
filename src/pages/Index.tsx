import { useEffect } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { trackHomePageView } from "@/lib/analytics";

const Index = () => {
  // Track home page view when component mounts
  useEffect(() => {
    trackHomePageView();
  }, []);

  return <AudioPlayer />;
};

export default Index;
