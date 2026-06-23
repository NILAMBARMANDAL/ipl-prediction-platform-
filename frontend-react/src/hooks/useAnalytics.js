import { useEffect, useState } from "react";
import api from "../services/api.js";

// useAnalytics: a small data-fetching hook. Pass an endpoint path under
// /analytics and it returns { data, loading, error }. Centralizing this keeps
// the Dashboard components clean and consistent.
export default function useAnalytics(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/analytics${path}`)
      .then((res) => {
        if (alive) setData(res.data.data);
      })
      .catch((err) => {
        if (alive)
          setError(err.response?.data?.message || "Failed to load data");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  return { data, loading, error };
}
