const BLOCK_SIZE = 32;
const ROWS = 20, COLS = 14;
const TETROMINOES = {
  I: {
    color: '#08ffff', // light blue
    blocks: [
      [[0,1],[1,1],[2,1],[3,1]], // 0 deg
      [[2,0],[2,1],[2,2],[2,3]], // 90 deg
      [[0,2],[1,2],[2,2],[3,2]], // 180 deg
      [[1,0],[1,1],[1,2],[1,3]]  // 270 deg
    ]
  },
  J: {
    color: '#0000f9', // dark blue
    blocks: [
      [[0,0],[0,1],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
      [[1,0],[1,1],[0,2],[1,2]]
    ]
  },
  L: {
    color: '#ff9800', // orange 
    blocks: [
      [[2,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,1],[0,2]],
      [[0,0],[1,0],[1,1],[1,2]]
    ]
  },
  O: {
    color: '#ffff00', // yellow
    blocks: [
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]]
    ]
  },
  T: {
    color: '#a000f9', // purple
    blocks: [
      [[1,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[2,1],[1,2]],
      [[1,0],[0,1],[1,1],[1,2]]
    ]
  },
  S: {
    color: '#ff0000', // red
    blocks: [
      [[1,0],[2,0],[0,1],[1,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[1,1],[2,1],[0,2],[1,2]],
      [[0,0],[0,1],[1,1],[1,2]]
    ]
  },
  Z: {
    color: '#00c000', // green
    blocks: [
      [[0,0],[1,0],[1,1],[2,1]],
      [[2,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,0],[0,1],[1,1],[0,2]]
    ]
  }
};

// ---- AmbiClear tracking ----
let lastLockTime = { L: 0, R: 0 };
let lastLockRow = { L: -1, R: -1 };
let ambiClearRows = [];

//
// --- Core Tetromino Logic Functions ---
//
// The following section contains the fundamental functions that govern
// the behavior of tetrominoes within the game. This includes:
//
// - `canPlace`: Determining if a tetromino can be placed at a given
//   position and rotation without collision.
// - Movement functions (`moveTetromino`, `moveDown`): Handling horizontal
//   and vertical movement, including interactions with other pieces.
// - Rotation (`rotateTetromino`): Managing tetromino rotation, including
//   wall kicks.
// - Spawning (`spawnTetromino`, `spawnGhostTetromino`): Creating new
//   tetrominoes and their ghost counterparts.
// - Locking (`lockBothTetrominoes`): Finalizing the position of
//   tetrominoes on the board.
// - Board manipulation (`clearFullLines`): Clearing completed lines
//   and handling associated animations and scoring implications.
// - Sprite updates (`updateTetrominoSprites`, `updateGhostTetromino`):
//   Ensuring the visual representation of tetrominoes matches their
//   logical state.
//
// These functions are crucial for the interactive gameplay loop,
// responding to player input and managing the game state.
//{{REWRITTEN_CODE}}
//
// --- Core Tetromino Logic Functions ---
//
// The following section contains the fundamental functions that govern
// the behavior of tetrominoes within the game. This includes:
//
// - `canPlace`: Determining if a tetromino can be placed at a given
//   position and rotation without collision.
// - Movement functions (`moveTetromino`, `moveDown`): Handling horizontal
//   and vertical movement, including interactions with other pieces.
// - Rotation (`rotateTetromino`): Managing tetromino rotation, including
//   wall kicks.
// - Spawning (`spawnTetromino`, `spawnGhostTetromino`): Creating new
//   tetrominoes and their ghost counterparts.
// - Locking (`lockBothTetrominoes`): Finalizing the position of
//   tetrominoes on the board.
// - Board manipulation (`clearFullLines`): Clearing completed lines
//   and handling associated animations and scoring implications.
// - Sprite updates (`updateTetrominoSprites`, `updateGhostTetromino`):
//   Ensuring the visual representation of tetrominoes matches their
//   logical state.
//
// These functions are crucial for the interactive gameplay loop,
// responding to player input and managing the game state.
//
function canPlace(tetromino, x, y, rotation, otherTetromino) {
  const blocks = TETROMINOES[tetromino.type].blocks[rotation];
  for (let i = 0; i < 4; i++) {
    const bx = x + blocks[i][0];
    const by = y + blocks[i][1];
    if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return false;
    if (board[by][bx]) return false;
    // Check against other falling tetromino
    if (otherTetromino) {
      // Ensure otherTetromino and its properties are defined before accessing them
      if (otherTetromino.type && TETROMINOES[otherTetromino.type] && TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation]) {
        const otherBlocks = TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
        for (let j = 0; j < 4; j++) {
          const obx = otherTetromino.x + otherBlocks[j][0];
          const oby = otherTetromino.y + otherBlocks[j][1];
          if (bx === obx && by === oby) return false;
        }
      }
    }
  }
  return true;
}

