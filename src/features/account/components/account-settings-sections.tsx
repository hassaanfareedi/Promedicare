import { getCurrentUser } from "@/lib/auth/session";
import { AccountDetailsForm } from "@/features/account/components/account-details-form";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared account + password cards for every role settings page. */
export async function AccountSettingsSections() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountDetailsForm
            fullName={user.profile.full_name}
            phone={user.profile.phone}
            email={user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
