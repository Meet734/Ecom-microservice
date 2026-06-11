import esClient from '../config/elasticsearch.js';

const INDEX = 'products';

// Index a product document — called after create/update in PostgreSQL
export const indexProduct = async (product) => {
  try {
    await esClient.index({
      index: INDEX,
      id:    product.id,
      document: {
        id:          product.id,
        name:        product.name,
        description: product.description,
        category:    product.category_id,
        brand:       product.brand,
        price:       product.price,
        is_active:   product.is_active,
        created_at:  product.created_at,
      },
    });
  } catch (err) {
    // Log but don't throw — ES sync failure should not break the API response.
    // The product is saved in PG. ES is eventually consistent.
    console.error('[ES] Failed to index product:', err.message);
  }
};

// Remove a product from search index on delete
export const removeProduct = async (productId) => {
  try {
    await esClient.delete({ index: INDEX, id: productId });
  } catch (err) {
    console.error('[ES] Failed to remove product:', err.message);
  }
};

// Full-text search with filters
export const searchProducts = async ({ query, category, minPrice, maxPrice, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;

  const must   = [];
  const filter = [{ term: { is_active: true } }];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields:     ['name^3', 'description', 'brand^2'],
        // Boost name matches 3x, brand 2x — relevance tuning
        fuzziness:  'AUTO',  // handles typos: "iphone" matches "iPhoe"
        type:       'best_fields',
      },
    });
  }

  if (category)              filter.push({ term:  { category } });
  if (minPrice !== undefined) filter.push({ range: { price: { gte: minPrice } } });
  if (maxPrice !== undefined) filter.push({ range: { price: { lte: maxPrice } } });

  const result = await esClient.search({
    index: INDEX,
    body: {
      from,
      size: limit,
      query: {
        bool: {
          must:   must.length ? must : [{ match_all: {} }],
          filter,
        },
      },
      sort: query
        ? [{ _score: 'desc' }]
        : [{ created_at: 'desc' }],  // no query = newest first
    },
  });

  return {
    total:    result.hits.total.value,
    products: result.hits.hits.map(hit => ({ id: hit._id, ...hit._source })),
    page,
    limit,
    pages:    Math.ceil(result.hits.total.value / limit),
  };
};