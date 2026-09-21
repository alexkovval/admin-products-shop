import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getLowStock, getRevenueByDay, getSummary, getTopProducts } from "../api/stats";
import type { StatsDays } from "../types/stats";

// Orders and products change these numbers, so they are refetched when the page is opened.
export const useSummary = (days: StatsDays) =>
  useQuery({ queryKey: ["stats", "summary", days], queryFn: () => getSummary(days), placeholderData: keepPreviousData });

export const useRevenueByDay = (days: StatsDays) =>
  useQuery({ queryKey: ["stats", "revenue", days], queryFn: () => getRevenueByDay(days), placeholderData: keepPreviousData });

export const useTopProducts = (days: StatsDays) =>
  useQuery({ queryKey: ["stats", "top", days], queryFn: () => getTopProducts(days), placeholderData: keepPreviousData });

export const useLowStock = () => useQuery({ queryKey: ["stats", "low-stock"], queryFn: getLowStock });
