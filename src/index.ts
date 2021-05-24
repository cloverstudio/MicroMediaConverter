import amqp, { Connection, Channel } from 'amqplib';
import { RmqConfig } from './interfaces/RmqConfig';
import { MutateFile } from './lib/mutateFile';

export class MicroMediaConverter {

  private isReady: boolean;
  private inputQueue: string;
  private outputQueue: string;
  private outputPath: string;
  private rmqConfig: RmqConfig;
  private amqpChannel!: Channel;
  private amqpConnection!: Connection;

  constructor(inputQueue: string, outputQueue: string, outputPath: string, rmqConfig?: RmqConfig) {
    this.isReady = false;
    this.inputQueue = inputQueue;
    this.outputQueue = outputQueue;
    this.outputPath = outputPath;
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

        if (!this.amqpChannel)
            this.amqpChannel = await this.amqpConnection.createChannel();

        resolve(true);
      } catch (err) {
        console.error(err);
        resolve(false);
      }
    });
  }

  private consumeQueue(): void {
    this.amqpChannel.consume(this.inputQueue, async (evnt) => {
      if (!evnt) return;
      
      const inputUrl: string = evnt.content.toString();
      const fileType: string = inputUrl.split(".")[1];

      try {

        if (fileType === 'png') {
          const thumbName: string = await MutateFile.thumbnailImage(inputUrl, this.outputPath);
          this.sendToQueue(thumbName);
          console.log(thumbName);
        } else if (fileType === 'mp4') {
          const thumbName: string = await MutateFile.thumbnailVideo(inputUrl, this.outputPath);
          this.sendToQueue(thumbName);
          const compressedName: string = await MutateFile.compressVideo(inputUrl, this.outputPath);
          this.sendToQueue(compressedName);
          console.log(thumbName, compressedName);
          
        }

        this.amqpChannel.ack(evnt);
      } catch (err) {
        console.error(err);
        
      }
    });
  }

  private sendToQueue(data: string): void {
    try {
      this.amqpChannel.sendToQueue(this.outputQueue, Buffer.from(data));
    } catch (err) {
      console.error(err);
    }
  }

}