# Connect the stats sheet

The app sends one completed match at a time to a Google Apps Script web app. The script writes a two-column `App` / `Goals` block into the appropriate team tab. Sending the same match again updates the original block rather than adding a duplicate.

## 1. Check the sheet layout

The script is configured for the current stats layout:

- Player squad number in column A.
- Player name in column B.
- Match date in row 3.
- Opponent in row 4.
- Home and away score in row 5.
- `App` and `Goals` headings in row 6.
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
