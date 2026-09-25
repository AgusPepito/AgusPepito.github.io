# Supabase leaderboards

## Activate the database

1. Open the Supabase project, choose **SQL Editor → New query**, paste all of `supabase/leaderboard.sql`, then click **Run**. The script is transactional and can be rerun without deleting scores.
2. Open **Authentication → Sign In / Providers**, enable **Allow anonymous sign-ins**, and save. Keep user signups enabled.
3. Keep the Data API enabled with the `public` schema exposed. Do not expose `race_private`. Automatic table exposure can remain disabled: the script explicitly grants access to only the two public functions.
4. Open the updated game and enter your **Pilot name** above the level picker. Choose **Save**, or press **Race** to save the name and start. Complete a campaign level. Scores publish at each level boundary, including automatic transitions within an area. The main-menu **Top times** chart loads submitted scores automatically.

Project URL and publishable browser key are in `src/racer/leaderboard-config.js`. They are intentionally public and travel with the static build; no secret, service-role key, database password, or deployment environment setting is needed.

## Behavior

- Top 10 for each of the 24 courses, fastest first, one best time per anonymous user and layout revision. Equal times are ordered by the earliest stored achievement, then a stable internal ID.
- The main-menu timing chart follows the selected level. Desktop shows the chart beside pilot/course controls; narrow screens stack it beneath them. Each row shows position, pilot, exact time and an elapsed-time bar on a shared zero-based scale. Shorter bars are faster.
- The approved menu layout keeps the moving course background visible between the panels. The area header browses the six areas, and four named rows select individual levels. Rows communicate selected/cleared/locked state, with an unlock hint below. The Race button names the selected level; its status and loading panel communicate preparation or locked areas. Campaign/Practice, Controls, music and fullscreen remain available.
- **Your best** uses the actual saved campaign time for the selected revision, or a faster own published time if returned in the live Top 10. It remains independent of mock pilots. With no record, the panel shows **No completed run**. Local personal bests can be shown even when they fall outside the online Top 10; an online rank outside the Top 10 is not inferred.
- There is one leaderboard, with no Mock/Live switch. Actual records always occupy the first rows, sorted fastest first. If fewer than ten records exist, local invented pilots fill the remaining places beneath them. Those rows have an **EXAMPLE** label and no rank. They disappear as real players fill the board and never set **Top time** or **Your best**. The fixtures in `src/racer/leaderboard-mocks.js` never enter Supabase or the pending upload queue.
- Scores load when the menu opens and when its selected level changes, with a 30-second cache. A successful upload invalidates the cache; connectivity recovery or the refresh button also fetches new scores. A failed refresh retains any previously fetched real records alongside clearly marked example fillers.
- Each finished campaign level queues its time. A saved nickname enables automatic uploads. Without a nickname, completions wait locally for the player to choose one.
- Slow/offline requests never block gameplay. Pending scores retain only the fastest per level and retry on the next completion, page load, connectivity recovery, or **Refresh times / Save**. Local storage must be available to retain pending times across reloads.
- Existing pre-feature local records are not imported. Practice, crashes, and construction reviews never submit.
- Time is the existing simulation elapsed time, excluding pause and course-loading waits. It resets at each level boundary. Times use integer milliseconds (rounded up), and the board displays three decimal places. The race HUD retains its existing hundredths display.
- Automatic campaign transitions retain the game's existing speed/pose rules. Flying starts and manual starts share the same leaderboard in this initial version.
- Layout revision comes from `CAMPAIGN_LAYOUT_REVISION` (currently `r3`). When a layout or timing rule changes, bump that revision and add matching course/revision rows in the SQL before publishing. Old online records stay separate; old unsent local scores are discarded at a revision change.
- Identity is stored by Supabase Auth in this browser/site. Localhost and the hosted game have separate identities. Clearing browser data or switching devices creates another pilot. Nicknames are public, not unique, and are updated across that identity's scores on its next successful submission.

## Access and limitations

Private tables have RLS enabled and no browser table grants. A signed-in user can submit only as `auth.uid()` through the submission function. The server validates nickname length, accepted courses/revisions and the 1-second to 1-hour duration range; an atomic upsert only improves the player's time. Public reads return ten nicknames/times and an own-row marker, without exposing user IDs or auth data.

This is a casual leaderboard: the browser reports completion time. Range checks and identity protection do not prove a legitimate run. No replay verification or authoritative game server is included. Supabase's anonymous-signup rate limits still apply; CAPTCHA can be added later with a corresponding game-side challenge if abuse requires it (enabling CAPTCHA alone will block the current anonymous signup flow).

## User-owned verification

No tests, simulations, browser smoke checks, or visual gameplay reviews were run by the agent. After applying SQL, the user should try pilot-name entry, changing levels, a campaign completion, a slower replay, a faster replay, a second level, practice, and an offline completion followed by **Refresh times**. Confirm real scores replace example rows, the best persists and the boards remain separate.
