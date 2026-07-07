/**
 * Module-level singleton for communicating a swap selection from the
 * SwapStop screen back to the OutingPreview screen via useFocusEffect.
 */

export type SwapPayload = {
  stopInstanceId: string;
  place: {
    id: string;
    name: string;
    category: string;
    color: string;
    description: string;
    neighborhood: string;
    priceTier: string;
  };
};

let pendingSwap: SwapPayload | null = null;

export function setPendingSwap(swap: SwapPayload): void {
  pendingSwap = swap;
}

export function consumePendingSwap(): SwapPayload | null {
  const s = pendingSwap;
  pendingSwap = null;
  return s;
}
