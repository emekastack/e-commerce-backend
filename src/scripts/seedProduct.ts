import "dotenv/config";
import mongoose from "mongoose";
import CategoryModel from "../database/models/category.model";
import ProductModel from "../database/models/product.model";
import { config } from "../config/app.config";

const MONGO_URI = process.env.MONGO_URI || "";

const categories = [
  { name: "Electronics", description: "Electronic gadgets and devices" },
  { name: "Books", description: "Books and literature" },
];

const products = [
  // Electronics
  {
    name: "Smartphone X1",
    description: "Latest smartphone with advanced features.",
    price: 699,
    imageUrl: "https://via.placeholder.com/300x300?text=Smartphone+X1",
    filename: "smartphone_x1.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones.",
    price: 199,
    imageUrl: "https://via.placeholder.com/300x300?text=Wireless+Headphones",
    filename: "wireless_headphones.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Smartwatch Pro",
    description: "Fitness tracking and notifications on your wrist.",
    price: 249,
    imageUrl: "https://via.placeholder.com/300x300?text=Smartwatch+Pro",
    filename: "smartwatch_pro.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable speaker with deep bass.",
    price: 89,
    imageUrl: "https://via.placeholder.com/300x300?text=Bluetooth+Speaker",
    filename: "bluetooth_speaker.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Laptop Air",
    description: "Lightweight laptop for everyday use.",
    price: 999,
    imageUrl: "https://via.placeholder.com/300x300?text=Laptop+Air",
    filename: "laptop_air.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Tablet S",
    description: "High-resolution display tablet.",
    price: 399,
    imageUrl: "https://via.placeholder.com/300x300?text=Tablet+S",
    filename: "tablet_s.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Gaming Mouse",
    description: "Ergonomic mouse for gamers.",
    price: 59,
    imageUrl: "https://via.placeholder.com/300x300?text=Gaming+Mouse",
    filename: "gaming_mouse.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard.",
    price: 129,
    imageUrl: "https://via.placeholder.com/300x300?text=Mechanical+Keyboard",
    filename: "mechanical_keyboard.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "4K Monitor",
    description: "Ultra HD monitor for professionals.",
    price: 349,
    imageUrl: "https://via.placeholder.com/300x300?text=4K+Monitor",
    filename: "4k_monitor.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  {
    name: "External SSD",
    description: "Fast portable storage device.",
    price: 149,
    imageUrl: "https://via.placeholder.com/300x300?text=External+SSD",
    filename: "external_ssd.jpg",
    categoryName: "Electronics",
    outOfStock: false,
  },
  // Books
  {
    name: "The Art of Coding",
    description: "A comprehensive guide to modern programming.",
    price: 29,
    imageUrl: "https://via.placeholder.com/300x300?text=The+Art+of+Coding",
    filename: "art_of_coding.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Mystery of the Old House",
    description: "A thrilling mystery novel with a twist ending.",
    price: 19,
    imageUrl: "https://via.placeholder.com/300x300?text=Mystery+of+the+Old+House",
    filename: "mystery_old_house.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Science for Everyone",
    description: "An introduction to basic science concepts.",
    price: 24,
    imageUrl: "https://via.placeholder.com/300x300?text=Science+for+Everyone",
    filename: "science_for_everyone.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "History Unveiled",
    description: "Exploring the secrets of ancient civilizations.",
    price: 34,
    imageUrl: "https://via.placeholder.com/300x300?text=History+Unveiled",
    filename: "history_unveiled.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Cooking 101",
    description: "Beginner's guide to cooking delicious meals.",
    price: 22,
    imageUrl: "https://via.placeholder.com/300x300?text=Cooking+101",
    filename: "cooking_101.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Travel Diaries",
    description: "Stories from around the world, one adventure at a time.",
    price: 27,
    imageUrl: "https://via.placeholder.com/300x300?text=Travel+Diaries",
    filename: "travel_diaries.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Mindfulness for Life",
    description: "A guide to meditation and mindfulness.",
    price: 18,
    imageUrl: "https://via.placeholder.com/300x300?text=Mindfulness+for+Life",
    filename: "mindfulness_for_life.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Children's Fairy Tales",
    description: "Classic fairy tales for children.",
    price: 15,
    imageUrl: "https://via.placeholder.com/300x300?text=Children's+Fairy+Tales",
    filename: "childrens_fairy_tales.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Business Success",
    description: "Tips and tricks for successful entrepreneurship.",
    price: 32,
    imageUrl: "https://via.placeholder.com/300x300?text=Business+Success",
    filename: "business_success.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
  {
    name: "Healthy Living",
    description: "Your guide to a healthy lifestyle.",
    price: 20,
    imageUrl: "https://via.placeholder.com/300x300?text=Healthy+Living",
    filename: "healthy_living.jpg",
    categoryName: "Books",
    outOfStock: false,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    await CategoryModel.deleteMany({});
    await ProductModel.deleteMany({});

    // Create categories and map their names to IDs
    const createdCategories = await CategoryModel.insertMany(categories);
    const categoryMap: Record<string, any> = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Assign category ObjectId to each product
    const productsWithCategory = products.map((prod) => ({
      ...prod,
      category: categoryMap[prod.categoryName],
    }));

    await ProductModel.insertMany(productsWithCategory);

   
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();