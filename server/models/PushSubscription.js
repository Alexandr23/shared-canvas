import mongoose from "mongoose";

const { Schema, model } = mongoose;

const pushSubscriptionSchema = new Schema({
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    type: {
      p256dh: String,
      auth: String,
    },
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

pushSubscriptionSchema.set("toJSON", {
  virtuals: true,
});

export const PushSubscription = model(
  "PushSubscription",
  pushSubscriptionSchema
);
