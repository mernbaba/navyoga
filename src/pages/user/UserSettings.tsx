import { PasswordChangeCard } from "../../components/settings/PasswordChangeCard";

export function UserSettings() {
  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account security</p>
        </div>

        <PasswordChangeCard role="STUDENT" />
      </div>
    </div>
  );
}
