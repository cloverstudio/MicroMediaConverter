import { Commands } from '../interfaces';

export class Constants {
  static commands: Commands = {
    thumbnailPicture: 'thumbnail_picture',
    thumbnailVideo: 'thumbnail_video',
    resizeVideo: 'resize_video'
  }

  static allowedFormats: string[] = [
    'png',
    'jpg'
  ]
}