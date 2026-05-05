import express from 'express'; import { protect, authorize } from '../middleware/auth.middleware.js'; import { asyncHandler } from '../middleware/error.middleware.js'; import Project from '../models/Project.model.js';
const router = express.Router();
router.use(protect);
router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'SuperAdmin' ? {} : { $or: [{ manager: req.user._id }, { 'artisans.artisan': req.user._id }] };
  const projects = await Project.find(filter).populate('manager', 'firstName lastName avatar').sort({ createdAt: -1 });
  res.json({ success: true, projects });
}));
router.post('/', authorize('Ingenieur', 'Architecte'), asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, manager: req.user._id });
  res.status(201).json({ success: true, project });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('manager', 'firstName lastName avatar').populate('artisans.artisan', 'firstName lastName avatar craft').populate('expenses.addedBy', 'firstName lastName');
  if (!project) return res.status(404).json({ success: false, message: 'Projet introuvable' });
  res.json({ success: true, project });
}));
router.put('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, project });
}));
// Ajouter une dépense au chantier (artisan ou manager)
router.post('/:id/expenses', asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Projet introuvable' });
  project.expenses.push({ ...req.body, addedBy: req.user._id });
  await project.save(); // Déclenche recalcul financials
  res.status(201).json({ success: true, financials: project.financials, expenses: project.expenses });
}));
// Supprimer une dépense
router.delete('/:id/expenses/:expenseId', asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Projet introuvable' });
  project.expenses = project.expenses.filter(e => e._id.toString() !== req.params.expenseId);
  await project.save();
  res.json({ success: true, financials: project.financials });
}));
export default router;
