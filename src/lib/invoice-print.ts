import type { BillDTO } from "./types";
import { inr, formatDate } from "./format";

export function printBillInvoice(bill: BillDTO, businessName = "Multi Plaza", tagline = "Sales | Service | Support") {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) {
    alert("Please allow popups to print the bill invoice.");
    return;
  }

  const itemsHtml = bill.items
    .map(
      (it, idx) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${it.itemName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${inr(it.rate, false)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${it.qty}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${inr(it.amount, false)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${bill.billNo}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 24px; }
        .header { border-bottom: 2px solid #0f3d63; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
        .shop-title { font-size: 26px; font-weight: 900; color: #0b2f4f; margin: 0; letter-spacing: -0.5px; }
        .shop-tagline { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .bill-meta { text-align: right; font-size: 13px; line-height: 1.6; }
        .bill-meta b { font-size: 16px; color: #0b2f4f; font-family: monospace; }
        .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; display: flex; justify-content: space-between; }
        .customer-box b { color: #0f172a; font-size: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th { background: #0f3d63; color: #fff; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        th.num { text-align: right; }
        .total-box { margin-left: auto; width: 300px; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 30px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .total-row.grand { background: #f8fafc; font-weight: 900; font-size: 16px; color: #0b2f4f; border-top: 2px solid #cbd5e1; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #15803d; }
        .status-due { background: #fee2e2; color: #b91c1c; }
        .status-pending { background: #fef3c7; color: #b45309; }
        .footer { border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 12px; color: #64748b; margin-top: 40px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="shop-title">${businessName}</h1>
          <p class="shop-tagline">${tagline}</p>
        </div>
        <div class="bill-meta">
          <div>Invoice No: <b>${bill.billNo}</b></div>
          <div>Date: ${formatDate(bill.billDate)}</div>
          ${bill.orderNo ? `<div>Order Ref: ${bill.orderNo}</div>` : ""}
        </div>
      </div>

      <div class="customer-box">
        <div>
          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold;">Billed To:</div>
          <b>${bill.customerName}</b>
          ${bill.customerMobile ? `<div>Phone: ${bill.customerMobile}</div>` : ""}
        </div>
        <div style="text-align: right;">
          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold;">Status:</div>
          <span class="status-badge ${bill.status === "paid" ? "status-paid" : bill.status === "due" ? "status-due" : "status-pending"}">
            ${bill.status}
          </span>
          ${bill.remarks ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">${bill.remarks}</div>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Item / Description</th>
            <th class="num" style="width: 100px;">Rate (₹)</th>
            <th class="num" style="width: 60px;">Qty</th>
            <th class="num" style="width: 110px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-row">
          <span>Subtotal:</span>
          <b>${inr(bill.totalAmount)}</b>
        </div>
        <div class="total-row">
          <span>Amount Paid:</span>
          <b style="color: #15803d;">${inr(bill.amountPaid)}</b>
        </div>
        <div class="total-row grand">
          <span>Balance Due:</span>
          <b style="${bill.dueAmount > 0 ? "color: #b91c1c;" : "color: #0b2f4f;"}">${inr(bill.dueAmount)}</b>
        </div>
      </div>

      <div class="footer">
        Thank you for your business! For service & support inquiries, please contact ${businessName}.
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
