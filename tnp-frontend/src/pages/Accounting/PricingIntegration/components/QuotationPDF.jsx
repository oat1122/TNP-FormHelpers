import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

// ============ Styles (ปรับใหม่: lineHeight สูงขึ้น, โลโก้ไม่เบียด, เส้นตารางอ่อนลง) ============
const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10.5, fontFamily: "Sarabun", lineHeight: 1.5 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  companyBox: { flexDirection: "row", alignItems: "flex-start" },
  logo: { width: 90, height: 34, marginRight: 12 }, // จำกัดขนาด + เว้นระยะ
  companyInfo: { maxWidth: 320 },
  titleBox: { alignItems: "flex-end" },
  title: { fontSize: 18, fontWeight: "bold" },
  label: { color: "#666" },

  // Customer
  section: { marginTop: 10 },
  rowLine: { height: 0.75, backgroundColor: "#e6e6e6", marginVertical: 6 },

  // Table
  table: { display: "table", width: "auto", marginTop: 10 },
  row: { flexDirection: "row" },
  cell: {
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    borderBottomStyle: "solid",
  },
  th: { fontWeight: "bold", backgroundColor: "#fafafa" },
  right: { textAlign: "right" },

  // Summary
  summary: { alignSelf: "flex-end", width: 260, marginTop: 12 },

  // Sign
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  signBox: { width: "45%", alignItems: "center" },
  signLine: {
    borderBottomWidth: 0.75,
    borderColor: "#888",
    width: "80%",
    height: 24,
    marginBottom: 4,
  },
});

// ช่วยห่อข้อความให้ถูกต้อง (ห้ามมี string อยู่นอก <Text>)
const Cell = ({ style, children, width }) => {
  const normalize = (c) => {
    if (c === null || c === undefined || c === false) return null;
    if (Array.isArray(c))
      return c.map((x, i) => <React.Fragment key={i}>{normalize(x)}</React.Fragment>);
    if (typeof c === "string" || typeof c === "number") return <Text>{String(c)}</Text>;
    return c;
  };
  return <View style={[styles.cell, { width }, style]}>{normalize(children)}</View>;
};

const currencyTHB = (v) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(v || 0));
const dateTH = (d) => {
  try {
    return (d ? new Date(d) : new Date()).toLocaleDateString("th-TH");
  } catch {
    return "";
  }
};

