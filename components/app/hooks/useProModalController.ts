"use client";

import { useEffect, useRef, useState } from "react";

import { isPro } from "@/lib/proStatus";

export type ProModalTrigger = false | "planning";

export function useProModalController({ liveCookComplete }: { liveCookComplete: boolean }) {
  const [showProModal, setShowProModal] = useState<ProModalTrigger>(false);
  const [showCookCompleteProModal, setShowCookCompleteProModal] = useState(false);
  const cookCompleteModalFiredRef = useRef(false);

  useEffect(() => {
    if (!liveCookComplete || cookCompleteModalFiredRef.current || isPro()) return;
    cookCompleteModalFiredRef.current = true;
    const id = window.setTimeout(() => setShowCookCompleteProModal(true), 2000);
    return () => window.clearTimeout(id);
  }, [liveCookComplete]);

  return {
    showProModal,
    showCookCompleteProModal,
    openPlanningProModal: () => setShowProModal("planning"),
    closeProModal: () => setShowProModal(false),
    closeCookCompleteProModal: () => setShowCookCompleteProModal(false),
  };
}
