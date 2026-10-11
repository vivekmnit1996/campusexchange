import { PurchaseRequest } from '../models/PurchaseRequest.js';
import { Product } from '../models/Product.js';

// Server-side privacy sanitizer:
// Completely hides the seller's phone number from the buyer until the reservation has been accepted or completed.
const sanitizeRequestForViewer = (reqDoc, user) => {
  if (!reqDoc) return reqDoc;
  const obj = reqDoc.toObject ? reqDoc.toObject() : { ...reqDoc };
  const userId = (user?._id || user?.id || '').toString();
  const userRole = (user?.role || '').toUpperCase();

  const sellerId = obj.seller && (obj.seller._id ? obj.seller._id.toString() : obj.seller.toString());
  const isSeller = sellerId === userId;
  const isAdmin = userRole === 'ADMIN';
  const isAcceptedOrCompleted = obj.status === 'ACCEPTED' || obj.status === 'COMPLETED';

  // If viewer is the buyer (not seller and not admin)
  if (!isSeller && !isAdmin) {
    if (!isAcceptedOrCompleted) {
      if (obj.seller && typeof obj.seller === 'object') {
        obj.seller = {
          ...obj.seller,
          phone: '', // Omit phone before seller acceptance
        };
      }
    }
  }

  return obj;
};

