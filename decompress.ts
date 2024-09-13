import { exists } from '@std/fs';

// adapted from https://deno.land/x/zip@v1.2.5/

export const decompress = async (
  filePath: string,
  destinationPath: string
): Promise<string | false> => {
  // check if the zip file is exist
  if (!(await exists(filePath))) {
    throw 'this file does not found';
  }
  // check destinationPath is not null and set './' as destinationPath
  if (!destinationPath) {
    destinationPath = './';
  }

  return (await decompressProcess(filePath, destinationPath))
    ? destinationPath
    : false;
};

const decompressProcess = async (
  zipSourcePath: string,
  destinationPath: string
): Promise<boolean> => {
  const unzipCommandProcess = new Deno.Command(
    Deno.build.os === 'windows' ? 'PowerShell' : 'unzip',
    {
      args:
        Deno.build.os === 'windows'
          ? [
              'Expand-Archive',
              '-Path',
              `"${zipSourcePath}"`,
              '-DestinationPath',
              `"${destinationPath}"`,
            ]
          : [zipSourcePath, '-d', destinationPath],
    }
  );

  return (await unzipCommandProcess.output()).success;
};
