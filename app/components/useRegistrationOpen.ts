import { useEffect, useState } from "react";

export function useRegistrationOpen() {
  const [open, setOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/registration-open")
      .then(res => res.json())
      .then(data => {
        setOpen(!!data.open);
        setLoading(false);
      })
      .catch(() => {
        setOpen(null);
        setLoading(false);
      });
  }, []);

  return { open, loading };
}
