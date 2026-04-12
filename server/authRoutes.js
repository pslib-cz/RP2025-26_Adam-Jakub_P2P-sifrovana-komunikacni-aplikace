const express = require("express");
const authService = require("./authService");
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Registrace usera
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { userId, username, email, password } = req.body;

    const user = await authService.register(userId, username, email, password);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  })
);
// Prihlaseni usera 
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user,
    });
  })
);
// Odhlaseni usera = offline
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    await authService.logout(userId);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  })
);
// vsechny usery
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();

    res.status(200).json({
      success: true,
      users,
    });
  })
);

// user podle id
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

    res.status(200).json({
      success: true,
      user,
    });
  })
);
// neprectene zpravy offline useru
router.get(
  "/messages/:userId",
  asyncHandler(async (req, res) => {
    const messages = await authService.getUnreadMessages(req.params.userId);

    res.status(200).json({
      success: true,
      messages,
    });
  })
);

module.exports = router;