function moveTetromino(tetromino, dx) {
  const otherTetromino = tetromino.side === 'L' ? window.rightTetromino : window.leftTetromino;
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  let canMove = true, blockedByOther = false;
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0] + dx;
    const by = tetromino.y + blocks[i][1];
    if (bx < 0 || bx >= COLS || (by >= 0 && board[by][bx])) {
      canMove = false;
      break;
    }
    // Check for collision with other falling tetromino
    if (otherTetromino && otherTetromino.type && TETROMINOES[otherTetromino.type]) {
        const otherBlocks = TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
        for (let j = 0; j < 4; j++) {
          if (
            bx === otherTetromino.x + otherBlocks[j][0] &&
            by === otherTetromino.y + otherBlocks[j][1]
          ) {
            blockedByOther = true;
            break;
          }
        }
    }
    if (blockedByOther) break;
  }
  if (canMove && !blockedByOther) {
    tetromino.x += dx;
    updateTetrominoSprites(tetromino);
  } else if (blockedByOther) {
    // --- Mash-off logic ---
    let otherMoveIntent = 0;
    if (otherTetromino.side === 'L') {
      otherMoveIntent = leftKeysHeld.right ? 1 : (leftKeysHeld.left ? -1 : 0);
    } else {
      otherMoveIntent = cursorsRight.right.isDown ? 1 : (cursorsRight.left.isDown ? -1 : 0);
    }
    if (otherMoveIntent === -dx) {
      return;
    }
    let pushed = tryPushOtherHorizontally(otherTetromino, dx);
    if (pushed) {
      tetromino.x += dx;
      updateTetrominoSprites(tetromino);
    }
  }
}

function tryPushOtherHorizontally(tetromino, dx) {
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0] + dx;
    const by = tetromino.y + blocks[i][1];
    if (bx < 0 || bx >= COLS || (by >= 0 && board[by][bx])) {
      return false; 
    }
  }
  tetromino.x += dx;
  updateTetrominoSprites(tetromino);
  return true;
}

function moveDown(tetromino, side) {
  const otherTetromino = side === 'L' ? window.rightTetromino : window.leftTetromino;
  let newY = tetromino.y + 1;
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  let blockedByBoard = false, blockedByOther = false;

  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0];
    const by = tetromino.y + blocks[i][1] + 1;
    if (by >= ROWS || (by >= 0 && board[by][bx])) {
      blockedByBoard = true;
      break;
    }
    if (otherTetromino && otherTetromino.type && TETROMINOES[otherTetromino.type]) {
        const otherBlocks = TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
        for (let j = 0; j < 4; j++) {
          if (
            bx === otherTetromino.x + otherBlocks[j][0] &&
            by === otherTetromino.y + otherBlocks[j][1]
          ) {
            blockedByOther = true;
            break;
          }
        }
    }
    if (blockedByOther) break;
  }

  if (!blockedByBoard && !blockedByOther) {
    tetromino.y = newY;
    updateTetrominoSprites(tetromino);
  } else if (blockedByOther) {
    let pushed = tryPushOtherDown(otherTetromino, side === 'L' ? 'R' : 'L');
    if (pushed) {
      tetromino.y = newY;
      updateTetrominoSprites(tetromino);
    } else {
      lockBothTetrominoes(tetromino, otherTetromino);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const bx = tetromino.x + blocks[i][0];
      const by = tetromino.y + blocks[i][1];
      board[by][bx] = { type: tetromino.type, sprite: tetromino.sprites[i], side: tetromino.side, lockTime: Date.now() };
    }
    clearFullLines(tetromino.scene);
    
    let newTet = spawnTetromino(tetromino.scene, side);
    const otherTetAfterSpawn = side === 'L' ? window.rightTetromino : window.leftTetromino; // Use the one that wasn't just replaced

    if (side === 'L') {
        window.leftTetromino = newTet;
    } else {
        window.rightTetromino = newTet;
    }
    
    // Check for game over after new pieces are in window references
    const currentLeft = window.leftTetromino;
    const currentRight = window.rightTetromino;

    if (!canPlace(currentLeft, currentLeft.x, currentLeft.y, currentLeft.rotation, currentRight) || 
        !canPlace(currentRight, currentRight.x, currentRight.y, currentRight.rotation, currentLeft)) {
      alert('Game Over!');
      location.reload();
      return;
    }
  }
}

