import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Minimun password length is 6 chars"),
});
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const result = registerSchema.safeParse({
      email,
      password,
    });
    if (!result.success) {
      return NextResponse.json({
        status: 400,
        error: "Invalid input type, please send valid data",
      });
    }
    await connectToDB();
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({
        status: 400,
        error: "User already exists with provided email",
      });
    }
    await User.create(email, password);
    return NextResponse.json({
      status: 200,
      error: "User registration sucessful",
    });
  } catch (error) {
    console.error("registration error", error);
    return NextResponse.json({
      status: 400,
      error: "Failes to register user",
    });
  }
}
