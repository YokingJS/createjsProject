import createjs from '@ali/createjs';
import { OS } from 'universal-platform';

export default function(player = '') {
  // preferXHR 这个表明是用XHR还是用HTML标签来加载。
  // 如果是false的时候，就用标签来加载，如果不能用标签的话，就还是用XHR来加载。
  // 默认是true，也就是说默认是用XHR来加载,XHR 加载 cdn 常常会报一些错误，建议使用标签方式
  // 但是在webgl的场景下面false会出现跨域的问题，所以针对这个场景需要使用true
  // const isUseGL = !!util.useWebGl();
  const queue = new createjs.LoadQueue(true);
  createjs.Sound.alternateExtensions = ['mp3'];
  queue.installPlugin(createjs.Sound);
  // 部分android机器不支持H5音频播放
  OS === 'Android' && createjs.Sound.registerPlugins([createjs.HTMLAudioPlugin]);

  queue.loadManifest([
    {
      id: 'jumpMusic',
      src: 'https://gw.alipayobjects.com/os/rmsportal/gOWijaFZQYzbLbUrlzIK.mp3',
    },
    {
      id: 'ableStaire',
      src: 'https://gw.alicdn.com/tfs/TB15sMyNMHqK1RjSZFgXXa7JXXa-160-148.png',
    },
    {
      id: 'disableStaire',
      src: 'https://gw.alicdn.com/tfs/TB1h_IANQvoK1RjSZPfXXXPKFXa-160-128.png',
    },
    {
      id: 'player',
      src: player || 'https://gw.alicdn.com/tfs/TB1Wg.ZLQvoK1RjSZPfXXXPKFXa-2400-588.png',
    },
    {
      id: 'left',
      src: 'https://gw.alicdn.com/tfs/TB1nFM7N5rpK1RjSZFhXXXSdXXa-375-1334.png',
    },
    {
      id: 'stair',
      src: 'https://gw.alicdn.com/tfs/TB1VFucz_tYBeNjy1XdXXXXyVXa-512-512.png',
    },
    {
      id: 'bgMusic',
      src: 'https://gw.alipayobjects.com/os/rmsportal/YwASPsDMOPusAzZVdLuS.mp3',
    },
    {
      id: 'overMusic',
      src: 'https://gw.alipayobjects.com/os/rmsportal/rwnaLtApFxfmVOQeFcaq.mp3',
    }
    
  ]);
  return queue;
}
