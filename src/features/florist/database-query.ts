import { queryOptions } from "@tanstack/react-query";
import { getFloristData } from "./database.functions";

export const floristQueryOptions = queryOptions({
  queryKey: ["florist-database"],
  queryFn: () => getFloristData(),
  staleTime: 0,
  retry: 1,
});