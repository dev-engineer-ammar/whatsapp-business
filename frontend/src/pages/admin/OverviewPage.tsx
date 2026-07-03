import { useEffect, useState } from "react";
import { MetricCard } from "../../components/MetricCard";
import { adminService } from "../../services/api/adminService";
import type { Order, Payment, Product } from "../../types";
import { money } from "../../utils/formatters";

export function OverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminService.getOrders(), adminService.getProducts(), adminService.getPayments()])
      .then(([nextOrders, nextProducts, nextPayments]) => {
        setOrders(nextOrders);
        setProducts(nextProducts);
        setPayments(nextPayments);
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Unable to load dashboard."));
  }, []);

  const paidOrders = orders.filter((order) => order.paymentStatus === "paid").length;
  const pendingOrders = orders.filter((order) => order.status === "pending_payment").length;
  const publishedProducts = products.filter((product) => product.isActive).length;
  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  return (
    <section className="panel-stack">
      {error ? <div className="alert">{error}</div> : null}
      <div className="metrics-grid">
        <MetricCard label="Total orders" value={orders.length} />
        <MetricCard label="Paid orders" value={paidOrders} tone="green" />
        <MetricCard label="Pending payment" value={pendingOrders} tone="amber" />
        <MetricCard label="Published products" value={publishedProducts} />
        <MetricCard label="Payments" value={payments.length} />
        <MetricCard label="Paid amount" value={money(paidAmount)} tone="green" />
      </div>
    </section>
  );
}
