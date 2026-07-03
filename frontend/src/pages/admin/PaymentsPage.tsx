import { useEffect, useState } from "react";
import { EmptyRow } from "../../components/EmptyRow";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService } from "../../services/api/adminService";
import type { Payment } from "../../types";
import { formatDate, money } from "../../utils/formatters";

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService
      .getPayments()
      .then(setPayments)
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Unable to load payments."));
  }, []);

  return (
    <section className="panel-stack">
      {error ? <div className="alert">{error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Gateway Ref</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td>{payment.orderReference}</td>
                <td>{payment.gatewayReference ?? "-"}</td>
                <td>{money(payment.amount, payment.currency)}</td>
                <td><StatusBadge status={payment.status} /></td>
                <td>{formatDate(payment.createdAt)}</td>
              </tr>
            ))}
            {!payments.length ? <EmptyRow columns={5} label="No payments recorded." /> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
