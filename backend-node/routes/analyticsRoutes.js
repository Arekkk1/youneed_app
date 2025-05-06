const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // Import Op directly
const db = require('../models'); // Import the db object
const { User, Order, Service, Feedback, ProviderGoal } = db; // Destructure models from db
const authenticate = require('../middleware/authenticate');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logAuditAction } = require('../utils/audit');

// All analytics routes require authentication
router.use(authenticate);

// Helper function to get date range based on query param
const getDateRange = (rangeQuery) => {
    const now = new Date();
    let startDate;
    const endDate = new Date(now); // Today

    switch (rangeQuery?.toLowerCase()) {
        case 'weekly':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'daily': // Fallthrough intentional
        default: // Default to daily (today)
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
};

// GET: /api/analytics/metrics
router.get('/metrics', async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        let metrics = {};
        let whereBase = {};

        if (userRole === 'provider') {
            whereBase = { providerId: userId };
            const [earningsResult, completedOrders, pendingOrders, activeServices] = await Promise.all([
                Order.findOne({
                    // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                    attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'totalEarnings']],
                    include: [{ model: Service, attributes: [], required: true }],
                    where: { ...whereBase, status: 'completed' },
                    raw: true,
                }),
                Order.count({ where: { ...whereBase, status: 'completed' } }),
                Order.count({ where: { ...whereBase, status: 'pending' } }),
                Service.count({ where: { providerId: userId } })
            ]);

            metrics = {
                totalEarnings: parseFloat(earningsResult?.totalEarnings || 0).toFixed(2),
                completedOrders: completedOrders,
                pendingOrders: pendingOrders,
                activeServices: activeServices,
                label: 'Zarobki',
            };
        } else if (userRole === 'client') {
            whereBase = { clientId: userId };
             const [expensesResult, totalOrdersPlaced, pendingOrders, activeOrders] = await Promise.all([
                Order.findOne({
                    // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                    attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'totalExpenses']],
                    include: [{ model: Service, attributes: [], required: true }],
                    where: { ...whereBase, status: { [Op.in]: ['completed', 'accepted'] } },
                    raw: true,
                }),
                Order.count({ where: whereBase }),
                Order.count({ where: { ...whereBase, status: 'pending' } }),
                Order.count({ where: { ...whereBase, status: 'accepted' } })
             ]);

            metrics = {
                totalExpenses: parseFloat(expensesResult?.totalExpenses || 0).toFixed(2),
                totalOrdersPlaced: totalOrdersPlaced,
                pendingOrders: pendingOrders,
                activeOrders: activeOrders,
                label: 'Wydatki',
            };
        } else if (userRole === 'admin') {
             const [revenueResult, totalUsers, totalProviders, totalClients, totalOrders] = await Promise.all([
                 Order.findOne({
                     // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                     attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'totalRevenue']],
                     include: [{ model: Service, attributes: [], required: true }],
                     where: { status: 'completed' },
                     raw: true,
                 }),
                 User.count(),
                 User.count({ where: { role: 'provider' } }),
                 User.count({ where: { role: 'client' } }),
                 Order.count()
             ]);

            metrics = {
                totalRevenue: parseFloat(revenueResult?.totalRevenue || 0).toFixed(2),
                totalUsers: totalUsers,
                totalProviders: totalProviders,
                totalClients: totalClients,
                totalOrders: totalOrders,
                label: 'Przychód Platformy',
            };
        } else {
            return sendErrorResponse(res, 403, 'Invalid user role for metrics');
        }

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_analytics_metrics_success', { role: userRole, metrics }, req.ip);
         }
        sendSuccessResponse(res, metrics, 'Metrics fetched successfully');
    } catch (err) {
        console.error(`Error fetching metrics for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_analytics_metrics_failed', { role: userRole, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch metrics', err);
    }
});

// GET: /api/analytics/monthly-sales
router.get('/monthly-sales', async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        let whereBase = {};
        // ** FIX: Use db.sequelize.col **
        let valueColumn = db.sequelize.col('Service.price');
        let dateColumn = userRole === 'client' ? 'createdAt' : 'updatedAt';

        if (userRole === 'provider') {
            whereBase = { providerId: userId, status: 'completed' };
        } else if (userRole === 'client') {
            whereBase = { clientId: userId, status: { [Op.in]: ['completed', 'accepted'] } };
        } else if (userRole === 'admin') {
            whereBase = { status: 'completed' };
        } else {
            return sendErrorResponse(res, 403, 'Invalid user role for monthly sales');
        }

        const currentYear = new Date().getFullYear();
        // ** FIX: Use db.sequelize.where, db.sequelize.fn, db.sequelize.col **
        const yearCondition = db.sequelize.where(db.sequelize.fn('YEAR', db.sequelize.col(`Order.${dateColumn}`)), currentYear);

        const monthlyData = await Order.findAll({
            attributes: [
                // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                [db.sequelize.fn('MONTH', db.sequelize.col(`Order.${dateColumn}`)), 'month'],
                [db.sequelize.fn('SUM', valueColumn), 'totalValue']
            ],
            include: [{ model: Service, attributes: [], required: true }],
            where: { ...whereBase, [Op.and]: [yearCondition] },
            // ** FIX: Use db.sequelize.fn and db.sequelize.col **
            group: [db.sequelize.fn('MONTH', db.sequelize.col(`Order.${dateColumn}`))],
            order: [[db.sequelize.fn('MONTH', db.sequelize.col(`Order.${dateColumn}`)), 'ASC']],
            raw: true,
        });

        const formattedData = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyData.find(m => m.month === i + 1);
            return {
                month: i + 1,
                value: parseFloat(monthData?.totalValue || 0)
            };
        });

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_monthly_sales_success', { role: userRole, year: currentYear }, req.ip);
         }
        sendSuccessResponse(res, formattedData, 'Monthly sales data fetched successfully');
    } catch (err) {
        console.error(`Error fetching monthly sales for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_monthly_sales_failed', { role: userRole, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch monthly sales data', err);
    }
});

