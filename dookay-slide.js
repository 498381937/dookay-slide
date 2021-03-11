import * as PIXI from 'pixi.js'
// import {TweenMax, TimelineMax,Power3} from 'gsap'
import { TweenMax, TimelineMax, Power3 } from 'gsap/src/minified/TweenMax.min.js';

/**
 * 水波切换效果插件
 * 依赖插件："gsap": "^1.20.1","pixi.js": "^4.5.1"
 * pixi.js手册文档 http://pixijs.download/release/docs/index.html
 *
 * @param wrapperElement 包裹元素
 * @param options 配置
 *
 * @var currentIndex 当前幻灯片索引
 * @var renderer 渲染器
 * @var slidesContainer 容器
 * @method slideNext() 下一个
 * @method slidePrev() 上一个
 * @method slideTo(index) 跳转到指定幻灯片
 *
 * @constructor
 */
export function DookaySlide(wrapperElement, options = {}) {
  if (typeof wrapperElement === 'string') {
    wrapperElement = document.getElementById(wrapperElement);
  }

  //  配置
  options = Object.assign({}, {
    pixiSprites : [],// 图片列表
    onPixiSpritesLoaded:function (image,index) {},// 图片载入完后的回调
    stageWidth : 1920, // 舞台宽
    stageHeight : 1080,// 舞台高
    centerSprites : false,//图片是基于舞台中心点
    autoPlay : true,// 是否自动播放效果
    autoPlaySpeed : [4, 4],// 自动播放效果尺寸
    displaceScale : [200, 70],// 纹理效果尺寸
    displacementImage : '', // 切换效果纹理图片
    displacementCenter : false,// 纹理效果是否居中
    displaceAutoFit : false,// 是否绕纹理边界框调整到渲染器
    displaceScaleTo : [20, 20],
    wacky : false, // 开启特殊切换效果
    onSlideChange:function (image) {}
  }, options);

  //  SCOPE
  /// ---------------------------
  const that = this;

  //  PIXI 变量
  /// ---------------------------
  that.renderer = new PIXI.autoDetectRenderer(options.stageWidth, options.stageHeight, {transparent: true});
  const stage = new PIXI.Container();
  that.slidesContainer = new PIXI.Container();
  const displacementSprite = new PIXI.Sprite.fromImage(options.displacementImage);
  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);

  //  幻灯片数组索引
  /// ---------------------------
  that.currentIndex = 0;


  /// ---------------------------
  //  初始化PIXI
  /// ---------------------------
  const initPixi = function () {

    // 插入canvas到页面
    wrapperElement.appendChild(that.renderer.view);

    // 将子容器添加到主容器
    stage.addChild(that.slidesContainer);

    //console.log(that.renderer.view.style);

    // 适配屏幕
    wrapperElement.style.overflow = 'hidden';
    wrapperElement.style.width = '100%';
    wrapperElement.style.height = '100%';

    that.renderer.view.style.display = 'block';
    that.renderer.view.style.objectFit = 'cover';
    that.renderer.view.style.width     = '100%';
    that.renderer.view.style.height    = '100%';
    displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.MIRRORED_REPEAT;


    // 设置过滤器和默认配置
    stage.filters = [displacementFilter];

    if (options.wacky === true) {

      displacementSprite.anchor.set(0.5);
      displacementSprite.x = that.renderer.width / 2;
      displacementSprite.y = that.renderer.height / 2;
    }

    displacementSprite.scale.x = 3;
    displacementSprite.scale.y = 3;

    // 绕过PIXI将过滤器边界框调整到渲染器
    displacementFilter.autoFit = options.displaceAutoFit;

    stage.addChild(displacementSprite);

  };


  /// ---------------------------
  //  记录绑定事件的子元素
  /// ---------------------------
  const spriteHasEventsChildren = [];

  /// ---------------------------
  //  加载幻灯片到canvas中
  /// ---------------------------
  const loadPixiSprites = function (sprites) {
    for (let i = 0; i < sprites.length; i++) {

      const texture = new PIXI.Texture.fromImage(sprites[i]);
      const image = new PIXI.Sprite(texture);

      if (options.centerSprites === true) {
        image.anchor.set(0.5);
        image.x = that.renderer.width / 2;
        image.y = that.renderer.height / 2;
      }
      if (i !== 0) {
        TweenMax.set(image, {alpha: 0});
      }
      that.slidesContainer.addChild(image);

      const _callback = function () {
        options.onPixiSpritesLoaded(image,i);
        // 记录绑定事件的子元素
        spriteHasEventsChildren[i] = [];
        image.children.forEach(n=>{
          if(n.interactive){
            spriteHasEventsChildren[i].push(n);
            if(i !== 0){
              n.buttonMode = false;
              n.interactive = false
            }
          }
        });
      };
      if(texture.baseTexture.hasLoaded){
        _callback();
      }else{
        texture.baseTexture.on('loaded',()=>{
          _callback();
        })
      }
    }
  };

  /// ---------------------------
  //  默认渲染或自动播放效果
  /// ---------------------------
  const ticker = new PIXI.ticker.Ticker();
  ticker.autoStart = true;
  let playSpeed = options.autoPlaySpeed[0];
  that.setAutoPlay = function(isAutoPlay){
    options.autoPlay = isAutoPlay;
    playSpeed = options.autoPlaySpeed[0];
    /*displacementSprite.scale.x = 3;
    displacementSprite.scale.y = 3;*/
    if(!isAutoPlay){
      let speedTimer = setInterval(function () {
        playSpeed -= 0.4;
        if(playSpeed<0.8){
          /*let timer = setInterval(function () {
            displacementSprite.scale.x += 1;
            displacementSprite.scale.y += 1;
          },5);
          setTimeout(function () {
            displacementSprite.scale.x = 0;
            displacementSprite.scale.y = 0;
            clearTimeout(timer);
          },100)*/
          clearInterval(speedTimer);
        }
      },100)
    }
  };
  that.setAutoPlay(options.autoPlay);
  ticker.add(function (delta) {
    if(options.autoPlay){
      displacementSprite.x += options.autoPlaySpeed[0] * delta;
      displacementSprite.y += options.autoPlaySpeed[1]*delta;
    }else{
      displacementSprite.x += playSpeed*delta;
      displacementSprite.y += playSpeed*delta;
    }
    that.renderer.render(stage);
  });

  /// ---------------------------
  //  切换幻灯片
  /// ---------------------------
  let isPlaying = false;
  let slideImages = that.slidesContainer.children;

  const moveSlider = function (newIndex) {

    isPlaying = true;

    const baseTimeline = new TimelineMax({
      onComplete: function () {
        that.currentIndex = newIndex;
        isPlaying = false;
        if (options.wacky === true) {
          displacementSprite.scale.set(1);
        }
        // 恢复新页面的子元素事件
        spriteHasEventsChildren[newIndex].forEach(n=>{
          n.buttonMode = true;
          n.interactive = true;
        });

        options.onSlideChange(slideImages[newIndex]);
      }, onUpdate: function () {
        // 移除上一页子元素的事件
        spriteHasEventsChildren[that.currentIndex].forEach(n=>{
          n.buttonMode = false;
          n.interactive = false;
        });

        if (options.wacky === true) {
          displacementSprite.rotation += baseTimeline.progress() * 0.02;
          displacementSprite.scale.set(baseTimeline.progress() * 3);
        }
      }
    });

    baseTimeline.clear();

    if (baseTimeline.isActive()) {
      return;
    }
    baseTimeline
      .to(slideImages[newIndex], 0.1, { alpha: 0.01}) // 解决首次动画的卡顿感
      .to(displacementFilter.scale, 0.8, { x: options.displaceScale[0], y: options.displaceScale[1], ease: Power3.easeOut  })
      .to(slideImages[that.currentIndex], 0.7, { alpha: 0, ease: Power3.easeOut }, 0.5)
      .to(slideImages[newIndex], 0.7, { alpha: 1, ease: Power3.easeOut }, 0.5)
      .to(displacementFilter.scale, 0.8, { x: options.displaceScaleTo[0], y: options.displaceScaleTo[1], ease: Power3.easeOut }, 0.6 );

  };

  that.slideTo = function(index){
    if (isPlaying) return false;
    moveSlider(index);
  };

  that.slideNext = function(){
    if (isPlaying) return false;
    if (that.currentIndex >= 0 && that.currentIndex < slideImages.length - 1) {
      moveSlider(that.currentIndex + 1);
    } else {
      moveSlider(0);
    }
  };
  that.slidePrev = function(){
    if (isPlaying) return false;
    if (that.currentIndex > 0 && that.currentIndex < slideImages.length) {
      moveSlider(that.currentIndex - 1);
    } else {
      moveSlider(options.pixiSprites.length - 1);
    }
  };

  /// ---------------------------
  //  初始化
  /// ---------------------------

  const init = function () {
    initPixi();
    loadPixiSprites(options.pixiSprites);

    // window.addEventListener("resize", function(){
    //   scaleToWindow( that.renderer.view );
    // });
    // scaleToWindow( that.renderer.view );
  };

  /// ---------------------------
  //  中心位移
  /// ---------------------------
  if (options.displacementCenter === true) {
    displacementSprite.anchor.set(0.5);
    displacementSprite.x = that.renderer.view.width / 2;
    displacementSprite.y = that.renderer.view.height / 2;
  }


  /// ---------------------------
  //  启动幻灯片
  /// ---------------------------
  init();

  /// ---------------------------
  //  窗口缩放适配
  /// ---------------------------
  function scaleToWindow( canvas ) {
    let scaleX, scaleY, scale;

    const wrapperElementClientRect = wrapperElement.getBoundingClientRect();

    //1. 将画布缩放到正确的大小计算出每个轴上的缩放量
    scaleX = wrapperElementClientRect.width / canvas.offsetWidth;
    scaleY = wrapperElementClientRect.height / canvas.offsetHeight;

    //根据较小的值缩放画布：“scaleX”或“scaleY”`
    scale = Math.min(scaleX, scaleY)+0.1;
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = "scale(" + scale + ")";

    //2. canvas居中设置
    const marginHorizontally = (wrapperElementClientRect.width - canvas.offsetWidth * scale) / 2;
    const marginVertically = (wrapperElementClientRect.height - canvas.offsetHeight * scale) / 2;
    canvas.style.marginLeft = marginHorizontally + "px";
    canvas.style.marginRight = marginHorizontally + "px";
    canvas.style.marginTop = marginVertically + "px";
    canvas.style.marginBottom = marginVertically + "px";
    return scale;
  }
}