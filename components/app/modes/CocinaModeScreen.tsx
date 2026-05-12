"use client";

import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";
import { ProModal } from "@/components/pro/ProModal";
import type { Lang } from "@/lib/i18n/texts";

type CocinaModeScreenProps = {
  lang: Lang;
  liveClientReady: boolean;
  liveSteps: LiveStep[];
  liveCurrentIndex: number;
  liveRemaining: number;
  livePaused: boolean;
  liveStarted: boolean;
  liveContext: string | undefined;
  showCookCompleteProModal: boolean;
  onCloseCookCompleteProModal: () => void;
  onBack: () => void;
  onPause: () => void;
  onCompleteStep: () => void;
  onGoToStep: (index: number) => void;
  onSaveCook: () => void;
};

export function CocinaModeScreen({
  lang,
  liveClientReady,
  liveSteps,
  liveCurrentIndex,
  liveRemaining,
  livePaused,
  liveStarted,
  liveContext,
  showCookCompleteProModal,
  onCloseCookCompleteProModal,
  onBack,
  onPause,
  onCompleteStep,
  onGoToStep,
  onSaveCook,
}: CocinaModeScreenProps) {
  return (
    <>
      {showCookCompleteProModal && (
        <ProModal
          lang={lang}
          trigger="cook_complete"
          onUpgrade={onCloseCookCompleteProModal}
          onDismiss={onCloseCookCompleteProModal}
        />
      )}
      <div className="bg-[#0a0a0a] md:flex md:min-h-screen md:items-center md:justify-center md:py-8">
        {/* allow-arbitrary: pre-slice-a */}
        <div className="flex h-screen w-full flex-col overflow-hidden md:h-[844px] md:w-[390px] md:rounded-[3rem] md:border md:border-white/10 md:shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
          {!liveClientReady ? (
            <div className="flex flex-1 flex-col items-center justify-center bg-[#020202]">
              <div className="h-[3px] w-14 rounded-full bg-orange-500/35" />
            </div>
          ) : (
            <LiveCookingScreen
              steps={liveSteps}
              currentIndex={liveCurrentIndex}
              remaining={liveRemaining}
              paused={livePaused}
              started={liveStarted}
              context={liveContext}
              lang={lang}
              onBack={onBack}
              onPause={onPause}
              onCompleteStep={onCompleteStep}
              onGoToStep={onGoToStep}
              onSaveCook={onSaveCook}
            />
          )}
        </div>
      </div>
    </>
  );
}
