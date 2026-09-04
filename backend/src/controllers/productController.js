import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      storeId,
      inStock,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    // 1. Text Search across Title, Description, Category, Tags
    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    // 2. Facet filters
    if (category && category !== 'All') {
      query.category = category;
    }

    if (storeId) {
      query.store = storeId;
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 3. Sorting options
    let sortOptions = {};
    if (search) {
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Parallel execution for pagination count and data fetching
    const [products, totalCount, categories] = await Promise.all([
      Product.find(query)
        .populate('store', 'name slug logo description rating')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
      Product.distinct('category', { isActive: true }),
    ]);

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
      categories,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('store', 'name slug logo description rating')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, compareAtPrice, stock, category, tags, images, attributes } = req.body;

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(403).json({ success: false, message: 'Only registered vendors with a store can create products.' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const product = await Product.create({
      title,
      slug,
      description,
      price,
      compareAtPrice,
      stock,
      category,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t) => t.trim()),
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
      store: store._id,
      attributes: attributes || {},
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const store = await Store.findOne({ owner: req.user._id });
    if (req.user.role !== 'admin' && (!store || product.store.toString() !== store._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this product.' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const store = await Store.findOne({ owner: req.user._id });
    if (req.user.role !== 'admin' && (!store || product.store.toString() !== store._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this product.' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a star rating between 1 and 5.' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide review comments.' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment.trim();
    } else {
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment: comment.trim(),
        user: req.user._id,
      };
      product.reviews.push(review);
    }

    product.numReviews = product.reviews.length;
    product.rating = Number(
      (
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length
      ).toFixed(1)
    );

    await product.save();
    res.status(201).json({ success: true, message: 'Review recorded successfully.', product });
  } catch (error) {
    next(error);
  }
};
