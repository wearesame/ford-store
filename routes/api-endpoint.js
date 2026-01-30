const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");
const { faker } = require('@faker-js/faker');
// ==================== ENDPOINT MANAGEMENT ROUTES ====================

// GET /api/endpoints - Get all endpoints for a user
router.get("/endpoints", async (req, res) => {
    try {
        const userId = req.session.userId || req.query.userId;

        const endpoints = await prisma.endpoint.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json(endpoints);
    } catch (error) {
        console.error("Error fetching endpoints:", error);
        res.status(500).json({ error: "Error fetching endpoints" });
    }
});

// GET /api/endpoints/:id - Get single endpoint
router.get("/endpoints/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const endpoint = await prisma.endpoint.findUnique({
            where: { id }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        res.json(endpoint);
    } catch (error) {
        console.error("Error fetching endpoint:", error);
        res.status(500).json({ error: "Error fetching endpoint" });
    }
});

// GET /api/endpoints/:id/data - Get endpoint data
router.get("/endpoints/:id/data", async (req, res) => {
    try {
        const { id } = req.params;

        const endpoint = await prisma.endpoint.findUnique({
            where: { id }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        // Parse JSON data
        const data = endpoint.data ? JSON.parse(endpoint.data) : [];
        res.json(data);
    } catch (error) {
        console.error("Error fetching endpoint data:", error);
        res.status(500).json({ error: "Error fetching endpoint data" });
    }
});
// POST /api/endpoints - Create new endpoint
router.post("/endpoints", express.json(), async (req, res) => {
    try {
        const { name, count, schema, userId } = req.body;

        // ตรวจสอบว่า endpoint มีอยู่ในระบบหรือยัง
        const existing = await prisma.endpoint.findFirst({
            where: { name, userId }
        });

        if (existing) {
            return res.status(400).json({ error: "Endpoint name already exists" });
        }

        // ตรวจสอบ schema ว่ามีฟิลด์ name และ faker ที่ใช้งานได้หรือไม่
        const validSchema = schema.every(field => field.name && field.faker && faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]);
        if (!validSchema) {
            return res.status(400).json({ error: "Invalid schema or faker function" });
        }

        // สร้างข้อมูลจาก schema โดยใช้ faker
        const generatedData = [];

        for (let i = 0; i < count; i++) {
            const item = {};

            // ใช้ฟังก์ชัน faker จาก schema ที่ระบุ
            for (const field of schema) {
                try {
                    if (field.faker && faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]) {
                        // ใช้ faker เพื่อสร้างข้อมูล
                        item[field.name] = faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]();
                    } else {
                        // ถ้าไม่สามารถใช้ faker ได้ ให้ใช้ค่า default
                        item[field.name] = null;
                    }
                } catch (err) {
                    console.error(`Error generating faker data for ${field.name}:`, err);
                    item[field.name] = null;  // fallback ถ้าเกิดข้อผิดพลาด
                }
            }

            item.id = i + 1;  // สร้าง ID ที่ไม่ซ้ำ
            item.createdAt = new Date().toISOString(); // เพิ่ม createdAt
            generatedData.push(item);
        }

        // สร้าง endpoint ใหม่ในฐานข้อมูล
        const endpoint = await prisma.endpoint.create({
            data: {
                name,
                count,
                schema: JSON.stringify(schema),
                data: JSON.stringify(generatedData),
                userId
            }
        });

        res.status(201).json(endpoint);
    } catch (error) {
        console.error("Error creating endpoint:", error);
        res.status(500).json({ error: "Error creating endpoint" });
    }
});
// PUT /api/endpoints/:id - Update endpoint
router.put("/endpoints/:id", express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, count, schema, userId } = req.body;

        // ตรวจสอบว่า endpoint มีอยู่ในระบบหรือยัง
        const existing = await prisma.endpoint.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        // ตรวจสอบว่า endpoint name ซ้ำกับ userId หรือไม่
        const duplicate = await prisma.endpoint.findFirst({
            where: { name, userId, NOT: { id } }, // Exclude the current endpoint by its ID
        });

        if (duplicate) {
            return res.status(400).json({ error: "Endpoint name already exists for this user" });
        }

        // ตรวจสอบ schema ว่ามีฟิลด์ name และ faker ที่ใช้งานได้หรือไม่
        const validSchema = schema.every(field => field.name && field.faker && faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]);
        if (!validSchema) {
            return res.status(400).json({ error: "Invalid schema or faker function" });
        }

        // สร้างข้อมูลใหม่จาก schema โดยใช้ faker
        const generatedData = [];

        for (let i = 0; i < count; i++) {
            const item = {};

            // ใช้ฟังก์ชัน faker จาก schema ที่ระบุ
            for (const field of schema) {
                try {
                    if (field.faker && faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]) {
                        // ใช้ faker เพื่อสร้างข้อมูล
                        item[field.name] = faker[field.faker.split('.')[0]]?.[field.faker.split('.')[1]]();
                    } else {
                        // ถ้าไม่สามารถใช้ faker ได้ ให้ใช้ค่า default
                        item[field.name] = null;
                    }
                } catch (err) {
                    console.error(`Error generating faker data for ${field.name}:`, err);
                    item[field.name] = null;  // fallback ถ้าเกิดข้อผิดพลาด
                }
            }

            item.id = i + 1;  // สร้าง ID ที่ไม่ซ้ำ
            item.createdAt = new Date().toISOString(); // เพิ่ม createdAt
            generatedData.push(item);
        }

        // อัปเดต endpoint ด้วยข้อมูลใหม่
        const updatedEndpoint = await prisma.endpoint.update({
            where: { id },
            data: {
                name,
                count,
                schema: JSON.stringify(schema),
                data: JSON.stringify(generatedData),
                updatedAt: new Date(),
            },
        });

        res.json(updatedEndpoint);
    } catch (error) {
        console.error("Error updating endpoint:", error);
        res.status(500).json({ error: "Error updating endpoint" });
    }
});

