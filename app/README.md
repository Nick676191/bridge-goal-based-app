# PYN app

The iPhone app, connected to PYN's Supabase database (stage 1 of the plan).

What's saved online, so it's there after you close the app and other people
see it: accounts, profiles and profile photos, goal posts with their photos and
video, goal status (achieved or dropped), and follows.

What still lives on your phone only, until stage 2: commits, encouragements,
tips, updates, replies, notifications and messages. They work, but reset when
the app restarts and nobody else sees them.

The fake-data prototype is saved as the `prototype-v1` tag in git, if you ever
want to look at it again: `git checkout prototype-v1`.

## Set up the database (once)

1. In the Supabase dashboard, open your **pyn** project.
2. Go to **SQL Editor**, click **New query**, paste the whole of
   `supabase/migrations/20261105000000_stage1_accounts_and_goals.sql`, and click
   **Run**. It should say "Success. No rows returned".
3. Go to **Authentication > Sign In / Providers**, open **Email**, turn off
   **Confirm email**, and save. While we're testing, this lets new accounts log
   in right away. Turn it back on before the beta; by then the app will handle
   the confirmation link.

## Open it on your iPhone

You need a Mac (or any computer) and your iPhone on the same Wi-Fi.

1. Install Node.js (the LTS version) from https://nodejs.org if you don't have it.
   Check with `node -v` in Terminal.
2. Get the code and install its packages:

   ```sh
   git clone https://github.com/Nick676191/bridge-goal-based-app.git
   cd bridge-goal-based-app
   git checkout app-prototype
   cd app
   npm install
   ```

3. Start the development server:

   ```sh
   npx expo start
   ```

4. A QR code appears in Terminal. Open the iPhone **Camera**, point it at the
   code, and tap the banner. The app opens in Expo Go.

Leave Terminal running while you use the app. When you save a change to any
file in `src/`, the app on your phone reloads by itself.

If your phone can't connect (common on work or school Wi-Fi), stop the server
with Ctrl+C and run `npx expo start --tunnel` instead.

To see it in a browser instead, press `w` in the Terminal window after
`npx expo start`.

## Things to try

- **Create account** makes a real account. Then log out (Profile > the gear >
  Log out) and **Log in** again: your goals are still there.
- Make a second account (another email) to see two people at once: follow one
  from the other, and pull down on Home to load the newest posts.
- On any post: **Reply** (bottom left), **Commit** (the pen, center), and the
  **star** (bottom right), which turns into an arrow when you encourage.
- Open a goal: switch between **Tips** (left) and **Updates** (right). On a goal you haven't
  committed to, the Updates box asks you to commit first.
- Post an update with **Tag as a setback** on.
- Under any tip or update, tap **Reply** to answer it or the star to encourage it.
  Tips, updates and replies are limited to 300 characters.
- **Activity**: when you mark a goal achieved, people who committed are notified.
- **Messages** (the speech bubbles at the top right of Home): your conversations,
  newest first, with a navy badge for unread ones. The pencil starts a new
  conversation, and every profile has a **Message** button.
- **Share** (the paper plane at the top right of any post): send the goal to
  people you follow (it lands in your Messages with them), or tap **More options** for the iPhone share sheet
  (Messages, copy link, AirDrop). The message reads "Check out [name]'s goal
  that they posted on PYN. Follow along with their progress here: [link]".
  The link (`pyn://goal/...`) only opens on phones with the app installed for
  now; a web link comes before launch.
- On your own goal, use **Where does this goal stand?** under the post to mark it achieved or dropped.
- **Post** tab: watch the SMART Principles fill in as you type (tick Attainable
  and Relevant yourself), add up to 4 photos and one video (60 seconds max), and
  pick up to 3 categories (or tap **New category** if none fit).
- **Explore**: tap a category, or search for a goal or a person.
- **Profile > Edit profile**: tap the photo to add your own.
- **Profile**: tap **Followers** or **Following** to see the lists.
- On someone's profile, the **...** button has Report and Block.

## How the code is organized

```
app/
  src/
    app/             Every file here is a screen. Folder names become URLs.
      _layout.tsx    Root: loads fonts and shared state, sets up navigation
      (tabs)/        The five bottom tabs: index (Home), explore, post,
                     notifications (Activity), profile
      goal/[id].tsx  A goal's page; [id] means "any goal id"
      user/[username].tsx  Someone else's profile
      connections/[username].tsx  Followers and Following lists
      share/[id].tsx Share a goal in the app or through the share sheet
      messages/      The inbox (index), one conversation ([username]), new message
      welcome.tsx, onboarding.tsx (sign-up), login.tsx, settings.tsx, edit-profile.tsx
    components/      Pieces used on many screens (post card, action bar, buttons)
    data/
      types.ts       The shapes of users, goals, tips, updates
      api.ts         Every read and write to the Supabase database
      store.tsx      Shared state: what happens when you press each button
    lib/             Feed ranking, timestamps, SMART checks, the Supabase connection
  supabase/
    migrations/      The database setup, as SQL to run in Supabase
    theme.ts         Colors (Carolina blue and navy), fonts and spacing
```

If you know Python: `types.ts` is like a set of dataclasses, `store.tsx` is
like a class that holds the app's state with a method per button, and each
screen is a function that returns what to draw.

## Commands

```sh
npx expo start     # run the app
npm run typecheck  # check for type errors
npm run lint       # check for common mistakes
```

Built with Expo SDK 58, Expo Router and Supabase.
