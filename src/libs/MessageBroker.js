const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

class MessageBroker {
  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.publisher = redis.createClient({ url });
    this.subscriber = redis.createClient({ url });
    this.ready = false;
    this.connectPromise = this.init(url);
  }

  async init(url) {
    await this.publisher.connect();
    await this.subscriber.connect();
    this.ready = true;
    console.log(`[MessageBroker] Connected to Redis at ${url}`);
  }

  async publish(channel, message) {
    await this.connectPromise;
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
    console.log(`[Event Published] ${channel} ->`, message);
  }

  async subscribe(channel, callback) {
    await this.connectPromise;
    await this.subscriber.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
    console.log(`[Subscribed] to ${channel}`);
  }
}

module.exports = new MessageBroker();
