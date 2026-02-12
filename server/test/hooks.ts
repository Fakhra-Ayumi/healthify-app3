import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

before(async function () {
  this.timeout(30000);
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async function () {
  await mongoose.disconnect();
  await mongoServer.stop();
});
