# snek: a snake game with HTML5 canvas and vanilla JS

learning HTML5 canvas for making 2D games.

## working demo (as of nov 2022): https://snek-62de1.web.app

### special features
- with motion controls for mobile!
- with snek `Teleport` (through walls, pacman-style) and `Phase` (through its own body) power-ups!

## architecture

for a detailed overview of game architecture, please refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

## development

### locally build and run project

```bash
λ npm install
λ npm run server
```

### run tests

```bash
λ npm test
```

### firebase hosting

```bash
λ nvm use --lts
λ npm install -g firebase-tools
λ firebase login
λ firebase init  # one-time setup
λ npm run build  # build latest code
λ firebase deploy
```

## wishlist
- [ ] reimplement in phaser, just to compare and contrast
- [ ] motion controls 'could be better' - game is a bit too difficult/jittery with motion
- [ ] turn on firebase cloud logging and analytics
- [ ] debug mode: extra logging, output debug info to screen (like canvas dimensions, etc.)
- [ ] add thought bubbles at random as snek eats its food? when it's gone a while without food (so hungry...)?
    - "snek refers to images of snakes with interior monologue captioning applied" (knowyourmeme)
- [ ] fix iOS safari issue: swipe up to full screen not working
- [ ] add an 'expand'/'enhance' power up that (temporarily?) makes the board larger (& so snake has more room to maneuver) ?
- [ ] at some score threshold, start losing points for time/moves spent without eating (inefficiency penalty)
- [ ] add audio feedback to make game more accessible/interactive
- [ ] consider a more centralized state management approach
- [ ] consider more modular input handling
- [ ] add window resize handling
