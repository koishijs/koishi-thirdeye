import { SchemaProperty } from 'schemastery-gen';
import { StarterPlugin } from '../src/base-plugin';
import { DefinePlugin } from '../src/register';
import { UseCommand } from 'koishi-decorators';
import { MapPlugin } from '../src/map-plugin';
import { App } from 'koishi';

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
  @SchemaProperty()
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
});
