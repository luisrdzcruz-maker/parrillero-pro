import { getSavedMenus } from "@/lib/db/savedMenus";
import SavedMenusClient from "./SavedMenusClient";

export const dynamic = "force-dynamic";

export default async function SavedMenusPage() {
  const menus = await getSavedMenus();

  return <SavedMenusClient initialMenus={menus} />;
}
