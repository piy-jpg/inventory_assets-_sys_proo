import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';

const invalidateMany = (queryClient, keys) => {
  keys.forEach((key) => {
    queryClient.invalidateQueries(key);
  });
};

const emitBridgeEvent = (eventName, detail) => {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: {
        ...detail,
        source: 'socket',
        timestamp: new Date().toISOString(),
      },
    })
  );
};

const RealtimeQueryBridge = ({ enabled = true }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return undefined;

    const token = localStorage.getItem('token');
    const isLocalDemoToken = !token || token.startsWith('mock-jwt-token-');
    const isVercelSocketTarget = /https?:\/\/[^/]*vercel\.app(?:\/|$)/i.test(SOCKET_URL);

    if (isLocalDemoToken || isVercelSocketTarget) {
      return undefined;
    }

    let socket;
    try {
      socket = io(SOCKET_URL, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed, continuing without real-time updates:', error.message);
      });

      socket.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
      });
    } catch (error) {
      console.warn('Failed to initialize socket, continuing without real-time updates:', error.message);
      return undefined;
    }

    const inventoryHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'inventory',
        'categories',
        'dashboardOverview',
        'report-category',
        'inventoryTrends',
        'dashboardInventory',
        'stockReport',
        'low-stock',
        'dashboardInventorySnapshot',
        'dashboardTransactionsSnapshot',
        'recent-transactions',
        'recent-alerts',
        'product-tools-inventory',
        'product-tool-categories',
        'stockAdjustments',
        'stockTransfers',
        'quick-actions-assets',
        'quick-actions-purchases',
        'quick-actions-sales',
        'ai-demand-inventory',
        'ai-restock-suggestions',
        'ai-inventory-optimization',
        'ai-profit-pricing',
        'ai-smart-reports',
      ]);

      emitBridgeEvent('inventoryUpdate', {
        operation: payload.action || 'sync',
        data: payload,
      });
      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'inventory',
        data: payload,
      });
    };

    const assetHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'assets',
        'assetsOverview',
        'report-category',
        'dashboardOverview',
        'dashboardAssets',
        'quick-actions-assets',
        'dashboardAssetsSnapshot',
        'ai-smart-reports',
      ]);

      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'assets',
        data: payload,
      });
    };

    const transactionHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'transactions',
        'transactionsAnalysis',
        'dashboardOverview',
        'report-category',
        'dashboardSales',
        'dashboardPurchases',
        'dashboardExpenses',
        'dashboardCustomers',
        'customer-analytics',
        'customer-sales-history',
        'all-sales-history',
        'all-due-payments',
        'dashboardTransactionsSnapshot',
        'paymentTransactions',
        'paymentAccounts',
        'sales',
        'invoices',
        'payments',
        'salesReturns',
        'quotations',
        'salesReports',
        'salesAgents',
        'purchases',
        'expenses',
        'recent-transactions',
        'quick-actions-purchases',
        'quick-actions-sales',
        'ai-profit-pricing',
        'ai-expense-insights',
        'ai-fraud-detection',
        'ai-sales-intelligence',
        'ai-customer-insights',
        'ai-smart-reports',
        'ai-assistant-live-context',
      ]);

      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'transactions',
        data: payload,
      });
      emitBridgeEvent('salesUpdate', {
        operation: payload.action || 'sync',
        data: payload,
      });
      emitBridgeEvent('purchaseUpdate', {
        operation: payload.action || 'sync',
        data: payload,
      });
    };

    const alertHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'alerts',
        'report-category',
        'alerts-navbar-feed',
        'alerts-navbar-stats',
        'realtime-alerts',
        'activeAlertsCount',
        'recentAlerts',
        'dashboardOverview',
        'dashboardAlerts',
        'dashboardAlertsSnapshot',
        'recent-alerts',
        'ai-smart-alerts',
        'ai-smart-reports',
      ]);

      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'alerts',
        data: payload,
      });
    };

    const supplierHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'suppliers',
        'report-category',
        'dashboardSuppliers',
        'suppliersPerformance',
        'product-tool-suppliers',
        'reportsSummary',
      ]);

      emitBridgeEvent('supplierUpdate', {
        operation: payload.action || 'sync',
        data: payload,
      });
      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'suppliers',
        data: payload,
      });
    };

    const customerHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'dashboardCustomers',
        'report-category',
        'customer-analytics',
        'customers',
        'customer',
        'customer-ledger',
        'customer-sales-history',
        'customer-communication',
        'customer-alerts',
        'all-due-payments',
        'import-export-data',
        'tags-segments-data',
        'ai-customer-insights',
        'ai-assistant-live-context',
      ]);

      emitBridgeEvent('customerUpdate', {
        operation: payload.action || 'sync',
        data: payload,
      });
      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'customers',
        data: payload,
      });
    };

    const userHandler = (payload = {}) => {
      invalidateMany(queryClient, ['users']);
      invalidateMany(queryClient, ['report-category']);

      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'users',
        data: payload,
      });
    };

    const paymentHandler = (payload = {}) => {
      invalidateMany(queryClient, [
        'paymentAccounts',
        'report-category',
        'paymentTransactions',
        'dashboardTransactionsSnapshot',
        'recent-transactions',
        'dashboardOverview',
        'ai-expense-insights',
        'ai-smart-reports',
      ]);

      emitBridgeEvent('databaseChange', {
        operation: payload.action || 'sync',
        table: 'paymentAccounts',
        data: payload,
      });
    };

    [
      'inventory-updated',
      'stock-adjusted',
      'inventory:updated',
      'inventory:stock-adjusted',
      'inventory:created',
      'inventory:deleted',
      'inventory:low-stock',
    ].forEach((event) => socket.on(event, inventoryHandler));

    [
      'asset-updated',
      'asset-assigned',
      'asset-unassigned',
      'asset-maintenance',
    ].forEach((event) => socket.on(event, assetHandler));

    [
      'transaction-created',
      'transaction-updated',
      'transaction-approved',
      'transaction-cancelled',
    ].forEach((event) => socket.on(event, transactionHandler));

    [
      'alert-created',
      'alert-acknowledged',
      'alert-resolved',
      'alert-dismissed',
      'alert-assigned',
    ].forEach((event) => socket.on(event, alertHandler));

    ['supplier-created', 'supplier-updated', 'supplier-deleted'].forEach((event) =>
      socket.on(event, supplierHandler)
    );

    ['customer-created', 'customer-updated', 'customer-deleted'].forEach((event) =>
      socket.on(event, customerHandler)
    );

    [
      'user-created',
      'user-updated',
      'user-deleted',
      'user-permissions-updated',
      'user-status-updated',
      'user-profile-photo-updated',
    ].forEach((event) => socket.on(event, userHandler));

    ['payment-account-updated', 'payment-transaction-created'].forEach((event) =>
      socket.on(event, paymentHandler)
    );

    ['expense-created'].forEach((event) => socket.on(event, transactionHandler));

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [enabled, queryClient]);

  return null;
};

export default RealtimeQueryBridge;
