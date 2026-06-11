// gRPC server — exposed on a separate port (50051)
// order-service will call GetProduct via gRPC when placing an order.
// Why gRPC here and not REST? Strongly typed contract, binary protocol,
// much faster for synchronous internal calls. Great interview answer.

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import { getProductForOrder } from '../services/product.service.js';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the proto file — shared contract between product-service and order-service
const PROTO_PATH = path.join(__dirname, '../../../../proto/product.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase:     true,
  longs:        String,
  enums:        String,
  defaults:     true,
  oneofs:       true,
});

const proto = grpc.loadPackageDefinition(packageDef).product;

// gRPC handler implementations
const productServiceHandlers = {
  GetProduct: async (call, callback) => {
    try {
      const product = await getProductForOrder(call.request.product_id);
      callback(null, {
        id:    product.id,
        name:  product.name,
        price: product.price,
        sku:   product.sku,
      });
    } catch (err) {
      callback({
        code:    grpc.status.NOT_FOUND,
        message: err.message,
      });
    }
  },

  GetProducts: async (call, callback) => {
    try {
      const { product_ids } = call.request;
      const results = await Promise.allSettled(
        product_ids.map(id => getProductForOrder(id))
      );

      const products = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

export const startGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(proto.ProductService.service, productServiceHandlers);

  server.bindAsync(
    `0.0.0.0:${env.GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(), // TLS in production
    (err, port) => {
      if (err) {
        console.error('[gRPC] Failed to start server:', err);
        process.exit(1);
      }
      console.log(`[gRPC] Product service listening on port ${port}`);
    }
  );
};