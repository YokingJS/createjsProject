import createjs from '@ali/createjs';

class Cloud {
  constructor(canvas, preload, spritOptions) {
    this.moving = false;
    this.nextPosY1 = 0;
    this.nextPosY2 = 0;
    this.canvas = canvas;
    this.leafCon1 = null;
    this.leafCon2 = null;
    this.sprite = null;
    this.leafHeight = 0;
    this.preload = preload;
    this.spritOptions = spritOptions;
    this.init();
  }

  init() {
    // const { landscape = '' } = this.spritOptions || {};

    // let image = new Image();
    // image.crossOrigin = 'Anonymous';
    // image.src = landscape;

    // const carouselOne = new createjs.Bitmap(image);
    // 滚动背景1
    const carouselOne = new createjs.Bitmap(this.preload.getResult('left'));
    carouselOne.x = 0;
    carouselOne.scaleX = 2.25;
    carouselOne.scaleY = 2;

    this.leafCon1 = new createjs.Container();
    this.leafCon1.addChild(carouselOne);
    // 单个背景滚动高度
    this.leafHeight = this.leafCon1.getBounds().height;
    // 背景Y位设定
    this.nextPosY1 = this.leafCon1.y = this.canvas.height - this.leafHeight; // eslint-disable-line
    // 滚动背景2
    const carouselTwo = carouselOne.clone();
    this.leafCon2 = new createjs.Container();
    this.leafCon2.addChild(carouselTwo);
    this.nextPosY2 = this.leafCon2.y = this.leafCon1.y - this.leafHeight; // eslint-disable-line

    this.sprite = new createjs.Container();
    this.sprite.addChild(this.leafCon1, this.leafCon2);
    // this.sprite.addChild(this.leafCon2);
  }

  tranlateY(distance) {
    if (this.moving) return;
    this.moving = true;
    const threshold = this.canvas.height;
    const curPosY1 = this.leafCon1.y;
    const curPosY2 = this.leafCon2.y;
    this.nextPosY1 = curPosY1 + distance;
    this.nextPosY2 = curPosY2 + distance;

    if (curPosY1 >= threshold) {
      this.leafCon1.y = this.nextPosY2 - this.leafHeight;
    } else {
      createjs.Tween.get(this.leafCon1, { override: true })
        .to({ y: this.nextPosY1 }, 500)
        .call(() => { this.moving = false; });
    }

    if (curPosY2 >= threshold) {
      this.leafCon2.y = this.nextPosY1 - this.leafHeight;
    } else {
      createjs.Tween.get(this.leafCon2, { override: true })
        .to({ y: this.nextPosY2 }, 500)
        .call(() => { this.moving = false; });
    }
  }
}

export default Cloud;
