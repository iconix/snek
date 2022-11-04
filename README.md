# snek: a snake game with HTML5 canvas and vanilla JS

Learning HTML5 canvas for making 2D games.

## demo (working as of sep 2022): https://snek-62de1.web.app

- with motion controls for mobile!
- with snek `Teleport` (through walls, pacman-style) and `Phase` (through its own body) power-ups!

### wishlist
- [ ] debug mode: extra logging, output debug info to screen (like canvas dimensions, etc.)
- [ ] add thought bubbles at random as the snek eats its food? when it's gone a while without food (so hungry...)?
    - "snek refers to images of snakes with interior monologue captioning applied" (knowyourmeme)
- [ ] (iOS safari issues) swipe up to full screen not working
- [ ] an 'expand'/'enhance' power up that (temporarily?) makes the board larger (& so snake has more room to maneuver) ?

## locally build and run project

```bash
λ npm install
λ npm run server
```

## firebase hosting

```bash
λ nvm use --lts
λ npm install -g firebase-tools
λ firebase login
λ firebase init  # one-time setup
λ firebase deploy
```
