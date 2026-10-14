import VideoLoop from "@/components/VideoLoop";
import { REEL } from "@/config/media";

// Showreel w ramce „onboard”: nagranie z kokpitu + nakładka jak z kamery w aucie wyścigowym.
export default function Reel({ lang }: { lang: "pl" | "en" }) {
  return (
    <div className="reel" data-reveal>
      <VideoLoop clip={REEL} className="reel-video" label={lang === "pl" ? "Jazdy w BMW M4 F82 i BMW E46: na torze i w salonie" : "Driving the BMW M4 F82 and BMW E46: on track and in the venue"} />
      <div className="reel-hud" aria-hidden="true">
        <span className="reel-rec">
          <i /> ONBOARD
        </span>
        <span className="reel-tag">2REAL · SIMRACING</span>
        <span className="reel-corner tl" />
        <span className="reel-corner tr" />
        <span className="reel-corner bl" />
        <span className="reel-corner br" />
        <span className="reel-scan" />
        <span className="reel-cap">
          <b>BMW M4 F82</b>
          <b>BMW E46</b>
          <small>{lang === "pl" ? "z toru prosto do salonu" : "from the track to the venue"}</small>
        </span>
      </div>
    </div>
  );
}
