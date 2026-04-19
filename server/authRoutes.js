const express = require("express");
const authService = require("./authService");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const requireBody = (fields, body) => {
  for (const f of fields) {
    if (!body[f]) return f;
  }
  return null;
};

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const missing = requireBody(
      ["userId", "username", "email", "password"],
      req.body
    );

    if (missing) {
      return res.status(400).json({
        success: false,
        message: `${missing} is required`,
      });
    }

    const user = await authService.register(
      req.body.userId,
      req.body.username,
      req.body.email,
      req.body.password
    );

    res.status(201).json({
      success: true,
      user,
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const missing = requireBody(["email", "password"], req.body);

    if (missing) {
      return res.status(400).json({
        success: false,
        message: `${missing} is required`,
      });
    }

    const user = await authService.login(
      req.body.email,
      req.body.password
    );

    res.json({
      success: true,
      user,
    });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    await authService.logout(userId);

    res.json({
      success: true,
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();

    res.json({
      success: true,
      users,
    });
  })
);

router.get(
  "/user/:userId",
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  })
);

router.get(
  "/messages/:userId",
  asyncHandler(async (req, res) => {
    const messages = await authService.getUnreadMessages(req.params.userId);

    res.json({
      success: true,
      messages,
    });
  })
);

router.post(
  "/mark-read",
  asyncHandler(async (req, res) => {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: "messageId is required",
      });
    }

    await authService.markMessageAsRead(messageId);

    res.json({
      success: true,
    });
  })
);

router.post(
  "/toggle-letstalk",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await authService.toggleLetsTalk(userId);

    res.json({
      success: true,
      user,
    });
  })
);

module.exports = router;