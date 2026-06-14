// gRPC client — calls product-service:50051 to fetch product details at order time.
// Why gRPC and not REST here? Strongly typed contract, binary protocol, faster for
// synchronous internal calls. Product validation must be synchronous before we create the order.

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROTO_PATH = env.PROTO_PATH.startsWith('/')
    ? env.PROTO_PATH
    : path.join(__dirname, env.PROTO_PATH);

const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).product;

const client = new proto.ProductService(
    `${env.PRODUCT_GRPC_HOST}:${env.PRODUCT_GRPC_PORT}`,
    grpc.credentials.createInsecure()
);

// Promisify gRPC callbacks
const callGrpc = (method, request) =>
    new Promise((resolve, reject) => {
        client[method](request, (err, response) => {
            if (err) return reject(err);
            resolve(response);
        });
    });

/**
 * Fetch a single product by ID from product-service.
 * Returns { id, name, price, sku } or throws with statusCode 404.
 */
export const getProduct = async (productId) => {
    try {
        const response = await callGrpc('GetProduct', { product_id: productId });
        return response;
    } catch (err) {
        const error = new Error(err.details || `Product ${productId} not found`);
        error.statusCode = 404;
        throw error;
    }
};

/**
 * Fetch multiple products by IDs from product-service in a single round-trip.
 * Returns array of { id, name, price, sku }.
 */
export const getProducts = async (productIds) => {
    try {
        const response = await callGrpc('GetProducts', { product_ids: productIds });
        return response.products;
    } catch (err) {
        const error = new Error(err.details || 'Failed to fetch products');
        error.statusCode = 502;
        throw error;
    }
};
