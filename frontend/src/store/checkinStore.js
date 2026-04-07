import { create } from 'zustand'

export const useCheckinStore = create((set) => ({
  latest: { me: null, partner: null },
  setLatest: (latest) => set({ latest }),
}))
