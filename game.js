import createjs from '@ali/createjs';
import preload from './preload';
import Floor from './Floor';
import Fliggy from './Fliggy';
import Cookie from '@ali/rw-cookie';
import Cloud from './Cloud';
import { moveXOffset, moveYOffset } from './config';
import util from './util';

// 定制一个全局 setInterval 方法
createjs.setInterval = function(cb, delay) {
  const interval = new createjs.Container();
  const tween = createjs.Tween.get(interval)
    .wait(delay)
    .call(() => {
      cb && cb();
    });
  // 循环为-1，createjs 1.0 版本升级
  tween.loop = -1;
  return tween;
};

// 定制一个 clearInterval 方法
createjs.clearInterval = function(interval) {
  interval && createjs.Tween.removeTweens(interval.target);
  interval = null; // eslint-disable-line
  return true;
};

class Game {
  constructor(options) {

    this.config = {
      initStairs: 8,
      barrProbabitiy: {
        0: 0.1,
        1: 0.4,
        2: 0.5
      },
      spritOptions: {},
      onProgress: () => {},
      onComplete: () => {},
      onGameOn: () => {},
      onGameEnd: () => {},
      isDemotion: options.isDemotion
    };
    Object.assign(this.config, options);
    this.stairIndex = -1; // 记录当前跳到第几层
    this.autoDropTimer = null;
    this.clickTimes = 0;
    this.score = 0;
    this.isStart = false;
    this.preload = preload();
    this.init();
  }

  init() {
    this.canvas = this.config.node;
    this.canvas.width = window.innerWidth * 2;
    this.canvas.height = window.innerHeight * 2;

    // 低端机android对webgl支持不好，使用老的2D
    this.stage = this.config.isDemotion ? new createjs.StageGL(this.canvas) : new createjs.Stage(this.canvas);
    this.stage.snapToPixelEnabled = true;
    createjs.Ticker.framerate = 60;
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.addEventListener('tick', (e) => {
      !e.paused && this.stage.update();
    });

    this.preload.on('complete', () => {
      this.ready();
      this.config.onComplete();
    });
    this.preload.on('fileload', this.config.onProgress);
    this.preload.on('error', (e) => {
      console.log('loaderror', e);
    });
  }

  getInitialSequence() {
    const stairSeq = [];
    const barrSeq = [];
    for (let i = 0; i < this.config.initStairs; i += 1) {
      stairSeq.push(util.getRandom(0, 2));
      barrSeq.push(util.getRandomNumBySpecial(this.config.barrProbabitiy));
    }
    return {
      stairSeq,
      barrSeq,
    };
  }

  createGameStage() {

    const { height, width } = this.canvas;

    this.background = new createjs.Shape();
    this.background.graphics.beginLinearGradientFill(
      ['#823e81', '#420655', '#410767'], [0.33, 0.66, 1], 0, 0, 0, height
    ).drawRect(0, 0, width, height);

    // 低端机android对webgl支持不好，使用老的2D
    if (this.config.isDemotion) {
      this.background.cache(0, 0, width, height);
    }

    const seq = this.getInitialSequence();
    // 降级背景穿梭图
    this.cloud = !this.config.isDemotion ? new Cloud(this.canvas, this.preload, this.config.spritOptions) : null;
    this.floor = new Floor(this.canvas, this.preload, this.config.spritOptions);
    this.fliggy = new Fliggy({
      initDirect: seq.stairSeq[0],
    }, this.canvas, this.preload);
    this.stairs = new createjs.Container();
    this.stairs.addChild(this.floor.sprite, this.fliggy.sprite);

    this.stairs.lastX = this.stairs.x;
    this.stairs.lastY = this.stairs.y;
    this.floor.addFloors(seq.stairSeq, seq.barrSeq);
    // 降级 不放云
    if (this.config.isDemotion) {
      this.stage.addChild(this.background, this.stairs);
    } else {
      this.stage.addChild(this.background, this.cloud.sprite, this.stairs);
    }
  }


  bindEvents() {
    createjs.Touch.enable(this.stage);
    const e = util.throttle(this.handleClick, 70, this);
    // 使用 mousedown 代替 touchstart
    this.background.addEventListener('mousedown', e.bind(this));
  }

  ready(needClear = true) {
    if (needClear) {
      this.score = 0;
    }

    this.clickTimes = 0;
    this.stairIndex = -1;
    this.autoDropTimer = null;
    this.createGameStage();
    this.bindEvents();
    createjs.Ticker.paused = false;
  }

  clear() {
    this.stage.clear();
    if (this.config.isDemotion) {
      this.stage.releaseTexture();
    }
    this.stage.removeAllChildren();
    this.stage.removeAllEventListeners();
  }

