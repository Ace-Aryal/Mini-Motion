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
