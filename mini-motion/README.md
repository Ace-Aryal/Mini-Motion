Perfect — here’s how you’d **adapt this full Mongoose setup to the Next.js App Router (`app/`)** (i.e. no `pages/api`, but using **Server Actions**, **Route Handlers**, or **Server Components**).

I’ll break it into:

---

## ⚙️ 1. Project structure for App Router

```
/app
  /api
    /users
      route.ts   <-- for route handlers
/lib
  mongoose.ts
/models
  User.ts
.env.local
```

---

## 🔌 2. Database connection (same as before)

Put in `lib/mongoose.ts`:

```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "yourdbname",
        bufferCommands: false,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 🏗️ 3. Mongoose models (same idea)

```ts
// models/User.ts
import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true },
    age: Number,
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
```

---

## 🚀 4. Route handlers (App Router’s replacement for API routes)

Put in `app/api/users/route.ts`:

```ts
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

// GET /api/users
export async function GET() {
  await connectDB();
  const users = await User.find();
  return NextResponse.json(users);
}

// POST /api/users
export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const user = await User.create(data);
  return NextResponse.json(user, { status: 201 });
}
```

✅ This replaces `pages/api`.

---

## 💻 5. Using directly in Server Components (optional)

If you want, you can use it directly inside a server component like:

```tsx
// app/users/page.tsx
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";

export default async function UsersPage() {
  await connectDB();
  const users = await User.find();

  return (
    <div>
      <h1>Users</h1>
      {users.map((user) => (
        <div key={user._id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 6. Environment

Same as before in `.env.local`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/yourdbname
```

Restart server after changes.

---

## ⚡ Quick summary cheatsheet

✅ Connection

```ts
await connectDB();
```

✅ CRUD

```ts
await User.find();
await User.create();
await User.findByIdAndUpdate();
await User.findByIdAndDelete();
```

---

## 🚀 You’re done!

You now have:
✅ `lib/mongoose.ts` → connection
✅ `models/User.ts` → schema
✅ `app/api/.../route.ts` → route handlers
✅ can also use directly in Server Components.

---

If you want, I can also give:
✅ `PATCH` / `DELETE` in route.ts
✅ Server Actions example (`app/page.tsx` + `useForm`)
✅ Optimistic UI pattern with `startTransition`
✅ Zod validation

Just tell me what you’d like next!

✅ Absolutely — let’s extend this to a **full auth flow** with:

1️⃣ **Register (sign up)** endpoint — creates a user in MongoDB with a hashed password.
2️⃣ **Login** via NextAuth Credentials (already done).
3️⃣ Keeps using **GitHub OAuth** alongside.

I'll keep this clean & minimal with your existing **Next.js 15 App Router + Mongoose + NextAuth** setup.

---

# 🚀 1. Create a **Register API Route**

This will let you **sign up new users**.
👉 E.g. POST `/api/auth/register` with `{ name, email, password }`.

---

## `app/api/auth/register/route.ts`

```ts
import { connectToDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectToDB();

  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return NextResponse.json({ message: "User created", userId: newUser._id });
}
```

---

# 🔐 2. Now your flow is:

✅ **POST /api/auth/register** — creates a user
✅ **NextAuth Credentials login** (via `/api/auth/[...nextauth]`) — signs them in
✅ **GitHub OAuth** still works alongside.

---

# ✍️ 3. Example register call from client

(You’d typically call this from a sign-up form on the frontend.)

```tsx
"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (res.ok) {
      setMsg("Account created. You can now log in.");
    } else {
      setMsg(data.message);
    }
  };

  return (
    <div>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button onClick={handleRegister}>Register</button>
      <div>{msg}</div>
    </div>
  );
}
```

---

# ✅ Recap of the **full flow**

| Action                       | Endpoint                       | What happens                            |
| ---------------------------- | ------------------------------ | --------------------------------------- |
| 🔨 **Register**              | `POST /api/auth/register`      | Creates MongoDB user w/ hashed password |
| 🔑 **Login** via Credentials | `signIn("credentials", {...})` | NextAuth checks MongoDB + bcrypt        |
| 🐙 **Login** via GitHub      | `signIn("github")`             | NextAuth OAuth + Mongo user if needed   |

---

# 🚀 That’s it!

✅ You now have **register + login** fully covered with:

- 🔥 `NextAuth` for sessions (JWT by default)
- 🔒 hashed passwords with `bcryptjs`
- 🐙 GitHub OAuth side-by-side
- 🐣 custom register endpoint for sign-up.

---

🎯 If you want, I can also give you:
✅ `signIn` call example with Credentials on the frontend
✅ `NextAuth` callbacks to **extend the session with user ID from Mongo**
✅ MongoDB adapter to **store sessions in your database** (vs default JWT).

Just tell me what you want next! 💪

🔥 Perfect — here’s a **full modern setup for NextAuth (with Credentials + GitHub) + Mongoose**
using **Next.js 15 App Router** style (in `app/`), designed to work cleanly with your existing Mongoose connection.

---

# 🚀 1. Install packages

```bash
npm install next-auth mongoose
```

---

# 📁 2. Folder structure

```
/app
  /api
    /auth
      [...nextauth]/route.ts
/lib
  mongoose.ts
/models
  User.ts
/pages
  (empty if App Router only)
/.env.local
```

---

# ⚙ 3. Create Mongoose connection

Already similar to yours:

```ts
// lib/mongoose.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {}).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

# 🗄 4. Create User model

```ts
// models/User.ts
import mongoose, { Schema, models, model } from "mongoose";

const userSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String, // hashed password for credentials
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
```

---

# 🔐 5. Setup NextAuth in App Router

### ✅ File: `app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { compare } from "bcryptjs"; // if using bcrypt

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDB();
        const user = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("No user found with this email");

        const isValid = await compare(credentials!.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return user; // must return object
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
});

export { handler as GET, handler as POST };
```

---

# 🔑 6. Environment variables

```dotenv
# .env.local
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/yourdb
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
NEXTAUTH_SECRET=some_random_string
```

---

# ✨ 7. Using in Client

### `app/page.tsx`

```tsx
"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <>
          <h1>Welcome {session.user?.email}</h1>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <>
          <button onClick={() => signIn("github")}>Sign in with GitHub</button>
          <button onClick={() => signIn()}>Sign in with Credentials</button>
        </>
      )}
    </div>
  );
}
```

---

# 📝 8. (Optional) bcrypt setup for credentials

If you’re doing **credentials with passwords**, make sure your signup hashes passwords.
Example:

```ts
import { hash } from "bcryptjs";
const hashedPassword = await hash(password, 10);
await User.create({ email, password: hashedPassword });
```

---

# ✅ Summary of what you now have

✅ NextAuth route at:

```
/api/auth/[...nextauth]/route.ts
```

✅ Integrated with **Mongoose + your `User` model**.

✅ Supports:

- `signIn("github")` with OAuth
- `signIn("credentials", { email, password })` for local login

✅ Fully **App Router compatible** (no `pages/api`).

---

✅ **Done!**
If you want, I can also give you:

- a **secure signup API route** to create users with hashed passwords
- a **custom NextAuth callbacks** example to extend the JWT with Mongo user ID
- or a **MongoDB session store** for persistent sessions.

Just tell me what you’d like next! 💪