function tryPushOtherDown(tetromino, side) {
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0];
    const by = tetromino.y + blocks[i][1] + 1;
    if (by >= ROWS || (by >= 0 && board[by][bx])) {
      return false; 
    }
  }
  tetromino.y += 1;
  updateTetrominoSprites(tetromino);
  return true;
}

function lockBothTetrominoes(t1, t2) {
  [t1, t2].forEach(tetromino => {
    if (!tetromino || !tetromino.type) return; // Safety check
    const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
    for (let i = 0; i < 4; i++) {
      const bx = tetromino.x + blocks[i][0];
      const by = tetromino.y + blocks[i][1];
      // Ensure by is within board bounds before assignment
      if (by >= 0 && by < ROWS && bx >=0 && bx < COLS) {
        board[by][bx] = { type: tetromino.type, sprite: tetromino.sprites[i], side: tetromino.side, lockTime: Date.now() };
      }
    }
  });
  clearFullLines(t1.scene || t2.scene);

  // Destroy old ghost sprites
  if (window.leftGhostTetromino && window.leftGhostTetromino.sprites) {
    window.leftGhostTetromino.sprites.forEach(s => s.destroy());
  }
  if (window.rightGhostTetromino && window.rightGhostTetromino.sprites) {
    window.rightGhostTetromino.sprites.forEach(s => s.destroy());
  }

  let newLeft = spawnTetromino(t1.scene || t2.scene, 'L');
  let newRight = spawnTetromino(t1.scene || t2.scene, 'R');
  window.leftTetromino = newLeft;
  window.rightTetromino = newRight;

  // Spawn new ghost tetrominoes
  window.leftGhostTetromino = spawnGhostTetromino(t1.scene || t2.scene, 'L', window.leftTetromino);
  window.rightGhostTetromino = spawnGhostTetromino(t2.scene || t2.scene, 'R', window.rightTetromino);

  if (!canPlace(newLeft, newLeft.x, newLeft.y, newLeft.rotation, newRight) || 
      !canPlace(newRight, newRight.x, newRight.y, newRight.rotation, newLeft)) {
    alert('Game Over!');
    location.reload();
  }
}

function updateTetrominoSprites(tetromino, isGhost = false) {
  if (!tetromino || !tetromino.type || !TETROMINOES[tetromino.type]) return; // Safety check
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  tetromino.blocks = blocks; // Update current shape based on rotation
  for (let i = 0; i < 4; i++) {
    if (!tetromino.sprites || !tetromino.sprites[i]) continue; // Safety check for sprite
    const gx = tetromino.x + blocks[i][0];
    const gy = tetromino.y + blocks[i][1];
    tetromino.sprites[i].x = gx * BLOCK_SIZE + BLOCK_SIZE/2;
    tetromino.sprites[i].y = gy * BLOCK_SIZE + BLOCK_SIZE/2;
    if (isGhost) {
      tetromino.sprites[i].setAlpha(0.3);
      tetromino.sprites[i].setDepth(0);
      tetromino.sprites[i].setTintFill(0x808080); // Set ghost to gray
    } else {
      tetromino.sprites[i].setAlpha(1);
      tetromino.sprites[i].setDepth(1);
      tetromino.sprites[i].clearTint(); // Ensure active tetromino shows its original texture color
    }
  }
}

