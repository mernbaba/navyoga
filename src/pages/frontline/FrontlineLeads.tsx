import { Leads } from "../superadmin/Leads";

export function FrontlineLeads() {
  return (
    <div className="p-6 lg:p-8">
      <Leads role="FRONTLINE" />
    </div>
  );
}