  start() {
    this.isStart = true;
    const isGameMusicPlay = Cookie.get('isGameMusicPlay');
    if (isGameMusicPlay !== 'true') return;
    try {
      createjs.Sound.play('bgMusic', {
        loop: -1,
        volume: 0.7,
      });
    } catch (error) {
      console.log('musicERROR:', error);
    }
  }

  continueStart() {
    this.clear();
    this.ready(false);
    this.start();
  }

  restart() {
    this.clear();
    this.ready();
    this.start();
  }

  handleClick(event) {

    if (this.isStart) {
      const isGameMusicPlay = Cookie.get('isGameMusicPlay');
      if (isGameMusicPlay === 'true') {
        createjs.Sound.play('jumpMusic', {
          volume: 0.83,
        });
      }
      const posX = event.stageX;
      this.stairIndex += 1;
      this.clickTimes += 1;
      let direct = -1;
      this.autoDrop();
      if (posX > (this.canvas.width / 2)) {
        this.fliggy.moveRight();
        direct = 1;
        this.centerFloor(-1 * moveXOffset, -1 * moveYOffset);
      } else {
        this.fliggy.moveLeft();
        direct = -1;
        this.centerFloor(moveXOffset, -1 * moveYOffset);
      }
      this.addStair();
      !this.config.isDemotion && this.cloud.tranlateY(-1 * moveYOffset);
      this.checkJump(direct);
    }
  }

  centerFloor(x, y) {
    this.stairs.lastX += x;
    this.stairs.lastY += y;

    createjs.Tween.get(this.stairs, { override: true })
      .to({
        x: this.stairs.lastX,
        y: this.stairs.lastY,
      }, 500);
  }

  checkJump(direct) {
    const { stairSequence } = this.floor;

    if (direct !== stairSequence[this.stairIndex]) {
      this.drop(direct, this.gameOver());
    } else {
      this.score += 1;
      this.config.onGameOn({ score: this.score });
    }
  }

  drop(direct, cb) {
    const { barrierSequence } = this.floor;

    if (barrierSequence[this.stairIndex] !== 1) {
      this.fliggy.dropAndDisappear(direct, cb);
    } else {
      this.shakeStairs();
      this.fliggy.hitAndDisappear(cb);
    }
  }

  shakeStairs() {
    createjs.Tween.removeTweens(this.stairs);
    createjs.Tween.get(this.stairs, {
      override: true,
    })
      .to({
        x: this.stairs.x + 5,
        y: this.stairs.y - 5,
      }, 50, createjs.Ease.getBackInOut(2.5))
      .to({
        x: this.stairs.x,
        y: this.stairs.y,
      }, 50, createjs.Ease.getBackInOut(2.5))
      .to({
        x: this.stairs.x + 5,
        y: this.stairs.y - 5,
      }, 50, createjs.Ease.getBackInOut(2.5))
      .to({
        x: this.stairs.x,
        y: this.stairs.y,
      }, 50, createjs.Ease.getBackInOut(2.5))
      .pause();
  }

  addStair() {
    const stair = util.getRandom(0, 2);
    const barrier = util.getRandomNumBySpecial(this.config.barrProbabitiy);
    this.floor.addOneFloor(stair, barrier, true);
  }

  autoDrop() {
    // 越来越快的逻辑
    const self = this;

    if (!self.autoDropTimer) {
      const fn = function fn() { // eslint-disable-line
        const num = self.clickTimes;
        if (num < 400 && num % 4 === 0) {
          createjs.clearInterval(self.autoDropTimer);
          self.autoDropTimer = createjs.setInterval(fn, 800 - num * 2);
        }
        // if (num === 300) {
        //   createjs.clearInterval(self.autoDropTimer);
        //   self.autoDropTimer = createjs.setInterval(fn, 450);
        // }
        self.floor.drop();
        if (self.clickTimes === self.floor.dropIndex) {
          createjs.clearInterval(self.autoDropTimer);
          self.fliggy.dropAndDisappear(0, self.gameOver());
        }
      };

      self.autoDropTimer = createjs.setInterval(fn, 700);
    }
  }

  gameOver(from) {
    createjs.clearInterval(this.autoDropTimer);
    this.isStart = false;
    if (from !== 'gohome') this.config.onGameEnd();
    setTimeout(() => {
      createjs.Sound.stop();
      const isGameMusicPlay = Cookie.get('isGameMusicPlay');
      if (from !== 'gohome' && isGameMusicPlay === 'true') {
        createjs.Sound.play('overMusic', {
          volume: 0.7,
        });
      }
    }, 200);
  }
}

export default Game;

