import { useEffect, useState } from "react";
import { EmptyRow } from "../../components/EmptyRow";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService } from "../../services/api/adminService";
import type { Order, OrderStatus } from "../../types";
import { formatDate, money } from "../../utils/formatters";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setError("");
      setOrders(await adminService.getOrders());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load orders.");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const visibleOrders = orders
    .filter((order) => !status || order.status === status)
    .filter((order) =>
      [order.orderReference, order.customerName, order.whatsappNumber, order.productName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const updateStatus = async (orderReference: string, nextStatus: OrderStatus) => {
    await adminService.updateOrderStatus(orderReference, nextStatus);
    await loadOrders();
  };

  return (
    <section className="panel-stack">
      {error ? <div className="alert">{error}</div> : null}
      <div className="toolbar">
        <input placeholder="Search orders" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="payment_received">Payment received</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order._id}>
                <td><strong>{order.orderReference}</strong><small>{formatDate(order.createdAt)}</small></td>
                <td>{order.customerName}<small>{order.whatsappNumber}</small></td>
                <td>{order.productName}<small>Qty {order.quantity}</small></td>
                <td>{money(order.totalAmount, order.currency)}</td>
                <td><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></td>
                <td>
                  <select value={order.status} onChange={(event) => updateStatus(order.orderReference, event.target.value as OrderStatus)}>
                    <option value="pending_payment">Pending payment</option>
                    <option value="payment_received">Payment received</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>
              </tr>
            ))}
            {!visibleOrders.length ? <EmptyRow columns={6} label="No orders found." /> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
