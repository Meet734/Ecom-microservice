import { Client } from '@elastic/elasticsearch';
import env from './env.js';

const esClient = new Client({ node: env.ELASTICSEARCH_URL });

export const connectElasticsearch = async () => {
  try {
    const info = await esClient.info();
    console.log(`[Elasticsearch] Connected — cluster: ${info.cluster_name}`);
    await ensureIndexExists();
  } catch (err) {
    console.error('[Elasticsearch] Failed to connect:', err.message);
    // Non-fatal: service can still run without ES (degraded search)
    // In production you'd want this to be fatal
    console.warn('[Elasticsearch] Running in degraded mode — search disabled');
  }
};

const ensureIndexExists = async () => {
  const exists = await esClient.indices.exists({ index: 'products' });

  if (!exists) {
    await esClient.indices.create({
      index: 'products',
      body: {
        settings: {
          number_of_shards:   1,  // fine for this scale
          number_of_replicas: 0,  // only 1 node in dev
          analysis: {
            analyzer: {
              // Custom analyzer for product search:
              // lowercase + edge ngrams for partial matching
              product_analyzer: {
                type:      'custom',
                tokenizer: 'standard',
                filter:    ['lowercase', 'edge_ngram_filter'],
              },
            },
            filter: {
              edge_ngram_filter: {
                type:     'edge_ngram',
                min_gram: 2,
                max_gram: 20,
              },
            },
          },
        },
        mappings: {
          properties: {
            id:          { type: 'keyword' },
            name:        { type: 'text', analyzer: 'product_analyzer', search_analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            category:    { type: 'keyword' },
            brand:       { type: 'keyword' },
            price:       { type: 'float' },
            is_active:   { type: 'boolean' },
            created_at:  { type: 'date' },
          },
        },
      },
    });
    console.log('[Elasticsearch] Index "products" created');
  }
};

export default esClient;