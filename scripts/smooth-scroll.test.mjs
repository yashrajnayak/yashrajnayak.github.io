import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../js/smooth-scroll.js', import.meta.url), 'utf8');
const queries = {
  reduced: '(prefers-reduced-motion: reduce)',
  fine: '(hover: hover) and (pointer: fine)',
  coarse: '(any-pointer: coarse)',
};

class Events {
  listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, values = {}) {
    const event = {
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
      ...values,
    };
    for (const listener of this.listeners.get(type) ?? []) listener(event);
    return event;
  }
}

function browser({reduced = false, fine = true, coarse = false, vendor = true, scrollY = 360} = {}) {
  const window = new Events();
  const document = new Events();
  window.location = new URL('https://example.test/#work');
  window.scrollY = scrollY;
  const media = Object.fromEntries(Object.entries({reduced, fine, coarse}).map(([name, matches]) => {
    const preference = new Events();
    preference.matches = matches;
    return [name, preference];
  }));
  window.matchMedia = (query) => {
    const name = Object.keys(queries).find(name => queries[name] === query);
    assert(name, `Unexpected media query: ${query}`);
    return media[name];
  };
  const instances = [];
  const live = new Set();
  const rafOwners = new Set();
  const noNativeOverride = () => assert.fail('The controller must not replace native scrolling, focus or history');
  window.scrollTo = noNativeOverride;
  window.history = {pushState: noNativeOverride, replaceState: noNativeOverride};
  document.activeElement = {focus: noNativeOverride};

  // Model only the lifecycle contract: fresh instances sample native position;
  // destroying one removes its frame driver and pending wheel destination.
  // Real wheel interpolation and browser navigation are covered by browser QA.
  class Lenis {
    constructor(options) {
      assert.equal(live.size, 0, 'Destroy the old instance before constructing another');
      this.options = options;
      this.targetScroll = window.scrollY;
      this.destroyed = false;
      instances.push(this);
      live.add(this);
      if (options.autoRaf) rafOwners.add(this);
    }

    destroy() {
      assert.equal(this.destroyed, false, 'Each instance should be destroyed once');
      this.destroyed = true;
      live.delete(this);
      rafOwners.delete(this);
    }

    stop() { assert.fail('stop() can leave native scrolling locked; destroy instead'); }
    scrollTo() { noNativeOverride(); }
    raf() { assert.fail('autoRaf must not have a second frame driver'); }

    wheel(delta) {
      assert.equal(this.destroyed, false);
      this.targetScroll += delta;
    }
  }

  if (vendor) window.Lenis = Lenis;
  const noManualRaf = () => assert.fail('Lenis owns its single RAF driver');
  window.requestAnimationFrame = noManualRaf;
  runInNewContext(source, {window, document, URL, requestAnimationFrame: noManualRaf});

  return {
    window, document, media, instances, live, rafOwners,
    current: () => [...live][0],
    change(name, matches) {
      media[name].matches = matches;
      media[name].dispatch('change');
    },
    nativeScrollTo(position) {
      window.scrollY = position;
      for (const instance of live) instance.targetScroll = position;
    },
    click(href, values = {}) {
      const anchor = href === null ? null : {href: new URL(href, window.location).href, focus: noNativeOverride};
      return document.dispatch('click', {
        button: 0,
        target: {closest: () => anchor},
        ...values,
      });
    },
  };
}

function assertNative(event, initialDefaultPrevented = false) {
  assert.equal(event.defaultPrevented, initialDefaultPrevented);
  assert.equal(event.propagationStopped, false);
}

test('eligible desktop gets one wheel-only instance and one RAF owner', () => {
  const b = browser();
  assert.equal(b.instances.length, 1);
  assert.equal(b.live.size, 1);
  assert.equal(b.rafOwners.size, 1);
  assert.equal(b.current().options.autoRaf, true);
  assert.equal(b.current().options.smoothWheel, true);
  assert.equal(b.current().options.syncTouch, false);
  assert.equal(b.current().options.anchors, false);
  assert.equal(b.window.scrollY, 360);
  b.change('fine', true);
  b.change('reduced', false);
  b.window.dispatch('pageshow');
  assert.equal(b.instances.length, 1, 'Repeated eligible notifications must not add RAF owners');
});

for (const [name, preferences] of Object.entries({
  'reduced motion': {reduced: true},
  'coarse pointer, including a hybrid device': {coarse: true},
  'no fine hover pointer': {fine: false},
})) {
  test(`${name} starts and stays native without creating Lenis`, () => {
    const b = browser(preferences);
    assert.equal(b.instances.length, 0);
    b.document.dispatch('pointerdown');
    b.document.dispatch('focusin');
    assertNative(b.document.dispatch('keydown', {key: 'PageDown'}));
    assertNative(b.click('#'));
    b.window.dispatch('hashchange');
    b.window.dispatch('pageshow');
    assert.equal(b.instances.length, 0);
    assert.equal(b.rafOwners.size, 0);
    assert.equal(b.window.scrollY, 360);
  });
}

test('live reduced-motion changes discard inertia and recreate at the native position', () => {
  const b = browser();
  const old = b.current();
  old.wheel(900);
  b.change('reduced', true);
  assert.equal(old.destroyed, true);
  assert.equal(b.live.size, 0);
  assert.equal(b.rafOwners.size, 0);
  assert.equal(b.window.scrollY, 360, 'Opting out must not jump to the old wheel destination');
  b.nativeScrollTo(820);
  b.change('reduced', true);
  b.change('reduced', false);
  assert.equal(b.current().targetScroll, 820);
  assert.equal(b.rafOwners.size, 1);
  assert.equal(b.instances.length, 2);
});

