import { execFile } from 'child_process';

export class MutateFile {

  static compressVideo(inputUrl: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!inputUrl || !outputPath) reject();
      
      const split: string[] = inputUrl.split("/");
      const originalFile: string = split[split.length - 1];
      const newFile: string = `${originalFile.split(".")[0]}.mp4`;

      try {

        execFile('ffmpeg', [
          '-i', inputUrl,
          '-s', '640x480',
          '-b:v', '512k',
          '-c:v', 'mpeg1video',
          '-c:a', 'copy', 
          `${outputPath}/${newFile}`
        ], (err: any) => {
          if (err) reject(err);
          resolve(newFile);
        });;

      } catch (err) {
        reject(err);
      }
    });
  }

  static thumbnailVideo(inputUrl: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!inputUrl || !outputPath) reject();

      const split: string[] = inputUrl.split("/");
      const originalFile: string = split[split.length - 1];
      const newFile: string = `${originalFile.split(".")[0]}.png`;

      try {

        execFile('ffmpeg', [
          '-i', inputUrl,
          '-ss', '00:00:01',
          '-frames:v', '1',
          `${outputPath}/${newFile}`
        ], (err: any) => {
          if (err) reject(err);
          resolve(newFile);
        })

      } catch (err) {
        reject(err);
      }
    });
  }

  static thumbnailImage(inputUrl: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!inputUrl || !outputPath) reject();
      
      const split: string[] = inputUrl.split("/");
      const originalFile: string = split[split.length - 1];
      const newFile: string = `${originalFile.split(".")[0]}.png`;

      try {

        execFile('ffmpeg', [
          '-i', inputUrl,
          '-vf', 'scale=320:-1',
          `${outputPath}/${newFile}`
        ], (err: any) => {
          if (err) reject(err);
          resolve(newFile);
        });

      } catch (err) {
        reject(err);
      }
    });
  }
  
}