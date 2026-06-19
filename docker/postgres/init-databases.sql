-- Create per-service databases on first Postgres startup.
-- ecomm_db is created automatically via POSTGRES_DB.
CREATE DATABASE ecomm_user_db;
CREATE DATABASE ecomm_product_db;
CREATE DATABASE ecomm_inventory_db;
CREATE DATABASE ecomm_order_db;
CREATE DATABASE ecomm_payment_db;

