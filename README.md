# Micro Media Converter
Micro media converter is a simple ![amqplib](https://www.npmjs.com/package/amqplib) consumer that mutates files through a powerful ![FFmpeg](https://www.ffmpeg.org).

## Before you get started
Requirements:
- Running RabbitMQ server
- FFmpeg installed on a machine
- Amqplib  

## Installation
```bash
$ npm install micromediaconverter
```

## Usage
Micro media converter adds *RabbitMQ* consumer that modifies files using *FFmpeg*. Queues are both input and output for this module. You can run this module as a standalone like this: 
```typescript
import Mmc from 'micromediaconverter';

const mmc: Mmc = new Mmc('inputQueueName', 'outputQueueName', '/upload/path');
```
And in your main application/*server* that has **amqplib** connection
```typescript
import { MmcMessage } from 'micromediaconverter';

const inputChannel = amqplibConnection.createChannel();
const outputChannel = amqplibConnection.createChannel();

const request: MmcMessage = {
  id: 'idWhichWillBeReturnedInOutputQueue',
  command: 'resize_video',
  src: 'https://www.input.url/video.mp4',
  options: {
    width: 128,
    height: 128
  }
};
inputChannel.sendToQueue('inputQueueName', Buffer.from(request.toString()));

outputChannel.consume('outputQueueName', (evnt: any) => {
  const response = JSON.parse(evnt.content.toString());

  console.log(response);
  /*
  Excepted output: 
    {
      "id": "idWhichWillBeReturnedInOutputQueue",
      "command": "resize_video",
      "result": "https://www.input.url/resized-video.mp4"
    }
  */

  outputChannel.ack(evnt);
});
```

## Informational
List of all possible commands:
1. `thumbnail_picture`
2. `thumbnail_video`
3. `resize_video`

Input queue messages types:
```typescript
{
  id: '748e128197c1df9d', // Input unique id by which you will identify it in output queue
  command: 'thumbnail_video',
  src: 'https://clover.studio/picture.jpg' // URL of an input file
  options: { // Arguments for current command
    width: 128,
    height: 128,
    compression: 0.7, // minimum 0, maximum 1
    outputformat: 'png',
    time: '00:05:04'
  }
}
```
Command | Argument | Description | Required
--- | --- | --- | ---
all | `width` | Change width of a file | **true**
all | `height` | Change height of a file | **true**
thumbnail_* | `compression` | Changes compression ratio | **false**
thumbnail_* | `outputformat` | Change the output file type | **false**
thumbnail_video | `time` |  Generates thumbnail from specified time | **false**

## Notes
MIT license. Created by ![Clover Studio Ltd](https://clover.studio).