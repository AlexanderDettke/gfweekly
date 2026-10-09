# V33 completion plan

Prepared on 09.10.2026. This is a plan, not a completed acceptance report.

## Why the work stopped

Claude paused at 06:07 Europe/Berlin after its automatic permission review rejected production database writes. The pending question concerned the real workflow test, cleanup of known Cowork test records, and neutral wording for the system entry “Das Hohe Haus”. The later Git push and deployment checks completed publication but did not resume that workflow. The missing handoff left V33b and the authenticated portion of V33d unfinished.

That rejection concerned actions in Claude's session. It does not establish that the database itself is technically unwritable. Current read access through the Supabase connector has been verified; current write approval has not been tested.

## Verified starting point

1. Git is clean on main, aligned with origin/main, at b09ae4f8a8b8a4ee33332b1a7078df5fa322466f.
2. The earlier publication check confirmed HTTP 200 for arbeiten.html and nine referenced local assets. Their contents matched the repository. The delivered navigation code contains “So arbeiten wir”.
3. V33a review round 2 records 211 successful local checks using a simulated backend. These do not establish production workflow behavior.
4. The recorded backend release is arbeiten version 2. Verify its deployed source and authenticated ping again before testing.
5. Fresh SQL reads during planning found: zero gfweekly_sa_ist records, one answer, zero gfweekly_sa_hub_stand records, only round 1, neither person submitted, and two log entries mentioning “Probe aus dem Test”. The sole answer is the known empty Alex answer for question 1, round 1.
6. README, TECHNIKSTAND, ARBEITSPAKETE, and FRAGEN_FUER_MORGEN still need reconciliation with actual publication and subsequent acceptance results.

## Sequence and ownership

Codex executes the remaining work. Claude reviews the exact resulting commits under docs/reviews/V33-pruefauftrag.md. Resume or hand over the existing paused session explicitly before any writer is started. Do not run competing writers or start the fallback script at the same time.

### 1. Prepare access and restoration before writes

Recheck Git, active sessions, production counts, round states, and known test record IDs. Verify browser authentication, authenticated ping, lage as both people, deployed function source, and available cleanup access. Retrieve secrets only through the authorized path and keep them out of files, logs, and reports.

Prepare the exact cleanup statements and a protected baseline of the records to be touched. Name each test record with a unique run identifier and record returned IDs. Obtain any action approval required by the chosen tool immediately before the affected operation. Do not expand database grants, weaken RLS, or use another route to bypass a rejection.

If real answers or submissions have appeared, do not overwrite or reset them. Replan the survey test around an isolated environment or an agreed testing window. Any additional environment cost requires separate approval. The original requirement to leave round 1 empty applies only while that remains the genuine initial state.

Do not begin submission or round creation until cleanup and baseline restoration are available. The production function has no action to delete survey rounds or reset both submissions.

### 2. Run V33b against the actual backend

1. As each person, create and edit a process record, reload to verify persistence, confirm it is hidden from the other person until shared, share and revoke access, then delete the test record. Check foreign edit and delete rejection.
2. Exercise scale, number, choice, text, example, and “cannot judge” answers. Check invalid input rejection and ensure the other person's answer content is absent from the response before both submissions.
3. Submit, repeat submission, verify the timestamp remains unchanged, verify answers are locked, withdraw before the other person submits, then submit both. Verify mutual visibility and refusal of withdrawal after both submissions.
4. Create a new round and verify it is empty while the completed test round is correctly shown as history. Verify premature round creation is rejected. Exercise the relevant competing submission and withdrawal cases.
5. Save and reload one tool classification, verify persistence in the house, and verify hub register records remain unchanged. Restore its previous state.
6. Where the review requires it, exercise shared system editing on a disposable record. Keep the main gfweekly function untouched.

### 3. Finish authenticated V33d in the browser

Use separate Alex and Lea sessions on the published page. Follow the navigation entry and exercise the main workflow against the real backend. At 390 px, create, save, reload, and delete a test process record. Check 1440 px, light and dark display, focus and keyboard navigation, survey lock and results display, and usable filtering of the real tool list. Record the actual screen reader check or explicitly leave that evidence open. Do not substitute mocked browser tests for these observations.

### 4. Clean up and prove restoration

Remove only this run's records and logs plus the explicitly identified Cowork leftovers. Restore classifications and round state through prepared statements with precise IDs and expected values. Never bulk clear the gfweekly_sa_* tables.

Given the freshly verified initial state, success means: only round 1 remains, neither submission is set, no answers remain, no process records remain, no test tool classifications remain, and no identified test log entries remain. Check for concurrent user changes before cleanup and preserve them if any appear.

Replace personal usage counts in the “Das Hohe Haus” system entry with neutral wording, and update the seed consistently so the wording does not return on a future initialization. Preserve unrelated system content.

### 5. Review, documentation, and release closure

Write a V33b evidence report tied to the tested commit, with action, expected response, observed response, persisted effect, and cleanup result. Include authenticated V33d browser evidence. Repair any serious or medium findings within V33 scope, retest affected paths, and obtain Claude's review of the exact commit, up to three rounds as specified in the package.

Update TECHNIKSTAND, README, ARBEITSPAKETE, and FRAGEN_FUER_MORGEN with verified outcomes. Commit only the agreed paths, rebase, push, and verify the published files after any code changes. Let the planned Cowork task handle notification; send no additional messages.

## Completion criteria

V33 is complete only when production effects and visibility rules are proven for both people, the mobile workflow works, cleanup is verified, no serious or medium findings remain, and documentation matches the live release. Record any remaining minor or untested accessibility detail explicitly.

Estimated effort: approximately 60 to 90 minutes once authentication and necessary action approvals are available, excluding repairs. No production changes were made while preparing this plan.

## Session closure

Closed at Alexander's request on 09.10.2026. The plan is saved for a future session; its execution has not started and no automatic continuation is scheduled by this session. V33b and authenticated V33d acceptance remain open. Resume with step 1 and a fresh state check before any production writes.