function rotateTetromino(tetromino) {
  if (!tetromino || !tetromino.type) return; // Safety check
  const oldRotation = tetromino.rotation;
  const newRotation = (tetromino.rotation + 1) % 4;
  const otherTetromino = tetromino.side === 'L' ? window.rightTetromino : window.leftTetromino;
  
  let canRotate = false;
  let newX = tetromino.x;

  if (canPlace(tetromino, tetromino.x, tetromino.y, newRotation, otherTetromino)) {
    canRotate = true;
  } else if (canPlace(tetromino, tetromino.x - 1, tetromino.y, newRotation, otherTetromino)) {
    newX = tetromino.x - 1;
    canRotate = true;
  } else if (canPlace(tetromino, tetromino.x + 1, tetromino.y, newRotation, otherTetromino)) {
    newX = tetromino.x + 1;
    canRotate = true;
  } else if (TETROMINOES[tetromino.type].blocks.length === 4) { // Assuming I-piece might need 2-block kicks
    if (canPlace(tetromino, tetromino.x - 2, tetromino.y, newRotation, otherTetromino)) {
      newX = tetromino.x - 2;
      canRotate = true;
    } else if (canPlace(tetromino, tetromino.x + 2, tetromino.y, newRotation, otherTetromino)) {
      newX = tetromino.x + 2;
      canRotate = true;
    }
  }

  if (canRotate) {
    tetromino.x = newX;
    tetromino.rotation = newRotation;
    updateTetrominoSprites(tetromino);
    if (tetromino.side === 'L') {
      if (window.leftTetromino && window.leftGhostTetromino) {
        updateGhostTetromino(window.leftTetromino, window.leftGhostTetromino, window.rightTetromino);
      }
    } else {
      if (window.rightTetromino && window.rightGhostTetromino) {
        updateGhostTetromino(window.rightTetromino, window.rightGhostTetromino, window.leftTetromino);
      }
    }
  }
}

function spawnTetromino(scene, side) {
  const types = Object.keys(TETROMINOES);
  const type = types[Math.floor(Math.random() * types.length)];
  const tet = TETROMINOES[type];
  const rotation = 0;
  const x = side === 'L' ? 4 : 9; 
  const y = 0;
  const color = tet.color;
  const shape = tet.blocks[rotation];
  const sprites = [];
  for (let i = 0; i < 4; i++) {
    let blockX = (x + shape[i][0]) * BLOCK_SIZE + BLOCK_SIZE/2;
    let blockY = (y + shape[i][1]) * BLOCK_SIZE + BLOCK_SIZE/2;
    let texKey = `block_${type}_${side}`;
    let sprite = scene.add.sprite(blockX, blockY, texKey);
    sprite.setDepth(1);
    sprites.push(sprite);
  }
  return {
    type, color, rotation, x, y, blocks: shape, sprites, side, scene
  };
}

// --- Ghost Piece Functions ---
function spawnGhostTetromino(scene, side, activeTetromino) {
  if (!activeTetromino || !activeTetromino.type || !TETROMINOES[activeTetromino.type]) {
    // console.error("Cannot spawn ghost: active tetromino is invalid", activeTetromino);
    return { sprites: [] }; // Return a minimal object to prevent errors
  }
  const { type, color, rotation, x, y } = activeTetromino;
  const shape = TETROMINOES[type].blocks[rotation];
  const sprites = [];
  for (let i = 0; i < 4; i++) {
    let blockX = (x + shape[i][0]) * BLOCK_SIZE + BLOCK_SIZE/2;
    let blockY = (y + shape[i][1]) * BLOCK_SIZE + BLOCK_SIZE/2;
    let texKey = `block_${type}_${side}`; 
    let sprite = scene.add.sprite(blockX, blockY, texKey);
    sprite.setDepth(0); 
    sprite.setAlpha(0.3); 
    sprites.push(sprite);
  }
  return {
    type, color, rotation, x, y, blocks: shape, sprites, side, scene
  };
}

