import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ROLE_LOGIN_PATHS,
  ROLE_USER_KEYS,
  clearRoleAuth,
  getRoleToken,
} from "./auth";
import { getMe, logoutOnServer, type RoleUser } from "../api/auth";
import type { Role } from "../api/types";

export function getCachedUser<R extends Role>(role: R): RoleUser[R] | null {
  const raw = localStorage.getItem(ROLE_USER_KEYS[role]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoleUser[R];
  } catch {
    return null;
  }
}

export function setCachedUser<R extends Role>(role: R, user: RoleUser[R]) {
  localStorage.setItem(ROLE_USER_KEYS[role], JSON.stringify(user));
}

export function useRoleSession<R extends Role>(role: R) {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser[R] | null>(() => getCachedUser(role));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getRoleToken(role)) {
      navigate(ROLE_LOGIN_PATHS[role], { replace: true });
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getMe(role)
      .then((fresh) => {
        if (cancelled) return;
        setCachedUser(role, fresh);
        setUser(fresh);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearRoleAuth(role);
          navigate(ROLE_LOGIN_PATHS[role], { replace: true });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, navigate]);

  return { user, setUser, isLoading };
}

export async function performLogout(role: Role) {
  try {
    await logoutOnServer(role);
  } catch {
    // server-side logout is best-effort; token gets discarded locally regardless
  }
  clearRoleAuth(role);
  toast.success("Logged out successfully!");
}
