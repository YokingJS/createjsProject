import createjs from '@ali/createjs';
import { stairYOffset, bottomOffset } from './config';

class Floor {
  constructor(canvas, preload, spritOptions) {
    this.stairSequence = [];
    this.barrierSequence = [];
    this.stairArr = [];
    this.barrierArr = [];
    this.barrierIndex = 0; // 障碍物已按序渲染到第几个
    this.barrierCon = null; // 障碍物容器
    this.stairCon = null; // 阶梯容器
    this.canvas = canvas;
    this.lastX = 0; // 最新一块阶梯的位置
    this.lastY = 0;
    this.dropIndex = -1;
    this.preload = preload;
    this.barrierListSource = (spritOptions || {}).barrierList || [];
    this.init();
  }

  init() {

    // 添加ableStaire
    const spriteStairAble = new createjs.SpriteSheet({
      images: [this.preload.getResult('ableStaire')],
      frames: [
        [0, 0, 160, 148]
      ],
      animations: {
        stair: [0]
      }
    });
    this.stair = new createjs.Sprite(spriteStairAble, 'stair');
    // this.stair.scale = 0.5;
    // this.stair.regX = 0;
    // this.stair.regY = 0;
    // 添加disableStaire
    const spriteStairDisable = new createjs.SpriteSheet({
      images: [this.preload.getResult('disableStaire')],
      frames: [
        [0, 0, 160, 128]
      ],
      animations: {
        stair: [0]
      }
    });
    this.stairDisable = new createjs.Sprite(spriteStairDisable, 'stair');
    // this.stairDisable.scale = 0.5;
    // this.stairDisable.regX = 0;
    // this.stairDisable.regY = 0;
    
    // // 设置台阶宽高
    // this.stair.width = this.stair.getBounds().width / 2;
    // this.stair.height = this.stair.getBounds().height / 2;
    this.stair.width = this.stair.getBounds().width;
    this.stair.height = this.stair.getBounds().height;

    // 品牌LOGO集合

    const barriers = [];
    this.barrierListSource.sort((item1, item2) => { return parseInt(item1.sort, 10) - parseInt(item2.sort, 10); });
    this.barrierListSource.forEach((item) => {
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = item.url;
      const brandLogoSheet = new createjs.SpriteSheet({
        images: [image],
        frames: [
          [0, 0, 236, 140]
        ],
        animations: {
          1: [0]
        },
      });
      const container = new createjs.Container();
      const st = this.stairDisable.clone(true);
      const bar = new createjs.Sprite(brandLogoSheet, 1);
      bar.x = (st.getBounds().width - bar.getBounds().width / 2) / 2;
      bar.y = -10;
      bar.scale = 0.5;
      bar.regX = 0;
      bar.regY = 0;
      container.addChild(st, bar);
      barriers.push(container);
    });

    this.barriers = barriers;

    const firstStair = this.stair.clone(true);
    firstStair.x = this.canvas.width / 2 - this.stair.width / 2;
    firstStair.y = this.canvas.height - this.stair.height - bottomOffset;

    this.lastX = firstStair.x;
    this.lastY = firstStair.y;

    this.stairCon = new createjs.Container();
    this.barrierCon = new createjs.Container();
    this.stairCon.addChild(firstStair);
    this.stairArr.push(firstStair);
    this.sprite = new createjs.Container();
    this.sprite.addChild(this.stairCon, this.barrierCon);
  }
  
  // 返回即将渲染的障碍物
  getNewBarrier() {
    const barrierLength = this.barriers.length || 0;
    if (this.barrierIndex >= barrierLength) this.barrierIndex = 0;
    const newBarrier = this.barriers[this.barrierIndex];
    this.barrierIndex++;
    return newBarrier;
  }

  addOneFloor(stairD, barrierType, animation) {
    // -1 代表前一个阶梯的左边，1右边
    const stairDirection = stairD ? 1 : -1;
    const stair = this.stair.clone(true);
    const nextX = this.lastX + stairDirection * this.stair.width / 2;
    const nextY = this.lastY - this.stair.height + stairYOffset;

    stair.x = nextX;
    stair.y = nextY - 100;
    this.stairArr.push(stair);
    this.stairSequence.push(stairDirection);
    this.barrierSequence.push(barrierType);
    this.stairCon.addChild(stair);

    if (animation) {
      createjs.Tween.get(stair, { override: true }).to({ y: nextY }, 200);
    } else {
      stair.y = nextY;
    }

    if (barrierType !== 0) {
      // 障碍物在阶梯的反方向
      const nextBarrierX = this.lastX + (-1 * stairDirection * this.stair.width / 2) * barrierType;
      const nextBarrierY = this.lastY - (this.stair.height - stairYOffset) * barrierType;
      const barrier = this.getNewBarrier().clone(true);

      barrier.x = nextBarrierX;
      barrier.y = nextBarrierY - 100;
      this.barrierCon.addChild(barrier);
      if (animation) {
        createjs.Tween.get(barrier, { override: true }).to({ y: nextBarrierY }, 200);
      } else {
        barrier.y = nextBarrierY;
      }
    }

    this.lastX = nextX;
    this.lastY = nextY;
  }

  addFloors(stairSequence, barrierSequence) {
    stairSequence.forEach((item, index) => {
      this.addOneFloor(item, barrierSequence[index], false);
    });
    Floor.sortChildren(this.stairCon);
    Floor.sortChildren(this.barrierCon);
  }

  static sortChildren(container) {
    container.sortChildren((obj1, obj2) => {
      if (obj1.y > obj2.y) { return 1; }
      if (obj1.y < obj2.y) { return -1; }
      return 0;
    });
  }

  dropStair(stair) {
    const { y: stairY } = stair;
    if (!createjs.Tween.hasActiveTweens(stair)) {
      createjs.Tween.get(stair, { override: true })
        .to({ y: stairY + 400 }, 500)
        .call(() => {
          this.stairCon.removeChild(stair);
          createjs.Tween.removeTweens(stair);
          stair = null;
        });

      this.barrierArr = this.barrierCon.children;
      const barrLen = this.barrierArr.length;

      for (let i = 0; i < barrLen; i += 1) {
        const item = this.barrierArr[i];
        if (item.y >= stairY) {
          createjs.Tween.get(item, { override: true })
            .to({ y: stairY + 400 }, 500)
            .call(() => {
              this.barrierCon.removeChild(item);
              createjs.Tween.removeTweens(item);
            });
        }
      }
      this.dropIndex += 1;
    }
  }

  drop() {
    const stair = this.stairArr.shift();

    stair && this.dropStair(stair);

    while (this.stairArr.length > 9) {
      this.dropStair(this.stairArr.shift());
    }
  }
}

export default Floor;
