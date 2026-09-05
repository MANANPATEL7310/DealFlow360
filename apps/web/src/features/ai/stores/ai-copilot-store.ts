import { create } from "zustand";

export type CopilotTab = "suggestions" | "inbox" | "runs";

interface AiCopilotState {
  isOpen: boolean;
  activeTab: CopilotTab;
  selectedApprovalId: string | null;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveTab: (tab: CopilotTab) => void;
  setSelectedApprovalId: (id: string | null) => void;
  openWithTab: (tab: CopilotTab, approvalId?: string) => void;
}

export const useAiCopilotStore = create<AiCopilotState>((set) => ({
  isOpen: false,
  activeTab: "inbox",
  selectedApprovalId: null,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedApprovalId: (id) => set({ selectedApprovalId: id }),
  openWithTab: (tab, approvalId) =>
    set({
      isOpen: true,
      activeTab: tab,
      selectedApprovalId: approvalId ?? null,
    }),
}));