function updateGhostTetromino(tetromino, ghostTetromino, otherTetromino) {
  if (!tetromino || !ghostTetromino || !tetromino.type || !ghostTetromino.type || !TETROMINOES[tetromino.type]) return;

  ghostTetromino.x = tetromino.x;
  ghostTetromino.rotation = tetromino.rotation;
  ghostTetromino.type = tetromino.type; 
  ghostTetromino.blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];

  let lowestY = tetromino.y;
  // Pass a temporary object representing the ghost to canPlace to avoid modifying tetromino's y for the check
  let tempGhostForCheck = { ...tetromino }; 
  while (canPlace(tempGhostForCheck, tempGhostForCheck.x, lowestY + 1, tempGhostForCheck.rotation, otherTetromino)) {
    lowestY++;
  }
  ghostTetromino.y = lowestY;

  updateTetrominoSprites(ghostTetromino, true);
}


let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let cursorsLeft, cursorsRight;
let leftTetromino, rightTetromino;
let leftGhostTetromino, rightGhostTetromino; // Added ghost variables
let dropTimerLeft = 0, dropTimerRight = 0;

let fastDropLeft = false, fastDropRight = false;

let moveTimers = {
  left: { left: 0, right: 0 }, 
  right: { left: 0, right: 0 }, 
  down: { left: 0, right: 0 } 
};
const INITIAL_DELAY = 200; 
const REPEAT_INTERVAL = 40; 

let leftKeysHeld = { left: false, right: false, down: false };
let paused = false;
let userPaused = false;

function create() {
  Object.entries(TETROMINOES).forEach(([type, tet]) => {
    this.textures.remove(`block_${type}_L`);
    this.textures.remove(`block_${type}_R`);

    let gfxL = this.add.graphics();
    gfxL.fillStyle(Phaser.Display.Color.HexStringToColor(tet.color).color, 1);
    gfxL.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    gfxL.fillStyle(0xffffff, 0.25);
    gfxL.fillEllipse(BLOCK_SIZE/2, BLOCK_SIZE/3, BLOCK_SIZE*0.8, BLOCK_SIZE*0.5);
    gfxL.fillStyle(0x000000, 0.10);
    gfxL.fillRect(0, BLOCK_SIZE*0.7, BLOCK_SIZE, BLOCK_SIZE*0.3);
    gfxL.lineStyle(2, 0x222222, 1);
    gfxL.strokeRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    gfxL.generateTexture(`block_${type}_L`, BLOCK_SIZE, BLOCK_SIZE);
    gfxL.destroy();

    let gfxR = this.add.graphics();
    gfxR.fillStyle(Phaser.Display.Color.HexStringToColor(tet.color).color, 1);
    gfxR.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    gfxR.lineStyle(0);
    gfxR.fillStyle(0xffffff, 0.28);
    gfxR.beginPath();
    gfxR.moveTo(0, 0);
    gfxR.lineTo(BLOCK_SIZE, 0);
    gfxR.lineTo(BLOCK_SIZE*0.7, BLOCK_SIZE*0.3);
    gfxR.lineTo(BLOCK_SIZE*0.3, BLOCK_SIZE*0.3);
    gfxR.lineTo(0, 0);
    gfxR.closePath();
    gfxR.fillPath();
    gfxR.fillStyle(0x000000, 0.18);
    gfxR.beginPath();
    gfxR.moveTo(BLOCK_SIZE, BLOCK_SIZE);
    gfxR.lineTo(0, BLOCK_SIZE);
    gfxR.lineTo(BLOCK_SIZE*0.3, BLOCK_SIZE*0.7);
    gfxR.lineTo(BLOCK_SIZE*0.7, BLOCK_SIZE*0.7);
    gfxR.lineTo(BLOCK_SIZE, BLOCK_SIZE);
    gfxR.closePath();
    gfxR.fillPath();
    gfxR.lineStyle(2, 0x222222, 1);
    gfxR.strokeRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    gfxR.generateTexture(`block_${type}_R`, BLOCK_SIZE, BLOCK_SIZE);
    gfxR.destroy();
  });

  if (!this.textures.exists('particle')) {
    let canvas = this.textures.createCanvas('particle', 1, 1).getContext('2d');
    canvas.fillStyle = '#fff';
    canvas.fillRect(0, 0, 1, 1);
    this.textures.get('particle').refresh();
  }

  cursorsLeft = this.input.keyboard.addKeys({
    left: 'C', right: 'B', down: 'V', rotate: 'G'
  });
  cursorsRight = this.input.keyboard.addKeys({
    left: 'J', right: 'L', down: 'K', rotate: 'I'
  });

  this.input.keyboard.on('keydown', function (event) {
    if (["C","B","V","F","J","L","K","I"].includes(event.key.toUpperCase())) {
      event.preventDefault();
    }
  });

  this.input.keyboard.on('keydown-C', () => { leftKeysHeld.left = true; });
  this.input.keyboard.on('keyup-C', () => { leftKeysHeld.left = false; });
  this.input.keyboard.on('keydown-B', () => { leftKeysHeld.right = true; });
  this.input.keyboard.on('keyup-B', () => { leftKeysHeld.right = false; });
  this.input.keyboard.on('keydown-V', () => { leftKeysHeld.down = true; });
  this.input.keyboard.on('keyup-V', () => { leftKeysHeld.down = false; });

  this.input.keyboard.on('keydown-SPACE', () => {
    userPaused = !userPaused;
    console.log(userPaused ? 'Game Paused' : 'Game Unpaused');
    // If pausing, maybe visually indicate pause on screen if desired later
  });

  leftTetromino = spawnTetromino(this, 'L');
  rightTetromino = spawnTetromino(this, 'R');
  window.leftTetromino = leftTetromino;
  window.rightTetromino = rightTetromino;

  // Spawn ghost tetrominoes after active ones
  leftGhostTetromino = spawnGhostTetromino(this, 'L', leftTetromino);
  rightGhostTetromino = spawnGhostTetromino(this, 'R', rightTetromino);
  window.leftGhostTetromino = leftGhostTetromino;
  window.rightGhostTetromino = rightGhostTetromino;
}

