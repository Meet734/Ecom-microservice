'use client';

import { useEffect, useState } from 'react';
import { productApi, inventoryApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function ManageProductPage() {
  const { user } = useAuthStore();
  const isAdmin  = user?.role === 'admin';
  const canCreate = user?.role === 'seller' || user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    sku: '',
    brand: '',
    category_id: '',
    images: '',
    attributes: '',
    initial_stock: '100',
    low_stock_threshold: '10',
    warehouse_location: 'Default-WH-01',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await productApi.getCategories();
      setCategories(data.data || []);
    } catch {
      // categories endpoint is public — safe to ignore
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name:        form.name,
        description: form.description || undefined,
        price:       parseInt(form.price),
        sku:         form.sku,
        brand:       form.brand || undefined,
        category_id: form.category_id,
      };

      if (form.compare_price) {
        payload.compare_price = parseInt(form.compare_price);
      }

      if (form.images.trim()) {
        try {
          payload.images = JSON.parse(form.images);
        } catch {
          setError('Images must be a valid JSON array, e.g. ["https://example.com/img.jpg"]');
          setSaving(false);
          return;
        }
      }

      if (form.attributes.trim()) {
        try {
          payload.attributes = JSON.parse(form.attributes);
        } catch {
          setError('Attributes must be a valid JSON object, e.g. {"color": "red"}');
          setSaving(false);
          return;
        }
      }

      const { data: createdProductRes } = await productApi.create(payload);
      const newProduct = createdProductRes?.data || createdProductRes;

      let stockInitialized = false;
      if (newProduct?.id) {
        try {
          await inventoryApi.initialize({
            productId:           newProduct.id,
            quantity:            parseInt(form.initial_stock) || 0,
            low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
            warehouse_location:  form.warehouse_location || 'Default-WH-01',
          });
          stockInitialized = true;
        } catch (invErr) {
          console.error('Failed to initialize stock:', invErr);
        }
      }

      if (stockInitialized) {
        setSuccess('Product created and stock initialized successfully!');
      } else {
        setSuccess('Product created successfully, but stock initialization failed. You can initialize it from the Dashboard.');
      }
      setForm((prev) => ({
        name: '', description: '', price: '', compare_price: '',
        sku: '', brand: '', category_id: prev.category_id, images: '', attributes: '',
        initial_stock: '100', low_stock_threshold: '10', warehouse_location: 'Default-WH-01',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingCategory(true);
    setError('');
    try {
      await productApi.createCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      });
      setSuccess('Category created!');
      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Add Product</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Create a new product listing.
          <span className="ml-2 text-[10px] text-zinc-400 font-mono">Product Service → POST /api/products</span>
        </p>
      </div>

      {/* Access notice for customers */}
      {!canCreate && (
        <Alert
          type="info"
          message="Only sellers and admins can create products. Your account role is 'customer'."
        />
      )}

      {error   && <Alert type="error"   message={error}   onDismiss={() => setError('')}   />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Block form entirely for customers */}
      {!canCreate ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Register as a <strong className="text-zinc-600">seller</strong> to list products.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Product Details</h2>

          <Input
            id="name"
            label="Product Name"
            required
            placeholder="Wireless Bluetooth Headphones"
            value={form.name}
            onChange={handleChange('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
            <textarea
              id="description"
              rows={3}
              placeholder="Product description..."
              value={form.description}
              onChange={handleChange('description')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="price"
              label="Price (paise)"
              required
              type="number"
              min="1"
              placeholder="29900"
              hint="29900 = ₹299.00"
              value={form.price}
              onChange={handleChange('price')}
            />
            <Input
              id="compare_price"
              label="Compare Price (optional)"
              type="number"
              min="1"
              placeholder="39900"
              hint="MRP — shows strikethrough"
              value={form.compare_price}
              onChange={handleChange('compare_price')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="sku"
              label="SKU"
              required
              placeholder="WBH-001"
              value={form.sku}
              onChange={handleChange('sku')}
            />
            <Input
              id="brand"
              label="Brand"
              placeholder="SoundMax"
              value={form.brand}
              onChange={handleChange('brand')}
            />
          </div>

          {/* Category selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="category_id" className="text-sm font-medium text-zinc-700">
                Category <span className="text-indigo-500">*</span>
              </label>
              {/* Only admins can create categories */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCategoryForm((v) => !v)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showCategoryForm ? 'Cancel' : '+ New Category'}
                </button>
              )}
            </div>

            {isAdmin && showCategoryForm && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2 mb-1">
                <Input
                  id="cat_name"
                  placeholder="Category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  id="cat_desc"
                  placeholder="Description (optional)"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCategory}
                  isLoading={savingCategory}
                  disabled={savingCategory || !categoryForm.name.trim()}
                >
                  Create Category
                </Button>
              </div>
            )}

            <select
              id="category_id"
              value={form.category_id}
              onChange={handleChange('category_id')}
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pt-2">Inventory Setup</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="initial_stock"
              label="Initial Stock"
              required
              type="number"
              min="0"
              placeholder="100"
              value={form.initial_stock}
              onChange={handleChange('initial_stock')}
            />
            <Input
              id="low_stock_threshold"
              label="Low Stock Threshold"
              required
              type="number"
              min="0"
              placeholder="10"
              value={form.low_stock_threshold}
              onChange={handleChange('low_stock_threshold')}
            />
          </div>

          <Input
            id="warehouse_location"
            label="Warehouse Location"
            required
            placeholder="Default-WH-01"
            value={form.warehouse_location}
            onChange={handleChange('warehouse_location')}
          />

          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pt-2">Additional Options</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="images" className="text-sm font-medium text-zinc-700">
              Images <span className="text-zinc-400 font-normal">(JSON array of URLs, optional)</span>
            </label>
            <textarea
              id="images"
              rows={2}
              placeholder='["https://example.com/img1.jpg"]'
              value={form.images}
              onChange={handleChange('images')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="attributes" className="text-sm font-medium text-zinc-700">
              Attributes <span className="text-zinc-400 font-normal">(JSON object, optional)</span>
            </label>
            <textarea
              id="attributes"
              rows={2}
              placeholder='{"color": "black", "size": "XL"}'
              value={form.attributes}
              onChange={handleChange('attributes')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs transition-all resize-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" size="full" isLoading={saving} disabled={saving}>
              Create Product
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
