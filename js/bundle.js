(function(){var e=`1.3.27`;function t(e,t,n){return Math.max(e,Math.min(t,n))}function n(e,t,n){return(1-n)*e+n*t}function r(e,t,r,i){return n(e,t,1-Math.exp(-r*i))}function i(e,t){return(e%t+t)%t}var a=class{isRunning=!1;value=0;from=0;to=0;currentTime=0;lerp;duration;easing;onUpdate;advance(e){if(!this.isRunning)return;let n=!1;if(this.duration&&this.easing){this.currentTime+=e;let r=t(0,this.currentTime/this.duration,1);n=r>=1;let i=n?1:this.easing(r);this.value=this.from+(this.to-this.from)*i}else this.lerp?(this.value=r(this.value,this.to,this.lerp*60,e),Math.round(this.value)===Math.round(this.to)&&(this.value=this.to,n=!0)):(this.value=this.to,n=!0);n&&this.stop(),this.onUpdate?.(this.value,n)}stop(){this.isRunning=!1}fromTo(e,t,{lerp:n,duration:r,easing:i,onStart:a,onUpdate:o}){this.from=this.value=e,this.to=t,this.lerp=n,this.duration=r,this.easing=i,this.currentTime=0,this.isRunning=!0,a?.(),this.onUpdate=o}};function o(e,t){let n;return function(...r){clearTimeout(n),n=setTimeout(()=>{n=void 0,e.apply(this,r)},t)}}var s=class{width=0;height=0;scrollHeight=0;scrollWidth=0;debouncedResize;wrapperResizeObserver;contentResizeObserver;constructor(e,t,{autoResize:n=!0,debounce:r=250}={}){this.wrapper=e,this.content=t,n&&(this.debouncedResize=o(this.resize,r),this.wrapper instanceof Window?window.addEventListener(`resize`,this.debouncedResize):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){this.wrapperResizeObserver?.disconnect(),this.contentResizeObserver?.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener(`resize`,this.debouncedResize)}resize=()=>{this.onWrapperResize(),this.onContentResize()};onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)};onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)};get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}},c=class{events={};emit(e,...t){let n=this.events[e]||[];for(let e=0,r=n.length;e<r;e++)n[e]?.(...t)}on(e,t){return this.events[e]?this.events[e].push(t):this.events[e]=[t],()=>{this.events[e]=this.events[e]?.filter(e=>t!==e)}}off(e,t){this.events[e]=this.events[e]?.filter(e=>t!==e)}destroy(){this.events={}}};let l={passive:!1};function u(e,t){return e===1?16.666666666666668:e===2?t:1}var d=class{touchStart={x:0,y:0};lastDelta={x:0,y:0};window={width:0,height:0};emitter=new c;constructor(e,t={wheelMultiplier:1,touchMultiplier:1}){this.element=e,this.options=t,window.addEventListener(`resize`,this.onWindowResize),this.onWindowResize(),this.element.addEventListener(`wheel`,this.onWheel,l),this.element.addEventListener(`touchstart`,this.onTouchStart,l),this.element.addEventListener(`touchmove`,this.onTouchMove,l),this.element.addEventListener(`touchend`,this.onTouchEnd,l)}on(e,t){return this.emitter.on(e,t)}destroy(){this.emitter.destroy(),window.removeEventListener(`resize`,this.onWindowResize),this.element.removeEventListener(`wheel`,this.onWheel,l),this.element.removeEventListener(`touchstart`,this.onTouchStart,l),this.element.removeEventListener(`touchmove`,this.onTouchMove,l),this.element.removeEventListener(`touchend`,this.onTouchEnd,l)}onTouchStart=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:0,y:0},this.emitter.emit(`scroll`,{deltaX:0,deltaY:0,event:e})};onTouchMove=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e,r=-(t-this.touchStart.x)*this.options.touchMultiplier,i=-(n-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:r,y:i},this.emitter.emit(`scroll`,{deltaX:r,deltaY:i,event:e})};onTouchEnd=e=>{this.emitter.emit(`scroll`,{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:e})};onWheel=e=>{let{deltaX:t,deltaY:n,deltaMode:r}=e,i=u(r,this.window.width),a=u(r,this.window.height);t*=i,n*=a,t*=this.options.wheelMultiplier,n*=this.options.wheelMultiplier,this.emitter.emit(`scroll`,{deltaX:t,deltaY:n,event:e})};onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}}};let f=e=>Math.min(1,1.001-2**(-10*e));var p=class{_isScrolling=!1;_isStopped=!1;_isLocked=!1;_preventNextNativeScrollEvent=!1;_resetVelocityTimeout=null;_rafId=null;_isDraggingSelection=!1;reducedMotionMediaQuery=window.matchMedia(`(prefers-reduced-motion: reduce)`);isTouching;isIos;time=0;userData={};lastVelocity=0;velocity=0;direction=0;options;targetScroll;animatedScroll;animate=new a;emitter=new c;dimensions;virtualScroll;constructor({wrapper:t=window,content:n=document.documentElement,eventsTarget:r=t,smoothWheel:i=!0,syncTouch:a=!1,syncTouchLerp:o=.075,touchInertiaExponent:c=1.7,duration:l,easing:u,lerp:p=.1,infinite:m=!1,orientation:h=`vertical`,gestureOrientation:g=h===`horizontal`?`both`:`vertical`,touchMultiplier:_=1,wheelMultiplier:v=1,autoResize:y=!0,prevent:b,virtualScroll:x,overscroll:S=!0,autoRaf:C=!1,anchors:w=!1,autoToggle:T=!1,allowNestedScroll:E=!1,__experimental__naiveDimensions:D=!1,naiveDimensions:O=D,stopInertiaOnNavigate:k=!1,respectReducedMotion:A=!0}={}){window.lenisVersion=e,window.lenis||(window.lenis={}),window.lenis.version=e,h===`horizontal`&&(window.lenis.horizontal=!0),a===!0&&(window.lenis.touch=!0),this.isIos=/(iPad|iPhone|iPod)/g.test(navigator.userAgent),(!t||t===document.documentElement)&&(t=window),typeof l==`number`&&typeof u!=`function`?u=f:typeof u==`function`&&typeof l!=`number`&&(l=1),this.options={wrapper:t,content:n,eventsTarget:r,smoothWheel:i,syncTouch:a,syncTouchLerp:o,touchInertiaExponent:c,duration:l,easing:u,lerp:p,infinite:m,gestureOrientation:g,orientation:h,touchMultiplier:_,wheelMultiplier:v,autoResize:y,prevent:b,virtualScroll:x,overscroll:S,autoRaf:C,anchors:w,autoToggle:T,allowNestedScroll:E,naiveDimensions:O,stopInertiaOnNavigate:k,respectReducedMotion:A},this.dimensions=new s(t,n,{autoResize:y}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.addEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.addEventListener(`click`,this.onClick),this.options.wrapper.addEventListener(`pointerdown`,this.onPointerDown),this.virtualScroll=new d(r,{touchMultiplier:_,wheelMultiplier:v}),this.virtualScroll.on(`scroll`,this.onVirtualScroll),this.options.autoToggle&&(this.checkOverflow(),this.rootElement.addEventListener(`transitionend`,this.onTransitionEnd)),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this.options.wrapper.removeEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.removeEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),this.options.wrapper.removeEventListener(`pointerdown`,this.onPointerDown),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.removeEventListener(`click`,this.onClick),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this._rafId&&cancelAnimationFrame(this._rafId)}on(e,t){return this.emitter.on(e,t)}off(e,t){return this.emitter.off(e,t)}onScrollEnd=e=>{e instanceof CustomEvent||(this.isScrolling===`smooth`||this.isScrolling===!1)&&e.stopPropagation()};dispatchScrollendEvent=()=>{this.options.wrapper.dispatchEvent(new CustomEvent(`scrollend`,{bubbles:this.options.wrapper===window,detail:{lenisScrollEnd:!0}}))};get overflow(){let e=this.isHorizontal?`overflow-x`:`overflow-y`;return getComputedStyle(this.rootElement)[e]}checkOverflow(){[`hidden`,`clip`].includes(this.overflow)?this.internalStop():this.internalStart()}onTransitionEnd=e=>{e.propertyName?.includes(`overflow`)&&e.target===this.rootElement&&this.checkOverflow()};setScroll(e){this.isHorizontal?this.options.wrapper.scrollTo({left:e,behavior:`instant`}):this.options.wrapper.scrollTo({top:e,behavior:`instant`})}onClick=e=>{let t=e.composedPath().filter(e=>e instanceof HTMLAnchorElement&&e.href).map(e=>new URL(e.href)),n=new URL(window.location.href);if(this.options.anchors){let e=t.find(e=>n.host===e.host&&n.pathname===e.pathname&&e.hash);if(e){let t=typeof this.options.anchors==`object`&&this.options.anchors?this.options.anchors:void 0,n=decodeURIComponent(e.hash);this.scrollTo(n,t);return}}if(this.options.stopInertiaOnNavigate&&t.some(e=>n.host===e.host&&n.pathname!==e.pathname)){this.reset();return}};onPointerDown=e=>{e.button===1&&this.reset()};isTouchOnSelectionHandle(e){let t=window.getSelection();if(!t||t.isCollapsed||t.rangeCount===0)return!1;let n=e.targetTouches[0]??e.changedTouches[0];if(!n)return!1;let r=t.getRangeAt(0).getClientRects();if(r.length===0)return!1;let i=r[0],a=r[r.length-1],o=Math.hypot(n.clientX-i.left,n.clientY-i.top)<=40,s=Math.hypot(n.clientX-a.right,n.clientY-a.bottom)<=40;return o||s}onVirtualScroll=e=>{if(typeof this.options.virtualScroll==`function`&&this.options.virtualScroll(e)===!1)return;let{deltaX:t,deltaY:n,event:r}=e;if(this.emitter.emit(`virtual-scroll`,{deltaX:t,deltaY:n,event:r}),r.ctrlKey||r.lenisStopPropagation)return;let i=r.type.includes(`touch`),a=r.type.includes(`wheel`);if(i&&this.isIos&&(r.type===`touchstart`&&(this._isDraggingSelection=this.isTouchOnSelectionHandle(r)),this._isDraggingSelection)){r.type===`touchend`&&(this._isDraggingSelection=!1);return}this.isTouching=r.type===`touchstart`||r.type===`touchmove`;let o=t===0&&n===0;if(this.options.syncTouch&&i&&r.type===`touchstart`&&o&&!this.isStopped&&!this.isLocked){this.reset();return}let s=this.options.gestureOrientation===`vertical`&&n===0||this.options.gestureOrientation===`horizontal`&&t===0;if(o||s)return;let c=r.composedPath();c=c.slice(0,c.indexOf(this.rootElement));let l=this.options.prevent,u=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`;if(c.find(e=>e instanceof HTMLElement&&(typeof l==`function`&&l?.(e)||e.hasAttribute?.(`data-lenis-prevent`)||u===`vertical`&&e.hasAttribute?.(`data-lenis-prevent-vertical`)||u===`horizontal`&&e.hasAttribute?.(`data-lenis-prevent-horizontal`)||i&&e.hasAttribute?.(`data-lenis-prevent-touch`)||a&&e.hasAttribute?.(`data-lenis-prevent-wheel`)||this.options.allowNestedScroll&&this.hasNestedScroll(e,{deltaX:t,deltaY:n}))))return;if(this.isStopped||this.isLocked){r.cancelable&&r.preventDefault();return}if(!(this.options.syncTouch&&i||this.options.smoothWheel&&a)){this.isScrolling=`native`,this.animate.stop(),r.lenisStopPropagation=!0;return}let d=n;this.options.gestureOrientation===`both`?d=Math.abs(n)>Math.abs(t)?n:t:this.options.gestureOrientation===`horizontal`&&(d=t),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&this.limit>0&&(this.animatedScroll>0&&this.animatedScroll<this.limit||this.animatedScroll===0&&n>0||this.animatedScroll===this.limit&&n<0))&&(r.lenisStopPropagation=!0),r.cancelable&&r.preventDefault();let f=i&&this.options.syncTouch,p=i&&r.type===`touchend`;p&&(d=Math.sign(d)*Math.abs(this.velocity)**this.options.touchInertiaExponent),this.scrollTo(this.targetScroll+d,{programmatic:!1,...f?{lerp:p?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})};resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit(`scroll`,this)}onNativeScroll=()=>{if(this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent){this._preventNextNativeScrollEvent=!1;return}if(this.isScrolling===!1||this.isScrolling===`native`){let e=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-e,this.direction=Math.sign(this.animatedScroll-e),this.isStopped||(this.isScrolling=`native`),this.emit(),this.velocity!==0&&(this._resetVelocityTimeout=setTimeout(()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()},400))}};reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){if(this.isStopped){if(this.options.autoToggle){this.rootElement.style.removeProperty(`overflow`);return}this.internalStart()}}internalStart(){this.isStopped&&(this.reset(),this.isStopped=!1,this.emit())}stop(){if(!this.isStopped){if(this.options.autoToggle){this.rootElement.style.setProperty(`overflow`,`clip`);return}this.internalStop()}}internalStop(){this.isStopped||(this.reset(),this.isStopped=!0,this.emit())}raf=e=>{let t=e-(this.time||e);this.time=e,this.animate.advance(t*.001),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))};scrollTo(e,{offset:n=0,immediate:r=!1,lock:i=!1,programmatic:a=!0,lerp:o=a?this.options.lerp:void 0,duration:s=a?this.options.duration:void 0,easing:c=a?this.options.easing:void 0,onStart:l,onComplete:u,force:d=!1,userData:p}={}){if(this.prefersReducedMotion&&(a?r=!0:(o=1,s=void 0,c=void 0)),(this.isStopped||this.isLocked)&&!d)return;let m=e,h=n;if(typeof m==`string`&&[`top`,`left`,`start`,`#`].includes(m))m=0;else if(typeof m==`string`&&[`bottom`,`right`,`end`].includes(m))m=this.limit;else{let e=null;if(typeof m==`string`?(e=m.startsWith(`#`)?document.getElementById(m.slice(1)):document.querySelector(m),e||(m===`#top`?m=0:console.warn(`Lenis: Target not found`,m))):m instanceof Element&&(e=m),e){if(this.options.wrapper!==window){let e=this.rootElement.getBoundingClientRect();h-=this.isHorizontal?e.left:e.top}let t=e.getBoundingClientRect(),n=getComputedStyle(e),r=this.isHorizontal?Number.parseFloat(n.scrollMarginLeft):Number.parseFloat(n.scrollMarginTop),i=getComputedStyle(this.rootElement),a=this.isHorizontal?Number.parseFloat(i.scrollPaddingLeft):Number.parseFloat(i.scrollPaddingTop);m=(this.isHorizontal?t.left:t.top)+this.animatedScroll-(Number.isNaN(r)?0:r)-(Number.isNaN(a)?0:a)}}if(typeof m==`number`){if(m+=h,this.options.infinite){if(a){this.targetScroll=this.animatedScroll=this.scroll;let e=m-this.animatedScroll;e>this.limit/2?m-=this.limit:e<-this.limit/2&&(m+=this.limit)}}else m=t(0,m,this.limit);if(m===this.targetScroll){l?.(this),u?.(this);return}if(this.userData=p??{},r){this.animatedScroll=this.targetScroll=m,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()});return}a||(this.targetScroll=m),typeof s==`number`&&typeof c!=`function`?c=f:typeof c==`function`&&typeof s!=`number`&&(s=1),this.animate.fromTo(this.animatedScroll,m,{duration:s,easing:c,lerp:o,onStart:()=>{i&&(this.isLocked=!0),this.isScrolling=`smooth`,l?.(this)},onUpdate:(e,t)=>{this.isScrolling=`smooth`,this.lastVelocity=this.velocity,this.velocity=e-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=e,this.setScroll(this.scroll),a&&(this.targetScroll=e),t||this.emit(),t&&(this.reset(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()}),this.preventNextNativeScrollEvent())}})}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame(()=>{this._preventNextNativeScrollEvent=!1})}hasNestedScroll(e,{deltaX:t,deltaY:n}){let r=Date.now();e._lenis||={};let i=e._lenis,a,o,s,c,l,u,d,f,p,m;if(r-(i.time??0)>2e3){i.time=Date.now();let t=window.getComputedStyle(e);if(i.computedStyle=t,a=[`auto`,`overlay`,`scroll`].includes(t.overflowX),o=[`auto`,`overlay`,`scroll`].includes(t.overflowY),l=[`auto`].includes(t.overscrollBehaviorX),u=[`auto`].includes(t.overscrollBehaviorY),i.hasOverflowX=a,i.hasOverflowY=o,!(a||o))return!1;d=e.scrollWidth,f=e.scrollHeight,p=e.clientWidth,m=e.clientHeight,s=d>p,c=f>m,i.isScrollableX=s,i.isScrollableY=c,i.scrollWidth=d,i.scrollHeight=f,i.clientWidth=p,i.clientHeight=m,i.hasOverscrollBehaviorX=l,i.hasOverscrollBehaviorY=u}else s=i.isScrollableX,c=i.isScrollableY,a=i.hasOverflowX,o=i.hasOverflowY,d=i.scrollWidth,f=i.scrollHeight,p=i.clientWidth,m=i.clientHeight,l=i.hasOverscrollBehaviorX,u=i.hasOverscrollBehaviorY;if(!(a&&s||o&&c))return!1;let h=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`,g,_,v,y,b,x;if(h===`horizontal`)g=Math.round(e.scrollLeft),_=d-p,v=t,y=a,b=s,x=l;else if(h===`vertical`)g=Math.round(e.scrollTop),_=f-m,v=n,y=o,b=c,x=u;else return!1;return!x&&(g>=_||g<=0)?!0:(v>0?g<_:g>0)&&y&&b}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?`x`:`y`]}get isHorizontal(){return this.options.orientation===`horizontal`}get actualScroll(){let e=this.options.wrapper;return this.isHorizontal?e.scrollX??e.scrollLeft:e.scrollY??e.scrollTop}get scroll(){return this.options.infinite?i(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return this.limit===0?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(e){this._isScrolling!==e&&(this._isScrolling=e,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(e){this._isStopped!==e&&(this._isStopped=e,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(e){this._isLocked!==e&&(this._isLocked=e,this.updateClassName())}get isSmooth(){return this.isScrolling===`smooth`}get prefersReducedMotion(){return this.options.respectReducedMotion&&this.reducedMotionMediaQuery.matches}get className(){let e=`lenis`;return this.options.autoToggle&&(e+=` lenis-autoToggle`),this.isStopped&&(e+=` lenis-stopped`),this.isLocked&&(e+=` lenis-locked`),this.isScrolling&&(e+=` lenis-scrolling`),this.isScrolling===`smooth`&&(e+=` lenis-smooth`),e}updateClassName(){this.cleanUpClassName(),this.className.split(` `).forEach(e=>{this.rootElement.classList.add(e)})}cleanUpClassName(){for(let e of Array.from(this.rootElement.classList))(e===`lenis`||e.startsWith(`lenis-`))&&this.rootElement.classList.remove(e)}};globalThis.Lenis=p,globalThis.Lenis.prototype=p.prototype})();

/* Optional wheel smoothing. Navigation, focus and touch remain browser-owned. */
(() => {
  if (typeof window.Lenis !== "function") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarsePointer = window.matchMedia("(any-pointer: coarse)");
  let lenis;
  let pageActive = true;

  function destroy() {
    lenis?.destroy();
    lenis = undefined;
  }

  function reconcile() {
    if (!pageActive || reducedMotion.matches || !finePointer.matches || coarsePointer.matches) {
      destroy();
    } else if (!lenis) {
      lenis = new window.Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.16,
        wheelMultiplier: 1,
        anchors: false,
        respectReducedMotion: true,
      });
    }
  }

  function releaseWheelTarget() {
    if (!lenis) return;
    // A fresh instance forgets inertia without writing a scroll position or
    // suppressing the browser's next scroll event (including bare href="#").
    destroy();
    reconcile();
  }

  for (const preference of [reducedMotion, finePointer, coarsePointer]) {
    preference.addEventListener("change", reconcile);
  }
  document.addEventListener("pointerdown", releaseWheelTarget, { capture: true, passive: true });
  document.addEventListener("focusin", releaseWheelTarget);
  document.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab", "Enter"].includes(event.key)) {
      releaseWheelTarget();
    }
  }, true);
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname &&
        url.search === window.location.search && anchor.href.includes("#")) {
      releaseWheelTarget();
    }
  });
  window.addEventListener("hashchange", releaseWheelTarget);
  window.addEventListener("popstate", releaseWheelTarget);
  window.addEventListener("pagehide", () => {
    pageActive = false;
    destroy();
  });
  window.addEventListener("pageshow", () => {
    pageActive = true;
    reconcile();
  });
  reconcile();
})();

