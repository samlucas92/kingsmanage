# Connect the stats sheet

The app sends one completed match at a time to a Google Apps Script web app. The script writes a two-column `App` / `Goals` block into the appropriate team tab. Sending the same match again updates the original block rather than adding a duplicate. If an earlier preformatted pair becomes available, re-exporting relocates the match there and clears its old position.

## 1. Check the sheet layout

The script is configured for the current stats layout:

- Player squad number in column A.
- Player name in column B.
- Match date in row 3.
- Opponent in row 4.
- Kingsbridge score followed by the opposition score in row 5, regardless of venue.
- `App` and `Goals` headings in row 6. Unused pairs may also be completely blank; the export adds these headings when it uses the pair.
- First player in row 7.

If the layout changes, update the constants at the top of `Code.gs` before deploying.

## 2. Add the Apps Script

1. Open the stats spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the repository's `docs/google-sheets/Code.gs` file.
4. Save the project and give it a useful name such as `KingsManage stats export`.

## 3. Add Script Properties

In Apps Script, select **Project Settings → Script Properties** and add:

### `EXPORT_SECRET`

Use a long random value. A convenient command is:

```bash
openssl rand -hex 32
```

Keep this value private. The identical value must be configured as `GOOGLE_SHEETS_EXPORT_SECRET` on the KingsManage API.

### `TEAM_SHEET_MAP`

This is a JSON object that maps each KingsManage team ID to its exact Google Sheet tab name. For the built-in first and second teams, start with:

```json
{
  "11111111-1111-1111-1111-111111111101": "26/27 1st Season Stats",
  "22222222-2222-2222-2222-222222222202": "26/27 2nds Season Stats"
}
```

Change the tab names to match the spreadsheet exactly. Custom teams use their own IDs; a failed export reports the unmapped team ID so it can be added here.

## 4. Deploy the web app

1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**. The shared secret protects writes; Google sign-in cannot be used by the server-to-server request.
5. Select **Deploy**, approve the requested spreadsheet permission, and copy the deployed `/exec` URL.

After changing the script later, use **Deploy → Manage deployments → Edit**, choose **New version**, and deploy again.

## 5. Configure the KingsManage API

Set these API environment variables and restart/redeploy the API:

```text
GOOGLE_SHEETS_EXPORT_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
GOOGLE_SHEETS_EXPORT_SECRET=the-same-value-as-EXPORT_SECRET
```

Do not put either value in the frontend's `VITE_*` environment variables.

## 6. Try an export

1. Open a completed match in KingsManage.
2. Open the **Stats** section.
3. Select **Export to Google Sheets**.

If a player who appeared in the match cannot be matched to column B (by normalized name, then unique squad number), no sheet values are changed. Correct or add the player row and try again. Players who did not appear are written as blank `App` and `Goals` cells.

## Optional: connect the workbook inside Yepset

The OAuth connection and in-app viewer are intentionally separate from the Apps Script export above. While the new integration is being tested, keep `GOOGLE_SHEETS_EXPORT_WEBHOOK_URL` and `GOOGLE_SHEETS_EXPORT_SECRET` configured: the match export button still uses that webhook.

### Google Cloud setup

1. Create or select a Google Cloud project.
2. Enable the **Google Sheets API** and **Google Picker API**.
3. Configure the OAuth consent screen for the organisation. Add the users who will test it if the app is in testing mode.
4. Create an **OAuth client ID** of type **Web application**.
5. Add the frontend callback URL as an authorised redirect URI, for example:

   ```text
   https://your-frontend.example.com/organization/integrations/google-sheets/callback
   ```

6. Create a browser API key for Google Picker. Restrict it to the frontend's web origin and to the Google Picker API.
7. Copy the Cloud project's numeric project number; Google Picker calls this the App ID.

### API environment variables

Configure these on the KingsManage API and restart/redeploy it:

```text
GOOGLE_CLIENT_ID=the-oauth-web-client-id
GOOGLE_CLIENT_SECRET=the-oauth-web-client-secret
GOOGLE_SHEETS_REDIRECT_URI=https://your-frontend.example.com/organization/integrations/google-sheets/callback
GOOGLE_PICKER_API_KEY=the-browser-restricted-picker-key
GOOGLE_PICKER_APP_ID=the-numeric-google-cloud-project-number
INTEGRATION_TOKEN_ENCRYPTION_KEY=a-base64-encoded-32-byte-key
```

Generate the encryption key with:

```bash
openssl rand -base64 32
```

`META_TOKEN_ENCRYPTION_KEY` remains a supported fallback so an existing Meta setup does not have to change immediately. Keep OAuth secrets and the encryption key on the API; do not add them to frontend `VITE_*` variables.

### Connect and test

1. In Yepset, open **Organisation → Integrations**.
2. Under **Google Sheets**, select **Connect Google** and approve access.
3. Select **Choose workbook**, then choose the club stats spreadsheet in Google Picker.
4. Select **View in Yepset**, or open **Stats → View Google Sheet**.

The in-app workbook is read-only in this phase. Google Picker grants Yepset access only to the file selected by the administrator. Disconnecting this integration removes the stored Google credential but does not affect the Apps Script export.
