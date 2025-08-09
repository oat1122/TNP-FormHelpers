import { useCallback, useState } from 'react';

export default function useCustomerPricingRequests() {
  const [isLoading, setIsLoading] = useState(false);
  const [list, setList] = useState([]);

  const fetchForCustomer = useCallback(async (customerId, currentPrId, canSelectCurrent, endpoint) => {
    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userUuid = userData.user_uuid || '';
      const url = `${endpoint}/pricing-requests?customer_id=${customerId}&user=${userUuid}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      const requests = data?.success ? data?.data || [] : [];
      setList(requests);
      const current = requests.find((pr) => pr.pr_id === currentPrId);
      const defaultSelected = current && !current.is_quoted && canSelectCurrent ? [currentPrId] : [];
      return { requests, defaultSelected };
    } catch (e) {
      console.error(e);
      setList([]);
      return { requests: [], defaultSelected: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { list, isLoading, fetchForCustomer };
}
