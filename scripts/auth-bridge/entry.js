// Redirect bridge of MSAL: passes the sign-in response of the popup back to the control.
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

broadcastResponseToMainFrame().catch((error) => {
  document.getElementById("message").textContent =
    "The sign-in could not be completed. You can close this window.";
  console.error(error);
});
