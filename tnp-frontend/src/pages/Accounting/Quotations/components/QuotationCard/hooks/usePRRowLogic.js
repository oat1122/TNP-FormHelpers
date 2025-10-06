import React from "react";
import { useGetPricingRequestAutofillQuery } from "../../../../../../features/Accounting/accountingApi";
import { thb } from "../utils/currency";

export default function usePRRowLogic(prId, items) {
  const { data, isLoading } = useGetPricingRequestAutofillQuery(prId, { skip: !prId });
  const pr = data?.data || data || {};
  const prNo = pr.pr_no || pr.pr_number || `#${String(prId).slice(-6)}`;
  const workName = pr.pr_work_name || pr.work_name || "-";
  const imgUrl = pr?.pr_image || pr?.image_url || pr?.image;

  const relatedItems = React.useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.filter(
      (item) => item?.pricing_request_id === prId || item?.pricing_request_id === pr?.id,
    );
  }, [items, prId, pr?.id]);

  const grouped = React.useMemo(() => {
    const map = new Map();

    (relatedItems || []).forEach((item, index) => {
      const name = item.item_name || item.name || "-";
      const pattern = item.pattern || "";
      const fabric = item.fabric_type || item.material || "";
      const color = item.color || "";
      const key = [name, pattern, fabric, color].join("||");

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          pattern,
          fabric,
          color,
          rows: [],
        });
      }

      const quantityValue =
        typeof item.quantity === "string" ? parseFloat(item.quantity || "0") : Number(item.quantity || 0);
      const priceValue =
        typeof item.unit_price === "string"
          ? parseFloat(item.unit_price || "0")
          : Number(item.unit_price || 0);
      const subtotal = !Number.isNaN(quantityValue) && !Number.isNaN(priceValue)
        ? quantityValue * priceValue
        : 0;

      map.get(key).rows.push({
        id: item.id || `${index}`,
        size: item.size || "",
        unit_price: Number.isNaN(priceValue) ? 0 : priceValue,
        quantity: Number.isNaN(quantityValue) ? 0 : quantityValue,
        subtotal: typeof item.subtotal === "number" ? item.subtotal : subtotal,
      });
    });

    return Array.from(map.values()).map((group) => ({
      ...group,
      total: group.rows.reduce((sum, row) => sum + (Number(row.subtotal) || 0), 0),
      totalQty: group.rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
    }));
  }, [relatedItems]);

  return {
    isLoading,
    pr,
    prNo,
    workName,
    imgUrl,
    grouped,
    formatTHB: thb,
  };
}
