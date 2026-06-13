import { useEffect, useState } from "react";
import { fetchBootstrap } from "../data/api";
import type { BootstrapData } from "../domain/types";

export function useBootstrap() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBootstrap()
      .then((next) => {
        if (active) setData(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading };
}

