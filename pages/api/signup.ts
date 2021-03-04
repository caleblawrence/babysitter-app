import withSession from "../../lib/session";
import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import type { NextApiResponse } from "next";
import assert from "assert";

const saltRounds = 10;

export default withSession(async (req: any, res: NextApiResponse) => {
  if (req.method !== "POST") return;

  try {
    assert.notEqual(null, req.body.email, "Email required");
    assert.notEqual(null, req.body.password, "Password required");
  } catch (bodyError) {
    res.status(400).json({ error: true, message: bodyError.message });
  }
  const { name, email, password } = await req.body;

  const usersWithEmail = await prisma.user.count({
    where: {
      email: email,
    },
  });

  if (usersWithEmail > 0) {
    res.status(400).json({ error: true, message: "Email already exists." });
  }

  try {
    bcrypt.hash(password, saltRounds, async function (err, hash: string) {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hash,
        },
      });

      req.session.set("user", {
        id: user.id,
        name: user.name,
        email: user.email,
        isLoggedIn: true,
      });

      await req.session.save();
      return res.status(200).json({ message: "Logged in" });
    });
  } catch (error) {
    const { response: fetchResponse } = error;
    res.status(fetchResponse?.status || 500).json(error.data);
    return;
  }
});