/* The page is complete HTML. These enhancements are optional. */
const siteData = JSON.parse(document.getElementById("site-data").textContent);
const projects = siteData.projects;
const ui = siteData.ui;
const pins = [...document.querySelectorAll("[data-project]")];
pins.forEach((pin) => {
  pin.disabled = false;
});
pins.forEach((pin) =>
  pin.addEventListener("click", () => {
    const project = projects[pin.dataset.project];
    if (!project) return;
    pins.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === pin)),
    );
    const image = document.getElementById("map-image");
    // Clear candidates when switching back to a project with only one image.
    if (project.sources) {
      image.sizes = project.sizes;
      image.srcset = project.sources.map(source => `${source.src} ${source.width}w`).join(', ');
    } else {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
    image.src = project.image;
    image.alt = project.alt;
    document.getElementById("map-category").textContent = project.category;
    document.getElementById("map-title").textContent = project.title;
    document.getElementById("map-description").textContent =
      project.description;
    document.getElementById("map-link").href = project.link;
  }),
);

const nameButton = document.querySelector(".name-button");
const canvas = document.getElementById("name-particles");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function syncNameInteraction() {
  nameButton.disabled = reduceMotion.matches;
  if (reduceMotion.matches) {
    nameButton.setAttribute('role', 'presentation');
    nameButton.removeAttribute('aria-label');
  } else {
    nameButton.removeAttribute('role');
    nameButton.setAttribute('aria-label', ui.animate);
  }
}
syncNameInteraction();
let frame = 0;
let titleMode = "idle";
const wordmark = nameButton.querySelector(".wordmark");
// A zero-size inline box exposes the browser's real text baseline. Centering
// the canvas ink bounds instead makes the title jump when the effect starts.
const baselineProbe = document.createElement("span");
baselineProbe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
baselineProbe.setAttribute("aria-hidden", "true");
wordmark.append(baselineProbe);
const titleLetters = Array.from(wordmark.firstChild.textContent, (letter) => {
  const span = document.createElement("span");
  span.textContent = letter;
  span.className = "title-letter";
  return span;
});
wordmark.firstChild.replaceWith(...titleLetters);
let hoveredLetter = null;
const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
function stopParticles() {
  cancelAnimationFrame(frame);
  titleMode = "idle";
  hoveredLetter?.classList.remove("hovered-letter");
  hoveredLetter = null;
  nameButton.classList.remove("playing");
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}
function prepareTitle() {
  const rect = canvas.getBoundingClientRect();
  const textRect = wordmark.getBoundingClientRect();
  const style = getComputedStyle(wordmark);
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(canvas.width / rect.width, 0, 0, canvas.height / rect.height, 0, 0);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing;
  context.textBaseline = "alphabetic";
  context.fillStyle = style.color;
  context.strokeStyle = style.color;
  context.lineWidth = 1;
  const x = textRect.left - rect.left;
  const baseline = baselineProbe.getBoundingClientRect().top - rect.top;
  const label = wordmark.textContent;
  context.fillText(label, x, baseline);
  return { context, rect, x, baseline, label };
}
nameButton.addEventListener("click", () => {
  if (reduceMotion.matches || titleMode === "click") return;
  stopParticles();
  const title = prepareTitle();
  if (!title) return;
  const { context, rect } = title;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const dots = [];
  const spacing = rect.width < 450 ? 3 : 4;
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  for (let y = 0; y < rect.height; y += spacing) {
    for (let x = 0; x < rect.width; x += spacing) {
      if (pixels[(Math.floor(y * sy) * canvas.width + Math.floor(x * sx)) * 4 + 3] > 120)
        dots.push({ x, y, dx: (Math.random() - 0.5) * 80, dy: (Math.random() - 0.5) * 70 });
    }
  }
  titleMode = "click";
  nameButton.classList.add("playing");
  const start = performance.now();
  function draw(now) {
    const progress = Math.min((now - start) / 1250, 1);
    if (progress === 1 || reduceMotion.matches) {
      stopParticles();
      return;
    }
    const spread = Math.sin(progress * Math.PI);
    context.clearRect(0, 0, rect.width, rect.height);
    for (const dot of dots)
      context.fillRect(dot.x + dot.dx * spread, dot.y + dot.dy * spread, spacing * 0.8, spacing * 0.8);
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
});
nameButton.addEventListener("pointermove", (event) => {
  if (reduceMotion.matches || !hoverPointer.matches || titleMode === "click") return;
  const letter = event.target.closest(".title-letter");
  if (letter === hoveredLetter) return;
  stopParticles();
  if (!letter || !letter.textContent.trim()) return;
  const title = prepareTitle();
  if (!title) return;
  const { context, rect, baseline } = title;
  const letterRect = letter.getBoundingClientRect();
  const x = letterRect.left - rect.left;
  const label = letter.textContent;
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillText(label, x, baseline);
  // Sample points on the actual glyph contours, retaining the site's font.
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const points = [];
  const step = Math.max(14, rect.width / 55);
  for (let px = 0; px < rect.width; px += step) {
    let first = -1;
    let last = -1;
    for (let py = 0; py < rect.height; py++) {
      if (pixels[(Math.floor(py * sy) * canvas.width + Math.floor(px * sx)) * 4 + 3] > 120) {
        if (first < 0) first = py;
        last = py;
      }
    }
    if (first >= 0) {
      points.push({ x: px, y: first });
      if (last - first > step) points.push({ x: px, y: last });
    }
  }
  titleMode = "hover";
  hoveredLetter = letter;
  letter.classList.add("hovered-letter");
  const start = performance.now();
  function drawHover(now) {
    const progress = Math.min((now - start) / 900, 1);
    context.clearRect(0, 0, rect.width, rect.height);
    context.globalAlpha = 1;
    context.strokeText(label, x, baseline);
    context.globalAlpha = 1 - Math.min(progress * 3, 1);
    context.fillText(label, x, baseline);
    for (const point of points) {
      const phase = Math.max(0, Math.min((progress - (point.x - x) / letterRect.width * 0.45) * 3, 1));
      context.globalAlpha = phase;
      context.beginPath();
      context.arc(point.x, point.y, 1.4 + Math.sin(phase * Math.PI) * 2, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (progress < 1) frame = requestAnimationFrame(drawHover);
  }
  frame = requestAnimationFrame(drawHover);
});
nameButton.addEventListener("pointerleave", () => {
  if (titleMode === "hover") stopParticles();
});
window.addEventListener("resize", stopParticles);
reduceMotion.addEventListener("change", () => { stopParticles(); syncNameInteraction(); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopParticles();
});

// Native local video: no third-party player or branding overlay.
const films = [...document.querySelectorAll(".ambient-video")];
const mainFilm = document.getElementById("btw-film");
const filmControls = document.querySelector(".film-controls");
const playButton = document.querySelector('[data-film-action="play"]');
const soundButton = document.querySelector('[data-film-action="sound"]');
const visibleFilms = new Set();
const mobileFilm = window.matchMedia('(max-width: 760px)');
const connection = navigator.connection;
const allowAmbientPlayback = () => !mobileFilm.matches && !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
const manuallyPaused = new WeakSet();
if (mainFilm) {
filmControls.hidden = false;
mainFilm.controls = false;
function syncVideoControls() {
  playButton.textContent = mainFilm.paused ? ui.play : ui.pause;
  soundButton.textContent = mainFilm.muted ? ui.soundOn : ui.soundOff;

}
function toggleFilm(film) {
  if (film.paused) {
    manuallyPaused.delete(film);
    film.play().catch(syncVideoControls);
  } else {
    manuallyPaused.add(film);
    film.pause();
  }
}
playButton.addEventListener("click", () => toggleFilm(mainFilm));
soundButton.addEventListener("click", () => {
  mainFilm.muted = !mainFilm.muted;
  syncVideoControls();
});
document
  .querySelector('[data-film-action="fullscreen"]')
  .addEventListener("click", async () => {
    if (mainFilm.requestFullscreen)
      await mainFilm.requestFullscreen().catch(() => {});
    else if (mainFilm.webkitEnterFullscreen) mainFilm.webkitEnterFullscreen();
  });
films.forEach((film) => {
  film.addEventListener("play", syncVideoControls);
  film.addEventListener("pause", syncVideoControls);
});
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      isIntersecting = isIntersecting && intersectionRatio >= 0.35;
      if (isIntersecting) visibleFilms.add(target);
      else visibleFilms.delete(target);
      if (!isIntersecting) target.pause();
      else if (
        !target.hidden &&
        !reduceMotion.matches &&
      allowAmbientPlayback() &&
        !manuallyPaused.has(target) &&
        !document.hidden
      )
        target.play().catch(syncVideoControls);
    });
  },
  { threshold: 0.35 },
);
films.forEach((film) => observer.observe(film));
const pauseForPreferences = () => { if (reduceMotion.matches || !allowAmbientPlayback()) films.forEach(film => film.pause()); };
reduceMotion.addEventListener('change', pauseForPreferences);
mobileFilm.addEventListener('change', pauseForPreferences);
connection?.addEventListener('change', pauseForPreferences);
document.addEventListener("visibilitychange", () => {
  films.forEach((film) => {
    if (document.hidden) film.pause();
    else if (
      visibleFilms.has(film) &&
      !film.hidden &&
      !reduceMotion.matches &&
      allowAmbientPlayback() &&
      !manuallyPaused.has(film)
    )
      film.play().catch(syncVideoControls);
  });
});
syncVideoControls();

}
