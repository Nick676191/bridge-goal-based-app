# TENET app (clickable prototype)

This is milestone 1 from the v1 plan: every screen of the iPhone app, working
buttons, and fake data. Nothing is saved; closing the app resets it.

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

- **Log in** skips straight to the app; **Create account** walks through sign-up.
- On any post: **Reply** (bottom left), **Commit** (the pen, center), and the
  **star** (bottom right), which turns into an arrow when you encourage.
- Open a goal: switch between **Tips** (left) and **Updates** (right). On a goal you haven't
  committed to, the Updates box asks you to commit first.
- Post an update with **Tag as a setback** on.
- Under any tip or update, tap **Reply** to answer it or the star to encourage it.
  Tips, updates and replies are limited to 300 characters.
- **Activity**: Maya's achieved goal shows how people who committed are notified.
- On your own goal, use **Where does this goal stand?** under the post to mark it achieved or dropped.
- **Post** tab: watch the SMART Principles fill in as you type (tick Attainable
  and Relevant yourself), add up to 4 photos and one video (60 seconds max), and
  pick up to 3 categories (or tap **New category** if none fit).
- **Explore**: tap a category, or search "marathon" or "Maya".
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
      welcome.tsx, onboarding.tsx, settings.tsx, edit-profile.tsx
    components/      Pieces used on many screens (post card, action bar, buttons)
    data/
      types.ts       The shapes of users, goals, tips, updates
      mock.ts        The fake data
      store.tsx      Shared state: what happens when you press each button
    lib/             Feed ranking, timestamps, SMART checks
    theme.ts         Colors, fonts and spacing for the whole app
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

Built with Expo SDK 57 and Expo Router. In milestone 2, `src/data/store.tsx`
starts reading and writing a real Supabase database instead of `mock.ts`.
