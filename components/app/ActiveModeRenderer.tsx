"use client";

import { CoccionModeScreen, type CoccionModeScreenProps } from "@/components/app/modes/CoccionModeScreen";
import { GuardadosModeScreen, type GuardadosModeScreenProps } from "@/components/app/modes/GuardadosModeScreen";
import { HomeModeScreen, type HomeModeScreenProps } from "@/components/app/modes/HomeModeScreen";
import { MenuModeScreen, type MenuModeScreenProps } from "@/components/app/modes/MenuModeScreen";
import { ParrilladaModeScreen, type ParrilladaModeScreenProps } from "@/components/app/modes/ParrilladaModeScreen";
import { PlanModeScreen, type PlanModeScreenProps } from "@/components/app/modes/PlanModeScreen";
import type { Mode } from "@/components/navigation/AppHeader";

type ActiveModeRendererProps = {
  mode: Mode;
  home: HomeModeScreenProps;
  coccion: CoccionModeScreenProps;
  menu: MenuModeScreenProps;
  guardados: GuardadosModeScreenProps;
  parrillada: ParrilladaModeScreenProps;
  plan: PlanModeScreenProps;
};

export function ActiveModeRenderer({
  mode,
  home,
  coccion,
  menu,
  guardados,
  parrillada,
  plan,
}: ActiveModeRendererProps) {
  if (mode === "inicio") return <HomeModeScreen {...home} />;
  if (mode === "plan") return <PlanModeScreen {...plan} />;
  if (mode === "coccion") return <CoccionModeScreen {...coccion} />;
  if (mode === "menu") return <MenuModeScreen {...menu} />;
  if (mode === "parrillada") return <ParrilladaModeScreen {...parrillada} />;
  if (mode === "guardados") return <GuardadosModeScreen {...guardados} />;
  return null;
}
