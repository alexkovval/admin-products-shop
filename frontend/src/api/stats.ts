import type { LowStockProduct, RevenuePoint, StatsDays, StatsSummary, TopProduct } from "../types/stats";
import { client } from "./client";

export const getSummary = (days: StatsDays) =>
  client.get<StatsSummary>("/stats/summary/", { params: { days } }).then((r) => r.data);

export const getRevenueByDay = (days: StatsDays) =>
  client.get<RevenuePoint[]>("/stats/revenue-by-day/", { params: { days } }).then((r) => r.data);

export const getTopProducts = (days: StatsDays) =>
  client.get<TopProduct[]>("/stats/top-products/", { params: { days } }).then((r) => r.data);

export const getLowStock = () => client.get<LowStockProduct[]>("/stats/low-stock/").then((r) => r.data);
