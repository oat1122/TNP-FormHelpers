import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

const reducers = (await import('../customerReducers')).default;
const initialState = (await import('../customerInitialState')).default;

describe('customer reducers', () => {
  it('setItemList updates itemList', () => {
    const state = JSON.parse(JSON.stringify(initialState));
    const payload = [{ id: 1, name: 'John' }];
    reducers.setItemList(state, { payload });
    expect(state.itemList).toEqual(payload);
  });

  it('resetInputList resets inputList to defaults', () => {
    const state = JSON.parse(JSON.stringify(initialState));
    state.inputList.cus_firstname = 'test';
    reducers.resetInputList(state);
    expect(state.inputList).toEqual(initialState.inputList);
  });
});
