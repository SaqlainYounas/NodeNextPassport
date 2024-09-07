import express from "express";

const router = express.Router();

//api/auth/login
router.get("/conversations", (req, res) => {
  res.send("Conversation route");
});

export default router;
