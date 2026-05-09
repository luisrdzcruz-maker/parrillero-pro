"use client";

import {
  Input,
  PrimaryButton,
  ResultCards,
  Select,
  equipmentOptions,
  type Blocks,
  type SaveMenuStatus,
} from "@/components/cooking/CookingWizard";
import { Button, Grid } from "@/components/ui";
import { ds } from "@/lib/design-system";
import type { AppText } from "@/lib/i18n/texts";

export type MenuModeScreenProps = {
  t: AppText;
  people: string;
  setPeople: (value: string) => void;
  eventType: string;
  setEventType: (value: string) => void;
  menuMeats: string;
  setMenuMeats: (value: string) => void;
  sides: string;
  setSides: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  equipment: string;
  setEquipment: (value: string) => void;
  loading: boolean;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  saveMenuStatus: SaveMenuStatus;
  saveMenuMessage: string;
  onGenerateMenuPlan: () => void;
  onSaveCurrentMenu: () => Promise<void>;
};

export function MenuModeScreen({
  t,
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
  equipment,
  setEquipment,
  loading,
  blocks,
  checkedItems,
  setCheckedItems,
  saveMenuStatus,
  saveMenuMessage,
  onGenerateMenuPlan,
  onSaveCurrentMenu,
}: MenuModeScreenProps) {
  const hasMenuBlocks = Boolean(blocks.MENU || blocks.COMPRA || blocks.SHOPPING);

  return (
    <Grid variant="split">
      <div className={ds.panel.form}>
        <h2 className="text-xl font-bold">{t.createMenu}</h2>

        <Input label={t.people} value={people} onChange={setPeople} placeholder="Ej: 6" />
        <Select
          label={t.eventType}
          value={eventType}
          onChange={setEventType}
          options={[
            "cena con amigos",
            "comida familiar",
            "barbacoa informal",
            "celebración especial",
            "menú premium",
          ]}
        />
        <Input
          label={t.meats}
          value={menuMeats}
          onChange={setMenuMeats}
          placeholder="Ej: chuletón, secreto, maíz"
        />
        <Input
          label={t.sides}
          value={sides}
          onChange={setSides}
          placeholder="Ej: patatas, ensalada, chimichurri"
        />
        <Input label={t.budget} value={budget} onChange={setBudget} placeholder="Ej: 200" />
        <Select
          label={t.difficulty}
          value={difficulty}
          onChange={setDifficulty}
          options={["fácil", "medio", "avanzado"]}
        />
        <Select
          label={t.equipment}
          value={equipment}
          onChange={setEquipment}
          options={equipmentOptions}
        />

        <PrimaryButton
          onClick={onGenerateMenuPlan}
          loading={loading}
          text={t.createMenu}
          loadingText={t.creating}
        />

        {hasMenuBlocks && (
          <Button
            className="px-5 py-4 font-bold"
            fullWidth
            onClick={onSaveCurrentMenu}
            disabled={saveMenuStatus === "saving"}
            variant="outlineAccent"
          >
            {saveMenuStatus === "saving" ? t.savingMenu : t.saveMenu}
          </Button>
        )}

        {saveMenuMessage && (
          <p
            className={
              saveMenuStatus === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"
            }
          >
            {saveMenuMessage}
          </p>
        )}
      </div>

      <ResultCards
        blocks={blocks}
        loading={loading}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
        onSaveMenu={hasMenuBlocks ? onSaveCurrentMenu : undefined}
        saveMenuStatus={saveMenuStatus}
        saveMenuMessage={saveMenuMessage}
        t={t}
      />
    </Grid>
  );
}
