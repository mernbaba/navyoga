import type { ReactNode } from "react";
import { ClassesRoleProvider } from "../superadmin/classes/classesRole";

/**
 * Wraps a shared superadmin classes page for use under the operations panel.
 * Supplies the OPERATIONS role (so API calls use the operations token and
 * in-module links point at `/operations/classes/*`) and the `p-6 lg:p-8`
 * padding that AdminLayout adds for superadmin but OperationsLayout does not.
 */
export function OperationsClassesShell({ children }: { children: ReactNode }) {
  return (
    <ClassesRoleProvider value="OPERATIONS">
      <div className="p-6 lg:p-8">{children}</div>
    </ClassesRoleProvider>
  );
}
