import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createPosterSignedUrl, isStoragePoster } from "../lib/supabaseClient.js";

export default function PosterImage({ alt = "", className = "", src }) {
  const { accessToken } = useAuth();
  const [resolvedSrc, setResolvedSrc] = useState(src || "");

  useEffect(() => {
    let cancelled = false;

    async function resolvePoster() {
      if (!src) {
        setResolvedSrc("");
        return;
      }
      if (!isStoragePoster(src)) {
        setResolvedSrc(src);
        return;
      }
      try {
        const signedUrl = await createPosterSignedUrl(accessToken, src);
        if (!cancelled) setResolvedSrc(signedUrl);
      } catch {
        if (!cancelled) setResolvedSrc("");
      }
    }

    resolvePoster();
    return () => {
      cancelled = true;
    };
  }, [accessToken, src]);

  if (!resolvedSrc) return null;
  return <img className={className} src={resolvedSrc} alt={alt} />;
}
