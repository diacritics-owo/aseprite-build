export const CMAKE_VERSION = '>=3.16';
export const NINJA_VERSION = '*';

export const SKIA_VERSION = 'm102-861e4743af';
export const SKIA_NAME = `skia-${SKIA_VERSION}`;

export const ASEPRITE_VERSION = 'v1.3.8.1';
export const ASEPRITE_NAME = `aseprite-${ASEPRITE_VERSION}`;

export const BUILD_DIR = 'build';

export const MACOS_SDK =
  '/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk';

export const TMP_OPTIONS = { prefix: 'aseprite-build' };

export const SEMVER =
  /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;
