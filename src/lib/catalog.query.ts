import { queryOptions } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";

/** Shared by loaders and screens so the cache is filled once per visit. */
export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    staleTime: 30_000,
  });
