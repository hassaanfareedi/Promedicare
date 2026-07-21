import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountDetailsForm } from "@/features/account/components/account-details-form";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared account + password cards for every role settings page. */
export async function AccountSettingsSections({
  contactFields = "editable",
}: {
  contactFields?: "editable" | "hidden";
} = {}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const t = await getTranslations("common");
  const tLang = await getTranslations("language");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tLang("label")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher variant="select" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountDetailsForm
            fullName={user.profile.full_name}
            phone={user.profile.phone}
            email={user.email}
            contactFields={contactFields}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("password")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
