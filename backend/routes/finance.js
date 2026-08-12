const router = require('express').Router();
const ctrl = require('../controllers/financeController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

// Revenue (sales) routes
router.get('/revenue', ctrl.getAllRevenue);
router.post('/revenue', ctrl.createRevenue);
router.put('/revenue/:id', ctrl.updateRevenue);
router.delete('/revenue/:id', ctrl.deleteRevenue);
router.get('/revenue/summary', ctrl.getRevenueSummary);

// Expense routes
router.get('/expenses', ctrl.getAllExpenses);
router.post('/expenses', ctrl.createExpense);
router.put('/expenses/:id', ctrl.updateExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);
router.get('/expenses/summary', ctrl.getExpenseSummary);

// Net income
router.get('/net-income', ctrl.getNetIncome);

module.exports = router;
