import { useState, useCallback, useMemo } from "react";
import {
  productionTypeConfig,
  statusConfig,
  priorityConfig,
  productionTypes,
  shirtTypes,
  priorityLevels,
  sizeOptions,
} from "../components/Shared/constants";

export const useProductionTypes = () => {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Get production type configuration
  const getProductionTypeConfig = useCallback((type) => {
    return productionTypeConfig[type] || productionTypeConfig.screen;
  }, []);

  // Get status configuration
  const getStatusConfig = useCallback((status) => {
    return statusConfig[status] || statusConfig.pending;
  }, []);

  // Get priority configuration
  const getPriorityConfig = useCallback((priority) => {
    return priorityConfig[priority] || priorityConfig.normal;
  }, []);

  // Get production type label
  const getProductionTypeLabel = useCallback(
    (type) => {
      const config = getProductionTypeConfig(type);
      return config.label;
    },
    [getProductionTypeConfig]
  );

  // Get production type icon
  const getProductionTypeIcon = useCallback(
    (type) => {
      const config = getProductionTypeConfig(type);
      return config.icon;
    },
    [getProductionTypeConfig]
  );

  // Get production type color
  const getProductionTypeColor = useCallback(
    (type) => {
      const config = getProductionTypeConfig(type);
      return config.color;
    },
    [getProductionTypeConfig]
  );

  // Get status label
  const getStatusLabel = useCallback(
    (status) => {
      const config = getStatusConfig(status);
      return config.label;
    },
    [getStatusConfig]
  );

  // Get priority label
  const getPriorityLabel = useCallback(
    (priority) => {
      const config = getPriorityConfig(priority);
      return config.label;
    },
    [getPriorityConfig]
  );

  // Calculate work capacity for a production type
  const calculateWorkCapacity = useCallback((jobs, productionType) => {
    const typeJobs = jobs.filter((job) => job.production_type === productionType);

    const capacity = {
      total_jobs: typeJobs.length,
      pending: typeJobs.filter((job) => job.status === "pending").length,
      in_progress: typeJobs.filter((job) => job.status === "in_progress").length,
      completed: typeJobs.filter((job) => job.status === "completed").length,
      cancelled: typeJobs.filter((job) => job.status === "cancelled").length,
      total_quantity: typeJobs.reduce((sum, job) => sum + (job.total_quantity || 0), 0),
      total_work_points: 0,
      urgent_jobs: typeJobs.filter((job) => job.priority === "urgent").length,
      high_priority_jobs: typeJobs.filter((job) => job.priority === "high").length,
    };

    // Calculate work points from work_calculations
    typeJobs.forEach((job) => {
      if (job.work_calculations && job.work_calculations[productionType]) {
        capacity.total_work_points += job.work_calculations[productionType].total_work || 0;
      }
    });

    return capacity;
  }, []);

  // Get all production types with their capacities
  const getProductionTypesWithCapacity = useCallback(
    (jobs) => {
      return Object.keys(productionTypeConfig).map((type) => {
        const config = productionTypeConfig[type];
        const capacity = calculateWorkCapacity(jobs, type);

        return {
          type,
          config,
          capacity,
          label: config.label,
          icon: config.icon,
          color: config.color,
          total_jobs: capacity.total_jobs,
          active_jobs: capacity.pending + capacity.in_progress,
          completion_rate:
            capacity.total_jobs > 0
              ? Math.round((capacity.completed / capacity.total_jobs) * 100)
              : 0,
        };
      });
    },
    [calculateWorkCapacity]
  );

  // Filter jobs by production type
  const filterJobsByType = useCallback((jobs, type) => {
    if (type === "all") return jobs;
    return jobs.filter((job) => job.production_type === type);
  }, []);

  // Filter jobs by status
  const filterJobsByStatus = useCallback((jobs, status) => {
    if (status === "all") return jobs;
    return jobs.filter((job) => job.status === status);
  }, []);

  // Filter jobs by priority
  const filterJobsByPriority = useCallback((jobs, priority) => {
    if (priority === "all") return jobs;
    return jobs.filter((job) => job.priority === priority);
  }, []);

  // Get filtered jobs based on current selections
  const getFilteredJobs = useCallback(
    (jobs) => {
      let filtered = jobs;

      filtered = filterJobsByType(filtered, selectedType);
      filtered = filterJobsByStatus(filtered, selectedStatus);
      filtered = filterJobsByPriority(filtered, selectedPriority);

      return filtered;
    },
    [
      selectedType,
      selectedStatus,
      selectedPriority,
      filterJobsByType,
      filterJobsByStatus,
      filterJobsByPriority,
    ]
  );

  // Get summary statistics
  const getSummaryStats = useCallback(
    (jobs) => {
      const filtered = getFilteredJobs(jobs);

      const stats = {
        total: filtered.length,
        by_type: {},
        by_status: {},
        by_priority: {},
        total_quantity: filtered.reduce((sum, job) => sum + (job.total_quantity || 0), 0),
        total_work_points: 0,
      };

      // Count by type
      Object.keys(productionTypeConfig).forEach((type) => {
        stats.by_type[type] = filtered.filter((job) => job.production_type === type).length;
      });

      // Count by status
      Object.keys(statusConfig).forEach((status) => {
        stats.by_status[status] = filtered.filter((job) => job.status === status).length;
      });

      // Count by priority
      Object.keys(priorityConfig).forEach((priority) => {
        stats.by_priority[priority] = filtered.filter((job) => job.priority === priority).length;
      });

      // Calculate total work points
      filtered.forEach((job) => {
        if (job.work_calculations) {
          Object.values(job.work_calculations).forEach((calc) => {
            stats.total_work_points += calc.total_work || 0;
          });
        }
      });

      return stats;
    },
    [getFilteredJobs]
  );

  // Parse print locations from job data
  const parsePrintLocations = useCallback(
    (job) => {
      if (!job.print_locations) return [];

      const locations = [];

      Object.entries(job.print_locations).forEach(([type, data]) => {
        if (data.enabled && data.points > 0) {
          const config = getProductionTypeConfig(type);
          locations.push({
            type,
            config,
            points: data.points,
            position: data.position || "ไม่ระบุ",
            label: config.label,
            icon: config.icon,
            color: config.color,
          });
        }
      });

      return locations;
    },
    [getProductionTypeConfig]
  );

  // Get job priority color
  const getJobPriorityColor = useCallback(
    (job) => {
      const config = getPriorityConfig(job.priority);
      return config.color;
    },
    [getPriorityConfig]
  );

  // Get job status color
  const getJobStatusColor = useCallback(
    (job) => {
      const config = getStatusConfig(job.status);
      return config.color;
    },
    [getStatusConfig]
  );

  // Check if job is overdue
  const isJobOverdue = useCallback((job) => {
    if (!job.due_date) return false;

    const dueDate = new Date(job.due_date);
    const now = new Date();

    return dueDate < now && job.status !== "completed";
  }, []);

  // Check if job is urgent
  const isJobUrgent = useCallback(
    (job) => {
      return job.priority === "urgent" || isJobOverdue(job);
    },
    [isJobOverdue]
  );

  // Get job display info
  const getJobDisplayInfo = useCallback(
    (job) => {
      const typeConfig = getProductionTypeConfig(job.production_type);
      const statusConfig = getStatusConfig(job.status);
      const priorityConfig = getPriorityConfig(job.priority);

      return {
        type: typeConfig,
        status: statusConfig,
        priority: priorityConfig,
        isOverdue: isJobOverdue(job),
        isUrgent: isJobUrgent(job),
        printLocations: parsePrintLocations(job),
      };
    },
    [
      getProductionTypeConfig,
      getStatusConfig,
      getPriorityConfig,
      isJobOverdue,
      isJobUrgent,
      parsePrintLocations,
    ]
  );

  // Available options for dropdowns
  const availableOptions = useMemo(
    () => ({
      productionTypes,
      shirtTypes,
      priorityLevels,
      sizeOptions,
      statusOptions: Object.entries(statusConfig).map(([value, config]) => ({
        value,
        label: config.label,
        color: config.color,
      })),
    }),
    []
  );

  return {
    // State
    selectedType,
    selectedStatus,
    selectedPriority,

    // Setters
    setSelectedType,
    setSelectedStatus,
    setSelectedPriority,

    // Configuration getters
    getProductionTypeConfig,
    getStatusConfig,
    getPriorityConfig,
    getProductionTypeLabel,
    getProductionTypeIcon,
    getProductionTypeColor,
    getStatusLabel,
    getPriorityLabel,

    // Calculations
    calculateWorkCapacity,
    getProductionTypesWithCapacity,
    getSummaryStats,

    // Filters
    filterJobsByType,
    filterJobsByStatus,
    filterJobsByPriority,
    getFilteredJobs,

    // Job helpers
    parsePrintLocations,
    getJobPriorityColor,
    getJobStatusColor,
    isJobOverdue,
    isJobUrgent,
    getJobDisplayInfo,

    // Available options
    availableOptions,

    // Constants
    productionTypeConfig,
    statusConfig,
    priorityConfig,
  };
};
