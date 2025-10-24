import { Order } from "@/entities/order.entity";
import { Product } from "@/entities/product.entity";
import { User } from "@/entities/user.entity";

// Array to store users (as a mock database)
export const users: User[] = [
  {
    id: 1,
    username: "johndoe",
    email: "johndoe@gmail.com",
    password: "S3cur3P@ssw0rd",
  },
  {
    id: 2,
    username: "janesmith",
    email: "janesmith@yahoo.com",
    password: "P@ssw0rd2024",
  },
  {
    id: 3,
    username: "michael89",
    email: "michael89@hotmail.com",
    password: "M1chael!2024",
  },
  {
    id: 4,
    username: "lisa.wong",
    email: "lisa.wong@example.com",
    password: "L1saW0ng!2024",
  },
  {
    id: 5,
    username: "alex_k",
    email: "alex.k@gmail.com",
    password: "A1ex#Key2024",
  },
  {
    id: 6,
    username: "emilyj",
    email: "emilyj@hotmail.com",
    password: "Em!ly0101",
  },
  {
    id: 7,
    username: "davidparker",
    email: "david.parker@yahoo.com",
    password: "D@v!d2024",
  },
  {
    id: 8,
    username: "sophia_m",
    email: "sophia.m@gmail.com",
    password: "Sophi@2024",
  },
  {
    id: 9,
    username: "chrisw",
    email: "chrisw@outlook.com",
    password: "Chri$Wong21",
  },
  {
    id: 10,
    username: "natalie_b",
    email: "natalie_b@gmail.com",
    password: "N@talie#B2024",
  },
];

// Array to store products (as a mock database)
export const products: Product[] = [
  {
    id: 1,
    name: "ASUS ROG Zephyrus G15",
    price: 45000000,
    description: "Gaming laptop with AMD Ryzen 9 5900HS and RTX 3080 GPU",
    category: "Electronics",
    stock: 15,
  },
  {
    id: 2,
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 12000000,
    description:
      "Premium noise-canceling over-ear headphones with 30hr battery",
    category: "Electronics",
    stock: 8,
  },
  {
    id: 3,
    name: "LG Smart Inverter Microwave",
    price: 25000000,
    description: "1.7 cu.ft countertop microwave with smart sensor cooking",
    category: "Appliances",
    stock: 5,
  },
  {
    id: 4,
    name: "Trek Marlin 5 Mountain Bike",
    price: 18000000,
    description: "Entry-level mountain bike with aluminum frame and 21 speeds",
    category: "Sports",
    stock: 3,
  },
  {
    id: 5,
    name: "DeLonghi Espresso Machine",
    price: 6500000,
    description: "Compact espresso maker with manual milk frother",
    category: "Kitchen",
    stock: 12,
  },
  {
    id: 6,
    name: "Anker Wireless Charger",
    price: 1200000,
    description: "15W fast wireless charger with anti-slip surface",
    category: "Mobile Accessories",
    stock: 30,
  },
  {
    id: 7,
    name: "Logitech MX Master 3 Mouse",
    price: 4500000,
    description: "Ergonomic wireless mouse with Darkfield tracking",
    category: "Computer Accessories",
    stock: 18,
  },
  {
    id: 8,
    name: "Kindle Paperwhite",
    price: 3800000,
    description: 'Waterproof e-reader with 6.8" 300ppi display',
    category: "Electronics",
    stock: 9,
  },
  {
    id: 9,
    name: "Dyson V11 Vacuum Cleaner",
    price: 32000000,
    description: "Cordless stick vacuum with LCD screen and 60min runtime",
    category: "Home Appliances",
    stock: 7,
  },
];

// Array to store orders (as a mock database)
export const orders: Order[] = [
  {
    id: 1,
    userId: 1,
    products: [
      { productId: 2, quantity: 1 },
      { productId: 6, quantity: 2 },
    ],
    status: "Delivered",
    total: 14400,
    createdAt: new Date("2024-01-15"),
    deliveredAt: new Date("2024-02-10"),
  },
  {
    id: 2,
    userId: 3,
    products: [
      { productId: 9, quantity: 1 },
      { productId: 7, quantity: 1 },
    ],
    status: "Processing",
    total: 36500,
    createdAt: new Date("2024-03-20"),
  },
  {
    id: 3,
    userId: 2,
    products: [
      { productId: 1, quantity: 1 },
      { productId: 4, quantity: 2 },
    ],
    status: "Canceled",
    total: 81000,
    createdAt: new Date("2024-05-01"),
    canceledAt: new Date("2024-05-03"),
  },
];