export default function QuotationPDF({ data }) {
  const company = data?.company || {};
  const customer = data?.customer || {};
  const items = Array.isArray(data?.items) ? data.items : [];

  const subtotal = Number(data?.subtotal || 0);
  const vat = Number(data?.vat || 0);
  const total = Number(data?.total || subtotal + vat);
  const depositAmount = Number(data?.depositAmount || 0);
  const remainingAmount = Number(data?.remainingAmount || Math.max(total - depositAmount, 0));

  return (
    <Document title={data.quotationNumber ? `Quotation_${data.quotationNumber}` : "Quotation"}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBox}>
            {/* If you have a logo at public/logo.png */}
            <Image src="/logo.png" style={styles.logo} />
            <View style={styles.companyInfo}>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {company.name || "บริษัทของคุณ"}
              </Text>
              {company.address ? <Text style={styles.label}>{company.address}</Text> : null}
              <Text style={styles.label}>
                โทร: {company.phone || "-"}
                {company.taxId ? ` • เลขประจำตัวผู้เสียภาษี ${company.taxId}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.title}>ใบเสนอราคา</Text>
            {data?.quotationNumber ? (
              <Text style={styles.label}>เลขที่: {data.quotationNumber}</Text>
            ) : null}
            <Text style={styles.label}>วันที่: {dateTH(data?.date)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: "60%" }}>
              <Text style={styles.label}>ลูกค้า</Text>
              <Text style={{ fontWeight: "bold" }}>
                {customer.cus_company || customer.company || "-"}
              </Text>
              {customer.cus_name || customer.name ? (
                <Text>{customer.cus_name || customer.name}</Text>
              ) : null}
              {customer.cus_address || customer.address ? (
                <Text>{customer.cus_address || customer.address}</Text>
              ) : null}
              {customer.cus_phone || customer.phone ? (
                <Text>โทร: {customer.cus_phone || customer.phone}</Text>
              ) : null}
            </View>
            <View style={{ width: "35%" }} />
          </View>
        </View>

        {/* Table header */}
        <View
          style={[
            styles.table,
            { borderTopWidth: 1, borderTopColor: "#e0e0e0", borderTopStyle: "solid" },
          ]}
        >
          <View style={[styles.row, styles.th]}>
            <Cell width={30}>#</Cell>
            <Cell width={260}>รายละเอียดงาน</Cell>
            <Cell width={80} style={styles.right}>
              จำนวน
            </Cell>
            <Cell width={90} style={styles.right}>
              ราคาต่อหน่วย
            </Cell>
            <Cell width={100} style={styles.right}>
              ยอดรวม
            </Cell>
          </View>

          {/* Table Rows */}
          {items.length === 0 ? (
            <View style={styles.row}>
              <Cell width={560}>ไม่มีรายการ</Cell>
            </View>
          ) : (
            items.map((it, idx) => {
              const rows = Array.isArray(it.sizeRows) ? it.sizeRows : [];
              const unit = it.unit || "ชิ้น";
              const unitPrice = Number(it.unit_price ?? it.unitPrice ?? 0);
              const qtyFromRows = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
              const qty = Number(it.quantity ?? qtyFromRows ?? 0);
              const totalLine = Number(
                it.subtotal ??
                  (rows.length > 0
                    ? rows.reduce(
                        (s, r) =>
                          s + Number(r.quantity || 0) * Number((r.unit_price ?? r.unitPrice) || 0),
                        0
                      )
                    : unitPrice * qty)
              );

              return (
                <View key={it.id || idx} wrap={false}>
                  {/* Item Title */}
                  <View style={styles.row}>
                    <Cell width={30}>{String(idx + 1)}</Cell>
                    <Cell width={260}>
                      <Text style={{ fontWeight: "bold" }}>{it.name || "ไม่ระบุชื่องาน"}</Text>
                    </Cell>
                    <Cell width={80} />
                    <Cell width={90} />
                    <Cell width={100} />
                  </View>

                  {/* Meta line */}
                  {it.pattern || it.fabricType || it.color ? (
                    <View style={styles.row}>
                      <Cell width={30}></Cell>
                      <Cell width={530}>
                        <Text style={{ color: "#666" }}>
                          {[it.pattern, it.fabricType, it.color].filter(Boolean).join(" • ")}
                        </Text>
                      </Cell>
                    </View>
                  ) : null}

                  {/* Size Rows / Single row */}
                  {rows.length > 0 ? (
                    rows.map((r, i) => {
                      const rQty = Number(r.quantity || 0);
                      const rUnit = Number((r.unit_price ?? r.unitPrice ?? unitPrice) || 0);
                      const rTotal = rQty * rUnit;
                      return (
                        <View key={`r-${idx}-${i}`} style={styles.row}>
                          <Cell width={30}></Cell>
                          <Cell width={260}>
                            <Text>ไซซ์: </Text>
                            <Text style={{ fontWeight: "bold" }}>{r.size || "-"}</Text>
                          </Cell>
                          <Cell width={80} style={styles.right}>
                            <Text>{`${rQty.toLocaleString("th-TH")} ${unit}`}</Text>
                          </Cell>
                          <Cell width={90} style={styles.right}>
                            <Text>{currencyTHB(rUnit)}</Text>
                          </Cell>
                          <Cell width={100} style={styles.right}>
                            <Text>{currencyTHB(rTotal)}</Text>
                          </Cell>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.row}>
                      <Cell width={30}></Cell>
                      <Cell width={260}>
                        {it.notes ? (
                          <Text style={{ color: "#666", fontStyle: "italic" }}>
                            หมายเหตุ: {it.notes}
                          </Text>
                        ) : (
                          <Text></Text>
                        )}
                      </Cell>
                      <Cell width={80} style={styles.right}>
                        <Text>{`${qty.toLocaleString("th-TH")} ${unit}`}</Text>
                      </Cell>
                      <Cell width={90} style={styles.right}>
                        <Text>{currencyTHB(unitPrice)}</Text>
                      </Cell>
                      <Cell width={100} style={styles.right}>
                        <Text>{currencyTHB(totalLine)}</Text>
                      </Cell>
                    </View>
                  )}

                  {/* Item subtotal */}
                  <View style={styles.row}>
                    <Cell width={30}></Cell>
                    <Cell width={430}>
                      {rows.length > 0 && it.notes ? (
                        <Text style={{ color: "#666", fontStyle: "italic" }}>
                          หมายเหตุ: {it.notes}
                        </Text>
                      ) : (
                        <Text></Text>
                      )}
                    </Cell>
                    <Cell width={90}></Cell>
                    <Cell width={100} style={styles.right}>
                      <Text style={{ fontWeight: "bold" }}>{currencyTHB(totalLine)}</Text>
                    </Cell>
                  </View>

                  <View style={styles.rowLine} />
                </View>
              );
            })
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>รวมเป็นเงิน</Text>
            <Text style={{ fontWeight: "bold" }}>{currencyTHB(subtotal)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>ภาษีมูลค่าเพิ่ม 7%</Text>
            <Text style={{ fontWeight: "bold" }}>{currencyTHB(vat)}</Text>
          </View>
          <View style={styles.rowLine} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "bold" }}>จำนวนเงินรวมทั้งสิ้น</Text>
            <Text style={{ fontWeight: "bold" }}>{currencyTHB(total)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text>มัดจำ</Text>
            <Text style={{ fontWeight: "bold" }}>{currencyTHB(depositAmount)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>คงเหลือ</Text>
            <Text style={{ fontWeight: "bold" }}>{currencyTHB(remainingAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data?.notes || data?.terms ? (
          <View style={{ marginTop: 12 }}>
            {data?.notes ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>หมายเหตุ</Text>
                <Text>{data.notes}</Text>
              </View>
            ) : null}
            {data?.terms ? <Text>{data.terms}</Text> : null}
          </View>
        ) : null}

        {/* Signatures */}
        <View style={styles.signRow}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>ผู้สั่งซื้อสินค้า</Text>
            <Text style={styles.label}>วันที่</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>ผู้อนุมัติ</Text>
            <Text style={styles.label}>วันที่</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
