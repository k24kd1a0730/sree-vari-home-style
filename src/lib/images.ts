/**
 * Maps the image keys stored in the database to the bundled photography.
 * Anything the owner uploads is a full URL and passes straight through.
 */
import asterSofa from "@/assets/products/aster-sofa.jpg";
import oliveLoungeChair from "@/assets/products/olive-lounge-chair.jpg";
import brassCoffeeTable from "@/assets/products/brass-coffee-table.jpg";
import walnutSideTable from "@/assets/products/walnut-side-table.jpg";
import oliveOttoman from "@/assets/products/olive-ottoman.jpg";
import teakDiningTable from "@/assets/products/teak-dining-table.jpg";
import havenDiningSet from "@/assets/products/haven-dining-set.jpg";
import marbleConsole from "@/assets/products/marble-console.jpg";
import linenBedFrame from "@/assets/products/linen-bed-frame.jpg";
import nookPlatformBed from "@/assets/products/nook-platform-bed.jpg";
import ashBookshelf from "@/assets/products/ash-bookshelf.jpg";
import brassSideboard from "@/assets/products/brass-sideboard.jpg";
import livingRoomEdit from "@/assets/offers/living-room-edit.jpg";

const assets: Record<string, string> = {
  "aster-sofa": asterSofa,
  "olive-lounge-chair": oliveLoungeChair,
  "brass-coffee-table": brassCoffeeTable,
  "walnut-side-table": walnutSideTable,
  "olive-ottoman": oliveOttoman,
  "teak-dining-table": teakDiningTable,
  "haven-dining-set": havenDiningSet,
  "marble-console": marbleConsole,
  "linen-bed-frame": linenBedFrame,
  "nook-platform-bed": nookPlatformBed,
  "ash-bookshelf": ashBookshelf,
  "brass-sideboard": brassSideboard,
  "living-room-edit": livingRoomEdit,
};

export function resolveImage(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key) || key.startsWith("/storage/")) return key;
  return assets[key] ?? null;
}
