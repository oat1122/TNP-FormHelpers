/**
 * Custom Hook สำหรับจัดการ Autofill Data Cache
 * 
 * Purpose:
 * - ลด API calls ที่ซ้ำซ้อน
 * - Improve UX โดยแสดงข้อมูล cached ทันที
 * - จัดการ cache lifecycle และ invalidation
 * - ป้องกัน React.StrictMode double-fetch
 * 
 * @module useAutofillCache
 */

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useGetBulkPricingRequestAutofillQuery, accountingApi } from '../../../features/Accounting/accountingApi';

/**
 * Hook สำหรับ fetch และ cache autofill data
 * 
 * Features:
 * - Auto cache management ผ่าน RTK Query
 * - Prevent duplicate requests
 * - Cache หมดอายุ 1 ชั่วโมง (ตั้งค่าใน accountingApi.js)
 * - แสดง cache status สำหรับ debugging
 * 
 * @param {Array<number>} prIds - Array ของ Pricing Request IDs
 * @param {Object} options - Configuration options
 * @param {boolean} options.skip - Skip การ fetch (default: false)
 * @param {boolean} options.refetchOnMountOrArgChange - Refetch เมื่อ mount หรือ args เปลี่ยน (default: false)
 * @param {number} options.pollingInterval - Polling interval ใน ms (default: 0 = ไม่ poll)
 * 
 * @returns {Object} Result object
 * @returns {Map} data - Map ของ autofill data (key: pr_id, value: autofill object)
 * @returns {boolean} isLoading - กำลัง loading หรือไม่
 * @returns {boolean} isFetching - กำลัง fetching (รวม background refetch)
 * @returns {Object|null} error - Error object ถ้ามี
 * @returns {boolean} isCached - ข้อมูล cached หรือไม่
 * @returns {Function} refetch - Function สำหรับ force refetch
 * 
 * @example
 * const { data: autofillMap, isLoading, isCached } = useAutofillCache([1, 2, 3], {
 *   skip: !dialogOpen,
 * });
 * 
 * const prData = autofillMap.get(prId); // ดึงข้อมูลของ PR ID ที่ต้องการ
 */
export const useAutofillCache = (prIds = [], options = {}) => {
  const {
    skip = false,
    refetchOnMountOrArgChange = false,
    pollingInterval = 0,
    debug = false,
  } = options;

  // Sort prIds เพื่อให้ cache key เหมือนกันแม้ลำดับต่างกัน
  const sortedPrIds = useMemo(() => {
    if (!Array.isArray(prIds) || prIds.length === 0) return [];
    // ✅ แปลงเป็น integer และ sort
    return [...prIds]
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);
  }, [prIds]);

  // Use RTK Query hook with optimized settings
  const {
    data: bulkAutofillData,
    isLoading,
    isFetching,
    error,
    refetch,
    isSuccess,
    isUninitialized,
  } = useGetBulkPricingRequestAutofillQuery(sortedPrIds, {
    skip: skip || sortedPrIds.length === 0,
    refetchOnMountOrArgChange,
    pollingInterval,
  });

  // แปลง response เป็น Map เพื่อให้ lookup ง่าย O(1)
  const autofillMap = useMemo(() => {
    const map = new Map();
    
    if (!bulkAutofillData?.data) return map;
    
    (bulkAutofillData.data || []).forEach(item => {
      const key = item.pr_id || item.id;
      if (key) {
        map.set(key, item);
      }
    });
    
    return map;
  }, [bulkAutofillData]);

  // ตรวจสอบว่าเป็น cached data หรือ fresh data
  const isCached = useMemo(() => {
    return isSuccess && !isFetching;
  }, [isSuccess, isFetching]);

  // Debug logging (เปิดเฉพาะเมื่อ debug = true)
  useEffect(() => {
    if (debug && sortedPrIds.length > 0) {
      console.group(`[useAutofillCache] PR IDs: ${sortedPrIds.join(', ')}`);
      console.log('Status:', {
        isLoading,
        isFetching,
        isCached,
        isSuccess,
        isUninitialized,
        dataCount: autofillMap.size,
        timestamp: new Date().toISOString(),
      });
      console.groupEnd();
    }
  }, [debug, sortedPrIds, isLoading, isFetching, isCached, isSuccess, isUninitialized, autofillMap.size]);

  // Helper function to get autofill data for specific PR
  const getAutofillForPR = useCallback((prId) => {
    return autofillMap.get(prId) || null;
  }, [autofillMap]);

  return {
    data: autofillMap,
    isLoading,
    isFetching,
    error,
    isCached,
    isSuccess,
    refetch,
    getAutofillForPR,
    // Metadata for debugging
    _meta: {
      totalItems: autofillMap.size,
      requestedIds: sortedPrIds,
      isFromCache: isCached,
    },
  };
};

/**
 * Hook สำหรับ prefetch autofill data
 * ใช้เมื่อต้องการ preload ข้อมูลก่อนที่ user จะเปิด dialog
 * 
 * @example
 * const { prefetch } = useAutofillPrefetch();
 * 
 * // Prefetch เมื่อ user hover หรือ select PR
 * const handlePRSelect = (prIds) => {
 *   prefetch(prIds); // Prefetch in background
 * };
 */
export const useAutofillPrefetch = () => {
  // Get prefetch function from accountingApi
  const prefetchBulkAutofill = accountingApi.usePrefetch('getBulkPricingRequestAutofill');

  const prefetch = useCallback((prIds, options = {}) => {
    if (!Array.isArray(prIds) || prIds.length === 0) return;
    
    const sortedPrIds = [...prIds].sort((a, b) => a - b);
    prefetchBulkAutofill(sortedPrIds, {
      force: false, // ไม่ force ถ้ามี cache อยู่แล้ว
      ...options,
    });
  }, [prefetchBulkAutofill]);

  return { prefetch };
};

/**
 * Hook สำหรับจัดการ autofill cache ใน Redux store
 * สำหรับ advanced use cases ที่ต้องการ manual cache management
 */
export const useAutofillCacheManager = () => {
  const dispatch = useDispatch();

  // Clear cache ทั้งหมด
  const clearAllCache = useCallback(() => {
    dispatch(accountingApi.util.resetApiState());
  }, [dispatch]);

  // Invalidate specific PR IDs
  const invalidateAutofill = useCallback((prIds) => {
    if (!Array.isArray(prIds)) prIds = [prIds];
    
    prIds.forEach(prId => {
      dispatch(
        accountingApi.util.invalidateTags([
          { type: 'PricingRequest', id: prId }
        ])
      );
    });
  }, [dispatch]);

  // Manually update cache (optimistic update)
  const updateAutofillCache = useCallback((prId, data) => {
    dispatch(
      accountingApi.util.upsertQueryData(
        'getPricingRequestAutofill',
        prId,
        () => ({ success: true, data })
      )
    );
  }, [dispatch]);

  return {
    clearAllCache,
    invalidateAutofill,
    updateAutofillCache,
  };
};

export default useAutofillCache;
