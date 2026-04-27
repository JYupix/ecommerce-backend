import { Router } from 'express';
import {
	createCategoryController,
	getAllCategoriesController,
	getCategoryBySlugController,
	restoreCategoryController,
	softDeleteCategoryController,
	updateCategoryController,
} from './categories.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getAllCategoriesController);
router.get('/slug/:slug', getCategoryBySlugController);

router.post('/', authMiddleware, requireRole("ADMIN"), createCategoryController);
router.patch('/:id', authMiddleware, requireRole("ADMIN"), updateCategoryController);
router.delete('/:id', authMiddleware, requireRole("ADMIN"), softDeleteCategoryController);
router.patch('/:id/restore', authMiddleware, requireRole("ADMIN"), restoreCategoryController);

export default router;