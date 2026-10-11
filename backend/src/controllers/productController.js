import { Product } from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      condition,
      status,
      minPrice,
      maxPrice,
      sellerId,
      page = 1,
      limit = 20,
      sortBy = 'newest',
    } = req.query;

    const query = {};

    // By default, browse only AVAILABLE products unless status is explicitly requested
    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    } else if (!status) {
      query.status = 'AVAILABLE';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (condition) {
      query.condition = condition;
    }

    if (sellerId) {
      query.seller = sellerId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOption = { price: 1 };
    if (sortBy === 'price_desc') sortOption = { price: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name email college branch year hostel avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email college branch year hostel avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      price,
      quantity,
      condition,
      image,
      images,
      imagePublicId,
      pickupLocation,
      reasonForSelling,
    } = req.body;

    const chosenImage = image || (images && images[0]) || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.create({
      seller: req.user._id,
      title,
      description,
      category,
      price: Number(price),
      quantity: parsedQty,
      stock: parsedQty,
      condition: condition || 'Good',
      image: chosenImage,
      images: images && images.length > 0 ? images : [chosenImage],
      imagePublicId: imagePublicId || '',
      pickupLocation: pickupLocation || req.user.hostel || 'Campus Hostel Gate',
      reasonForSelling: reasonForSelling || 'Graduating',
      status: 'AVAILABLE',
    });

    const populated = await Product.findById(product._id)
      .populate('seller', 'name email college branch year hostel avatar');

    res.status(201).json({
      success: true,
      message: 'Listing published successfully! It is now AVAILABLE to campus students.',
      product: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const isOwner = product.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the seller who listed this item can modify it.',
      });
    }

    const updatePayload = { ...req.body };
    if (updatePayload.quantity !== undefined) {
      updatePayload.quantity = Math.max(0, parseInt(updatePayload.quantity, 10) || 0);
      updatePayload.stock = updatePayload.quantity;
      if (updatePayload.quantity > 0 && product.status === 'RESERVED' && !updatePayload.status) {
        updatePayload.status = 'AVAILABLE';
      }
    } else if (updatePayload.stock !== undefined) {
      updatePayload.stock = Math.max(0, parseInt(updatePayload.stock, 10) || 0);
      updatePayload.quantity = updatePayload.stock;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    }).populate('seller', 'name email college branch year hostel avatar');

    res.json({
      success: true,
      message: 'Listing updated successfully.',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const isOwner = product.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the seller who listed this item can delete it.',
      });
    }

    if (product.imagePublicId && process.env.CLOUDINARY_API_KEY) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        await cloudinary.uploader.destroy(product.imagePublicId);
      } catch (cErr) {
        console.error('Failed to destroy Cloudinary image:', cErr.message);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .populate('seller', 'name email college branch year hostel phone avatar');

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};
