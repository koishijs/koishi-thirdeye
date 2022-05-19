import { SchemaProperty } from 'schemastery-gen';
import { StarterPlugin } from '../src/base-plugin';
import { DefinePlugin } from '../src/register';
import { UseCommand } from 'koishi-decorators';
import { MapPlugin } from '../src/plugin-operators';
import { App } from 'koishi';
import { MergePlugin } from '../src/plugin-operators/merge-plugin';

class DressConfig {
  @SchemaProperty()
  color: string;
}

@DefinePlugin()
class DressPlugin extends StarterPlugin(DressConfig) {
  @UseCommand('dressColor')
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
  @UseCommand('skirtSize')
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
  @UseCommand('wearingStrip')
  wearingStrip() {
    return this.config.strip;
  }
}

@DefinePlugin()
class MergedWearingPlugin extends MergePlugin(
  { dress: DressPlugin, skirt: SkirtPlugin },
  WearingConfig,
) {
  @UseCommand('wearingStrip')
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
    expect(await app.command('dressColor').execute({})).toBe('red');
    expect(await app.command('skirtSize').execute({})).toBe('XL');
    expect(await app.command('wearingStrip').execute({})).toBe('pink');
  });
  it('should partial register', async () => {
    const app = new App();
    app.plugin(WearingPlugin, {
      dress: { color: 'red' },
      strip: 'pink',
    });
    await app.start();
    expect(await app.command('dressColor').execute({})).toBe('red');
    expect(await app.command('wearingStrip').execute({})).toBe('pink');
    expect(await app.command('skirtSize').execute({})).toBe('S');
  });
  it('should work on merge plugin', async () => {
    const app = new App();
    app.plugin(MergedWearingPlugin, {
      color: 'red',
      size: 'XL',
      strip: 'pink',
    });
    await app.start();
    expect(await app.command('dressColor').execute({})).toBe('red');
    expect(await app.command('skirtSize').execute({})).toBe('XL');
    expect(await app.command('wearingStrip').execute({})).toBe('pink');
  });
});
