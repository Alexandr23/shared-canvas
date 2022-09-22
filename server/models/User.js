import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
      default: "#000000",
    },
  },
  { timestamps: true }
);

const FIRST_NAMES = {
  male: ["Medved", "Zayac", "Kenguru", "Homyak", "Verblud", "Petuh"],
  female: ["Antilopa", "Krisa", "Loshad", "Bloha", "Sinica", "Zebra"],
};

const MIDDLE_NAMES = {
  male: [
    "Nikolaevic",
    "Petrovic",
    "Alexandrovic",
    "Dmitrievic",
    "Kirillovic",
    "Ivanovic",
  ],
  female: [
    "Nikolaevna",
    "Petrovna",
    "Alexandrovna",
    "Dmitrievna",
    "Kirillovna",
    "Ivanovna",
  ],
};

const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const getRandomName = () => {
  const sex = Math.random() > 0.5 ? "male" : "female";
  const firstName = FIRST_NAMES[sex][random(0, 5)];
  const middleName = MIDDLE_NAMES[sex][random(0, 6)];

  return `${firstName} ${middleName}`;
};

const getRandomHexColor = () => {
  return "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
};

userSchema.statics.generate = async function () {
  return this.create({
    name: getRandomName(),
    color: getRandomHexColor(),
  });
};

userSchema.set("toJSON", {
  virtuals: true,
});

export const User = model("User", userSchema);
