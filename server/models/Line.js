import mongoose from "mongoose";

const { Schema, model } = mongoose;

const pointSchema = new Schema({
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
});

const lineSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  start: {
    type: pointSchema,
    required: true,
  },
  end: {
    type: pointSchema,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
});

lineSchema.set("toJSON", {
  virtuals: true,
});

export const Line = model("Line", lineSchema);
