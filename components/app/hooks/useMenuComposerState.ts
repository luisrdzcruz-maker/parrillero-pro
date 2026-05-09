"use client";

import { useState } from "react";

import { type PlanMode } from "@/components/planning/PlanHub";
import { getPlanTextDefaults } from "@/components/app/utils/i18n";
import type { Lang } from "@/lib/i18n/texts";

export function useMenuComposerState(lang: Lang) {
  const planTextDefaults = getPlanTextDefaults(lang);

  const [people, setPeople] = useState("4");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState(planTextDefaults.menuMeats);
  const [sides, setSides] = useState(planTextDefaults.sides);
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");
  const [planMode, setPlanMode] = useState<PlanMode>("rapido");
  const [planProduct, setPlanProduct] = useState(planTextDefaults.planProduct);
  const [planGenerated, setPlanGenerated] = useState(false);

  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState(planTextDefaults.parrilladaProducts);
  const [parrilladaSides, setParrilladaSides] = useState(planTextDefaults.parrilladaSides);

  return {
    people,
    setPeople,
    eventType,
    setEventType,
    menuMeats,
    setMenuMeats,
    sides,
    setSides,
    budget,
    setBudget,
    difficulty,
    setDifficulty,
    planMode,
    setPlanMode,
    planProduct,
    setPlanProduct,
    planGenerated,
    setPlanGenerated,
    parrilladaPeople,
    setParrilladaPeople,
    serveTime,
    setServeTime,
    parrilladaProducts,
    setParrilladaProducts,
    parrilladaSides,
    setParrilladaSides,
  };
}
