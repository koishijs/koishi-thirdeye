import { App } from 'koishi';
import { MapPlugin, MergePlugin } from '../src/plugin-operators';
import { SchemaProperty } from 'cordis-decorators';
import { DefinePlugin, UseEvent } from '../src/decorators';
import { StarterPlugin } from '../src/registrar';

declare module 'cordis' {
  interface Events {
    dressColor(): string;
    skirtSize(): string;
    wearingStrip(): string;
  }
}

class DressConfig {
  @SchemaProperty()
  color: string;
}

@DefinePlugin()
class DressPlugin extends StarterPlugin(DressConfig) {
  @UseEvent('dressColor')
  dressColor() {
    return this.config.color;
  }
}

class SkirtConfig {
  @SchemaProperty({ default: 'S' })
  size: string;
}

@DefinePlugin()
class SkirtPlugin extends StarterPlugin(SkirtConfig) {
  @UseEvent('skirtSize')
  skirtSize() {
    return this.config.size;
  }
}

class WearingConfig {
  @SchemaProperty()
  strip: string;
}

@DefinePlugin()
class WearingPlugin extends MapPlugin(
  { dress: DressPlugin, skirt: SkirtPlugin },
  WearingConfig,
) {
  @UseEvent('wearingStrip')
  wearingStrip() {
    return this.config.strip;
  }
}

@DefinePlugin()
class MergedWearingPlugin extends MergePlugin(
  { dress: DressPlugin, skirt: SkirtPlugin },
  WearingConfig,
) {
  @UseEvent('wearingStrip')
  wearingStrip() {
    return this.config.strip;
  }
}

describe('register map plugin instance', () => {
  it('should work on each level', async () => {
    const app = new App();
    app.plugin(WearingPlugin, {
      dress: { color: 'red' },
      skirt: { size: 'XL' },
      strip: 'pink',
    });
    await app.start();
    expect(app.bail('dressColor')).toBe('red');
    expect(app.bail('skirtSize')).toBe('XL');
    expect(app.bail('wearingStrip')).toBe('pink');
  });
  it('should partial register', async () => {
    const app = new App();
    app.plugin(WearingPlugin, {
      dress: { color: 'red' },
      strip: 'pink',
    });
    await app.start();
    expect(app.bail('dressColor')).toBe('red');
    expect(app.bail('wearingStrip')).toBe('pink');
    expect(app.bail('skirtSize')).toBe('S');
  });
  it('should work on merge plugin', async () => {
    const app = new App();
    app.plugin(MergedWearingPlugin, {
      color: 'red',
      size: 'XL',
      strip: 'pink',
    });
    await app.start();
    expect(app.bail('dressColor')).toBe('red');
    expect(app.bail('skirtSize')).toBe('XL');
    expect(app.bail('wearingStrip')).toBe('pink');
  });
});
