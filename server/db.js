import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const USER = process.env.MONGO_DB_USER;
const PASSWORD = process.env.MONGO_DB_PASSWORD;

const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.nhrydsy.mongodb.net/?retryWrites=true&w=majority`;

const adminUser = {
  _id: "admin",
  name: "Admin",
  color: "#000000",
};

const setDefaultUsers = async (db) => {
  const collection = db.db("shared-canvas").collection("users");
  const users = await collection.find({ _id: "admin" }).toArray();

  console.log({ users });

  const admin = users.find((u) => u._id === adminUser._id);

  if (admin) {
    console.log("Admin user already exists");
  } else {
    const result = await collection.insertOne(adminUser);
    console.log("Admin user was added");
  }
};

export const getUsers = async (db) => {
  const collection = db.db("shared-canvas").collection("users");
  const users = await collection.find({}).toArray();

  return users;
};

export const db = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

db.connect(async (err) => {
  console.log("mongo db connected");

  await setDefaultUsers(db);
  const users = await getUsers(db);

  console.log({ users });

  //   db.close();
});
