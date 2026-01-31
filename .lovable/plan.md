
Goal
- “Reset the full app” in the way you requested: clear all database data related to patients and reports so you can start fresh, while keeping clinic settings intact.

What we will delete (database)
- Patients (all rows in `patients` for the default clinic)
- Reports (all rows in `reports` for the default clinic)
- Report images (all rows in `report_images` for reports that belong to the default clinic)

What we will keep (database)
- Clinic configuration (`clinics` row, including name/logo/branding)
- Custom templates (`custom_templates`) so you don’t lose your template edits

Why we’ll implement this as a “Reset” action (instead of asking you to run SQL)
- In this project, the safest and most reliable way is to add a built-in “Reset Data” action inside the app that calls a backend function to perform the deletions in the correct order and returns success/failure.

Safety (important since the app is open-access)
- Add a “Danger Zone” section in Settings that:
  - Requires typing a confirmation phrase like: DELETE ALL DATA
  - Requires a “Reset Code” (stored securely as a backend secret, not in the frontend)
  - Shows exactly what will be deleted and what will remain

Implementation steps
1) Backend function: “reset-clinic-data”
   - Create a backend function that:
     - Verifies the provided reset code matches a backend secret (e.g., `ADMIN_RESET_CODE`)
     - Deletes data in a safe order:
       1) Delete `report_images` for affected reports
       2) Delete `reports` for the clinic
       3) Delete `patients` for the clinic
     - Returns a JSON response with deleted counts (patients/reports/images) and a timestamp
   - Use a transaction-like approach (best-effort rollback where possible) and clear error messages so we can diagnose failures.

2) Add a Reset Data UI in Settings
   - Add a “Reset Data” card/button (Settings page) that opens a confirmation dialog.
   - Dialog fields:
     - Reset code input
     - Confirmation phrase input (must match exactly)
   - On submit:
     - Call the backend function
     - Show a success toast with what was deleted
     - Clear any cached queries (patients/reports) so the dashboard updates immediately
     - Navigate back to Dashboard

3) Optional “local reset” (helps if things feel stuck)
   - Add an optional secondary action in the same dialog:
     - “Clear Draft + Reload”
   - This clears the saved draft report in localStorage and reloads the page, without touching the database.

Verification (end-to-end)
1) Open the app → Dashboard shows current counts.
2) Go to Settings → Danger Zone → Reset Data.
3) Enter Reset Code + type DELETE ALL DATA → confirm.
4) After success:
   - Dashboard shows 0 patients, 0 reports
   - Patients list is empty
   - Reports list is empty
5) Create a new patient + create a new report to confirm normal usage works again.

Notes / assumptions
- This reset is targeted to the single global/default clinic used by the app.
- If you also want to delete Custom Templates, we can add a second checkbox in the reset dialog (off by default) to optionally wipe those too.
