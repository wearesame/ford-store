const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await fetch(
      "https://6907f062b49bea95fbf1edf9.mockapi.io/ntdotjsx/products",
    );
    const products = await response.json();

    res.render("index", {
      title: "ตัวอย่าง data",
      products,
    });
  } catch (error) {
    res.status(500).send("Error fetching products");
  }
});

module.exports = router;
