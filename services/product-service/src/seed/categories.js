// Seed script — inserts a standard e-commerce category tree on startup.
// Fully idempotent: checks existence by slug before inserting.
// Parent categories are created first, then subcategories reference them by slug.

import Category from '../models/category.model.js';

const slugify = (value) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Category tree ──────────────────────────────────────────────────────────
// Format: { name, description, children?: [...] }
// Children automatically get parent_id set after their parent is inserted.
const CATEGORY_TREE = [
    {
        name: 'Electronics',
        description: 'Gadgets, devices, and tech accessories',
        children: [
            { name: 'Mobile Phones',     description: 'Smartphones and feature phones' },
            { name: 'Laptops',           description: 'Notebooks, ultrabooks, and gaming laptops' },
            { name: 'Tablets',           description: 'iPads, Android tablets' },
            { name: 'Headphones',        description: 'Over-ear, in-ear, wireless audio' },
            { name: 'Cameras',           description: 'DSLRs, mirrorless, action cameras' },
            { name: 'TV & Home Theatre', description: 'Smart TVs, projectors, soundbars' },
            { name: 'Accessories',       description: 'Cables, chargers, cases, and peripherals' },
        ],
    },
    {
        name: 'Clothing',
        description: 'Apparel for men, women, and kids',
        children: [
            { name: "Men's Clothing",    description: 'Shirts, trousers, jackets' },
            { name: "Women's Clothing",  description: 'Tops, dresses, ethnic wear' },
            { name: "Kids' Clothing",    description: 'Boys and girls apparel' },
            { name: 'Sports & Activewear', description: 'Gym, running, outdoor wear' },
        ],
    },
    {
        name: 'Footwear',
        description: 'Shoes, sandals, and boots',
        children: [
            { name: "Men's Footwear",    description: 'Casual, formal, sports shoes' },
            { name: "Women's Footwear",  description: 'Heels, flats, sneakers' },
            { name: "Kids' Footwear",    description: 'School shoes, sandals' },
        ],
    },
    {
        name: 'Home & Kitchen',
        description: 'Furniture, appliances, and home décor',
        children: [
            { name: 'Kitchen Appliances', description: 'Mixer, microwave, cookware' },
            { name: 'Furniture',          description: 'Sofas, beds, tables' },
            { name: 'Bedding & Bath',     description: 'Sheets, towels, pillows' },
            { name: 'Home Décor',         description: 'Wall art, lights, plants' },
        ],
    },
    {
        name: 'Books',
        description: 'Physical and digital books',
        children: [
            { name: 'Fiction',           description: 'Novels, short stories' },
            { name: 'Non-Fiction',       description: 'Self-help, biographies, history' },
            { name: 'Academic',          description: 'Textbooks, reference books' },
            { name: 'Comics & Manga',    description: 'Graphic novels, manga series' },
        ],
    },
    {
        name: 'Sports & Fitness',
        description: 'Equipment, gear, and supplements',
        children: [
            { name: 'Gym Equipment',     description: 'Dumbbells, benches, resistance bands' },
            { name: 'Outdoor Sports',    description: 'Cycling, trekking, camping' },
            { name: 'Cricket',           description: 'Bats, balls, protective gear' },
            { name: 'Yoga & Meditation', description: 'Mats, blocks, accessories' },
        ],
    },
    {
        name: 'Beauty & Personal Care',
        description: 'Skincare, haircare, and grooming',
        children: [
            { name: 'Skincare',          description: 'Moisturisers, serums, sunscreen' },
            { name: 'Haircare',          description: 'Shampoos, conditioners, styling' },
            { name: 'Makeup',            description: 'Foundation, lipstick, eyeshadow' },
            { name: 'Fragrances',        description: 'Perfumes and deodorants' },
        ],
    },
    {
        name: 'Groceries',
        description: 'Food, beverages, and daily essentials',
        children: [
            { name: 'Dry Fruits & Nuts', description: 'Almonds, cashews, raisins' },
            { name: 'Beverages',         description: 'Tea, coffee, juices' },
            { name: 'Snacks',            description: 'Chips, cookies, namkeen' },
            { name: 'Organic & Natural', description: 'Certified organic food products' },
        ],
    },
    {
        name: 'Toys & Games',
        description: 'Toys for all ages and board games',
        children: [
            { name: 'Action Figures',    description: 'Superheroes, robots, vehicles' },
            { name: 'Board Games',       description: 'Chess, Monopoly, strategy games' },
            { name: 'Educational Toys',  description: 'STEM kits, puzzles, learning toys' },
        ],
    },
    {
        name: 'Automotive',
        description: 'Car and bike accessories',
        children: [
            { name: 'Car Accessories',   description: 'Seat covers, dash cams, tyres' },
            { name: 'Bike Accessories',  description: 'Helmets, locks, phone mounts' },
        ],
    },
];

// ── Seeder ─────────────────────────────────────────────────────────────────

export const seedCategories = async () => {
    let created = 0;
    let skipped = 0;

    for (const parent of CATEGORY_TREE) {
        const parentSlug = slugify(parent.name);

        // Upsert parent
        let parentRecord = await Category.findOne({ where: { slug: parentSlug } });
        if (!parentRecord) {
            parentRecord = await Category.create({
                name:        parent.name,
                slug:        parentSlug,
                description: parent.description || null,
                parent_id:   null,
            });
            created++;
        } else {
            skipped++;
        }

        // Upsert children
        for (const child of (parent.children || [])) {
            const childSlug = slugify(child.name);
            const existing  = await Category.findOne({ where: { slug: childSlug } });
            if (!existing) {
                await Category.create({
                    name:        child.name,
                    slug:        childSlug,
                    description: child.description || null,
                    parent_id:   parentRecord.id,
                });
                created++;
            } else {
                skipped++;
            }
        }
    }

    console.log(`[Seed] Categories: ${created} created, ${skipped} already existed`);
};
