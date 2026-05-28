import React from "react";
import { useState } from "react";

export default function LogoMark({ compact = false, variant = "chilling" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageName = variant === "tv" ? "snoopy-tv.jpg" : "snoopy-chilling.jpg";

  return (
    <div className={`snoopy-mark ${compact ? "snoopy-mark--compact" : ""}`} aria-hidden="true">
      {!imageFailed ? (
        <img className="snoopy-image" src={`/mascots/${imageName}`} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <>
          <div className="moon" />
          <div className="house">
            <div className="roof" />
            <div className="wall" />
            <div className="door" />
          </div>
          <div className="pup">
            <div className="body" />
            <div className="head" />
            <div className="ear" />
          </div>
        </>
      )}
    </div>
  );
}
