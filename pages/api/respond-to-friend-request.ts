import prisma from "../../lib/prisma";
import withSession from "../../lib/session";
import * as yup from "yup";

let requestSchema = yup.object().shape({
  friendId: yup.number().required(),
  accepted: yup.boolean().required(),
});

export default withSession(async (req, res, session) => {
  if (typeof req.body !== "object") {
    return res
      .status(400)
      .json({ error: true, errors: ["request body is required"] });
  }

  try {
    await requestSchema.validate(req.body);
  } catch (err) {
    return res.status(400).json({ error: true, errors: err.errors });
  }

  const { friendId, accepted } = req.body;

  if (req.session.get("user") === undefined) {
    return res.status(403).json({ error: true, message: "restricted" });
  }

  let userId = req.session.get("user").id;

  const friendRequest = await prisma.userFriendRequests.findFirst({
    where: {
      sentByUserId: +friendId,
      requestedUserId: +userId,
    },
  });

  if (friendRequest === null) {
    res
      .status(500)
      .json({ error: true, errors: ["Friend request does not exist."] });
  }

  if (accepted == "true" || accepted == true) {
    await prisma.userFriend.create({
      data: {
        userId: +userId,
        friendId: +friendId,
      },
    });

    await prisma.userFriend.create({
      data: {
        userId: +friendId,
        friendId: +userId,
      },
    });

    await prisma.userFriendRequests.delete({
      where: {
        id: friendRequest.id,
      },
    });
  } else {
    await prisma.userFriendRequests.delete({
      where: {
        id: friendRequest.id,
      },
    });
  }

  res.status(200).json({ succes: true });
});