function update(time, delta) {
  if (userPaused) return;

  const leftTetromino = window.leftTetromino;
  const rightTetromino = window.rightTetromino;
  const leftGhostTetromino = window.leftGhostTetromino;
  const rightGhostTetromino = window.rightGhostTetromino;

  handleInput(this, delta);

  // Update ghost positions before movement and drop
  if (leftTetromino && leftGhostTetromino) {
    updateGhostTetromino(leftTetromino, leftGhostTetromino, rightTetromino);
  }
  if (rightTetromino && rightGhostTetromino) {
    updateGhostTetromino(rightTetromino, rightGhostTetromino, leftTetromino);
  }

  dropTimerLeft += delta;
  dropTimerRight += delta;

  let leftInterval = fastDropLeft ? 40 : 500;
  let rightInterval = fastDropRight ? 40 : 500;

  if (dropTimerLeft > leftInterval) {
    moveDown(leftTetromino, 'L');
    dropTimerLeft = 0;
  }
  if (dropTimerRight > rightInterval) {
    moveDown(rightTetromino, 'R');
    dropTimerRight = 0;
  }
}

function handleInput(scene, delta) {
  const leftTetromino = window.leftTetromino;
  const rightTetromino = window.rightTetromino;

  if (!leftTetromino || !rightTetromino) return; // Safety check

  if (leftKeysHeld.left) {
    moveTimers.left.left += delta;
    if (moveTimers.left.left === delta || moveTimers.left.left > INITIAL_DELAY) {
      moveTetromino(leftTetromino, -1);
      if (moveTimers.left.left > INITIAL_DELAY) moveTimers.left.left -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.left.left = 0;
  }
  if (leftKeysHeld.right) {
    moveTimers.left.right += delta;
    if (moveTimers.left.right === delta || moveTimers.left.right > INITIAL_DELAY) {
      moveTetromino(leftTetromino, 1);
      if (moveTimers.left.right > INITIAL_DELAY) moveTimers.left.right -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.left.right = 0;
  }
  fastDropLeft = leftKeysHeld.down;

  if (cursorsLeft.rotate.isDown) {
    rotateTetromino(leftTetromino);
    cursorsLeft.rotate.reset(); 
  }

  if (cursorsRight.left.isDown) {
    moveTimers.right.left += delta;
    if (moveTimers.right.left === delta || moveTimers.right.left > INITIAL_DELAY) {
      moveTetromino(rightTetromino, -1);
      if (moveTimers.right.left > INITIAL_DELAY) moveTimers.right.left -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.right.left = 0;
  }
  if (cursorsRight.right.isDown) {
    moveTimers.right.right += delta;
    if (moveTimers.right.right === delta || moveTimers.right.right > INITIAL_DELAY) {
      moveTetromino(rightTetromino, 1);
      if (moveTimers.right.right > INITIAL_DELAY) moveTimers.right.right -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.right.right = 0;
  }
  fastDropRight = cursorsRight.down.isDown;
  
  if (cursorsRight.rotate.isDown) {
    rotateTetromino(rightTetromino);
    cursorsRight.rotate.reset(); 
  }
}

function clearFullLines(scene) {
  paused = true;
  let clearedRows = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      clearedRows.push(y);
    }
  }
  if (clearedRows.length === 0) {
    paused = false;
    return;
  }
  let isAmbiClear = false;
  for (let row of clearedRows) {
    let leftUsed = false, rightUsed = false, leftTime = 0, rightTime = 0;
    for (let x = 0; x < COLS; x++) {
      if (board[row][x] && board[row][x].side === 'L') {
        leftUsed = true; leftTime = Math.max(leftTime, board[row][x].lockTime||0);
      }
      if (board[row][x] && board[row][x].side === 'R') {
        rightUsed = true; rightTime = Math.max(rightTime, board[row][x].lockTime||0);
      }
    }
    if (leftUsed && rightUsed && Math.abs(leftTime - rightTime) < 600) {
      isAmbiClear = true;
      ambiClearRows.push(row);
    }
  }
  let flashes = 0;
  let flashSprites = [];
  for (let row of clearedRows) {
    for (let x = 0; x < COLS; x++) {
      if (board[row][x] && board[row][x].sprite) {
        flashSprites.push(board[row][x].sprite);
      }
    }
  }
  function doFlash() {
    flashes++;
    flashSprites.forEach(s => s.setTint(0xffffff));
    scene.time.delayedCall(80, () => {
      flashSprites.forEach(s => s.clearTint());
      if (flashes < 2) {
        scene.time.delayedCall(80, doFlash);
      } else {
        doFade();
      }
    });
  }
  function doFade() {
    let completedFades = 0;
    const totalFades = flashSprites.length;

    // This case handles if clearedRows has items, but none had sprites (e.g. pre-existing blocks without sprite refs)
    // or if flashSprites array ended up empty for some reason despite clearedRows having content.
    if (totalFades === 0) {
        if (clearedRows.length > 0) { // Ensure there were rows to clear
            clearedRows.sort((a, b) => a - b); // Sort from top-most cleared row
            for (let i = 0; i < clearedRows.length; i++) {
                const y = clearedRows[i] - i; // Adjust index for previous splices
                board.splice(y, 1);
                board.unshift(new Array(COLS).fill(null));
            }
            // Update Y positions of all remaining sprites on the board after model update
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c] && board[r][c].sprite) {
                        board[r][c].sprite.y = r * BLOCK_SIZE + BLOCK_SIZE / 2;
                    }
                }
            }
        }
        paused = false; // Reset the line-clear specific pause
        return;
    }

    flashSprites.forEach(sprite => {
      scene.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          if (sprite && typeof sprite.destroy === 'function') {
            sprite.destroy();
          }
          completedFades++;
          if (completedFades === totalFades) {
            // All sprites faded and destroyed
            // Now, update the board model
            clearedRows.sort((a, b) => a - b); // Sort: process from top-most cleared row
            for (let i = 0; i < clearedRows.length; i++) {
              const y = clearedRows[i] - i; // Adjust index for previous splices
              board.splice(y, 1);
              board.unshift(new Array(COLS).fill(null));
            }

            // Update Y positions of all remaining sprites on the board
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (board[r][c] && board[r][c].sprite) {
                  board[r][c].sprite.y = r * BLOCK_SIZE + BLOCK_SIZE / 2;
                }
              }
            }
            // console.log("Ambitetris: Line clear animation complete, board updated.");
            paused = false; // Reset the line-clear specific pause
          }
        }
      });
    });
  }
  doFlash();
}
