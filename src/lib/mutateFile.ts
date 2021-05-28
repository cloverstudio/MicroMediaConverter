import { execFile } from 'child_process';

export class MutateFile {

  private outputPath: string;

  constructor(outpathPath: string) {
    this.outputPath = outpathPath;
  }

  public resizeVideo(inputUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const newFileName: string = `resized-${this.extractFileNameFromUrl(inputUrl)}`;
      const args: string[] = [
        '-i', inputUrl,
        '-s', `${width}x${height}`,
        `${this.outputPath}/${newFileName}`
      ];

      execFile('ffmpeg', args, (err) => {
        if (err) reject(err);
        resolve(newFileName);
      })
    });
  }

  public compressVideo(inputUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const newFileName: string = `compressed-${this.extractFileNameFromUrl(inputUrl)}`;
      const args: string[] = [
        '-i', inputUrl, '-s',
        `${width}x${height}`,
        '-b:v', '512k',
        '-c:v', 'mpeg1video',
        '-c:a', 'copy',
        `${this.outputPath}/${newFileName}`
      ];

      execFile('ffmpeg', args, (err) => {
        if (err) reject(err);
        resolve(newFileName);
      });;
    })
  }

  public thumbnailVideo(
    inputUrl: string, width: number, height: number, outputFormat?: string, compression?: number, time?: string
    ): Promise<string> {
    return new Promise((resolve, reject) => {
      const newFileName: string = this.generateThumbnailName(this.extractFileNameFromUrl(inputUrl), outputFormat);
      const args: string[] = [
        '-i', inputUrl, '-frames:v', '1',
        '-s', `${width}x${height}`,
        '-ss', `${time ? time : '00:00:01'}`,
      ];

      if (compression) args.push('-compression_level', `${compression * 100}`);

      args.push(`${this.outputPath}/${newFileName}`)
      execFile('ffmpeg', args, (err) => {
        if (err) reject(err);
        resolve(newFileName);
      });
    });
  }

  public thumbnailPicture(
    inputUrl: string, width: number, height: number, outputFormat?: string, compression?: number
    ): Promise<string> {
    return new Promise((resolve, reject) => {
      const newFileName: string = this.generateThumbnailName(this.extractFileNameFromUrl(inputUrl), outputFormat);
      const args: string[] = [
        '-i', inputUrl, '-vf', 
        `scale=${width}:${height}`,
      ];

      if (compression) args.push('-compression_level', `${compression * 100}`);

      args.push(`${this.outputPath}/${newFileName}`);
      execFile('ffmpeg', args, (err) => {
        if (err) reject(err);
        resolve(newFileName)
      });
    });
  }

  private generateThumbnailName(oldName: string, outputFormat?: string): string {
    const newName: string = outputFormat ? `${oldName.split(".")[0]}.${outputFormat}` : oldName;
    return `thumbnail-${newName}`;
  }

  private extractFileNameFromUrl(url: string): string {
    const split: string[] = url.split("/");
    return split[split.length - 1];
  }
  
}