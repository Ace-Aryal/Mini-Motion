//1. imoports
import mongoose, { Schema, Date, model, models } from "mongoose";
import bcrypt from "bcryptjs";
//2. define types
export type TUser = {
  email: string;
  password: string;
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
// 3. create schema (like that in prisma)
const userSchema = new Schema<TUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
// 4. pre hooks for passwords and credentails
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
// 5. export user schema
const User = models?.User || model<TUser>("User", userSchema);
export default User;

// this is how you define a model in mongoose