// GET: /api/analytics/monthly-target
router.get('/monthly-target', async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        let targetData = { current: 0, target: 0, percentage: 0, label: '' };

        if (userRole === 'provider') {
            targetData.label = "Cel Miesięczny";
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const earningsResult = await Order.findOne({
                // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                attributes: [[db.sequelize.fn('SUM', db.sequelize.col('Service.price')), 'currentEarnings']],
                include: [{ model: Service, attributes: [], required: true }],
                where: {
                    providerId: userId,
                    status: 'completed',
                    updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
                },
                raw: true,
            });
            targetData.current = parseFloat(earningsResult?.currentEarnings || 0);

            // ** FIX: Handle ProviderGoal schema mismatch - Keep temporary fix **
            targetData.target = 5000; // Default target
            console.warn(`ProviderGoal model/table schema mismatch for user ${userId}. Using default target: ${targetData.target}`);

            if (targetData.target > 0) {
                targetData.percentage = Math.min(100, Math.round((targetData.current / targetData.target) * 100));
            }

        } else if (userRole === 'client') {
             targetData = { current: 0, target: 0, percentage: 0, label: "Budżet miesięczny (przykład)" };
        } else if (userRole === 'admin') {
             targetData = { current: 0, target: 100000, percentage: 0, label: "Cel przychodu platformy (przykład)" };
        }

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_monthly_target_success', { role: userRole, targetData }, req.ip);
         }
        sendSuccessResponse(res, targetData, 'Monthly target data fetched successfully');
    } catch (err) {
        console.error(`Error fetching monthly target for user ${userId} (role: ${userRole}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_monthly_target_failed', { role: userRole, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch monthly target data', err);
    }
});

// GET: /api/analytics/stats
router.get('/stats', async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { range } = req.query;
    try {
        let whereBase = {};
        if (userRole === 'provider') whereBase.providerId = userId;
        else if (userRole === 'client') whereBase.clientId = userId;
        else if (userRole !== 'admin') return sendErrorResponse(res, 403, 'Invalid role for stats');

        const { startDate, endDate } = getDateRange(range || 'monthly');
        whereBase.createdAt = { [Op.between]: [startDate, endDate] };

        const stats = await Order.findAll({
            attributes: [
                'status',
                // ** FIX: Use db.sequelize.fn and db.sequelize.col **
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            where: whereBase,
            group: ['status'],
            raw: true,
        });

        const formattedStats = {
            pending: 0,
            accepted: 0,
            completed: 0,
            rejected: 0,
            cancelled: 0,
        };
        stats.forEach(stat => {
            if (formattedStats.hasOwnProperty(stat.status)) {
                formattedStats[stat.status] = parseInt(stat.count, 10);
            }
        });

         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_analytics_stats_success', { role: userRole, range: range || 'monthly', stats: formattedStats }, req.ip);
         }
        sendSuccessResponse(res, formattedStats, 'Statistics fetched successfully');
    } catch (err) {
        console.error(`Error fetching stats for user ${userId} (role: ${userRole}, range: ${range}):`, err);
         if (typeof logAuditAction === 'function') {
            await logAuditAction(userId, 'fetch_analytics_stats_failed', { role: userRole, range, error: err.message }, req.ip);
         }
        sendErrorResponse(res, 500, 'Failed to fetch statistics', err);
    }
});


module.exports = router;
