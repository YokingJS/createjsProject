import createjs from '@ali/createjs';
// import preload from './preload';
import { bottomOffset, moveXOffset, moveYOffset } from './config';

class Fliggy {
  constructor(options, canvas, preload) {
    this.config = {
      initDirect: -1,
    };
    Object.assign(this.config, options);
    this.sprite = null;
    this.canvas = canvas;
    this.lastX = 0;
    this.lastY = 0;
    this.lastDirect = this.config.initDirect;
    this.preload = preload;
    this.init();
  }

  init() {
    const spriteSheet = new createjs.SpriteSheet({
      images: [this.preload.getResult('player')],
      frames: {
        width: 300,
        height: 588,
        count: 8,
      },
      animations: {
        jump: [1, 7, 0, 0.5],
      },
    });

    this.sprite = new createjs.Sprite(spriteSheet);
    this.sprite.scale = 0.5;
    this.sprite.regX = 0;
    this.sprite.regY = 0;
    const bounds = this.sprite.getBounds();

    this.sprite.x = (this.canvas.width - bounds.width / 2) / 2;
    this.lastX = this.sprite.x;
    this.sprite.y = this.canvas.height - bounds.height / 2 - bottomOffset - 65;

    this.lastY = this.sprite.y;
    if (this.config.initDirect === 1) {
      this.sprite.scaleX = -0.5;
      this.sprite.scaleY = 0.5;
      this.sprite.regX = 290;
    }
  }

  move(x, y) {
    this.lastX += x;
    this.lastY += y;

    this.sprite.gotoAndPlay('jump');
    createjs.Tween.get(this.sprite, { override: true })
      .to({
        x: this.lastX,
        y: this.lastY,
      }, 200);
  }

  moveRight() {
    if (this.lastDirect !== 1) {
      this.lastDirect = 1;
      this.sprite.scaleX = -0.5;
      this.sprite.scaleY = 0.5;
      this.sprite.regX = 290;
    }
    this.move(moveXOffset, moveYOffset);
  }

  moveLeft() {
    if (this.lastDirect !== -1) {
      this.lastDirect = -1;
      this.sprite.scale = 0.5;
      this.sprite.regX = 0;
    }
    this.move(-1 * moveXOffset, moveYOffset);
  }

  dropAndDisappear(dir, cb = () => {}) {
    const posY = this.sprite.y;
    const posX = this.sprite.x;
    this.sprite.stop();
    createjs.Tween.removeTweens(this.sprite);
    createjs.Tween.get(this.sprite, { override: true })
      .to({
        x: posX + dir * 2 * moveXOffset,
        y: posY + moveYOffset,
      }, 240)
      .to({
        y: this.canvas.height + this.sprite.y,
      }, 800)
      .set({
        visible: false,
      })
      .call(cb, null, this);
  }

  hitAndDisappear(cb = () => {}) {
    createjs.Tween.get(this.sprite, { override: true })
      .wait(800)
      .set({
        visible: false,
      })
      .call(cb, null, this);
  }
}

export default Fliggy;
