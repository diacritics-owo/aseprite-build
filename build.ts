import os from 'node:os';
import { join } from '@std/path';
import {
  aseprite,
  downloadZip,
  fatal,
  info,
  log,
  present,
  skia,
  standardizedArchitecture,
  success,
  tmp,
  version,
} from './util.ts';
import {
  ASEPRITE_NAME,
  ASEPRITE_VERSION,
  BUILD_DIR,
  CMAKE_VERSION,
  MACOS_SDK,
  NINJA_VERSION,
  SKIA_NAME,
  SKIA_VERSION,
} from './constants.ts';

const platform = os.platform();
const architecture = os.arch();

switch (platform) {
  case 'darwin':
    switch (architecture) {
      case 'arm64':
      case 'x64':
        info(`detected supported platform ${platform}-${architecture}`);
    }
    break;
  default:
    fatal(`detected unsupported platform ${platform}-${architecture}`);
}

info('attempting to search for common dependencies');

const cmake = await version('cmake', CMAKE_VERSION);
const ninja = await version('ninja', NINJA_VERSION);

if (!(ninja && cmake)) {
  fatal('one or more expected common dependencies were not found');
} else {
  success('all common dependencies were found');
}

switch (platform) {
  case 'darwin': {
    info('attempting to search for macos dependencies');

    const sdk = await present('macos sdk', MACOS_SDK);

    if (!sdk) {
      fatal('one or more expected macos dependencies were not found');
    } else {
      success('all macos dependencies were found');
    }

    break;
  }
  default:
    throw new Error('unreachable');
}

const output = await tmp();

await downloadZip(
  skia(SKIA_VERSION, platform, architecture),
  SKIA_NAME,
  output
);

await downloadZip(aseprite(ASEPRITE_VERSION), ASEPRITE_NAME, output);

// TODO: better reporting (wherever fatal is called)

info('attempting to set the build up');

const build = join(output, ASEPRITE_NAME, BUILD_DIR);
await Deno.mkdir(build);

switch (platform) {
  case 'darwin': {
    const cmakeStatus = await new Deno.Command('cmake', {
      cwd: build,
      args: [
        '-DCMAKE_BUILD_TYPE=RelWithDebInfo',
        `-DCMAKE_OSX_ARCHITECTURES=${standardizedArchitecture(architecture)}`,
        '-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0',
        `-DCMAKE_OSX_SYSROOT=${MACOS_SDK}`,
        '-DLAF_BACKEND=skia',
        `-DSKIA_DIR=${join(output, SKIA_NAME)}`,
        `-DSKIA_LIBRARY_DIR=${join(
          output,
          SKIA_NAME,
          'out',
          `Release-${architecture}`
        )}`,
        `-DSKIA_LIBRARY=${join(
          output,
          SKIA_NAME,
          'out',
          `Release-${architecture}`,
          'libskia.a'
        )}`,
        architecture === 'arm64' ? '-DPNG_ARM_NEON:STRING=on' : '',
        '-G Ninja',
        '..',
      ],
    }).output();

    if (!cmakeStatus.success) {
      fatal(
        `failed to set the build up; a log has been written to ${await log(
          new TextDecoder().decode(cmakeStatus.stderr)
        )}`
      );
    }

    break;
  }
  default:
    throw new Error('unreachable');
}

success('successfully set the build up');

info('attempting to build');

const ninjaStatus = await new Deno.Command('ninja', {
  cwd: build,
}).output();

if (!ninjaStatus.success) {
  fatal(
    `failed to build; a log has been written to ${await log(
      new TextDecoder().decode(ninjaStatus.stderr)
    )}`
  );
}

success(`successfully built aseprite to ${build}!`);
