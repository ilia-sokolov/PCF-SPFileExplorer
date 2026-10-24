import {
  AccountInfo,
  createStandardPublicClientApplication,
  IPublicClientApplication,
} from "@azure/msal-browser";
import { SignInRequiredError, TokenProvider } from "./GraphClient";

/**
 * Delegated permission used for folders, thumbnails and previews.
 */
export const GRAPH_SCOPES = ["Files.ReadWrite.All"];

/**
 * Path of the sign-in redirect page (web resource of the solution) that has to be registered
 * as single-page application redirect URI of the Microsoft Entra application.
 */
export const AUTH_REDIRECT_PATH = "/WebResources/dotact_/spfileexplorer/authredirect.html";

/**
 * Creates a token provider that signs in the current user with MSAL.
 * @param clientId Application (client) ID of the Microsoft Entra application.
 * @param tenantId Directory (tenant) ID; the organizations endpoint is used if not specified.
 * @param getLoginHint Returns the sign-in name of the current Dataverse user.
 * @param clientUrl URL of the Dataverse environment that hosts the redirect page.
 */
export const createMsalTokenProvider = (
  clientId: string,
  tenantId: string | undefined,
  getLoginHint: () => Promise<string | undefined>,
  clientUrl: string
): TokenProvider => {
  // Started right away, so that a sign-in started by a click does not wait for them
  // (the browser blocks popups that are not opened shortly after a user action).
  const application: Promise<IPublicClientApplication> =
    createStandardPublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId || "organizations"}`,
        redirectUri: `${clientUrl.replace(/\/+$/, "")}${AUTH_REDIRECT_PATH}`,
      },
      cache: { cacheLocation: "sessionStorage" },
    });
  const loginHint = getLoginHint();

  const findAccount = (
    accounts: AccountInfo[],
    hint: string | undefined
  ): AccountInfo | undefined =>
    accounts.find((a) => hint && a.username?.toLowerCase() === hint.toLowerCase()) ??
    accounts[0];

  return async (interactive: boolean): Promise<string> => {
    const app = await application;
    const hint = await loginHint;
    const account = findAccount(app.getAllAccounts(), hint);
    if (account) {
      try {
        return (await app.acquireTokenSilent({ scopes: GRAPH_SCOPES, account }))
          .accessToken;
      } catch {
        if (!interactive) {
          throw new SignInRequiredError();
        }
      }
    } else if (!interactive) {
      try {
        return (await app.ssoSilent({ scopes: GRAPH_SCOPES, loginHint: hint })).accessToken;
      } catch {
        throw new SignInRequiredError();
      }
    }
    // Only from a user action, so that the browser does not block the popup.
    const result = await app.acquireTokenPopup({ scopes: GRAPH_SCOPES, loginHint: hint });
    return result.accessToken;
  };
};
