"use client";
import { create } from "zustand";

interface WalletState {
  wallets: any[];
  loading: boolean;
  setWallets: (w: any[]) => void;
  setLoading:  (v: boolean) => void;
  getBalance:  (currency: string, type?: string) => number;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  loading: false,
  setWallets: (wallets) => set({ wallets }),
  setLoading:  (loading) => set({ loading }),
  getBalance: (currency, type = "SPOT") => {
    const w = get().wallets.find(
      (w: any) => w.currency === currency && w.type === type
    );
    return w ? Number(w.balance) : 0;
  },
}));
