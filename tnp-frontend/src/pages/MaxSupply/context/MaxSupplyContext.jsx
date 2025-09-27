import React, { createContext, useContext, useReducer, useEffect } from "react";
import { maxSupplyApi, calendarApi, worksheetApi } from "../../../services/maxSupplyApi";

// Initial state
const initialState = {
  // Max Supply data
  maxSupplies: [],
  currentMaxSupply: null,

  // Calendar data
  calendarEvents: [],
  calendarStatistics: {},

  // Worksheets for selection
  availableWorksheets: [],

  // UI state
  loading: false,
  error: null,

  // Filters
  filters: {
    search: "",
    status: "all",
    production_type: "all",
    priority: "all",
    date_from: "",
    date_to: "",
  },

  // Pagination
  pagination: {
    current_page: 1,
    per_page: 20,
    total_pages: 1,
    total_items: 0,
  },

  // Calendar settings
  calendarSettings: {
    view: "month", // month, week, day
    currentDate: new Date(),
  },
};

// Action types
const ActionTypes = {
  // Loading actions
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",

  // Max Supply actions
  SET_MAX_SUPPLIES: "SET_MAX_SUPPLIES",
  SET_CURRENT_MAX_SUPPLY: "SET_CURRENT_MAX_SUPPLY",
  ADD_MAX_SUPPLY: "ADD_MAX_SUPPLY",
  UPDATE_MAX_SUPPLY: "UPDATE_MAX_SUPPLY",
  DELETE_MAX_SUPPLY: "DELETE_MAX_SUPPLY",

  // Calendar actions
  SET_CALENDAR_EVENTS: "SET_CALENDAR_EVENTS",
  SET_CALENDAR_STATISTICS: "SET_CALENDAR_STATISTICS",

  // Worksheet actions
  SET_AVAILABLE_WORKSHEETS: "SET_AVAILABLE_WORKSHEETS",

  // Filter actions
  SET_FILTERS: "SET_FILTERS",
  UPDATE_FILTER: "UPDATE_FILTER",
  RESET_FILTERS: "RESET_FILTERS",

  // Pagination actions
  SET_PAGINATION: "SET_PAGINATION",

  // Calendar settings actions
  SET_CALENDAR_VIEW: "SET_CALENDAR_VIEW",
  SET_CALENDAR_DATE: "SET_CALENDAR_DATE",
};

// Reducer
const maxSupplyReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.SET_MAX_SUPPLIES:
      return {
        ...state,
        maxSupplies: action.payload,
        loading: false,
        error: null,
      };

    case ActionTypes.SET_CURRENT_MAX_SUPPLY:
      return {
        ...state,
        currentMaxSupply: action.payload,
        loading: false,
        error: null,
      };

    case ActionTypes.ADD_MAX_SUPPLY:
      return {
        ...state,
        maxSupplies: [action.payload, ...state.maxSupplies],
      };

    case ActionTypes.UPDATE_MAX_SUPPLY:
      return {
        ...state,
        maxSupplies: state.maxSupplies.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
        currentMaxSupply:
          state.currentMaxSupply?.id === action.payload.id
            ? action.payload
            : state.currentMaxSupply,
      };

    case ActionTypes.DELETE_MAX_SUPPLY:
      return {
        ...state,
        maxSupplies: state.maxSupplies.filter((item) => item.id !== action.payload),
        currentMaxSupply:
          state.currentMaxSupply?.id === action.payload ? null : state.currentMaxSupply,
      };

    case ActionTypes.SET_CALENDAR_EVENTS:
      return {
        ...state,
        calendarEvents: action.payload,
        loading: false,
        error: null,
      };

    case ActionTypes.SET_CALENDAR_STATISTICS:
      return {
        ...state,
        calendarStatistics: action.payload,
      };

    case ActionTypes.SET_AVAILABLE_WORKSHEETS:
      return {
        ...state,
        availableWorksheets: action.payload,
        loading: false,
        error: null,
      };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: action.payload,
      };

    case ActionTypes.UPDATE_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.name]: action.payload.value,
        },
      };

    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
      };

    case ActionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload,
      };

    case ActionTypes.SET_CALENDAR_VIEW:
      return {
        ...state,
        calendarSettings: {
          ...state.calendarSettings,
          view: action.payload,
        },
      };

    case ActionTypes.SET_CALENDAR_DATE:
      return {
        ...state,
        calendarSettings: {
          ...state.calendarSettings,
          currentDate: action.payload,
        },
      };

    default:
      return state;
  }
};

// Create context
const MaxSupplyContext = createContext();

