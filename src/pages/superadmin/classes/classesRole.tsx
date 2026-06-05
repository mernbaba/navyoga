import { createContext, useContext, type ReactNode } from "react";

/**
 * The classes module is rendered under two surfaces — the superadmin panel
 * (`/superadmin/classes/*`) and the operations panel (`/operations/classes/*`)
 * — using the exact same page components. The only per-surface differences are
 * (a) which auth token the API calls use and (b) the base path for in-module
 * navigation. Both are derived from this context so the pages themselves stay
 * identical.
 *
 * The default is SUPERADMIN, so superadmin routes need no provider; operations
 * routes wrap the pages in <OperationsClassesShell> which supplies "OPERATIONS".
 */
export type ClassesRole = "SUPERADMIN" | "OPERATIONS";

const ClassesRoleContext = createContext<ClassesRole>("SUPERADMIN");

export function ClassesRoleProvider({
  value,
  children,
}: {
  value: ClassesRole;
  children: ReactNode;
}) {
  return (
    <ClassesRoleContext.Provider value={value}>
      {children}
    </ClassesRoleContext.Provider>
  );
}

/** The auth role to pass to classes API calls for the current surface. */
export function useClassesRole(): ClassesRole {
  return useContext(ClassesRoleContext);
}

/** The base path (`/superadmin/classes` or `/operations/classes`) for in-module links. */
export function useClassesBasePath(): string {
  return useContext(ClassesRoleContext) === "OPERATIONS"
    ? "/operations/classes"
    : "/superadmin/classes";
}
