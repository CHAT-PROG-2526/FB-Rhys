# Flappy-Bird
Flappy Bird (Class Project)


## Flappy Bird App Spec

- Platform: browser + mobile responsive
- Tech: plain HTML / CSS / JavaScript
- Style: pixel-art look
- Gameplay: single-screen, local play only
- Controls: tap/click, Space, Arrow Up
- Sound: background music loop + sound effects

### Required game states

- `TITLE`
  - show game title
  - show best score
  - show instructions: “Tap or press Space to start”
- `READY`
  - show “Get Ready”
  - bird hovering before first flap
- `PLAYING`
  - game loop runs
  - obstacles move
  - scoring active
- `GAME_OVER`
  - overlay with current score
  - best score
  - restart prompt/button
  - tap/click or key press should restart

### Gameplay mechanics

- Bird with gravity and flap impulse
- Tap/click or Space/Arrow Up causes a flap
- Pipes are repeating obstacles with a gap
- Collision with pipes or floor/ceiling ends the game
- Score increments when the bird passes each pipe
- Speed increases gradually as score rises

### Audio

- Background music should loop
- Sound effects for:
  - flap
  - point scored
  - crash
- Mute toggle available on screen

### Leaderboard and persistence

- Use `localStorage`
- Store top 10 scores sorted highest first
- Keep best score as well
- Each entry includes score and date
- Show leaderboard on title screen or game over screen
- Use a consistent key like `flappyLeaderboard`

### UI / UX

- Responsive canvas or layout for mobile and desktop
- Pixel-art style UI text and sprites
- Clear restart flow:
  - show overlay at game over
  - allow restart by button or tap/click anywhere
  - optionally accept key press to restart
- Show score during play

### Development requirements

- Each branch implements the full feature set independently
- Use the same game flow, controls, and localStorage convention
- No external framework required
- Keep code simple and self-contained
- You may use placeholder pixel-art sprites at first

### Optional but expected

- Title/menu screen
- “Get Ready” state before first flap
- Score + best score visible in game over
- Local leaderboard persisted across refresh