test('live pointer changes require both fine input and no coarse input', () => {
  const b = browser();
  const first = b.current();
  b.change('coarse', true);
  assert.equal(first.destroyed, true);
  b.change('fine', false);
  b.change('coarse', false);
  assert.equal(b.live.size, 0);
  b.nativeScrollTo(640);
  b.change('fine', true);
  assert.equal(b.current().targetScroll, 640);
  assert.equal(b.live.size, 1);
  b.change('fine', false);
  assert.equal(b.live.size, 0);
  assert.equal(b.rafOwners.size, 0);
});

test('pagehide clears the frame driver and pageshow adopts restored position once', () => {
  const b = browser();
  const old = b.current();
  old.wheel(1500);
  b.window.dispatch('pagehide', {persisted: true});
  b.window.dispatch('pagehide', {persisted: true});
  assert.equal(old.destroyed, true);
  assert.equal(b.rafOwners.size, 0);
  b.change('reduced', true);
  b.change('reduced', false);
  b.change('fine', true);
  assert.equal(b.instances.length, 1, 'A cached page must not restart on preference events');
  b.nativeScrollTo(1260);
  b.window.dispatch('pageshow', {persisted: true});
  b.window.dispatch('pageshow', {persisted: true});
  assert.equal(b.current().targetScroll, 1260);
  assert.equal(b.window.scrollY, 1260);
  assert.equal(b.instances.length, 2);
  assert.equal(b.rafOwners.size, 1);
});

test('returning from BFCache still respects a newly enabled reduced-motion preference', () => {
  const b = browser();
  b.window.dispatch('pagehide', {persisted: true});
  b.change('reduced', true);
  b.window.dispatch('pageshow', {persisted: true});
  assert.equal(b.live.size, 0);
  assert.equal(b.instances.length, 1);
});

for (const href of ['#', '#work', '#contact']) {
  test(`native anchor ${href} drops stale inertia without changing URL, focus or defaults`, () => {
    const b = browser();
    const old = b.current();
    old.wheel(1000);
    const originalURL = b.window.location.href;
    assertNative(b.click(href));
    assert.equal(old.destroyed, true);
    assert.equal(b.current().targetScroll, 360);
    assert.equal(b.window.location.href, originalURL, 'The browser, not the controller, owns the hash');
    assert.equal(b.window.scrollY, 360);
    const destination = href === '#' ? 0 : 2200;
    b.nativeScrollTo(destination);
    b.current().wheel(80);
    assert.equal(b.current().targetScroll, destination + 80, 'The next wheel starts from native navigation');
    assert.equal(b.live.size, 1);
    assert.equal(b.rafOwners.size, 1);
  });
}

test('native scrolling keys, pointer and focus release inertia without canceling defaults', () => {
  for (const [type, values] of [
    ['pointerdown', {}], ['focusin', {}],
    ...['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab', 'Enter'].map(key => ['keydown', {key}]),
  ]) {
    const b = browser();
    const old = b.current();
    old.wheel(900);
    assertNative(b.document.dispatch(type, values));
    assert.equal(old.destroyed, true, `${type} ${values.key ?? ''}: discard pending wheel motion`);
    assert.equal(b.current().targetScroll, 360);
    assert.equal(b.window.scrollY, 360);
    assert.equal(b.rafOwners.size, 1);
  }
});

test('hash and history events adopt the browser-restored position without editing history', () => {
  for (const type of ['hashchange', 'popstate']) {
    const b = browser();
    const old = b.current();
    old.wheel(700);
    // Simulate restoration before the event, without notifying the old instance.
    b.window.scrollY = 1400;
    const originalURL = b.window.location.href;
    assertNative(b.window.dispatch(type));
    assert.equal(old.destroyed, true);
    assert.equal(b.current().targetScroll, 1400);
    assert.equal(b.window.location.href, originalURL);
    assert.equal(b.window.scrollY, 1400);
  }
});

test('modified, prevented and non-fragment clicks leave wheel state and native defaults alone', () => {
  const cases = [
    [null, {}], ['https://elsewhere.test/#work', {}], ['/other#work', {}],
    ['?other=1#work', {}], ['/', {}], ['#work', {button: 1}],
    ['#work', {metaKey: true}], ['#work', {ctrlKey: true}],
    ['#work', {shiftKey: true}], ['#work', {altKey: true}],
    ['#work', {defaultPrevented: true}],
  ];
  for (const [href, values] of cases) {
    const b = browser();
    const original = b.current();
    assertNative(b.click(href, values), values.defaultPrevented ?? false);
    assert.equal(b.current(), original);
    assert.equal(b.instances.length, 1);
  }
  const b = browser();
  assertNative(b.document.dispatch('keydown', {key: 'a'}));
  assert.equal(b.instances.length, 1);
});

test('missing vendor leaves native navigation available without an exception', () => {
  const b = browser({vendor: false});
  assert.equal(b.instances.length, 0);
  assert.equal(b.document.listeners.size, 0);
  assert.equal(b.window.listeners.size, 0);
  assertNative(b.click('#'));
  b.nativeScrollTo(900);
  assert.equal(b.window.scrollY, 900);
});