// Provider component
export const MaxSupplyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(maxSupplyReducer, initialState);

  // Action creators
  const actions = {
    // Loading actions
    setLoading: (loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    },

    // Max Supply actions
    loadMaxSupplies: async (params = {}) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await maxSupplyApi.getAll({
          ...state.filters,
          page: state.pagination.current_page,
          per_page: state.pagination.per_page,
          ...params,
        });

        if (response.status === "success") {
          dispatch({ type: ActionTypes.SET_MAX_SUPPLIES, payload: response.data });
          dispatch({ type: ActionTypes.SET_PAGINATION, payload: response.pagination });
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    loadMaxSupplyById: async (id) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await maxSupplyApi.getById(id);

        if (response.status === "success") {
          dispatch({ type: ActionTypes.SET_CURRENT_MAX_SUPPLY, payload: response.data });
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    createMaxSupply: async (data) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await maxSupplyApi.create(data);

        if (response.status === "success") {
          dispatch({ type: ActionTypes.ADD_MAX_SUPPLY, payload: response.data });
          return response.data;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateMaxSupply: async (id, data) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await maxSupplyApi.update(id, data);

        if (response.status === "success") {
          dispatch({ type: ActionTypes.UPDATE_MAX_SUPPLY, payload: response.data });
          return response.data;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    deleteMaxSupply: async (id) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await maxSupplyApi.delete(id);
        dispatch({ type: ActionTypes.DELETE_MAX_SUPPLY, payload: id });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateStatus: async (id, status, completedQuantity = null) => {
      try {
        const response = await maxSupplyApi.updateStatus(id, status, completedQuantity);

        if (response.status === "success") {
          dispatch({ type: ActionTypes.UPDATE_MAX_SUPPLY, payload: response.data });
          return response.data;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Calendar actions
    loadCalendarData: async (params = {}) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await calendarApi.getCalendarData({
          view: state.calendarSettings.view,
          date: state.calendarSettings.currentDate.toISOString().split("T")[0],
          ...state.filters,
          ...params,
        });

        if (response.status === "success") {
          dispatch({ type: ActionTypes.SET_CALENDAR_EVENTS, payload: response.data.events || [] });
          dispatch({
            type: ActionTypes.SET_CALENDAR_STATISTICS,
            payload: response.data.statistics || {},
          });
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    // Worksheet actions
    loadAvailableWorksheets: async (params = {}) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const response = await worksheetApi.getForMaxSupply(params);

        if (response.status === "success") {
          dispatch({ type: ActionTypes.SET_AVAILABLE_WORKSHEETS, payload: response.data });
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    // Filter actions
    setFilters: (filters) => {
      dispatch({ type: ActionTypes.SET_FILTERS, payload: filters });
    },

    updateFilter: (name, value) => {
      dispatch({ type: ActionTypes.UPDATE_FILTER, payload: { name, value } });
    },

    resetFilters: () => {
      dispatch({ type: ActionTypes.RESET_FILTERS });
    },

    // Pagination actions
    setPagination: (pagination) => {
      dispatch({ type: ActionTypes.SET_PAGINATION, payload: pagination });
    },

    setPage: (page) => {
      dispatch({
        type: ActionTypes.SET_PAGINATION,
        payload: { ...state.pagination, current_page: page },
      });
    },

    // Calendar settings actions
    setCalendarView: (view) => {
      dispatch({ type: ActionTypes.SET_CALENDAR_VIEW, payload: view });
    },

    setCalendarDate: (date) => {
      dispatch({ type: ActionTypes.SET_CALENDAR_DATE, payload: date });
    },

    navigateCalendar: (direction) => {
      const { view, currentDate } = state.calendarSettings;
      let newDate = new Date(currentDate);

      if (direction === "prev") {
        switch (view) {
          case "month":
            newDate.setMonth(newDate.getMonth() - 1);
            break;
          case "week":
            newDate.setDate(newDate.getDate() - 7);
            break;
          case "day":
            newDate.setDate(newDate.getDate() - 1);
            break;
        }
      } else {
        switch (view) {
          case "month":
            newDate.setMonth(newDate.getMonth() + 1);
            break;
          case "week":
            newDate.setDate(newDate.getDate() + 7);
            break;
          case "day":
            newDate.setDate(newDate.getDate() + 1);
            break;
        }
      }

      dispatch({ type: ActionTypes.SET_CALENDAR_DATE, payload: newDate });
    },

    goToToday: () => {
      dispatch({ type: ActionTypes.SET_CALENDAR_DATE, payload: new Date() });
    },
  };

  // Auto-reload data when filters or calendar settings change
  useEffect(() => {
    if (state.calendarSettings.view) {
      actions.loadCalendarData();
    }
  }, [state.filters, state.calendarSettings]);

  return (
    <MaxSupplyContext.Provider value={{ state, actions }}>{children}</MaxSupplyContext.Provider>
  );
};

// Hook to use MaxSupply context
export const useMaxSupply = () => {
  const context = useContext(MaxSupplyContext);
  if (!context) {
    throw new Error("useMaxSupply must be used within a MaxSupplyProvider");
  }
  return context;
};

export default MaxSupplyContext;
