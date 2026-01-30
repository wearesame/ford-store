const express = require("express");
const router = express.Router();

const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.get("/:id", async (req, res) => {
    res.send(req.params.id);
});

router.get("/", requireAuth(), async (req, res) => {
    try {

        // Get all endpoints for this user
        const endpoints = await prisma.endpoint.findMany({
            where: { userId: req.session.user.id },
            select: {
                id: true,
                name: true,
                count: true,
                schema: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: "desc" }
        });

        // Parse schema for each endpoint
        const endpointsWithParsedSchema = endpoints.map(ep => {
            console.log("Schema value for endpoint", ep.id, ":", ep.schema);
            try {
                // Check if the schema is a valid JSON string
                if (ep.schema && isValidJSON(ep.schema)) {
                    return {
                        ...ep,
                        schema: JSON.parse(ep.schema)
                    };
                } else {
                    // If it's invalid, use a default or empty structure
                    console.warn("Invalid schema data for endpoint", ep.id);
                    return {
                        ...ep,
                        schema: [] // Default empty schema if invalid
                    };
                }
            } catch (error) {
                console.error("Error parsing schema for endpoint", ep.id, ":", error);
                return {
                    ...ep,
                    schema: [] // Fallback to empty schema in case of any error
                };
            }
        });

        // Helper function to check if a string is valid JSON
        function isValidJSON(str) {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }


        res.render("project/index", {
            title: "จัดการ DATA ปลอม",
            user: req.session.user,
            endpoints: endpointsWithParsedSchema
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.status(500).send("Error loading dashboard");
    }
});

module.exports = router;