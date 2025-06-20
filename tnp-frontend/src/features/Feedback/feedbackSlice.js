import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeFeedbackTab: 'submit', // 'submit', 'list', 'statistics'
  feedbackForm: {
    category: '', // 'bug', 'feature', 'improvement', 'other'
    title: '',
    description: '',
    priority: 'medium', // 'low', 'medium', 'high'
    isAnonymous: false,
    attachments: [], // Will store file objects before upload
  },
  previewAttachment: null, // For attachment preview
  activeFilter: {
    category: '',
    priority: '',
    resolved: '',
    search: '',
  },
};

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setActiveFeedbackTab: (state, action) => {
      state.activeFeedbackTab = action.payload;
    },
    updateFeedbackForm: (state, action) => {
      state.feedbackForm = {
        ...state.feedbackForm,
        ...action.payload,
      };
    },
    clearFeedbackForm: (state) => {
      state.feedbackForm = initialState.feedbackForm;
    },
    addAttachment: (state, action) => {
      state.feedbackForm.attachments = [
        ...state.feedbackForm.attachments, 
        action.payload
      ];
    },
    removeAttachment: (state, action) => {
      state.feedbackForm.attachments = state.feedbackForm.attachments.filter(
        (_, index) => index !== action.payload
      );
    },
    setPreviewAttachment: (state, action) => {
      state.previewAttachment = action.payload;
    },
    updateFilter: (state, action) => {
      state.activeFilter = {
        ...state.activeFilter,
        ...action.payload,
      };
    },
    resetFilter: (state) => {
      state.activeFilter = initialState.activeFilter;
    },
  },
});

export const {
  setActiveFeedbackTab,
  updateFeedbackForm,
  clearFeedbackForm,
  addAttachment,
  removeAttachment,
  setPreviewAttachment,
  updateFilter,
  resetFilter,
} = feedbackSlice.actions;

// Selectors
export const selectActiveFeedbackTab = (state) => state.feedback.activeFeedbackTab;
export const selectFeedbackForm = (state) => state.feedback.feedbackForm;
export const selectPreviewAttachment = (state) => state.feedback.previewAttachment;
export const selectActiveFilter = (state) => state.feedback.activeFilter;

export default feedbackSlice.reducer;
