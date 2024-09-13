// deno-lint-ignore-file no-explicit-any

import { parseRange, parse as parseSemver, satisfies } from '@std/semver';
import { exists } from '@std/fs';
import { join } from '@std/path';
import { downstream } from 'downstream';
import { MultiProgressBar } from 'progress';
import { SEMVER, TMP_OPTIONS } from './constants.ts';
import { decompress } from './decompress.ts';

export const standardizedPlatform = (platform: string) =>
  platform === 'darwin' ? 'macos' : platform;

export const standardizedArchitecture = (architecture: string) =>
  architecture === 'x64' ? 'x86_64' : architecture;

export const tmp = async () => await Deno.makeTempDir(TMP_OPTIONS);

export const log = async (content: string) => {
  const file = await Deno.makeTempFile(TMP_OPTIONS);
  await Deno.writeTextFile(file, content);
  return file;
};

export const skia = (version: string, platform: string, architecture: string) =>
  `https://github.com/aseprite/skia/releases/download/${version}/skia-${standardizedPlatform(
    platform
  )}-release-${architecture}.zip`;

export const aseprite = (version: string) =>
  `https://github.com/aseprite/aseprite/releases/download/${version}/Aseprite-${version}-Source.zip`;

const formatted =
  (format: string) =>
  (...args: any[]) =>
    console.log('%c%s', format, ...args);

export const error = formatted('color: red; font-weight: bold;');
export const fatal = (...args: any[]) => {
  error(args);
  Deno.exit(1);
};
export const info = formatted('color: lightblue;');
export const success = formatted('color: green;');

export const version = async (
  command: string,
  expected: string,
  flag = '--version'
) => {
  const version = new TextDecoder()
    .decode(
      (
        await new Deno.Command(command, {
          args: [flag],
        }).output()
      ).stdout
    )
    .match(SEMVER)![0];

  const matches = satisfies(parseSemver(version), parseRange(expected));

  if (!matches) {
    error(`- expected ${command} version matching ${expected}, got ${version}`);
  } else {
    info(`- detected valid ${command} version ${version}`);
  }

  return matches;
};

export const present = async (name: string, path: string) => {
  const present = await exists(path);

  if (!present) {
    error(`- expected ${name} at ${path} but it was not found`);
  } else {
    info(`- detected ${name} at ${path}`);
  }

  return present;
};

export const downloadZip = async (
  url: string,
  name: string,
  directory: string
) => {
  const output = join(directory, name);
  const zipOutput = `${output}.zip`;

  info(`attempting to download and unzip ${name} to ${output}`);

  const progressBar = new MultiProgressBar({
    title: `downloading ${url}`,
    display: '[:bar] :text :percent',
  });

  const { progressStream, fileStream } = await downstream(url);

  const filePipe = fileStream.pipeTo(
    (
      await Deno.open(zipOutput, {
        write: true,
        create: true,
      })
    ).writable
  );

  for await (const progress of progressStream) {
    progressBar.render([
      {
        completed: Number.parseFloat(progress),
      },
    ]);
  }

  await filePipe;

  // it may not update until 100% when the download completes
  progressBar.end();

  info('attempting to decompress downloaded file');

  if (!(await decompress(zipOutput, output))) {
    fatal('failed to decompress the downloaded file');
  }

  info('removing downloaded file');

  await Deno.remove(zipOutput);

  success(`${name} has successfully been downloaded and decompressed`);
};
