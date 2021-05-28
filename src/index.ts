import amqp, { Connection, Channel } from 'amqplib';
import { RmqConfig, MmcMessage } from './interfaces';
import { MutateFile, Constants } from './lib';

export default class MicroMediaConverter {

  private isReady: boolean;
  private inputQueue: string;
  private outputQueue: string;
  private rmqConfig: RmqConfig;
  private amqpChannelInput!: Channel;
  private amqpChannelOutput!: Channel;
  private mutateFile: MutateFile;
  private amqpConnection!: Connection;

  constructor(inputQueue: string, outputQueue: string, outputPath: string, rmqConfig?: RmqConfig) {
    this.isReady = false;
    this.mutateFile = new MutateFile(outputPath);
    this.inputQueue = inputQueue;
    this.outputQueue = outputQueue;
    this.rmqConfig = rmqConfig || {
      user: "guest",
      password: "guest",
      host: "localhost",
      port: 5672
    };
    
    this.initialize();
  }

  private async initialize() {
    while (!this.isReady) {
      this.isReady = await this.connectToRabbitMq();
    }
    this.consumeQueue();
  }

  private connectToRabbitMq(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.amqpConnection)
          this.amqpConnection = await amqp.connect(
            `amqp://${this.rmqConfig.user}:${this.rmqConfig.password}@${this.rmqConfig.host}:${this.rmqConfig.port}`
          );

        if (!this.amqpChannelInput || !this.amqpChannelOutput) {
          this.amqpChannelInput = await this.amqpConnection.createChannel();
          this.amqpChannelOutput = await this.amqpConnection.createChannel();

          this.amqpChannelInput.assertQueue(this.inputQueue, { durable: false });
          this.amqpChannelOutput.assertQueue(this.outputQueue, { durable: false });
        }

        resolve(true);
      } catch (err) {
        console.error(err);
        resolve(false);
      }
    });
  }

  private consumeQueue(): void {
    this.amqpChannelInput.consume(this.inputQueue, async (evnt) => {
      if (!evnt) return;

      const newMessage = JSON.parse(evnt.content.toString());
      const id: string = newMessage.id;
      const command: string = newMessage.command;
      const src: string = newMessage.src;
 
      const time: string = newMessage.time;
      const width: number = newMessage.options.width;
      const height: number = newMessage.options.height;
      const compression: number = newMessage.options.compression;
      const outputFormat: string = newMessage.options.outputformat;

      try {
        if (!id || !command || !src) throw Error('input error');
        const returnMessage: MmcMessage = {
          id,
          command,
          result: '',
        }

        switch (command) {
          // case Constants.commands.compressVideo:
            // TODO
          // break;

          case Constants.commands.resizeVideo:
            returnMessage.result = await this.mutateFile.resizeVideo(src, width, height);
            this.sendToQueue(returnMessage);
          break;
            
          case Constants.commands.thumbnailVideo:
            if (outputFormat && !Constants.allowedFormats.some(format => format === outputFormat)) throw Error('forbidden format');
            returnMessage.result = await this.mutateFile.thumbnailVideo(src, width, height, outputFormat, compression, time);
            this.sendToQueue(returnMessage);
          break;
            
          case Constants.commands.thumbnailPicture:
            if (outputFormat && !Constants.allowedFormats.some(format => format === outputFormat)) throw Error('forbidden format');
            returnMessage.result = await this.mutateFile.thumbnailPicture(src, width, height, outputFormat, compression);
            this.sendToQueue(returnMessage);
          break;
        }

        this.amqpChannelInput.ack(evnt);
      } catch (err) {
        console.error(err);
        this.amqpChannelInput.ack(evnt);
      }
    });
  }

  private sendToQueue(data: MmcMessage): void {
    try {
      const output: Buffer = Buffer.from(JSON.stringify(data));
      this.amqpChannelOutput.sendToQueue(this.outputQueue, output);
    } catch (err) {
      console.error(err);
    }
  }

}