// DELETE /api/endpoints/:id - Delete endpoint
router.delete("/endpoints/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.endpoint.delete({
            where: { id }
        });

        res.json({ message: "Endpoint deleted successfully" });
    } catch (error) {
        console.error("Error deleting endpoint:", error);
        res.status(500).json({ error: "Error deleting endpoint" });
    }
});

// POST /api/endpoints/generate-all - Regenerate all endpoint data
router.post("/endpoints/generate-all", express.json(), async (req, res) => {
    try {
        const { userId } = req.body;

        const endpoints = await prisma.endpoint.findMany({
            where: { userId }
        });

        // Note: Actual regeneration would require Faker.js on server side
        // This is a placeholder - frontend handles generation currently

        res.json({ message: "Data regeneration triggered", count: endpoints.length });
    } catch (error) {
        console.error("Error regenerating data:", error);
        res.status(500).json({ error: "Error regenerating data" });
    }
});

// DELETE /api/endpoints/reset-all - Delete all endpoints
router.delete("/endpoints/reset-all", express.json(), async (req, res) => {
    try {
        const { userId } = req.body;

        await prisma.endpoint.deleteMany({
            where: { userId }
        });

        res.json({ message: "All endpoints deleted successfully" });
    } catch (error) {
        console.error("Error resetting endpoints:", error);
        res.status(500).json({ error: "Error resetting endpoints" });
    }
});

// ==================== MOCK API DATA ROUTES ====================

// GET /:userId/:username/:endpoint - Get all items from endpoint
router.get("/:userId/:username/:endpoint", async (req, res) => {
    const { userId, endpoint: endpointName } = req.params;

    try {
        const endpoint = await prisma.endpoint.findFirst({
            where: {
                userId,
                name: endpointName
            }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        const data = endpoint.data ? JSON.parse(endpoint.data) : [];
        res.json(data);
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).json({ error: "Error retrieving data" });
    }
});

// GET /:userId/:username/:endpoint/:id - Get single item from endpoint
router.get("/:userId/:username/:endpoint/:id", async (req, res) => {
    const { userId, endpoint: endpointName, id } = req.params;

    try {
        const endpoint = await prisma.endpoint.findFirst({
            where: {
                userId,
                name: endpointName
            }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        const data = endpoint.data ? JSON.parse(endpoint.data) : [];
        const item = data.find(item => item.id === parseInt(id));

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(item);
    } catch (error) {
        console.error("Error retrieving item:", error);
        res.status(500).json({ error: "Error retrieving item" });
    }
});

// POST /:userId/:username/:endpoint - Create new item in endpoint
router.post("/:userId/:username/:endpoint", express.json(), async (req, res) => {
    const { userId, endpoint: endpointName } = req.params;

    try {
        const endpoint = await prisma.endpoint.findFirst({
            where: {
                userId,
                name: endpointName
            }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        const data = endpoint.data ? JSON.parse(endpoint.data) : [];

        // Generate new ID
        const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;

        const newItem = {
            id: newId,
            ...req.body,
            createdAt: new Date().toISOString()
        };

        data.push(newItem);

        // Update endpoint
        await prisma.endpoint.update({
            where: { id: endpoint.id },
            data: {
                data: JSON.stringify(data),
                count: data.length,
                updatedAt: new Date()
            }
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ error: "Error creating item" });
    }
});

// PUT /:userId/:username/:endpoint/:id - Update item in endpoint
router.put("/:userId/:username/:endpoint/:id", express.json(), async (req, res) => {
    const { userId, endpoint: endpointName, id } = req.params;

    try {
        const endpoint = await prisma.endpoint.findFirst({
            where: {
                userId,
                name: endpointName
            }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        const data = endpoint.data ? JSON.parse(endpoint.data) : [];
        const itemIndex = data.findIndex(item => item.id === parseInt(id));

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Update item
        data[itemIndex] = {
            ...data[itemIndex],
            ...req.body,
            id: parseInt(id),
            updatedAt: new Date().toISOString()
        };

        // Update endpoint
        await prisma.endpoint.update({
            where: { id: endpoint.id },
            data: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            }
        });

        res.json(data[itemIndex]);
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: "Error updating item" });
    }
});

// DELETE /:userId/:username/:endpoint/:id - Delete item from endpoint
router.delete("/:userId/:username/:endpoint/:id", async (req, res) => {
    const { userId, endpoint: endpointName, id } = req.params;

    try {
        const endpoint = await prisma.endpoint.findFirst({
            where: {
                userId,
                name: endpointName
            }
        });

        if (!endpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        const data = endpoint.data ? JSON.parse(endpoint.data) : [];
        const filteredData = data.filter(item => item.id !== parseInt(id));

        if (data.length === filteredData.length) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Update endpoint
        await prisma.endpoint.update({
            where: { id: endpoint.id },
            data: {
                data: JSON.stringify(filteredData),
                count: filteredData.length,
                updatedAt: new Date()
            }
        });

        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Error deleting item" });
    }
});

module.exports = router;