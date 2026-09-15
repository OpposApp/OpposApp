import { useEffect, useRef } from "react";
import { brandConfig } from "../../../config/brandConfig";
import { useOfficeStore, officeStore } from "../../../context/useOfficeStore";

export function RadioPlayer() {
  const audioRef = useRef(null);
  const isRadioPlaying = useOfficeStore((s) => s.isRadioPlaying);
  const currentStationIndex = useOfficeStore((s) => s.currentStationIndex);
  const volume = useOfficeStore((s) => s.volume);

  const currentStation = brandConfig.audio.stations[currentStationIndex];

  useEffect(() => {
    if (!audioRef.current || !currentStation) return;

    audioRef.current.volume = volume;

    if (isRadioPlaying) {
      // Set stream source if different
      if (audioRef.current.src !== currentStation.url) {
        audioRef.current.src = currentStation.url;
        audioRef.current.load();
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay blocked or stream error:", err);
          officeStore.setRadioPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isRadioPlaying, currentStationIndex, currentStation, volume]);

  return (
    <audio
      ref={audioRef}
      preload="none"
      onError={() => {
        console.warn("Radio stream error, switching or pausing");
        officeStore.setRadioPlaying(false);
      }}
    />
  );
}
