import fs from "fs";
import path from "path";
import {Image} from "../models/imageModel.js";

const UPLOADS_DIR = path.join(path.resolve(), "uploads");

export const uploadImage = async (req, res) => {
  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    const newImage = await Image.create({ url: imageUrl });

    res.status(201).json({ message: "Image uploaded successfully", url: newImage.url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

export const getImages = async (req, res) => {
  try {
    const images = await Image.findAll({ limit: 9 });
    const fullImages = Array(9).fill(null).map((_, index) => images[index]?.url || null);
    res.json(fullImages);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    const imagePath = path.join(UPLOADS_DIR, path.basename(url));

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Image.destroy({ where: { url } });
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

