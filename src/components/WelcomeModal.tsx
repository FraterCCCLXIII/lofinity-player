import React, { useState, useEffect } from "react";
import { Volume2, Headphones, ListMusic } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackModalOpen, trackModalClose } from "@/lib/analytics";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Check if user has seen the welcome modal before
  useEffect(() => {
    const seen = localStorage.getItem('hasSeenWelcome');
    if (seen === 'true') {
      setHasSeenWelcome(true);
    }
  }, []);

  // Track modal open/close
  React.useEffect(() => {
    if (isOpen) {
      trackModalOpen('welcome');
    }
  }, [isOpen]);

  const handleClose = () => {
    // Mark as seen and close
    localStorage.setItem('hasSeenWelcome', 'true');
    setHasSeenWelcome(true);
    trackModalClose('welcome');
    onClose();
  };

  // Don't show if user has already seen it
  if (hasSeenWelcome) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-morphism border-white/20">
        <DialogHeader>
          {/* Logo */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-sans">Lofinity</h1>
              <span className="text-xs font-medium text-white/60 bg-white/10 px-1.5 py-0.5 rounded">BETA</span>
            </div>
            <p className="text-sm text-white/70 mt-1 font-light">Lofi Hip Hop · Chill Beats</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 text-white/90">
          {/* Main description */}
          <div className="text-center">
            <p className="text-sm leading-relaxed">
              Lofinity is your infinite stream of lofi hip hop — crafted for focus, study, and relaxation.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">How to use:</h3>

            {/* Track List */}
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
              <ListMusic className="h-4 w-4 text-white/70" />
              <div className="flex-1">
                <p className="text-xs font-medium">Browse Tracks</p>
                <p className="text-xs text-white/60">Tap the menu icon to browse and select tracks</p>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
              <Volume2 className="h-4 w-4 text-white/70" />
              <div className="flex-1">
                <p className="text-xs font-medium">Volume</p>
                <p className="text-xs text-white/60">Use the volume slider to adjust playback level</p>
              </div>
            </div>

            {/* Headphones */}
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
              <Headphones className="h-4 w-4 text-white/70" />
              <div className="flex-1">
                <p className="text-xs font-medium">Best with headphones</p>
                <p className="text-xs text-white/60">Experience the full depth of lofi beats</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-white/60">
              Designed and built by Paul Bloch
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
