"use client";

import { useEffect, useState } from "react";

export const AVATAR_SRC = "/images/avatar.png";

/**
 * Probes the avatar image once on the client. Native onError on a
 * server-rendered <img> can fire before hydration and get lost, so we
 * verify with a detached Image() instead.
 */
export function useAvatar() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = AVATAR_SRC;
  }, []);

  return ok;
}
