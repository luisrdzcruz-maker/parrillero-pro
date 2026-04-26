"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  hasResult,
  saveMenuStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  hasResult: boolean;
  saveMenuStatus?: SaveMenuStatus;
  t: {
    copy: string;
    result: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <ResultHeader title={t.result} />
      <ResultActions
        actions={actions}
        hasResult={hasResult}
        status={saveMenuStatus}
        t={{
          copy: t.copy,
          save: t.save,
          saving: t.saving,
          share: t.share,
          startCooking: t.startCooking,
        }}
      />
    </div>
  );
}
