
Goal
- Fix the “Create Report page looks blank” problem in the Preview link so you can always open /reports/new and successfully create a report.

What I found (why it can look blank)
- Your routing is wrapped in src/components/AnimatedRoutes.tsx which performs a page “exit” animation before swapping routes.
- The exit animation (animate-page-exit) ends with opacity: 0 and uses forwards. If the animation-end event is missed (can happen on some devices/browsers, tab switching, or during the initial redirect), the wrapper stays in the “exit” state and the whole page remains invisible — it appears “blank”.
- This is especially likely on first load because “/” immediately redirects to “/dashboard” (<Navigate />), triggering an exit animation right away.
- Separately (not the blank-page cause, but still a bug): when creating a new patient, the form uses a mock patient id of "new", and the patient history query tries to filter reports by patient_id="new" which is not a UUID, causing 400 errors in the background.

Implementation approach (no backend/schema changes)
A) Make route transitions robust so they can’t get stuck invisible
1) Remove the initial redirect animation trigger
   - In AnimatedRoutes.tsx, replace:
     - <Route path="/" element={<Navigate to="/dashboard" replace />} />
     with:
     - <Route path="/" element={<Dashboard />} />
   - This avoids the immediate “exit” animation on first load from “/” → “/dashboard”, which is the most common place to get stuck.

2) Make the animation state machine “fail-safe”
   - Update AnimatedRoutes.tsx to:
     - Remove reliance on any child animation bubbling into onAnimationEnd.
     - Only react to the wrapper’s own animation end:
       - Check event.target === event.currentTarget
       - Check event.animationName === "page-exit"
     - Add a fallback timeout when transitionStage becomes "exit":
       - After ~250–300ms (slightly longer than the 0.2s exit animation), force:
         - setDisplayLocation(location)
         - setTransitionStage("enter")
       - Clear the timeout on cleanup to avoid memory leaks.
   - Result: even if the browser misses animationend, the route will still swap and the UI will not stay hidden.

3) (Optional but recommended) Respect reduced-motion and skip the exit animation
   - Detect prefers-reduced-motion in AnimatedRoutes.tsx.
   - If reduced-motion is enabled, skip “exit” and instantly swap displayLocation.
   - This prevents “blank due to animation” for users who have motion reduction enabled.

B) Prevent background 400 errors when creating a report for a “new” patient
4) Guard patient history query to only run with a valid UUID
   - In src/hooks/usePatientHistory.ts:
     - If patientId is missing or not a UUID, return [] and disable the query.
   - In src/pages/CreateReport.tsx / DynamicReportForm usage:
     - Keep the mock patient object for reference ranges, but ensure patient history does not run for that mock “new” id.

Files to change
- src/components/AnimatedRoutes.tsx
  - Remove "/" redirect to avoid initial animation trap.
  - Harden the transition logic:
    - filter onAnimationEnd
    - add fallback timeout
    - (optional) reduced-motion shortcut
- src/hooks/usePatientHistory.ts
  - Disable query when patientId is not a UUID (prevents 400 errors)
- (Optional) src/components/reports/DynamicReportForm.tsx
  - Pass patientId conditionally or let the hook handle it (either approach is fine; I’ll follow existing patterns)

How we’ll verify (end-to-end)
1) Open Preview link at “/”
   - Expect: Dashboard shows immediately (no blank screen).
2) Click “New Report”
   - Expect: Create Report page reliably shows sections: Patient, Select Test Type, Report Details, footer buttons.
3) Create report (New Patient flow)
   - Enter name + age, select CBC, complete report.
   - Expect: success animation shows, returns to dashboard, report appears in Reports list.
4) Create report (Existing Patient flow)
   - Select an existing patient and template, complete report.
   - Expect: same as above.
5) Confirm no “reports?patient_id=eq.new” 400 errors happen anymore.

Risks / notes
- Adjusting route “/” to render Dashboard directly may slightly change the URL behavior (stays “/” instead of “/dashboard” when opened fresh). All existing navigation to /dashboard will still work since we keep that route too.
- The transition improvements are intentionally defensive: even if CSS/animation events behave inconsistently, the UI won’t disappear.

If you approve, I’ll implement these changes and then you can try opening New Report again in Preview.
