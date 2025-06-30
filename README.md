# Mini-Motion

Mini Motion is a small video streaming/uploading full-stack web app built using next.js , mongoDB(mongoose), next auth and Imagekit

## Steps / Approach

### 1. Installation

- mongoose, becrypt , next.js, types

### 2. Model Set up

- define types and create models
  Great question — let’s break it down clearly.

---

## ⏱ What is `timestamps` in Mongoose?

In Mongoose (the popular ODM for MongoDB in Node.js),
the `timestamps` option **automatically adds and manages two fields** on your schema:

- `createdAt` → when the document was first created
- `updatedAt` → when the document was last updated

---

### 🔧 How to use it

When you define your schema, just add:

```javascript
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
  },
  { timestamps: true }
); // 👈 this line adds createdAt and updatedAt
```

---

### ⚙️ How it works

- When you **create a document**, Mongoose automatically sets both `createdAt` and `updatedAt` to the current date.
- When you **update a document**, Mongoose automatically updates the `updatedAt` timestamp.

You don’t have to manually handle it.

---

### 📄 Example document

```json
{
  "_id": "66b016e7f9d...",
  "title": "My first post",
  "content": "Hello world!",
  "createdAt": "2025-06-30T08:12:23.456Z",
  "updatedAt": "2025-06-30T08:12:23.456Z",
  "__v": 0
}
```

---

✅ **Summary:**
`timestamps: true` is just a **shortcut to keep track of when your data was created and last modified.** Very handy for posts, comments, user activity, logs, etc.

---

If you want, I can also show you how to:

- customize the field names (e.g. `created_on` instead of `createdAt`),
- or how to query/filter by these timestamps.

Want that? Let me know! 🚀

Absolutely! Let’s break this down line by line in **plain, intuitive terms.**

---

## 🚀 What does this code do?

This is a **Mongoose “pre-save hook”** (also called a **middleware**).
It runs **automatically before** a document (like a User) is saved to the database.

It’s often used to **hash passwords before saving**, so you never store plain text passwords.

---

## 📝 Line by line explanation

```javascript
userSchema.pre("save", async function (next) {
```

- `userSchema.pre("save", ...)`
  → Sets up a **pre-save hook**.
  Mongoose will run this function **before any `.save()` or `.create()` on this schema.**

- `async function (next)`
  → This is an async function (so we can `await` promises).
  The `next` is a callback you call when done, telling Mongoose to move on.

- `this` inside here → refers to the **actual document** being saved (e.g. a user object).

---

```javascript
  if (this.isModified("password")) {
```

- `this.isModified("password")`
  → Checks if the `password` field has been **created or changed**.
  (So we don’t re-hash an already hashed password if other fields change.)

---

```javascript
this.password = await bcrypt.hash(this.password, 10);
```

- If the password was created or modified:

  - **Hash it** using bcrypt.
  - `10` is the salt rounds (controls hashing complexity).
  - Then replace the plain password with the hashed one **before saving to the DB.**

---

```javascript
  }
  next();
});
```

- `next();` tells Mongoose:
  ✅ “I’m done with the pre-save work — you can proceed to actually save to the DB now.”

---

## 💡 Why is this important?

- This makes sure **passwords are always stored hashed** — never in plain text.
- Even if a developer forgets to hash before calling `save()`, this hook ensures it’s done.

---

✅ **Summary:**

> - Before saving a user, this checks if the password was added or changed.
> - If yes, it hashes the password with bcrypt.
> - Then it saves the user with the hashed password.

---

If you’d like, I can also show you:

- how to compare passwords on login (using `bcrypt.compare`),
- or how to only hash if password was changed on `update`.
  Just tell me! 🚀

### 3.Connection to db

✅ That’s an excellent question — and you’re absolutely right:
Prisma (especially with Next.js on Vercel) often **abstracts away the DB connection lifecycle for you**.
In contrast, when you use **Mongoose** (or any direct driver like `mongodb`), **you manage the connection yourself**.

Let’s break your code down carefully — in a very clear way, so you understand **what problem it solves**, and **why it’s written like this.**

---

## 🏗️ What problem is this solving?

When using **Next.js (or any serverless environment)**:

- Every **API route** or **getServerSideProps** is **a new function execution**, meaning your app could create **many database connections** if you’re not careful.

MongoDB Atlas **has a connection limit**. If you open a new connection for every API call, you’ll exhaust it quickly.

So this pattern:
✅ **Reuses an existing DB connection if already open** (avoids unnecessary new connections).

---

## 🔍 Your code, explained line by line

---

### 1️⃣ The global declaration

```ts
declare global {
  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}
```

- This is a **TypeScript global declaration** so `global.mongoose` can be safely typed anywhere.
- `global` is **Node’s global object**, like `window` for browsers.

This is needed because in a **Next.js dev server**, modules can be hot-reloaded multiple times — so we attach the connection cache to `global` to persist across reloads.

---

### 2️⃣ Check / set global cache

```ts
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
```

- If `global.mongoose` does not exist yet, we initialize it.
- `cached.conn` will hold the **resolved DB connection**.
- `cached.promise` will hold the **connection promise** while it’s connecting.

---

### 3️⃣ The connect function

```ts
export async function connectToDB() {
  if (cached.conn) {
    return cached.conn; // reuse existing connection
  }

  if (!cached.promise) {
    const options = {};
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then(() => mongoose.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
```

✅ **How it works:**

- If a connection is already **established**, just reuse it (`cached.conn`).
- If a connection is **in progress** (`cached.promise`), wait for it to finish.
- If no connection yet, **start connecting**, save the promise, and wait for it.
- If it fails, clear `cached.promise` so the next call can retry.

This ensures **only one connection is made**, and it’s shared.

---

## 🚀 Comparison with Prisma

✅ **Prisma:**

- Handles a **single client instance under the hood** (via `prisma` object in `@prisma/client`), which auto-manages the connection pool.
- On serverless platforms (like Vercel), Prisma recommends a similar approach in development:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

So conceptually, it’s the **same pattern**:
✅ Cache the client on `global` so hot-reloads in Next.js dev don’t make 100 connections.

---

## 🧭 So why is it explicit in Mongoose?

Because **Mongoose does not auto-cache or auto-manage a global connection**.
You have to do it yourself (or use a helper library).

---

## 🗣️ How to think about it

| With Prisma                               | With Mongoose / MongoDB driver                      |
| ----------------------------------------- | --------------------------------------------------- |
| Prisma client manages pool under the hood | You must manage the connection                      |
| Simple `import prisma`                    | Explicit `connectToDB()` function with global cache |
| Works automatically with serverless pools | If not careful, can open dozens of connections      |

---

✅ **Summary:**

- Your code is just an **explicit way to reuse the Mongo connection** to prevent opening many connections in serverless (Next.js API routes).
- It mimics what Prisma does for you automatically.

---

🎯 If you’d like, I can also:

- make a small **diagram** of how `cached.conn` & `cached.promise` work, or
- show a simpler version in **pure JavaScript (no TS)**.

Want either of those? Just tell me! 🚀

### 4.Next Auth
