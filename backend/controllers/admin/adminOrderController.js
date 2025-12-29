const mongoose = require('mongoose');
const Order = require('../../models/Order');

exports.listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to, q } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
    if (q) filter.$text = { $search: q };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('customer', 'name email phone')
        .populate('items.product', 'title sku price'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: { orders, total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    console.error('listOrders err', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.query; // route used earlier was GET /getOrder
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid order id required' });
    }
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('items.product', 'title slug sku price');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('getOrder err', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (assigneeId) {
      if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
        return res.status(400).json({ success: false, message: 'Invalid assignee id' });
      }
      order.assignedTo = assigneeId;
    }
    if (status) {
      order.status = status;
    }

    await order.save();

    const updated = await Order.findById(id)
      .populate('assignedTo', 'name email')
      .populate('customer', 'name email phone');

    res.json({ success: true, message: 'Order updated', data: updated });
  } catch (err) {
    console.error('assignOrder err', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