export const createRequest = async (req, res, next) => {
  try {
    const { productId, notes, pickupLocation, quantity } = req.body;
    const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product listing not found.' });
    }

    // Rule 1: SOLD products cannot be requested
    if (product.status === 'SOLD') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request item: This listing has already been SOLD.',
      });
    }

    const availableStock = product.quantity !== undefined ? product.quantity : (product.stock || 0);

    // Rule 2: Cannot request if already out of stock / reserved
    if (product.status === 'RESERVED' || availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request item: This listing is currently out of stock or reserved.',
      });
    }

    // Rule 3: Requested quantity cannot exceed available stock
    if (requestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${requestedQty}) exceeds currently available stock (${availableStock}).`,
      });
    }

    // Rule 4: Seller cannot buy their own product
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: You cannot purchase your own listing.',
      });
    }

    // Rule 5: Avoid duplicate active requests from the same buyer
    const existingActiveRequest = await PurchaseRequest.findOne({
      product: productId,
      buyer: req.user._id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (existingActiveRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active request for this item.',
      });
    }

    const totalAmount = (product.price || 0) * requestedQty;

    const request = await PurchaseRequest.create({
      product: product._id,
      buyer: req.user._id,
      seller: product.seller,
      status: 'PENDING',
      quantity: requestedQty,
      totalAmount,
      notes: notes || '',
      pickupLocation: pickupLocation || product.pickupLocation || 'Campus Hostel Gate',
    });

    const populatedRequest = await PurchaseRequest.findById(request._id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('seller', 'name email college branch year hostel phone avatar')
      .populate('buyer', 'name email college branch year hostel phone avatar');

    const sanitized = sanitizeRequestForViewer(populatedRequest, req.user);

    res.status(201).json({
      success: true,
      message: 'Purchase request sent to seller! Please wait for them to accept.',
      request: sanitized,
      order: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const getBuyerRequests = async (req, res, next) => {
  try {
    const requests = await PurchaseRequest.find({ buyer: req.user._id })
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('seller', 'name email college branch year hostel phone avatar')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .sort({ createdAt: -1 });

    const sanitizedRequests = requests.map((r) => sanitizeRequestForViewer(r, req.user));

    res.json({
      success: true,
      count: sanitizedRequests.length,
      requests: sanitizedRequests,
      orders: sanitizedRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerRequests = async (req, res, next) => {
  try {
    const requests = await PurchaseRequest.find({ seller: req.user._id })
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .populate('seller', 'name email college branch year hostel phone avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
      orders: requests,
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('seller', 'name email college branch year hostel phone avatar')
      .populate('buyer', 'name email college branch year hostel phone avatar');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isBuyer = request.buyer._id.toString() === req.user._id.toString();
    const isSeller = request.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this request.' });
    }

    const sanitized = sanitizeRequestForViewer(request, req.user);

    res.json({ success: true, request: sanitized, order: sanitized });
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only seller (or admin) can accept
    if (request.seller.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the seller can accept this request.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status ${request.status}. Only PENDING requests can be accepted.`,
      });
    }

    const reqQty = request.quantity || 1;
    const product = await Product.findById(request.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product listing not found.' });
    }

    const currentStock = product.quantity !== undefined ? product.quantity : (product.stock || 0);
    if (currentStock < reqQty) {
      return res.status(409).json({
        success: false,
        message: `Cannot accept: Requested quantity (${reqQty}) exceeds currently available stock (${currentStock}).`,
      });
    }

    // Decrement stock and update status
    const newStock = Math.max(0, currentStock - reqQty);
    const newStatus = newStock === 0 ? 'RESERVED' : 'AVAILABLE';

    await Product.findByIdAndUpdate(request.product, {
      $set: {
        quantity: newStock,
        stock: newStock,
        status: newStatus,
      },
    });

    request.status = 'ACCEPTED';
    await request.save();

    const populated = await PurchaseRequest.findById(request._id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .populate('seller', 'name email college branch year hostel phone avatar');

    res.json({
      success: true,
      message: newStock === 0
        ? 'Request accepted. Product is now fully RESERVED. Coordinate with buyer for campus hand-off.'
        : `Request accepted (${reqQty} units reserved, ${newStock} remaining). Coordinate with buyer for campus hand-off.`,
      request: populated,
      order: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only seller (or admin) can reject
    if (request.seller.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the seller can decline this request.' });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason explaining why you cannot complete this hand-off.',
      });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason cannot exceed 500 characters.',
      });
    }

    const wasAccepted = request.status === 'ACCEPTED';
    request.status = 'REJECTED';
    request.cancellationReason = reason.trim();
    request.notes = reason.trim();
    request.cancelledAt = new Date();
    await request.save();

    // If request was ACCEPTED, restore the reserved quantity and ensure AVAILABLE status
    if (wasAccepted) {
      const reqQty = request.quantity || 1;
      const product = await Product.findById(request.product);
      if (product) {
        const currentQty = product.quantity !== undefined ? product.quantity : (product.stock || 0);
        const restoredQty = currentQty + reqQty;
        await Product.findByIdAndUpdate(request.product, {
          $set: {
            quantity: restoredQty,
            stock: restoredQty,
            status: 'AVAILABLE',
          },
        });
      }
    }

    const populated = await PurchaseRequest.findById(request._id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .populate('seller', 'name email college branch year hostel phone avatar');

    res.json({
      success: true,
      message: 'Request declined. Listing inventory restored to Available.',
      request: populated,
      order: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isBuyer = request.buyer.toString() === req.user._id.toString();
    const isSeller = request.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const { reason } = req.body;

    // If seller is cancelling an accepted reservation, require a reason
    if (isSeller && !isAdmin && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason explaining why you cannot complete this hand-off.',
      });
    }

    if (reason && reason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason cannot exceed 500 characters.',
      });
    }

    const wasAccepted = request.status === 'ACCEPTED';
    request.status = 'CANCELLED';
    const cleanReason = (reason && reason.trim()) || (isBuyer ? 'Reservation cancelled by student' : 'Cancelled');
    request.cancellationReason = cleanReason;
    request.notes = cleanReason;
    request.cancelledAt = new Date();
    await request.save();

    // If request was ACCEPTED, restore the reserved quantity and ensure AVAILABLE status
    if (wasAccepted) {
      const reqQty = request.quantity || 1;
      const product = await Product.findById(request.product);
      if (product) {
        const currentQty = product.quantity !== undefined ? product.quantity : (product.stock || 0);
        const restoredQty = currentQty + reqQty;
        await Product.findByIdAndUpdate(request.product, {
          $set: {
            quantity: restoredQty,
            stock: restoredQty,
            status: 'AVAILABLE',
          },
        });
      }
    }

    const populated = await PurchaseRequest.findById(request._id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .populate('seller', 'name email college branch year hostel phone avatar');

    const sanitized = sanitizeRequestForViewer(populated, req.user);

    res.json({
      success: true,
      message: 'Reservation cancelled. Listing inventory restored to Available.',
      request: sanitized,
      order: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const completeRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only seller (or admin) can mark physical hand-off completed
    if (request.seller.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the seller can complete the hand-off.' });
    }

    request.status = 'COMPLETED';
    await request.save();

    // Check product remaining inventory and active requests
    const prod = await Product.findById(request.product);
    if (prod) {
      const remainingStock = prod.quantity !== undefined ? prod.quantity : (prod.stock || 0);
      if (remainingStock <= 0) {
        const otherAccepted = await PurchaseRequest.countDocuments({
          product: prod._id,
          status: 'ACCEPTED',
          _id: { $ne: request._id },
        });

        if (otherAccepted === 0) {
          prod.status = 'SOLD';
        } else {
          prod.status = 'RESERVED';
        }
      } else {
        prod.status = 'AVAILABLE';
      }
      await prod.save();
    }

    const populated = await PurchaseRequest.findById(request._id)
      .populate('product', 'title price condition status image images pickupLocation category description quantity stock')
      .populate('buyer', 'name email college branch year hostel phone avatar')
      .populate('seller', 'name email college branch year hostel phone avatar');

    res.json({
      success: true,
      message: 'Campus hand-off completed! Listing updated.',
      request: populated,
      order: populated,
    });
  } catch (error) {
    next(error);
  }
};
