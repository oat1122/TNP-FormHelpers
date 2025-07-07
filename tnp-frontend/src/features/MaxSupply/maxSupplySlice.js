import { create } from 'zustand';

const useMaxSupplyStore = create((set) => ({
  filter: '',
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  setFilter: (filter) => set({ filter }),
}));

export default useMaxSupplyStore;
