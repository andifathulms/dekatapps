import { create } from 'zustand'
import { getUnreadCount } from '../api/letters'

export const useUnreadStore = create((set) => ({
  unreadLetters: 0,
  fetchUnread: async () => {
    try {
      const res = await getUnreadCount()
      set({ unreadLetters: res.data.count })
    } catch {}
  },
  decrement: () => set((s) => ({ unreadLetters: Math.max(0, s.unreadLetters - 1) })),
  clear: () => set({ unreadLetters: 0 }),
}))
