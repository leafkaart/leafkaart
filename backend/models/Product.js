const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productActivitySchema = new Schema(
  {
    performedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    performedByName: { type: String, default: 'System' },
    performedByRole: { type: String, default: 'System' },
    action: { type: String, required: true, trim: true },
    previousValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    remarks: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new Schema({
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
  title: { type: String, trim: true },
  shortDescription: { type: String },
  sku: { type: String },
  brand: { type: String },
  serialNumber: {type: String},
  modelNumber:{type:String},
  dealerId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
  images: [{ url: String, alt: String, order: Number }],
  customerPrice: { type: Number, min: 0 },
  dealerPrice: { type: Number },
  commission: { type: Number },
  stock: { type: Number, default: 0, min: 0 },
  isApproved: { type: Boolean, default: false },
  approvedAt: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  weightKg: { type: Number },
  createdById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdByName: { type: String, default: '' },
  createdByRole: { type: String, default: '' },
  lastModifiedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  lastModifiedByName: { type: String, default: '' },
  lastModifiedByRole: { type: String, default: '' },
  lastModifiedAt: { type: Date },
  lastAction: { type: String, default: '' },
  activityLog: { type: [productActivitySchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
