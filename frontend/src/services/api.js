// Smart Inventory System - Complete API Configuration
// Prisma ORM Database Schema Created - All Features Available

// Mock data import
import mockData from '../data/mockData.js';
import {
  generateDuePayments,
  generateCustomerLedger,
  generateSalesHistory,
  generateProductPattern,
  generateCommunicationLog,
  generateAlerts,
  generateCustomerAnalytics,
  generateImportExportData,
  generateTagsAndSegments
} from '../data/customerData.js';

// API configuration
const normalizeApiBaseUrl = (value) => {
  const fallback = 'http://localhost:3001/api';
  const rawValue = (value || fallback).trim();
  const trimmedValue = rawValue.replace(/\/+$/, '');

  if (/\/api$/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `${trimmedValue}/api`;
};

const normalizeSocketUrl = (value) => {
  const fallback = 'http://localhost:3001';
  const rawValue = (value || fallback).trim();
  return rawValue.replace(/\/+$/, '').replace(/\/api$/i, '');
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
const SOCKET_URL = normalizeSocketUrl(process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL);
const isDevelopment = process.env.NODE_ENV === 'development';
const API_TOKEN_KEY = 'token';
const CUSTOMERS_STORAGE_KEY = 'customersRealtime';
const CUSTOMERS_REALTIME_EVENT = 'customersRealtime:update';

const buildHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const createApiError = async (response, fallbackMessage) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  const error = new Error(payload?.message || fallbackMessage);
  error.response = {
    status: response.status,
    data: payload || {
      success: false,
      message: fallbackMessage,
    },
  };

  throw error;
};

const authRequest = async (path, options = {}) => {
  const { authenticated = false, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...buildHeaders(authenticated),
      ...(fetchOptions.headers || {}),
    },
  });

  if (!response.ok) {
    await createApiError(response, 'Authentication request failed');
  }

  return response.json();
};

const getStoredCustomers = () => {
  const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        mockData.customers = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse stored customers:', error);
    }
  }

  if (!Array.isArray(mockData.customers)) {
    mockData.customers = [];
  }

  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(mockData.customers));
  return mockData.customers;
};

const persistCustomers = (customers, detail = {}) => {
  mockData.customers = Array.isArray(customers) ? customers : [];
  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(mockData.customers));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CUSTOMERS_REALTIME_EVENT, {
        detail: {
          ...detail,
          customers: mockData.customers,
          timestamp: new Date().toISOString(),
        },
      })
    );
  }

  return mockData.customers;
};

// Check backend availability
const checkBackendAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: buildHeaders(true),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Complete Mock API service
const mockApi = {
  // Suppliers API
  getSuppliers: async (params = {}) => {
    // Try real backend first
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.limit) queryParams.append('limit', params.limit);

        const response = await fetch(`${API_BASE_URL}/suppliers?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Backend API failed, falling back to mock data');
      }
    }

    // Fallback to mock data
    let items = [...mockData.suppliers];
    
    if (params.search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(params.search.toLowerCase()) ||
        item.company_name.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    
    if (params.limit) {
      items = items.slice(0, params.limit);
    }

    return {
      data: {
        success: true,
        data: {
          suppliers: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
  },

  getSupplierById: async (id) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Backend API failed, falling back to mock data');
      }
    }

    const supplier = mockData.suppliers.find(supplier => supplier._id === id);
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return {
      data: {
        success: true,
        data: { supplier }
      }
    };
  },

  createSupplier: async (data) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Backend API failed, falling back to mock data');
      }
    }

    const newSupplier = {
      _id: `SUP_${Date.now()}`,
      supplier_id: `SUP_${data.name.replace(/\s+/g, '_')}_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.suppliers.push(newSupplier);
    
    return {
      data: {
        success: true,
        data: { supplier: newSupplier }
      }
    };
  },

  updateSupplier: async (id, data) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Backend API failed, falling back to mock data');
      }
    }

    const index = mockData.suppliers.findIndex(supplier => supplier._id === id);
    
    if (index === -1) {
      throw new Error('Supplier not found');
    }
    
    mockData.suppliers[index] = {
      ...mockData.suppliers[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return {
      data: {
        success: true,
        data: { supplier: mockData.suppliers[index] }
      }
    };
  },

  deleteSupplier: async (id) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Backend API failed, falling back to mock data');
      }
    }

    const index = mockData.suppliers.findIndex(supplier => supplier._id === id);
    
    if (index === -1) {
      throw new Error('Supplier not found');
    }
    
    const deletedSupplier = mockData.suppliers.splice(index, 1)[0];
    
    return {
      data: {
        success: true,
        data: { supplier: deletedSupplier }
      }
    };
  },

  // Inventory API
  inventory: {
    getAll: async (params = {}) => {
      // Try real backend first
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const queryParams = new URLSearchParams();
          if (params.search) queryParams.append('search', params.search);
          if (params.category) queryParams.append('category', params.category);
          if (params.status) queryParams.append('status', params.status);
          if (params.minStock) queryParams.append('minStock', params.minStock);
          if (params.maxStock) queryParams.append('maxStock', params.maxStock);
          if (params.sortBy) queryParams.append('sortBy', params.sortBy);
          if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
          if (params.page) queryParams.append('page', params.page);
          if (params.limit) queryParams.append('limit', params.limit);

          const response = await fetch(`${API_BASE_URL}/inventory?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      // Fallback to mock data
      let items = [...mockData.products];
      
      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.category) {
        items = items.filter(item => item.category === params.category);
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
      }
      
      if (params.minStock) {
        items = items.filter(item => item.quantity <= item.minStock);
      }
      
      // Sort
      const sortBy = params.sortBy || 'name';
      const sortOrder = params.sortOrder || 'ASC';
      items.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        return sortOrder === 'ASC' 
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      });
      
      return {
        data: {
          success: true,
          data: {
            inventory: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      // Try real backend first
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      // Fallback to mock data
      const product = mockData.products.find(p => p._id === id || p.item_id === id);
      return {
        data: {
          success: true,
          data: product
        }
      };
    },
    
    create: async (data) => {
      const newProduct = {
        _id: 'INV_' + Date.now(),
        item_id: data.item_id || 'INV_' + Date.now(),
        ...data,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockData.products.push(newProduct);
      return {
        data: {
          success: true,
          data: newProduct
        }
      };
    },
    
    update: async (id, data) => {
      const index = mockData.products.findIndex(p => p._id === id || p.item_id === id);
      if (index !== -1) {
        mockData.products[index] = { 
          ...mockData.products[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
      }
      return {
        data: {
          success: true,
          data: mockData.products[index]
        }
      };
    },
    
    delete: async (id) => {
      const index = mockData.products.findIndex(p => p._id === id || p.item_id === id);
      if (index !== -1) {
        const deleted = mockData.products.splice(index, 1)[0];
        return {
          data: {
            success: true,
            data: deleted
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Product not found'
        }
      };
    },
    
    adjustStock: async (id, quantity, reason) => {
      const index = mockData.products.findIndex(p => p._id === id || p.item_id === id);
      if (index > -1) {
        mockData.products[index].quantity += quantity;
        mockData.products[index].updated_at = new Date().toISOString();
      }
      return {
        data: {
          success: true,
          data: mockData.products[index] || null
        }
      };
    },
    
    getStockReport: async () => {
      console.log('Generating Stock Report...');
      
      const products = mockData.products || [];
      
      // Calculate statistics
      const totalItems = products.length;
      const lowStockItems = products.filter(p => p.quantity <= p.minStock).length;
      const outOfStockItems = products.filter(p => p.quantity === 0).length;
      const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
      
      // Generate detailed items data
      const items = products.map(product => ({
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantity,
        minStock: product.minStock,
        maxStock: product.maxStock,
        price: product.price,
        totalValue: product.quantity * product.price,
        status: product.quantity === 0 ? 'out_of_stock' : 
                product.quantity <= product.minStock ? 'low_stock' : 'in_stock',
        lastUpdated: product.updated_at,
        location: product.location || 'Main Warehouse',
        supplier: product.supplier || 'Unknown'
      }));

      const reportData = {
        stats: {
          total_items: totalItems,
          low_stock_items: lowStockItems,
          out_of_stock: outOfStockItems,
          total_value: totalValue
        },
        items: items,
        generated_at: new Date().toISOString(),
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      };

      console.log('Stock Report generated successfully:', reportData);
      
      return {
        data: {
          success: true,
          data: reportData
        }
      };
    },

    getLowStock: async () => {
      console.log('Getting Low Stock Report...');
      
      const products = mockData.products || [];
      
      // Filter products that are at or below minimum stock
      const lowStockItems = products
        .filter(product => product.quantity <= product.minStock)
        .map(product => ({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          quantity: product.quantity,
          minStock: product.minStock,
          maxStock: product.maxStock,
          price: product.price,
          status: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
          reorderQuantity: product.maxStock - product.quantity,
          lastUpdated: product.updated_at,
          location: product.location || 'Main Warehouse',
          supplier: product.supplier || 'Unknown',
          urgency: product.quantity === 0 ? 'critical' : 
                   product.quantity <= product.minStock * 0.5 ? 'high' : 'medium'
        }))
        .sort((a, b) => a.quantity - b.quantity); // Sort by quantity (lowest first)

      const reportData = {
        lowStockItems: lowStockItems,
        summary: {
          totalLowStock: lowStockItems.length,
          criticalItems: lowStockItems.filter(item => item.urgency === 'critical').length,
          highPriorityItems: lowStockItems.filter(item => item.urgency === 'high').length,
          mediumPriorityItems: lowStockItems.filter(item => item.urgency === 'medium').length,
          totalReorderValue: lowStockItems.reduce((sum, item) => sum + (item.reorderQuantity * item.price), 0)
        },
        generated_at: new Date().toISOString()
      };

      console.log('Low Stock Report generated successfully:', reportData);
      
      return {
        data: {
          success: true,
          data: reportData
        }
      };
    },

    getReportsSummary: async () => {
      console.log('Generating Reports Summary...');
      
      const sales = mockData.sales || [];
      const purchases = mockData.purchases || [];
      const expenses = mockData.expenses || [];
      const products = mockData.products || [];
      
      // Calculate sales summary
      const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || sale.total || 0), 0);
      const salesCount = sales.length;
      const avgTicketSize = salesCount > 0 ? totalSales / salesCount : 0;
      
      // Calculate purchases summary
      const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || purchase.total || 0), 0);
      const purchasesCount = purchases.length;
      
      // Calculate expenses summary
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const expensesCount = expenses.length;
      
      // Calculate inventory summary
      const totalInventoryValue = products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.quantity <= p.minStock).length;
      
      // Calculate revenue metrics
      const revenue = totalSales;
      const costs = totalPurchases + totalExpenses;
      const profit = revenue - costs;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Calculate period statistics (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSales = sales.filter(sale => new Date(sale.sale_date) >= thirtyDaysAgo);
      const recentPurchases = purchases.filter(purchase => new Date(purchase.purchase_date) >= thirtyDaysAgo);
      const recentExpenses = expenses.filter(expense => new Date(expense.date) >= thirtyDaysAgo);
      
      const recentRevenue = recentSales.reduce((sum, sale) => sum + (sale.total_amount || sale.total || 0), 0);
      const recentCosts = recentPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || purchase.total || 0), 0) + 
                         recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const recentProfit = recentRevenue - recentCosts;

      const summaryData = {
        sales: {
          count: salesCount,
          total: totalSales,
          average: avgTicketSize,
          recent: recentSales.length,
          recentTotal: recentRevenue
        },
        purchases: {
          count: purchasesCount,
          total: totalPurchases,
          recent: recentPurchases.length,
          recentTotal: recentPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || purchase.total || 0), 0)
        },
        expenses: {
          count: expensesCount,
          total: totalExpenses,
          recent: recentExpenses.length,
          recentTotal: recentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        },
        inventory: {
          totalProducts: totalProducts,
          totalValue: totalInventoryValue,
          lowStockItems: lowStockProducts,
          outOfStockItems: products.filter(p => p.quantity === 0).length
        },
        financial: {
          revenue: revenue,
          costs: costs,
          profit: profit,
          profitMargin: profitMargin,
          recentRevenue: recentRevenue,
          recentProfit: recentProfit
        },
        period: {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 30
        },
        generated_at: new Date().toISOString()
      };

      console.log('Reports Summary generated successfully:', summaryData);
      
      return {
        data: {
          success: true,
          data: summaryData
        }
      };
    },

    getAssetsOverview: async () => {
      console.log('Generating Assets Overview...');
      
      const assets = mockData.assets || [];
      
      // Calculate asset statistics
      const totalAssets = assets.length;
      const activeAssets = assets.filter(asset => asset.status === 'active').length;
      const disposedAssets = assets.filter(asset => asset.status === 'disposed').length;
      const assignedAssets = assets.filter(asset => asset.assigned_to?.user_id).length;
      
      // Calculate maintenance statistics
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const maintenanceDueAssets = assets.filter(asset => {
        if (!asset.maintenance_schedule) return false;
        const nextMaintenance = new Date(asset.maintenance_schedule.next_maintenance_date);
        return nextMaintenance <= currentDate;
      });
      
      const maintenanceUpcomingAssets = assets.filter(asset => {
        if (!asset.maintenance_schedule) return false;
        const nextMaintenance = new Date(asset.maintenance_schedule.next_maintenance_date);
        return nextMaintenance > currentDate && nextMaintenance <= thirtyDaysFromNow;
      });
      
      // Calculate depreciation statistics
      const assetsWithDepreciation = assets.filter(asset => asset.depreciation && asset.current_value);
      const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchase_cost?.amount || 0), 0);
      const totalCurrentValue = assets.reduce((sum, asset) => sum + (asset.current_value?.amount || 0), 0);
      const totalDepreciation = totalPurchaseValue - totalCurrentValue;
      
      // Calculate asset value by category
      const assetsByCategory = assets.reduce((acc, asset) => {
        const category = asset.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { count: 0, totalValue: 0, purchaseValue: 0 };
        }
        acc[category].count++;
        acc[category].totalValue += asset.current_value?.amount || 0;
        acc[category].purchaseValue += asset.purchase_cost?.amount || 0;
        return acc;
      }, {});
      
      // Calculate asset age statistics
      const assetAges = assets.map(asset => {
        const purchaseDate = new Date(asset.purchase_date);
        const ageInYears = (currentDate - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
        return ageInYears;
      });
      
      const averageAssetAge = assetAges.length > 0 ? assetAges.reduce((sum, age) => sum + age, 0) / assetAges.length : 0;
      
      const overviewData = {
        totalAssets: totalAssets,
        activeAssets: activeAssets,
        disposedAssets: disposedAssets,
        assignedAssets: assignedAssets,
        unassignedAssets: totalAssets - assignedAssets,
        
        maintenance: {
          dueCount: maintenanceDueAssets.length,
          upcomingCount: maintenanceUpcomingAssets.length,
          overdueCount: maintenanceDueAssets.length,
          nextScheduledMaintenance: maintenanceUpcomingAssets.length > 0 ? 
            maintenanceUpcomingAssets.sort((a, b) => new Date(a.maintenance_schedule.next_maintenance_date) - new Date(b.maintenance_schedule.next_maintenance_date))[0].maintenance_schedule.next_maintenance_date : null
        },
        
        financial: {
          totalPurchaseValue: totalPurchaseValue,
          totalCurrentValue: totalCurrentValue,
          totalDepreciation: totalDepreciation,
          depreciationRate: totalPurchaseValue > 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0,
          averageAssetValue: totalAssets > 0 ? totalCurrentValue / totalAssets : 0
        },
        
        categories: assetsByCategory,
        
        age: {
          average: averageAssetAge,
          oldest: assetAges.length > 0 ? Math.max(...assetAges) : 0,
          newest: assetAges.length > 0 ? Math.min(...assetAges) : 0
        },
        
        utilization: {
          utilizationRate: totalAssets > 0 ? (assignedAssets / totalAssets) * 100 : 0,
          activeRate: totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0
        },
        
        generated_at: new Date().toISOString(),
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      };

      console.log('Assets Overview generated successfully:', overviewData);
      
      return {
        data: {
          success: true,
          data: overviewData
        }
      };
    },

    getExpenseInsights: async () => {
      console.log('Generating Expense Insights...');
      
      // Create sample expense data if not available
      const expenses = mockData.expenses || [
        {
          _id: 'EXP_001',
          title: 'Office Rent',
          category: 'Rent',
          amount: 5000,
          date: '2024-04-15',
          description: 'Monthly office rent payment',
          vendor: 'ABC Properties',
          paymentMethod: 'Bank Transfer',
          status: 'Paid',
          recurring: true,
          frequency: 'Monthly'
        },
        {
          _id: 'EXP_002',
          title: 'Software Licenses',
          category: 'Software',
          amount: 1200,
          date: '2024-04-10',
          description: 'Annual software license renewals',
          vendor: 'TechCorp',
          paymentMethod: 'Credit Card',
          status: 'Paid',
          recurring: true,
          frequency: 'Annually'
        },
        {
          _id: 'EXP_003',
          title: 'Office Supplies',
          category: 'Office Supplies',
          amount: 350,
          date: '2024-04-08',
          description: 'Stationery and office materials',
          vendor: 'Office Depot',
          paymentMethod: 'Cash',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        },
        {
          _id: 'EXP_004',
          title: 'Utilities',
          category: 'Utilities',
          amount: 850,
          date: '2024-04-05',
          description: 'Electricity and water bills',
          vendor: 'City Utilities',
          paymentMethod: 'Bank Transfer',
          status: 'Paid',
          recurring: true,
          frequency: 'Monthly'
        },
        {
          _id: 'EXP_005',
          title: 'Marketing Campaign',
          category: 'Marketing',
          amount: 2500,
          date: '2024-04-03',
          description: 'Digital marketing campaign',
          vendor: 'Marketing Agency',
          paymentMethod: 'Credit Card',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        },
        {
          _id: 'EXP_006',
          title: 'Travel Expenses',
          category: 'Travel',
          amount: 1800,
          date: '2024-04-01',
          description: 'Business travel and accommodation',
          vendor: 'Travel Agency',
          paymentMethod: 'Credit Card',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        },
        {
          _id: 'EXP_007',
          title: 'Insurance Premium',
          category: 'Insurance',
          amount: 750,
          date: '2024-03-28',
          description: 'Business insurance premium',
          vendor: 'Insurance Co',
          paymentMethod: 'Bank Transfer',
          status: 'Paid',
          recurring: true,
          frequency: 'Quarterly'
        },
        {
          _id: 'EXP_008',
          title: 'Equipment Maintenance',
          category: 'Maintenance',
          amount: 420,
          date: '2024-03-25',
          description: 'Office equipment maintenance',
          vendor: 'Maintenance Service',
          paymentMethod: 'Cash',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        },
        {
          _id: 'EXP_009',
          title: 'Professional Services',
          category: 'Professional Services',
          amount: 1500,
          date: '2024-03-20',
          description: 'Legal and consulting fees',
          vendor: 'Law Firm',
          paymentMethod: 'Bank Transfer',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        },
        {
          _id: 'EXP_010',
          title: 'Employee Training',
          category: 'Training',
          amount: 800,
          date: '2024-03-15',
          description: 'Staff training programs',
          vendor: 'Training Provider',
          paymentMethod: 'Credit Card',
          status: 'Paid',
          recurring: false,
          frequency: 'One-time'
        }
      ];
      
      // Calculate expense statistics
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const avgDailyExpense = totalExpenses / 30;
      
      // Calculate category breakdown
      const categoryBreakdown = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, transactions: [] };
        }
        acc[category].total += expense.amount || 0;
        acc[category].count++;
        acc[category].transactions.push(expense);
        return acc;
      }, {});
      
      // Calculate outliers (expenses that are significantly higher than average)
      const categoryAverages = Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        average: data.total / data.count
      }));
      
      const outliers = expenses.filter(expense => {
        const categoryAvg = categoryAverages.find(c => c.category === expense.category)?.average || 0;
        return expense.amount > categoryAvg * 2; // 2x the category average
      });
      
      // Calculate potential savings opportunities
      const potentialSavings = [];
      
      // High-frequency recurring expenses
      const recurringExpenses = expenses.filter(e => e.recurring);
      const highFrequencyCategories = Object.entries(categoryBreakdown)
        .filter(([_, data]) => data.count > 3)
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          average: data.total / data.count,
          potentialSavings: Math.round(data.total * 0.15) // 15% potential savings
        }));
      
      potentialSavings.push(...highFrequencyCategories);
      
      // Calculate daily expense trends
      const dailyTrends = Array.from({ length: 30 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - index));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = expenses.filter(e => e.date === dateStr);
        const dayTotal = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        return {
          date: dateStr,
          total: dayTotal,
          count: dayExpenses.length,
          avgAmount: dayExpenses.length > 0 ? dayTotal / dayExpenses.length : 0
        };
      });
      
      // Calculate weekly trends
      const weeklyTrends = Array.from({ length: 4 }, (_, index) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (index * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekExpenses = expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });
        
        const weekTotal = weekExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        return {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          total: weekTotal,
          count: weekExpenses.length
        };
      });
      
      // Calculate payment method breakdown
      const paymentMethodBreakdown = expenses.reduce((acc, expense) => {
        const method = expense.paymentMethod || 'Unknown';
        if (!acc[method]) {
          acc[method] = { total: 0, count: 0 };
        }
        acc[method].total += expense.amount || 0;
        acc[method].count++;
        return acc;
      }, {});
      
      // Calculate vendor analysis
      const vendorAnalysis = expenses.reduce((acc, expense) => {
        const vendor = expense.vendor || 'Unknown';
        if (!acc[vendor]) {
          acc[vendor] = { total: 0, count: 0, categories: new Set() };
        }
        acc[vendor].total += expense.amount || 0;
        acc[vendor].count++;
        acc[vendor].categories.add(expense.category);
        return acc;
      }, {});
      
      // Convert Set to Array for vendor categories
      Object.keys(vendorAnalysis).forEach(vendor => {
        vendorAnalysis[vendor].categories = Array.from(vendorAnalysis[vendor].categories);
      });
      
      const insightsData = {
        summary: {
          totalExpenses: totalExpenses,
          avgDailyExpense: Math.round(avgDailyExpense),
          totalTransactions: expenses.length,
          avgTransactionAmount: expenses.length > 0 ? totalExpenses / expenses.length : 0,
          outliers: outliers.length,
          potentialSavings: potentialSavings.reduce((sum, item) => sum + (item.potentialSavings || 0), 0)
        },
        
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category,
          totalAmount: data.total,
          transactions: data.count,
          avgAmount: Math.round(data.total / data.count),
          percentage: Math.round((data.total / totalExpenses) * 100)
        })).sort((a, b) => b.totalAmount - a.totalAmount),
        
        outliers: outliers.map(expense => ({
          id: expense._id,
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          reason: 'Significantly higher than category average',
          categoryAverage: Math.round(categoryAverages.find(c => c.category === expense.category)?.average || 0),
          variance: Math.round(((expense.amount - (categoryAverages.find(c => c.category === expense.category)?.average || 0)) / (categoryAverages.find(c => c.category === expense.category)?.average || 1)) * 100)
        })),
        
        potentialSavings: potentialSavings.map(item => ({
          category: item.category,
          currentTotal: item.total,
          potentialSavings: item.potentialSavings,
          recommendation: `Consider negotiating better rates or finding alternative vendors for ${item.category}`,
          savingsPercentage: Math.round((item.potentialSavings / item.total) * 100)
        })).sort((a, b) => b.potentialSavings - a.potentialSavings),
        
        trends: {
          daily: dailyTrends,
          weekly: weeklyTrends.reverse(),
          paymentMethods: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
            method,
            total: data.total,
            count: data.count,
            percentage: Math.round((data.total / totalExpenses) * 100)
          })),
          vendors: Object.entries(vendorAnalysis)
            .map(([vendor, data]) => ({
              vendor,
              total: data.total,
              count: data.count,
              categories: data.categories,
              avgAmount: Math.round(data.total / data.count)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
        },
        
        recommendations: [
          `Review ${outliers.length} outlier expenses for potential cost reduction`,
          `Consider renegotiating contracts with top vendors`,
          `Implement expense tracking for better visibility`,
          `Set up automated alerts for unusual spending patterns`,
          `Consolidate vendors to reduce administrative overhead`
        ],
        
        generated_at: new Date().toISOString(),
        period: {
          startDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 30
        }
      };

      console.log('Expense Insights generated successfully:', insightsData);
      
      return {
        data: {
          success: true,
          data: insightsData
        }
      };
    },

    getAlertsAnalysis: async () => {
      console.log('Generating Alerts Analysis...');
      
      // Create sample alerts data if not available
      const alerts = mockData.alerts || [
        {
          _id: 'ALT_001',
          alert_id: 'ALT_001',
          title: 'Low Stock Alert',
          message: 'Product "Laptop Pro 15" is running low on stock',
          alert_type: 'inventory',
          severity: 'warning',
          module: 'inventory',
          reference_id: 'INV_LAPTOP_001',
          reference_type: 'product',
          status: 'active',
          created_at: '2024-04-20T12:00:00Z',
          expires_at: '2024-04-21T12:00:00Z'
        },
        {
          _id: 'ALT_002',
          alert_id: 'ALT_002',
          title: 'Payment Due',
          message: 'Customer "ABC Corporation" has overdue payment of $15,000',
          alert_type: 'payment',
          severity: 'critical',
          module: 'customers',
          reference_id: 'CUST_ABC_001',
          reference_type: 'customer',
          status: 'active',
          created_at: '2024-04-20T13:00:00Z',
          expires_at: '2024-04-25T13:00:00Z'
        },
        {
          _id: 'ALT_003',
          alert_id: 'ALT_003',
          title: 'Maintenance Due',
          message: 'Asset "Industrial CNC Machine" requires maintenance',
          alert_type: 'maintenance',
          severity: 'high',
          module: 'assets',
          reference_id: 'AST_006',
          reference_type: 'asset',
          status: 'acknowledged',
          created_at: '2024-04-19T09:00:00Z',
          expires_at: '2024-04-24T09:00:00Z'
        },
        {
          _id: 'ALT_004',
          alert_id: 'ALT_004',
          title: 'System Error',
          message: 'Database connection timeout occurred',
          alert_type: 'system',
          severity: 'critical',
          module: 'system',
          reference_id: 'SYS_DB_001',
          reference_type: 'system',
          status: 'resolved',
          created_at: '2024-04-18T15:30:00Z',
          expires_at: '2024-04-23T15:30:00Z'
        },
        {
          _id: 'ALT_005',
          alert_id: 'ALT_005',
          title: 'High CPU Usage',
          message: 'Server CPU usage exceeded 90% threshold',
          alert_type: 'performance',
          severity: 'warning',
          module: 'system',
          reference_id: 'SYS_CPU_001',
          reference_type: 'system',
          status: 'active',
          created_at: '2024-04-21T10:15:00Z',
          expires_at: '2024-04-22T10:15:00Z'
        }
      ];
      
      // Calculate alert statistics
      const totalAlerts = alerts.length;
      const activeAlerts = alerts.filter(alert => alert.status === 'active').length;
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
      const highAlerts = alerts.filter(alert => alert.severity === 'high').length;
      const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length;
      const infoAlerts = alerts.filter(alert => alert.severity === 'info').length;
      
      // Calculate alert distribution by type
      const typeDistribution = alerts.reduce((acc, alert) => {
        const type = alert.alert_type || 'unknown';
        const existing = acc.find(item => item._id === type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ _id: type, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count);
      
      // Calculate severity distribution
      const severityDistribution = [
        { _id: 'critical', count: criticalAlerts },
        { _id: 'high', count: highAlerts },
        { _id: 'warning', count: warningAlerts },
        { _id: 'info', count: infoAlerts }
      ];
      
      // Calculate status distribution
      const statusDistribution = [
        { _id: 'active', count: alerts.filter(alert => alert.status === 'active').length },
        { _id: 'acknowledged', count: alerts.filter(alert => alert.status === 'acknowledged').length },
        { _id: 'resolved', count: alerts.filter(alert => alert.status === 'resolved').length }
      ];
      
      // Calculate module distribution
      const moduleDistribution = alerts.reduce((acc, alert) => {
        const module = alert.module || 'unknown';
        const existing = acc.find(item => item._id === module);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ _id: module, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count);
      
      // Calculate time-based trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentAlerts = alerts.filter(alert => new Date(alert.created_at) >= thirtyDaysAgo);
      
      const dailyTrends = recentAlerts.reduce((acc, alert) => {
        const date = new Date(alert.created_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const analysisData = {
        totalAlerts: totalAlerts,
        activeAlerts: activeAlerts,
        criticalAlerts: criticalAlerts,
        highAlerts: highAlerts,
        warningAlerts: warningAlerts,
        infoAlerts: infoAlerts,
        
        typeDistribution: typeDistribution,
        severityDistribution: severityDistribution,
        statusDistribution: statusDistribution,
        moduleDistribution: moduleDistribution,
        
        trends: {
          daily: dailyTrends,
          weekly: recentAlerts.length,
          monthly: totalAlerts
        },
        
        metrics: {
          averageAlertsPerDay: recentAlerts.length > 0 ? (recentAlerts.length / 30).toFixed(2) : 0,
          resolutionRate: totalAlerts > 0 ? ((alerts.filter(alert => alert.status === 'resolved').length / totalAlerts) * 100).toFixed(2) : 0,
          acknowledgmentRate: totalAlerts > 0 ? ((alerts.filter(alert => alert.status === 'acknowledged').length / totalAlerts) * 100).toFixed(2) : 0,
          criticalAlertRate: totalAlerts > 0 ? ((criticalAlerts / totalAlerts) * 100).toFixed(2) : 0
        },
        
        generated_at: new Date().toISOString(),
        period: {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 30
        }
      };

      console.log('Alerts Analysis generated successfully:', analysisData);
      
      return {
        data: {
          success: true,
          data: analysisData
        }
      };
    },

    getUserActivityAnalysis: async () => {
      console.log('Generating User Activity Analysis...');
      
      // Create sample user activity data
      const users = mockData.users || [
        {
          _id: 'USR_001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          role: 'admin',
          department: 'IT',
          isActive: true,
          lastLogin: '2024-04-23T09:15:00Z',
          actionsToday: 45,
          sessionMinutes: 120,
          loginCount: 156,
          totalActions: 2340
        },
        {
          _id: 'USR_002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          role: 'manager',
          department: 'Sales',
          isActive: true,
          lastLogin: '2024-04-23T08:30:00Z',
          actionsToday: 32,
          sessionMinutes: 95,
          loginCount: 124,
          totalActions: 1876
        },
        {
          _id: 'USR_003',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@company.com',
          role: 'user',
          department: 'Sales',
          isActive: true,
          lastLogin: '2024-04-23T10:45:00Z',
          actionsToday: 28,
          sessionMinutes: 78,
          loginCount: 98,
          totalActions: 1456
        },
        {
          _id: 'USR_004',
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah.williams@company.com',
          role: 'manager',
          department: 'Marketing',
          isActive: true,
          lastLogin: '2024-04-22T16:20:00Z',
          actionsToday: 15,
          sessionMinutes: 45,
          loginCount: 87,
          totalActions: 1234
        },
        {
          _id: 'USR_005',
          firstName: 'David',
          lastName: 'Lee',
          email: 'david.lee@company.com',
          role: 'user',
          department: 'IT',
          isActive: true,
          lastLogin: '2024-04-23T11:00:00Z',
          actionsToday: 38,
          sessionMinutes: 110,
          loginCount: 143,
          totalActions: 1987
        },
        {
          _id: 'USR_006',
          firstName: 'Robert',
          lastName: 'Brown',
          email: 'robert.brown@company.com',
          role: 'user',
          department: 'Production',
          isActive: false,
          lastLogin: '2024-04-20T14:30:00Z',
          actionsToday: 0,
          sessionMinutes: 0,
          loginCount: 76,
          totalActions: 987
        },
        {
          _id: 'USR_007',
          firstName: 'Tom',
          lastName: 'Wilson',
          email: 'tom.wilson@company.com',
          role: 'user',
          department: 'Logistics',
          isActive: true,
          lastLogin: '2024-04-23T07:45:00Z',
          actionsToday: 22,
          sessionMinutes: 65,
          loginCount: 112,
          totalActions: 1567
        },
        {
          _id: 'USR_008',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@company.com',
          role: 'admin',
          department: 'HR',
          isActive: true,
          lastLogin: '2024-04-23T09:00:00Z',
          actionsToday: 35,
          sessionMinutes: 105,
          loginCount: 167,
          totalActions: 2109
        }
      ];
      
      // Calculate user activity statistics
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.isActive).length;
      const activeToday = users.filter(user => user.actionsToday > 0).length;
      const loggedInToday = users.filter(user => {
        if (!user.lastLogin) return false;
        const loginDate = new Date(user.lastLogin).toDateString();
        const today = new Date().toDateString();
        return loginDate === today;
      }).length;
      
      const totalActionsToday = users.reduce((sum, user) => sum + (user.actionsToday || 0), 0);
      const averageSessionMinutes = users.reduce((sum, user) => sum + (user.sessionMinutes || 0), 0) / users.length;
      
      // Find most active user
      const mostActiveUser = users.reduce((prev, current) => 
        (prev.actionsToday || 0) > (current.actionsToday || 0) ? prev : current
      );
      
      // Calculate activity by department
      const departmentActivity = users.reduce((acc, user) => {
        const dept = user.department || 'Unknown';
        if (!acc[dept]) {
          acc[dept] = { users: 0, actionsToday: 0, activeUsers: 0 };
        }
        acc[dept].users++;
        acc[dept].actionsToday += user.actionsToday || 0;
        if (user.isActive) acc[dept].activeUsers++;
        return acc;
      }, {});
      
      // Calculate activity by role
      const roleActivity = users.reduce((acc, user) => {
        const role = user.role || 'Unknown';
        if (!acc[role]) {
          acc[role] = { users: 0, actionsToday: 0, activeUsers: 0 };
        }
        acc[role].users++;
        acc[role].actionsToday += user.actionsToday || 0;
        if (user.isActive) acc[role].activeUsers++;
        return acc;
      }, {});
      
      // Calculate hourly activity distribution (sample data)
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour,
        actions: Math.floor(Math.random() * 50) + 10,
        logins: Math.floor(Math.random() * 10) + 2
      }));
      
      // Find peak activity hour
      const peakActivityHour = hourlyActivity.reduce((prev, current) => 
        prev.actions > current.actions ? prev : current
      ).hour;
      
      // Calculate login trends (last 7 days)
      const loginTrends = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return {
          date: date.toISOString().split('T')[0],
          logins: Math.floor(Math.random() * 20) + 5,
          uniqueUsers: Math.floor(Math.random() * 15) + 3
        };
      });
      
      // Calculate user engagement metrics
      const engagementMetrics = {
        averageActionsPerUser: totalActionsToday / Math.max(activeToday, 1),
        averageLoginFrequency: users.reduce((sum, user) => sum + user.loginCount, 0) / users.length,
        userRetentionRate: (activeUsers / totalUsers) * 100,
        dailyActiveRate: (activeToday / totalUsers) * 100
      };
      
      const analysisData = {
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        activeToday: activeToday,
        loggedInToday: loggedInToday,
        actionsToday: totalActionsToday,
        averageSessionMinutes: Math.round(averageSessionMinutes),
        
        mostActiveUser: mostActiveUser ? `${mostActiveUser.firstName} ${mostActiveUser.lastName}` : 'N/A',
        peakActivityHour: `${peakActivityHour}:00`,
        
        departmentActivity: departmentActivity,
        roleActivity: roleActivity,
        
        hourlyActivity: hourlyActivity,
        loginTrends: loginTrends,
        
        engagementMetrics: engagementMetrics,
        
        userMetrics: users.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          actionsToday: user.actionsToday || 0,
          sessionMinutes: user.sessionMinutes || 0,
          loginCount: user.loginCount || 0,
          totalActions: user.totalActions || 0
        })),
        
        generated_at: new Date().toISOString(),
        period: {
          startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 7
        }
      };

      console.log('User Activity Analysis generated successfully:', analysisData);
      
      return {
        data: {
          success: true,
          data: analysisData
        }
      };
    }
  },

  // Assets API
  assets: {
    getAll: async (params = {}) => {
      // Try real backend first
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const queryParams = new URLSearchParams();
          if (params.search) queryParams.append('search', params.search);
          if (params.category) queryParams.append('category', params.category);
          if (params.status) queryParams.append('status', params.status);
          if (params.type) queryParams.append('type', params.type);
          if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
          if (params.sortBy) queryParams.append('sortBy', params.sortBy);
          if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
          if (params.page) queryParams.append('page', params.page);
          if (params.limit) queryParams.append('limit', params.limit);

          const response = await fetch(`${API_BASE_URL}/assets?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      // Fallback to mock data
      console.log('=== ASSETS API DEBUG ===');
      console.log('Mock data assets:', mockData.assets);
      console.log('Params received:', params);
      
      let items = [...(mockData.assets || [])];
      
      // If still empty, create fallback assets
      if (items.length === 0) {
        console.log('No assets found in mockData, creating fallback assets');
        items = [
          {
            "_id": "AST_FALLBACK_1",
            "asset_name": "Dell OptiPlex 7090",
            "category": "Electronics",
            "type": "computer",
            "status": "active",
            "purchase_date": "2024-01-15T10:00:00Z",
            "purchase_cost": { "amount": 1200, "currency": "USD" },
            "current_value": { "amount": 960, "currency": "USD" },
            "assigned_to": { "user_id": { "firstName": "John", "lastName": "Doe" } },
            "location": "Office Building - Floor 3",
            "specifications": { "make": "Dell", "model": "OptiPlex 7090" },
            "maintenance_schedule": { "next_maintenance_date": "2024-06-01T10:00:00Z" },
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-04-15T10:00:00Z"
          },
          {
            "_id": "AST_FALLBACK_2",
            "asset_name": "HP LaserJet Pro M404n",
            "category": "Electronics",
            "type": "printer",
            "status": "active",
            "purchase_date": "2024-02-20T14:30:00Z",
            "purchase_cost": { "amount": 450, "currency": "USD" },
            "current_value": { "amount": 405, "currency": "USD" },
            "assigned_to": { "user_id": { "firstName": "Jane", "lastName": "Smith" } },
            "location": "Office Building - Floor 2",
            "specifications": { "make": "HP", "model": "LaserJet Pro M404n" },
            "maintenance_schedule": { "next_maintenance_date": "2024-06-15T09:00:00Z" },
            "created_at": "2024-02-20T14:30:00Z",
            "updated_at": "2024-04-10T14:30:00Z"
          }
        ];
      }
      
      console.log('Items count after fallback check:', items.length);
      
      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.asset_name.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.type.toLowerCase().includes(searchLower) ||
          (item.specifications?.make && item.specifications.make.toLowerCase().includes(searchLower)) ||
          (item.specifications?.model && item.specifications.model.toLowerCase().includes(searchLower))
        );
        console.log('After search filter:', items.length);
      }
      
      if (params.category) {
        items = items.filter(item => item.category === params.category);
        console.log('After category filter:', items.length);
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
        console.log('After status filter:', items.length);
      }
      
      if (params.type) {
        items = items.filter(item => item.type === params.type);
        console.log('After type filter:', items.length);
      }
      
      if (params.assignedTo) {
        items = items.filter(item => 
          item.assigned_to?.user_id && 
          `${item.assigned_to.user_id.firstName} ${item.assigned_to.user_id.lastName}`.toLowerCase().includes(params.assignedTo.toLowerCase())
        );
        console.log('After assignedTo filter:', items.length);
      }
      
      // Apply sorting
      if (params.sortBy) {
        items.sort((a, b) => {
          let aValue, bValue;
          
          switch (params.sortBy) {
            case 'asset_name':
              aValue = a.asset_name;
              bValue = b.asset_name;
              break;
            case 'category':
              aValue = a.category;
              bValue = b.category;
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            case 'purchase_date':
              aValue = new Date(a.purchase_date);
              bValue = new Date(b.purchase_date);
              break;
            case 'purchase_cost':
              aValue = a.purchase_cost?.amount || 0;
              bValue = b.purchase_cost?.amount || 0;
              break;
            case 'current_value':
              aValue = a.current_value?.amount || 0;
              bValue = b.current_value?.amount || 0;
              break;
            default:
              aValue = a.asset_name;
              bValue = b.asset_name;
          }
          
          if (params.sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedItems = items.slice(startIndex, endIndex);
      
      console.log('Final items being returned:', paginatedItems.length);
      
      const response = {
        data: {
          success: true,
          assets: paginatedItems,
          pagination: {
            page: page,
            limit: limit,
            total: items.length,
            pages: Math.ceil(items.length / limit)
          }
        }
      };
      
      console.log('ASSETS API RESPONSE:', response);
      
      return response;
    },

    getById: async (id) => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      const asset = mockData.assets?.find(asset => asset._id === id);
      
      if (!asset) {
        throw new Error('Asset not found');
      }
      
      return {
        data: {
          success: true,
          asset: asset
        }
      };
    },

    create: async (data) => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      const newAsset = {
        _id: `AST_${Date.now()}`,
        asset_name: data.asset_name,
        category: data.category,
        type: data.type,
        status: data.status || 'active',
        purchase_date: data.purchase_date || new Date().toISOString(),
        purchase_cost: data.purchase_cost,
        current_value: data.current_value || data.purchase_cost,
        assigned_to: data.assigned_to || null,
        location: data.location || 'Not specified',
        specifications: data.specifications || {},
        maintenance_schedule: data.maintenance_schedule || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!mockData.assets) {
        mockData.assets = [];
      }
      
      mockData.assets.push(newAsset);
      syncAssetTransaction(newAsset);
      
      return {
        data: {
          success: true,
          asset: newAsset
        }
      };
    },

    update: async (id, data) => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      const index = mockData.assets?.findIndex(asset => asset._id === id);
      
      if (index === -1 || !mockData.assets) {
        throw new Error('Asset not found');
      }
      
      mockData.assets[index] = {
        ...mockData.assets[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      syncAssetTransaction(mockData.assets[index]);
      
      return {
        data: {
          success: true,
          asset: mockData.assets[index]
        }
      };
    },

    delete: async (id) => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      const index = mockData.assets?.findIndex(asset => asset._id === id);
      
      if (index === -1 || !mockData.assets) {
        throw new Error('Asset not found');
      }
      
      const deletedAsset = mockData.assets.splice(index, 1)[0];
      removeTransactionByOrderId(deletedAsset._id);
      
      return {
        data: {
          success: true,
          message: 'Asset deleted successfully'
        }
      };
    },

    getCategories: async () => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets/categories`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      const categories = [...new Set(mockData.assets?.map(asset => asset.category) || [])];
      
      return {
        data: {
          success: true,
          categories: categories
        }
      };
    },

    getAssetsOverview: async () => {
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/assets/overview`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      // Use the existing getAssetsOverview from inventory API
      return mockApi.inventory.getAssetsOverview();
    }
  },

  // Categories API
  categories: {
    getAll: async () => {
      // Try real backend first
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_BASE_URL}/inventory/categories/list`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log('Backend API failed, falling back to mock data');
        }
      }

      // Fallback to mock data
      return {
        data: {
          success: true,
          data: {
            categories: mockData.categories,
            total: mockData.categories.length
          }
        }
      };
    },
    
    getById: async (id) => {
      const category = mockData.categories.find(c => c._id === id);
      return {
        data: {
          success: true,
          data: category
        }
      };
    }
  },

  // Customers API
  customers: {
    getAll: async (params = {}) => {
      let items = [...getStoredCustomers()];
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.email.toLowerCase().includes(searchLower) ||
          item.phone.toLowerCase().includes(searchLower) ||
          item.company_name.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
      }
      
      if (params.highValue) {
        items = items.filter(item => (item.metrics?.totalSpent || 0) > 2000);
      }
      
      if (params.duePayments) {
        items = items.filter(item => (item.metrics?.outstandingBalance || 0) > 0);
      }
      
      return {
        data: {
          success: true,
          data: {
            customers: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const customer = getStoredCustomers().find(c => c._id === id);
      return {
        data: {
          success: true,
          data: { customer }
        }
      };
    },
    
    getDuePayments: async (id) => {
      const customerCollection = getStoredCustomers();
      const duePayments = id ? generateDuePayments(id) : customerCollection.flatMap(c => generateDuePayments(c._id));
      
      // Generate comprehensive analytics
      const totalAmount = duePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const overdueAmount = duePayments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);
      const upcomingAmount = duePayments.filter(p => p.status === 'upcoming').reduce((sum, payment) => sum + payment.amount, 0);
      
      // Status breakdown
      const statusBreakdown = {};
      duePayments.forEach(payment => {
        if (!statusBreakdown[payment.status]) {
          statusBreakdown[payment.status] = { count: 0, amount: 0 };
        }
        statusBreakdown[payment.status].count++;
        statusBreakdown[payment.status].amount += payment.amount;
      });
      
      // Priority breakdown
      const priorityBreakdown = {};
      duePayments.forEach(payment => {
        if (!priorityBreakdown[payment.priority]) {
          priorityBreakdown[payment.priority] = { count: 0, amount: 0 };
        }
        priorityBreakdown[payment.priority].count++;
        priorityBreakdown[payment.priority].amount += payment.amount;
      });
      
      // Monthly breakdown
      const monthlyBreakdown = {};
      duePayments.forEach(payment => {
        const month = new Date(payment.dueDate).toISOString().slice(0, 7);
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = { count: 0, amount: 0 };
        }
        monthlyBreakdown[month].count++;
        monthlyBreakdown[month].amount += payment.amount;
      });
      
      return {
        data: {
          success: true,
          data: {
            duePayments,
            summary: {
              totalAmount,
              overdueAmount,
              upcomingAmount,
              totalPayments: duePayments.length,
              statusBreakdown,
              priorityBreakdown,
              monthlyBreakdown,
              averageAmount: duePayments.length > 0 ? totalAmount / duePayments.length : 0
            }
          }
        }
      };
    },
    
    getLedger: async (id) => {
      const ledger = generateCustomerLedger(id);
      const customer = getStoredCustomers().find(c => c._id === id);
      
      // Generate comprehensive analytics
      const totalDebit = ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      const balance = totalCredit - totalDebit;
      
      // Transaction summary by type
      const transactionSummary = {};
      ledger.forEach(entry => {
        if (!transactionSummary[entry.type]) {
          transactionSummary[entry.type] = { count: 0, amount: 0 };
        }
        transactionSummary[entry.type].count++;
        transactionSummary[entry.type].amount += entry.debit || entry.credit || 0;
      });
      
      // Monthly summary
      const monthlySummary = {};
      ledger.forEach(entry => {
        const month = new Date(entry.date).toISOString().slice(0, 7);
        if (!monthlySummary[month]) {
          monthlySummary[month] = { debit: 0, credit: 0, transactions: 0 };
        }
        monthlySummary[month].debit += entry.debit || 0;
        monthlySummary[month].credit += entry.credit || 0;
        monthlySummary[month].transactions++;
      });
      
      // Enhanced summary
      const summary = {
        totalPurchases: ledger.filter(entry => entry.type === 'sale').length,
        totalSpent: ledger.reduce((sum, entry) => sum + entry.debit, 0),
        outstandingBalance: ledger[ledger.length - 1]?.runningBalance || 0,
        overdueAmount: ledger.filter(entry => entry.type === 'sale' && entry.debit > 0).reduce((sum, entry) => sum + entry.debit, 0),
        totalDebit,
        totalCredit,
        balance,
        transactionCount: ledger.length,
        transactionSummary,
        monthlySummary,
        averageTransaction: ledger.length > 0 ? totalDebit / ledger.length : 0,
        lastTransaction: ledger.length > 0 ? ledger[ledger.length - 1] : null
      };
      
      return {
        data: {
          success: true,
          data: {
            ledger,
            customer,
            summary
          }
        }
      };
    },
    
    getSalesHistory: async (id) => {
      const salesHistory = generateSalesHistory(id);
      const productPattern = generateProductPattern(id);
      
      return {
        data: {
          success: true,
          data: {
            salesHistory,
            productPattern
          }
        }
      };
    },
    
    getAllSalesHistory: async () => {
      // Generate comprehensive sales history for all customers
      const allSales = [];
      const allCustomers = getStoredCustomers();
      
      allCustomers.forEach(customer => {
        const customerSales = generateSalesHistory(customer._id);
        customerSales.forEach(sale => {
          allSales.push({
            ...sale,
            customer_id: customer._id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            company_name: customer.company_name
          });
        });
      });
      
      // Sort by date descending
      allSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
      
      // Generate overall product pattern
      const overallProductPattern = {};
      allSales.forEach(sale => {
        if (sale.items) {
          sale.items.forEach(item => {
            if (!overallProductPattern[item.name]) {
              overallProductPattern[item.name] = { quantity: 0, revenue: 0 };
            }
            overallProductPattern[item.name].quantity += item.quantity;
            overallProductPattern[item.name].revenue += item.total;
          });
        }
      });
      
      const productPattern = Object.entries(overallProductPattern).map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        percentage: ((data.revenue / allSales.reduce((sum, sale) => sum + sale.total_amount, 0)) * 100).toFixed(1)
      }));
      
      return {
        data: {
          success: true,
          data: {
            salesHistory: allSales,
            productPattern
          }
        }
      };
    },
    
    getCommunication: async (id) => {
      const communicationLog = generateCommunicationLog(id);
      const customer = getStoredCustomers().find(c => c._id === id);
      
      return {
        data: {
          success: true,
          data: {
            communicationLog,
            customer
          }
        }
      };
    },
    
    getAlerts: async (id) => {
      const customerCollection = getStoredCustomers();
      const alerts = id ? generateAlerts(id) : customerCollection.flatMap(c => generateAlerts(c._id));
      
      return {
        data: {
          success: true,
          data: {
            alerts
          }
        }
      };
    },
    
    getAnalytics: async () => {
      const analytics = generateCustomerAnalytics();
      
      return {
        data: {
          success: true,
          data: analytics
        }
      };
    },
    
    getImportExport: async () => {
      const importExportData = generateImportExportData();
      
      return {
        data: {
          success: true,
          data: importExportData
        }
      };
    },
    
    getTagsAndSegments: async () => {
      const tagsAndSegments = generateTagsAndSegments();
      
      return {
        data: {
          success: true,
          data: tagsAndSegments
        }
      };
    },
    
    getDuePayments: async (id) => {
      const customerCollection = getStoredCustomers();
      const duePayments = id ? generateDuePayments(id) : customerCollection.flatMap(c => generateDuePayments(c._id));
      
      // Generate comprehensive analytics
      const totalAmount = duePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const overdueAmount = duePayments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);
      const upcomingAmount = duePayments.filter(p => p.status === 'upcoming').reduce((sum, payment) => sum + payment.amount, 0);
      
      // Status breakdown
      const statusBreakdown = {};
      duePayments.forEach(payment => {
        if (!statusBreakdown[payment.status]) {
          statusBreakdown[payment.status] = { count: 0, amount: 0 };
        }
        statusBreakdown[payment.status].count++;
        statusBreakdown[payment.status].amount += payment.amount;
      });
      
      // Priority breakdown
      const priorityBreakdown = {};
      duePayments.forEach(payment => {
        if (!priorityBreakdown[payment.priority]) {
          priorityBreakdown[payment.priority] = { count: 0, amount: 0 };
        }
        priorityBreakdown[payment.priority].count++;
        priorityBreakdown[payment.priority].amount += payment.amount;
      });
      
      // Monthly breakdown
      const monthlyBreakdown = {};
      duePayments.forEach(payment => {
        const month = new Date(payment.dueDate).toISOString().slice(0, 7);
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = { count: 0, amount: 0 };
        }
        monthlyBreakdown[month].count++;
        monthlyBreakdown[month].amount += payment.amount;
      });
      
      return {
        data: {
          success: true,
          data: {
            duePayments,
            summary: {
              totalAmount,
              overdueAmount,
              upcomingAmount,
              totalPayments: duePayments.length,
              statusBreakdown,
              priorityBreakdown,
              monthlyBreakdown,
              averageAmount: duePayments.length > 0 ? totalAmount / duePayments.length : 0
            }
          }
        }
      };
    },

    // Comprehensive unified customer data method
    getUnifiedCustomerData: async (id) => {
      const customer = getStoredCustomers().find(c => c._id === id);
      const ledger = generateCustomerLedger(id);
      const salesHistory = generateSalesHistory(id);
      const duePayments = generateDuePayments(id);
      const productPattern = generateProductPattern(id);
      const communicationLog = generateCommunicationLog(id);
      const alerts = generateAlerts(id);
      const analytics = generateCustomerAnalytics(id);
      
      // Cross-reference and connect data
      const unifiedData = {
        customer,
        ledger: ledger.map(entry => ({
          ...entry,
          // Link to corresponding sales if applicable
          relatedSale: salesHistory.find(sale => 
            sale.sale_id === entry.reference || 
            sale.items.some(item => entry.description.includes(item.name))
          ),
          // Link to corresponding due payment if applicable
          relatedPayment: duePayments.find(payment => 
            payment.description && entry.description.includes(payment.description)
          )
        })),
        salesHistory: salesHistory.map(sale => ({
          ...sale,
          // Link to corresponding ledger entry
          relatedLedgerEntry: ledger.find(entry => 
            entry.reference === sale.sale_id || 
            entry.description.includes(sale.items[0]?.name)
          ),
          // Link to corresponding due payment
          relatedPayment: duePayments.find(payment => 
            payment.description && payment.description.includes(sale.sale_id)
          )
        })),
        duePayments: duePayments.map(payment => ({
          ...payment,
          // Link to corresponding sales
          relatedSale: salesHistory.find(sale => 
            sale.sale_id === payment.description || 
            payment.description.includes(sale.items[0]?.name)
          ),
          // Link to corresponding ledger entry
          relatedLedgerEntry: ledger.find(entry => 
            entry.reference === payment.description || 
            entry.description.includes(payment.description)
          )
        })),
        productPattern,
        communicationLog,
        alerts,
        analytics: {
          ...analytics,
          // Enhanced analytics with cross-section data
          unifiedMetrics: {
            totalTransactions: ledger.length + salesHistory.length + duePayments.length,
            totalRevenue: salesHistory.reduce((sum, sale) => sum + sale.total_amount, 0),
            totalOutstanding: duePayments.reduce((sum, payment) => sum + payment.amount, 0),
            averageOrderValue: salesHistory.length > 0 ? 
              salesHistory.reduce((sum, sale) => sum + sale.total_amount, 0) / salesHistory.length : 0,
            paymentCompletionRate: salesHistory.length > 0 ? 
              (salesHistory.reduce((sum, sale) => sum + (sale.paid_amount || 0), 0) / 
               salesHistory.reduce((sum, sale) => sum + sale.total_amount, 0)) * 100 : 0,
            recentActivity: {
              ledgerEntries: ledger.filter(entry => {
                const entryDate = new Date(entry.date);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return entryDate >= thirtyDaysAgo;
              }).length,
              sales: salesHistory.filter(sale => {
                const saleDate = new Date(sale.sale_date);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return saleDate >= thirtyDaysAgo;
              }).length,
              payments: duePayments.filter(payment => {
                const paymentDate = new Date(payment.dueDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return paymentDate >= thirtyDaysAgo;
              }).length
            }
          }
        }
      };
      
      return {
        data: {
          success: true,
          data: unifiedData
        }
      };
    },
    
    create: async (data) => {
      const customerCollection = getStoredCustomers();
      const newCustomer = {
        _id: 'CUST_' + Date.now(),
        customer_id: 'CUST_' + Date.now(),
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistCustomers([newCustomer, ...customerCollection], {
        operation: 'create',
        customer: newCustomer,
      });
      return {
        data: {
          success: true,
          data: newCustomer
        }
      };
    },
    
    update: async (id, data) => {
      const customerCollection = [...getStoredCustomers()];
      const index = customerCollection.findIndex(c => c._id === id || c.customer_id === id);
      if (index !== -1) {
        customerCollection[index] = { 
          ...customerCollection[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
        persistCustomers(customerCollection, {
          operation: 'update',
          customer: customerCollection[index],
        });
      }
      return {
        data: {
          success: true,
          data: customerCollection[index]
        }
      };
    },
    
    delete: async (id) => {
      const customerCollection = [...getStoredCustomers()];
      const index = customerCollection.findIndex(c => c._id === id || c.customer_id === id);
      if (index !== -1) {
        const deleted = customerCollection.splice(index, 1)[0];
        persistCustomers(customerCollection, {
          operation: 'delete',
          customer: deleted,
        });
        return {
          data: {
            success: true,
            data: deleted
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Customer not found'
        }
      };
    }
  },

  // Contacts API
  contacts: {
    getAll: async (params = {}) => {
      let items = [...mockData.contacts];
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.first_name.toLowerCase().includes(searchLower) ||
          item.last_name.toLowerCase().includes(searchLower) ||
          item.email.toLowerCase().includes(searchLower) ||
          item.company.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.contact_type) {
        items = items.filter(item => item.contact_type === params.contact_type);
      }
      
      if (params.is_favorite) {
        items = items.filter(item => item.is_favorite);
      }
      
      return {
        data: {
          success: true,
          data: {
            contacts: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const contact = mockData.contacts.find(c => c._id === id || c.contact_id === id);
      return {
        data: {
          success: true,
          data: contact
        }
      };
    },
    
    create: async (data) => {
      const newContact = {
        _id: 'CONT_' + Date.now(),
        contact_id: data.contact_id || 'CONT_' + Date.now(),
        ...data,
        is_active: true,
        is_favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockData.contacts.push(newContact);
      return {
        data: {
          success: true,
          data: newContact
        }
      };
    },
    
    update: async (id, data) => {
      const index = mockData.contacts.findIndex(c => c._id === id || c.contact_id === id);
      if (index !== -1) {
        mockData.contacts[index] = { 
          ...mockData.contacts[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
      }
      return {
        data: {
          success: true,
          data: mockData.contacts[index]
        }
      };
    },
    
    toggleFavorite: async (id, isFavorite) => {
      const index = mockData.contacts.findIndex(c => c._id === id || c.contact_id === id);
      if (index !== -1) {
        mockData.contacts[index].is_favorite = isFavorite;
        mockData.contacts[index].updatedAt = new Date().toISOString();
      }
      return {
        data: {
          success: true,
          data: mockData.contacts[index]
        }
      };
    },
    
    delete: async (id) => {
      const index = mockData.contacts.findIndex(c => c._id === id || c.contact_id === id);
      if (index !== -1) {
        const deleted = mockData.contacts.splice(index, 1)[0];
        return {
          data: {
            success: true,
            data: deleted
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Contact not found'
        }
      };
    }
  },

  // Sales API
  sales: {
    getAll: async (params = {}) => {
      let items = [...mockData.sales];
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.customer_name.toLowerCase().includes(searchLower) ||
          item.sale_id.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.payment_status) {
        items = items.filter(item => item.payment_status === params.payment_status);
      }
      
      return {
        data: {
          success: true,
          data: {
            sales: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const sale = mockData.sales.find(s => s._id === id || s.sale_id === id);
      return {
        data: {
          success: true,
          data: sale
        }
      };
    }
  },

  // Purchases API
  purchases: {
    getAll: async (params = {}) => {
      ensureOperationalCollections();
      let items = [...mockData.purchases];
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.supplier_name.toLowerCase().includes(searchLower) ||
          item.purchase_id.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
      }
      
      return {
        data: {
          success: true,
          data: {
            purchases: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const purchase = mockData.purchases.find(p => p._id === id || p.purchase_id === id);
      return {
        data: {
          success: true,
          data: purchase
        }
      };
    },

    updateStatus: async (id, status) => {
      const index = mockData.purchases.findIndex(p => p._id === id);
      if (index === -1) {
        throw new Error('Purchase not found');
      }

      const previousPurchase = mockData.purchases[index];
      const nextPurchase = {
        ...mockData.purchases[index],
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'returned') {
        nextPurchase.return_date = new Date().toISOString();
        nextPurchase.payment_status = nextPurchase.payment_status === 'paid' ? 'refunded' : nextPurchase.payment_status;
      }

      mockData.purchases[index] = nextPurchase;

      if (previousPurchase.status !== 'received' && status === 'received') {
        applyPurchaseInventoryImpact(nextPurchase, 1);
      }

      if (previousPurchase.status === 'received' && status === 'returned') {
        applyPurchaseInventoryImpact(nextPurchase, -1);
      }

      syncPurchaseTransaction(nextPurchase);
      
      return {
        data: {
          success: true,
          data: nextPurchase
        }
      };
    },

    delete: async (id) => {
      const index = mockData.purchases.findIndex(p => p._id === id);
      if (index === -1) {
        throw new Error('Purchase not found');
      }
      
      const deletedPurchase = mockData.purchases.splice(index, 1)[0];
      removeTransactionByOrderId(deletedPurchase.purchase_id);
      
      return {
        data: {
          success: true,
          data: deletedPurchase
        }
      };
    },

    create: async (data) => {
      ensureOperationalCollections();
      const supplier = mockData.suppliers?.find((item) => item._id === data.supplier);
      const newPurchase = {
        _id: `PURCH_${Date.now()}`,
        purchase_id: `PURCH_${Date.now()}`,
        ...data,
        supplier_id: data.supplier,
        supplier_name: supplier?.company_name || supplier?.name || 'Unknown Supplier',
        purchase_date: data.purchase_date || new Date().toISOString(),
        payment_status: data.payment_status || 'pending',
        payment_method: data.payment_method || 'bank_transfer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockData.purchases.unshift(newPurchase);
      syncPurchaseTransaction(newPurchase);
      
      return {
        data: {
          success: true,
          data: newPurchase
        }
      };
    }
  },

  // Sales API
  sales: {
    getAll: async (params = {}) => {
      ensureSalesCollections();
      console.log('Sales API called with params:', params);
      let items = [...mockData.sales];
      console.log('Total sales data available:', items.length);
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.customer_name.toLowerCase().includes(searchLower) ||
          item.sale_id.toLowerCase().includes(searchLower)
        );
        console.log('After search filter:', items.length);
      }
      
      if (params.status && params.status !== 'all') {
        items = items.filter(item => item.status === params.status);
        console.log('After status filter:', items.length);
      }
      
      if (params.startDate && params.endDate) {
        items = items.filter(item => {
          const saleDate = new Date(item.sale_date);
          const start = new Date(params.startDate);
          const end = new Date(params.endDate);
          return saleDate >= start && saleDate <= end;
        });
        console.log('After date filter:', items.length);
      }

      const result = {
        data: {
          success: true,
          data: {
            sales: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
      console.log('Sales API returning:', result);
      return result;
    },
    
    getById: async (id) => {
      const sale = mockData.sales.find(s => s._id === id || s.sale_id === id);
      return {
        data: {
          success: true,
          data: sale
        }
      };
    },
    
    create: async (data) => {
      const newSale = normalizeSaleRecord(data);
      applySaleInventoryImpact(newSale);
      mockData.sales.unshift(newSale);

      const createdInvoice = buildInvoiceFromSale(newSale);
      mockData.invoices.unshift(createdInvoice);

      if (newSale.payment_status === 'paid' || newSale.payment_status === 'partial') {
        mockData.payments.unshift(buildPaymentFromSale(newSale, createdInvoice));
      }

      syncInvoicesAndPayments();
      regenerateSalesReports();
      
      return {
        data: {
          success: true,
          data: newSale
        }
      };
    },
    
    updateStatus: async (id, status) => {
      const index = mockData.sales.findIndex(s => s._id === id);
      if (index === -1) {
        throw new Error('Sale not found');
      }
      
      mockData.sales[index] = {
        ...mockData.sales[index],
        status,
        updated_at: new Date().toISOString()
      };

      regenerateSalesReports();
      
      return {
        data: {
          success: true,
          data: mockData.sales[index]
        }
      };
    },
    
    update: async (id, data) => {
      ensureSalesCollections();
      const index = mockData.sales.findIndex(s => s._id === id || s.sale_id === id);
      if (index === -1) {
        throw new Error('Sale not found');
      }
      
      mockData.sales[index] = {
        ...mockData.sales[index],
        ...data,
        updated_at: new Date().toISOString()
      };

      regenerateSalesReports();
      
      return {
        data: {
          success: true,
          data: mockData.sales[index]
        }
      };
    },
    
    delete: async (id) => {
      const index = mockData.sales.findIndex(s => s._id === id);
      if (index === -1) {
        throw new Error('Sale not found');
      }
      
      const deletedSale = mockData.sales.splice(index, 1)[0];
      mockData.invoices = mockData.invoices.filter((invoice) => invoice.sale_id !== deletedSale.sale_id);
      mockData.payments = mockData.payments.filter((payment) => payment.sale_id !== deletedSale.sale_id);
      syncInvoicesAndPayments();
      regenerateSalesReports();
      
      return {
        data: {
          success: true,
          data: deletedSale
        }
      };
    }
  },

  // Stock Transfers API
  stockTransfers: {
    getAll: async (params = {}) => {
      let items = [...mockData.stockTransfers];
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
      }
      
      return {
        data: {
          success: true,
          data: {
            transfers: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const transfer = mockData.stockTransfers.find(t => t._id === id || t.transfer_id === id);
      return {
        data: {
          success: true,
          data: transfer
        }
      };
    },

    delete: async (id) => {
      const index = mockData.stockTransfers.findIndex(t => t._id === id || t.transfer_id === id);
      if (index > -1) {
        mockData.stockTransfers.splice(index, 1);
        return {
          data: {
            success: true,
            message: 'Transfer deleted successfully'
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Transfer not found'
        }
      };
    },

    create: async (transferData) => {
      const newTransfer = {
        _id: `TRANS_${String(mockData.stockTransfers.length + 1).padStart(3, '0')}`,
        transfer_id: `TRF-${new Date().getFullYear()}-${String(mockData.stockTransfers.length + 1).padStart(3, '0')}`,
        ...transferData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockData.stockTransfers.push(newTransfer);
      return {
        data: {
          success: true,
          data: newTransfer
        }
      };
    },

    update: async (id, updateData) => {
      const index = mockData.stockTransfers.findIndex(t => t._id === id || t.transfer_id === id);
      if (index > -1) {
        mockData.stockTransfers[index] = {
          ...mockData.stockTransfers[index],
          ...updateData,
          updated_at: new Date().toISOString()
        };
        return {
          data: {
            success: true,
            data: mockData.stockTransfers[index]
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Transfer not found'
        }
      };
    },

    updateStatus: async (id, status) => {
      const index = mockData.stockTransfers.findIndex(t => t._id === id || t.transfer_id === id);
      if (index > -1) {
        const transfer = mockData.stockTransfers[index];
        const statusHistory = transfer.status_history || [];
        
        // Add status change to history
        statusHistory.push({
          status: status,
          changed_at: new Date().toISOString(),
          changed_by: 'Current User', // In real app, this would be the logged-in user
          notes: `Status changed from ${transfer.status} to ${status}`
        });

        mockData.stockTransfers[index] = {
          ...transfer,
          status: status,
          status_history: statusHistory,
          updated_at: new Date().toISOString()
        };

        // Update date based on status
        if (status === 'completed') {
          mockData.stockTransfers[index].completed_date = new Date().toISOString();
        } else if (status === 'cancelled') {
          mockData.stockTransfers[index].cancelled_date = new Date().toISOString();
        }

        return {
          data: {
            success: true,
            data: mockData.stockTransfers[index],
            message: `Transfer status updated to ${status}`
          }
        };
      }
      return {
        data: {
          success: false,
          message: 'Transfer not found'
        }
      };
    }
  },

  // Expenses API
  expenses: {
    getAll: async (params = {}) => {
      console.log('=== EXPENSES API DEBUG ===');
      console.log('Mock data expenses:', mockData.expenses);
      console.log('Params received:', params);
      
      // Force load expenses if mockData.expenses is empty
      let items = [...(mockData.expenses || [])];
      
      // If still empty, create fallback expenses
      if (items.length === 0) {
        console.log('No expenses found in mockData, creating fallback expenses');
        items = [
          {
            "_id": "EXP_FALLBACK_1",
            "expense_id": "EXP_FALLBACK_1",
            "category": "utilities",
            "description": "Electricity bill - fallback data",
            "amount": 2500,
            "expense_date": "2024-04-01T00:00:00Z",
            "payment_method": "bank_transfer",
            "status": "paid",
            "receipt_url": "https://example.com/receipts/electricity.pdf",
            "notes": "Monthly electricity bill",
            "created_at": "2024-04-01T10:00:00Z",
            "updated_at": "2024-04-01T10:00:00Z"
          },
          {
            "_id": "EXP_FALLBACK_2",
            "expense_id": "EXP_FALLBACK_2",
            "category": "rent",
            "description": "Office rent - fallback data",
            "amount": 5000,
            "expense_date": "2024-04-01T00:00:00Z",
            "payment_method": "bank_transfer",
            "status": "paid",
            "receipt_url": "https://example.com/receipts/rent.pdf",
            "notes": "Monthly office rent",
            "created_at": "2024-04-01T10:00:00Z",
            "updated_at": "2024-04-01T10:00:00Z"
          }
        ];
      }
      
      console.log('Items count after fallback check:', items.length);
      
      if (params.category) {
        items = items.filter(item => item.category === params.category);
        console.log('After category filter:', items.length);
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
        console.log('After status filter:', items.length);
      }
      
      const result = {
        data: {
          success: true,
          data: {
            expenses: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
      
      console.log('Final result:', result);
      console.log('=== END EXPENSES API DEBUG ===');
      
      return result;
    },
    
    getById: async (id) => {
      const expense = mockData.expenses.find(e => e._id === id || e.expense_id === id);
      return {
        data: {
          success: true,
          data: expense
        }
      };
    },
    
    create: async (data) => {
      const newExpense = {
        _id: `EXP_${Date.now()}`,
        expense_id: `EXP_${Date.now()}`,
        category: data.category || 'other',
        description: data.description || 'New expense',
        amount: Number(data.amount) || 0,
        expense_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        payment_method: data.payment_method || 'cash',
        status: data.status || 'paid',
        receipt_url: data.receipt_url || '',
        notes: data.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to mock data
      mockData.expenses.unshift(newExpense);
      
      return {
        data: {
          success: true,
          data: newExpense,
          message: 'Expense created successfully'
        }
      };
    },
    
    getCategories: async () => {
      const categories = [
        { value: 'utilities', label: 'Utilities' },
        { value: 'rent', label: 'Rent' },
        { value: 'office_supplies', label: 'Office Supplies' },
        { value: 'travel', label: 'Travel' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'software', label: 'Software' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'training', label: 'Training' },
        { value: 'telecommunications', label: 'Telecommunications' },
        { value: 'fuel', label: 'Fuel' },
        { value: 'legal', label: 'Legal' },
        { value: 'cleaning', label: 'Cleaning' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'advertising', label: 'Advertising' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'security', label: 'Security' },
        { value: 'transportation', label: 'Transportation' },
        { value: 'meals', label: 'Meals' },
        { value: 'accommodation', label: 'Accommodation' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'licenses', label: 'Licenses' },
        { value: 'subscriptions', label: 'Subscriptions' },
        { value: 'taxes', label: 'Taxes' },
        { value: 'banking', label: 'Banking' },
        { value: 'shipping', label: 'Shipping' },
        { value: 'postage', label: 'Postage' },
        { value: 'other', label: 'Other' }
      ];
      
      return {
        data: {
          success: true,
          data: {
            categories: categories
          }
        }
      };
    }
  },

  // Payment Accounts API
  paymentAccounts: {
    getAll: async () => {
      return {
        data: {
          success: true,
          data: {
            accounts: mockData.paymentAccounts,
            total: mockData.paymentAccounts.length
          }
        }
      };
    },
    
    getById: async (id) => {
      const account = mockData.paymentAccounts.find(a => a._id === id || a.account_id === id);
      return {
        data: {
          success: true,
          data: account
        }
      };
    },
    
    create: async (data) => {
      console.log('Creating payment account:', data);
      
      const newAccount = {
        _id: `ACC_${Date.now()}`,
        account_id: `ACC_${Date.now()}`,
        name: data.name,
        account_type: data.account_type,
        opening_balance: parseFloat(data.opening_balance) || 0,
        current_balance: parseFloat(data.opening_balance) || 0,
        bank_name: data.bank_name || '',
        bank_branch: data.bank_branch || '',
        account_number: data.account_number || '',
        upi_id: data.upi_id || '',
        card_number: data.card_number || '',
        card_type: data.card_type || 'credit',
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_transaction: null
      };
      
      // Add to mock data
      if (!mockData.paymentAccounts) {
        mockData.paymentAccounts = [];
      }
      mockData.paymentAccounts.unshift(newAccount);
      
      console.log('Payment account created successfully:', newAccount);
      console.log('Total accounts after creation:', mockData.paymentAccounts.length);
      
      return {
        data: {
          success: true,
          data: newAccount,
          message: 'Payment account created successfully'
        }
      };
    },
    
    createTransaction: async (data) => {
      console.log('Creating transaction:', data);
      
      const newTransaction = {
        _id: `TXN_${Date.now()}`,
        transaction_id: `TXN_${Date.now()}`,
        from_account: data.from_account,
        to_account: data.to_account || null,
        amount: parseFloat(data.amount) || 0,
        transaction_type: data.transaction_type,
        description: data.description || '',
        transaction_date: data.transaction_date || new Date().toISOString(),
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to mock transactions
      if (!mockData.paymentTransactions) {
        mockData.paymentTransactions = [];
      }
      mockData.paymentTransactions.unshift(newTransaction);
      
      // Update account balances
      if (data.from_account) {
        const fromAccount = mockData.paymentAccounts.find(a => a._id === data.from_account);
        if (fromAccount) {
          if (data.transaction_type === 'deposit') {
            fromAccount.current_balance += parseFloat(data.amount) || 0;
          } else if (data.transaction_type === 'withdraw') {
            fromAccount.current_balance -= parseFloat(data.amount) || 0;
          } else if (data.transaction_type === 'transfer' && data.to_account) {
            fromAccount.current_balance -= parseFloat(data.amount) || 0;
            
            const toAccount = mockData.paymentAccounts.find(a => a._id === data.to_account);
            if (toAccount) {
              toAccount.current_balance += parseFloat(data.amount) || 0;
              toAccount.last_transaction = {
                date: data.transaction_date,
                amount: parseFloat(data.amount),
                type: 'credit'
              };
            }
          }
          
          fromAccount.last_transaction = {
            date: data.transaction_date,
            amount: parseFloat(data.amount),
            type: data.transaction_type === 'deposit' ? 'credit' : 'debit'
          };
          fromAccount.updated_at = new Date().toISOString();
        }
      }
      
      console.log('Transaction created successfully:', newTransaction);
      
      return {
        data: {
          success: true,
          data: newTransaction,
          message: 'Transaction completed successfully'
        }
      };
    },
    
    getTransactions: async (dateRange) => {
      let transactions = mockData.paymentTransactions || [];
      
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        transactions = transactions.filter(txn => {
          const txnDate = new Date(txn.transaction_date);
          return txnDate >= start && txnDate <= end;
        });
      }
      
      return {
        data: {
          success: true,
          data: {
            transactions: transactions,
            total: transactions.length
          }
        }
      };
    },
    
    updateTransaction: async (data) => {
      console.log('Updating transaction:', data);
      const { id, ...updateData } = data;
      const index = mockData.paymentTransactions.findIndex(txn => txn._id === id);
      
      if (index > -1) {
        // Store old transaction for balance reversal
        const oldTransaction = mockData.paymentTransactions[index];
        
        // Reverse old transaction effects on balances
        const fromAccount = mockData.paymentAccounts.find(acc => acc._id === oldTransaction.from_account);
        if (fromAccount) {
          if (oldTransaction.transaction_type === 'deposit') {
            fromAccount.current_balance -= oldTransaction.amount;
          } else if (oldTransaction.transaction_type === 'withdraw') {
            fromAccount.current_balance += oldTransaction.amount;
          } else if (oldTransaction.transaction_type === 'transfer' && oldTransaction.to_account) {
            fromAccount.current_balance += oldTransaction.amount;
            const toAccount = mockData.paymentAccounts.find(acc => acc._id === oldTransaction.to_account);
            if (toAccount) {
              toAccount.current_balance -= oldTransaction.amount;
            }
          }
        }
        
        // Update transaction
        mockData.paymentTransactions[index] = {
          ...mockData.paymentTransactions[index],
          ...updateData,
          amount: parseFloat(updateData.amount) || mockData.paymentTransactions[index].amount,
          transaction_date: updateData.transaction_date ? new Date(updateData.transaction_date).toISOString() : mockData.paymentTransactions[index].transaction_date,
          updated_at: new Date().toISOString()
        };
        
        // Apply new transaction effects on balances
        const newTransaction = mockData.paymentTransactions[index];
        if (fromAccount) {
          if (newTransaction.transaction_type === 'deposit') {
            fromAccount.current_balance += newTransaction.amount;
          } else if (newTransaction.transaction_type === 'withdraw') {
            fromAccount.current_balance -= newTransaction.amount;
          } else if (newTransaction.transaction_type === 'transfer' && newTransaction.to_account) {
            fromAccount.current_balance -= newTransaction.amount;
            const toAccount = mockData.paymentAccounts.find(acc => acc._id === newTransaction.to_account);
            if (toAccount) {
              toAccount.current_balance += newTransaction.amount;
            }
          }
          fromAccount.updated_at = new Date().toISOString();
        }
        
        console.log('Transaction updated successfully:', mockData.paymentTransactions[index]);
        
        return {
          data: {
            success: true,
            data: mockData.paymentTransactions[index],
            message: 'Transaction updated successfully'
          }
        };
      } else {
        return {
          data: {
            success: false,
            message: 'Transaction not found'
          }
        };
      }
    }
  },

  // AI Insights API
  aiInsights: {
    getAll: async (params = {}) => {
      let items = [...mockData.aiInsights];
      
      if (params.category) {
        items = items.filter(item => item.category === params.category);
      }
      
      if (params.priority) {
        items = items.filter(item => item.priority === params.priority);
      }
      
      return {
        data: {
          success: true,
          data: {
            insights: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
    },
    
    getById: async (id) => {
      const insight = mockData.aiInsights.find(i => i._id === id || i.insight_id === id);
      return {
        data: {
          success: true,
          data: insight
        }
      };
    }
  },

  // Alerts API
  alerts: {
    getAll: async (params = {}) => {
      // Filter only stock-related alerts (low_stock and out_of_stock)
      let items = mockData.alerts.filter(alert => 
        alert.alert_type === 'low_stock' || 
        alert.alert_type === 'out_of_stock'
      );
      
      console.log('Stock Alerts API called with params:', params);
      console.log('Total stock alerts:', items.length);
      console.log('Sample stock alert data:', items[0]);
      
      if (params.severity) {
        items = items.filter(item => item.severity === params.severity);
        console.log('After severity filter:', items.length);
      }
      
      if (params.module) {
        items = items.filter(item => item.module === params.module);
        console.log('After module filter:', items.length);
      }
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        items = items.filter(item => 
          item.title?.toLowerCase().includes(searchLower) ||
          item.message?.toLowerCase().includes(searchLower) ||
          item.alert_type?.toLowerCase().includes(searchLower)
        );
        console.log('After search filter:', items.length);
      }
      
      if (params.status) {
        items = items.filter(item => item.status === params.status);
        console.log('After status filter:', items.length);
      }
      
      if (params.type) {
        items = items.filter(item => item.alert_type === params.type);
        console.log('After type filter:', items.length);
      }
      
      console.log('Final filtered stock alerts count:', items.length);
      console.log('Final stock alerts sample:', items.slice(0, 3));
      
      const response = {
        data: {
          success: true,
          data: {
            alerts: items,
            total: items.length,
            page: 1,
            totalPages: 1
          }
        }
      };
      
      console.log('API Response:', response);
      return response;
    },
    
    getById: async (id) => {
      const alert = mockData.alerts.find(a => a._id === id || a.alert_id === id);
      return {
        data: {
          success: true,
          data: alert
        }
      };
    },

    create: async (alertData) => {
      const newAlert = {
        _id: `ALT_${Date.now()}`,
        alert_id: `ALT_${Date.now()}`,
        ...alertData,
        is_active: true,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      mockData.alerts.unshift(newAlert);

      return {
        data: {
          success: true,
          data: newAlert
        }
      };
    },

    acknowledge: async (id) => {
      const alert = mockData.alerts.find(a => a._id === id || a.alert_id === id);
      if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledged_at = new Date().toISOString();
      }

      return {
        data: {
          success: true,
          data: alert
        }
      };
    },

    resolve: async (id) => {
      const alert = mockData.alerts.find(a => a._id === id || a.alert_id === id);
      if (alert) {
        alert.status = 'resolved';
        alert.resolved_at = new Date().toISOString();
      }

      return {
        data: {
          success: true,
          data: alert
        }
      };
    },

    getRealTimeAlerts: async () => {
      console.log('Generating real-time stock alerts based on actual inventory data...');
      
      // Generate alerts based on actual product stock levels
      const currentTime = new Date();
      const recentStockAlerts = mockData.alerts.filter(alert => {
        const alertTime = new Date(alert.created_at);
        const timeDiff = (currentTime - alertTime) / 1000 / 60; // minutes
        return timeDiff <= 30 && (alert.alert_type === 'low_stock' || alert.alert_type === 'out_of_stock'); // Last 30 minutes, stock alerts only
      });

      // Generate alerts based on actual inventory data
      const newStockAlerts = [];
      const existingAlertIds = new Set(mockData.alerts.map(alert => alert.reference_id));
      
      // Check each product for stock issues
      mockData.products.forEach(product => {
        const isOutOfStock = product.quantity === 0;
        const isLowStock = product.quantity <= product.reorderPoint && product.quantity > 0;
        
        // Only create alert if it doesn't already exist for this product
        const productAlertKey = product._id;
        const hasExistingAlert = existingAlertIds.has(productAlertKey);
        
        if (!hasExistingAlert) {
          if (isOutOfStock) {
            const newAlert = {
              _id: `ALT_${Date.now()}_${product._id}`,
              alert_id: `ALT_${Date.now()}_${product._id}`,
              title: `Critical: Out of Stock`,
              message: `Product "${product.name}" is completely out of stock. Immediate action required.`,
              alert_type: 'out_of_stock',
              severity: 'critical',
              module: 'inventory',
              reference_id: product._id,
              reference_type: 'product',
              is_active: true,
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
              status: 'active'
            };
            newStockAlerts.push(newAlert);
            mockData.alerts.unshift(newAlert);
          } else if (isLowStock) {
            const newAlert = {
              _id: `ALT_${Date.now()}_${product._id}`,
              alert_id: `ALT_${Date.now()}_${product._id}`,
              title: `Low Stock Alert`,
              message: `Product "${product.name}" is running low on stock (${product.quantity} units remaining). Reorder point: ${product.reorderPoint}.`,
              alert_type: 'low_stock',
              severity: product.quantity <= product.reorderPoint / 2 ? 'critical' : 'high',
              module: 'inventory',
              reference_id: product._id,
              reference_type: 'product',
              is_active: true,
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
              status: 'active'
            };
            newStockAlerts.push(newAlert);
            mockData.alerts.unshift(newAlert);
          }
        }
      });

      // Remove alerts for products that are no longer in stock issue
      mockData.alerts = mockData.alerts.filter(alert => {
        if (alert.module === 'inventory' && alert.reference_type === 'product') {
          const product = mockData.products.find(p => p._id === alert.reference_id);
          if (product) {
            const isOutOfStock = product.quantity === 0;
            const isLowStock = product.quantity <= product.reorderPoint && product.quantity > 0;
            // Keep alert if product still has stock issues
            return isOutOfStock || isLowStock;
          }
          return false; // Remove alert if product no longer exists
        }
        return true; // Keep non-inventory alerts (though we only have stock alerts now)
      });

      // Combine recent alerts with new alerts
      const allRealTimeStockAlerts = [...newStockAlerts, ...recentStockAlerts];

      // Calculate stats
      const stats = {
        total: allRealTimeStockAlerts.length,
        critical: allRealTimeStockAlerts.filter(a => a.severity === 'critical').length,
        high: allRealTimeStockAlerts.filter(a => a.severity === 'high').length,
        warning: allRealTimeStockAlerts.filter(a => a.severity === 'warning').length,
        info: allRealTimeStockAlerts.filter(a => a.severity === 'info').length,
        new: newStockAlerts.length,
        outOfStock: mockData.products.filter(p => p.quantity === 0).length,
        lowStock: mockData.products.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length
      };

      console.log('Real-time stock alerts generated:', { 
        stats, 
        newStockAlerts: newStockAlerts.length,
        totalProducts: mockData.products.length,
        outOfStockProducts: stats.outOfStock,
        lowStockProducts: stats.lowStock
      });

      return {
        data: {
          success: true,
          data: {
            alerts: allRealTimeStockAlerts,
            stats: stats,
            timestamp: new Date().toISOString(),
            real_time: true,
            inventory_summary: {
              total_products: mockData.products.length,
              out_of_stock: stats.outOfStock,
              low_stock: stats.lowStock,
              healthy_stock: mockData.products.length - stats.outOfStock - stats.lowStock
            }
          }
        }
      };
    },

    getAlertStats: async () => {
      const alerts = mockData.alerts;
      const currentTime = new Date();
      
      // Calculate comprehensive alert statistics
      const stats = {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
        
        // Time-based statistics
        lastHour: alerts.filter(a => {
          const alertTime = new Date(a.created_at);
          const timeDiff = (currentTime - alertTime) / 1000 / 60 / 60; // hours
          return timeDiff <= 1;
        }).length,
        
        last24Hours: alerts.filter(a => {
          const alertTime = new Date(a.created_at);
          const timeDiff = (currentTime - alertTime) / 1000 / 60 / 60; // hours
          return timeDiff <= 24;
        }).length,
        
        last7Days: alerts.filter(a => {
          const alertTime = new Date(a.created_at);
          const timeDiff = (currentTime - alertTime) / 1000 / 60 / 60 / 24; // days
          return timeDiff <= 7;
        }).length,
        
        // Module distribution
        byModule: alerts.reduce((acc, alert) => {
          const module = alert.module || 'unknown';
          acc[module] = (acc[module] || 0) + 1;
          return acc;
        }, {}),
        
        // Type distribution
        byType: alerts.reduce((acc, alert) => {
          const type = alert.alert_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        
        // Resolution metrics
        resolutionRate: alerts.length > 0 ? ((alerts.filter(a => a.status === 'resolved').length / alerts.length) * 100).toFixed(2) : 0,
        acknowledgmentRate: alerts.length > 0 ? ((alerts.filter(a => a.status === 'acknowledged').length / alerts.length) * 100).toFixed(2) : 0,
        
        // Average resolution time (for resolved alerts)
        avgResolutionTime: (() => {
          const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolved_at);
          if (resolvedAlerts.length === 0) return 0;
          
          const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
            const created = new Date(alert.created_at);
            const resolved = new Date(alert.resolved_at);
            return sum + (resolved - created) / 1000 / 60; // minutes
          }, 0);
          
          return Math.round(totalResolutionTime / resolvedAlerts.length);
        })()
      };

      return {
        data: {
          success: true,
          data: stats
        }
      };
    }
  }
};

// Export API services
const inventoryAPI = mockApi.inventory;
const categoriesAPI = mockApi.categories;
const customersAPI = mockApi.customers;
const contactsAPI = mockApi.contacts;
const salesAPI = mockApi.sales;
const purchasesAPI = mockApi.purchases;
const stockTransfersAPI = mockApi.stockTransfers;
const expensesAPI = mockApi.expenses;
const paymentAccountsAPI = mockApi.paymentAccounts;
const aiInsightsAPI = mockApi.aiInsights;
const alertsAPI = mockApi.alerts;
const assetsAPI = mockApi.assets; // Dedicated assets API
const suppliersAPI = {
  getAll: mockApi.getSuppliers.bind(mockApi),
  getById: mockApi.getSupplierById.bind(mockApi),
  create: mockApi.createSupplier.bind(mockApi),
  update: mockApi.updateSupplier.bind(mockApi),
  delete: mockApi.deleteSupplier.bind(mockApi)
};
const DEFAULT_CATEGORY_SEEDS = [
  {
    name: 'Networking',
    description: 'Routers, switches, access points, and network accessories',
    code: 'NET',
    color: '#0EA5E9',
  },
  {
    name: 'Office Supplies',
    description: 'Daily office consumables, stationery, and desk essentials',
    code: 'OFF',
    color: '#14B8A6',
  },
  {
    name: 'Packaging',
    description: 'Boxes, tapes, labels, wraps, and shipment packaging material',
    code: 'PKG',
    color: '#F97316',
  },
  {
    name: 'Warehouse Tools',
    description: 'Operational tools and handling equipment used in warehouse workflows',
    code: 'WHT',
    color: '#6366F1',
  },
  {
    name: 'Safety Equipment',
    description: 'Protective gear, signage, and emergency-response stock',
    code: 'SAFE',
    color: '#EF4444',
  },
];

const createMetadataId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const buildCategoryCode = (name = '') =>
  name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 10);

const flattenCategoryNodes = (categories = []) =>
  categories.flatMap((category) => [
    category,
    ...(Array.isArray(category.children) ? flattenCategoryNodes(category.children) : []),
  ]);

const normalizeCategoryItem = (category, index = 0) => {
  const name = category?.name || category?.title || `Category ${index + 1}`;
  return {
    _id: category?._id || category?.id || createMetadataId('CAT'),
    id: category?.id || index + 1,
    name,
    description: category?.description || '',
    code: category?.code || buildCategoryCode(name),
    color: category?.color || '#3B82F6',
    icon: category?.icon || 'TagIcon',
    status: category?.status || 'active',
    product_count: category?.product_count || 0,
    created_at: category?.created_at || category?.createdAt || new Date().toISOString(),
    updated_at: category?.updated_at || category?.updatedAt || new Date().toISOString(),
    createdAt: category?.createdAt || category?.created_at || new Date().toISOString(),
    updatedAt: category?.updatedAt || category?.updated_at || new Date().toISOString(),
  };
};

const upsertTopLevelCategory = (category) => {
  if (!Array.isArray(mockData.categories)) {
    mockData.categories = [];
  }

  const existingIndex = mockData.categories.findIndex(
    (item) => item._id === category._id || item.name?.toLowerCase() === category.name?.toLowerCase()
  );

  if (existingIndex >= 0) {
    mockData.categories[existingIndex] = {
      ...mockData.categories[existingIndex],
      ...category,
    };
    return mockData.categories[existingIndex];
  }

  mockData.categories.push(category);
  return category;
};

const updateNestedCategory = (categories, id, updater) =>
  categories.map((category) => {
    if (category._id === id || category.id === id) {
      return updater(category);
    }

    if (Array.isArray(category.children) && category.children.length > 0) {
      return {
        ...category,
        children: updateNestedCategory(category.children, id, updater),
      };
    }

    return category;
  });

const removeNestedCategory = (categories, id) =>
  categories
    .filter((category) => category._id !== id && category.id !== id)
    .map((category) => ({
      ...category,
      children: Array.isArray(category.children) ? removeNestedCategory(category.children, id) : category.children,
    }));

const ensureMockCategoriesDataset = () => {
  const currentCategories = Array.isArray(mockData.categories) ? mockData.categories : [];
  const flattenedExisting = flattenCategoryNodes(currentCategories).map(normalizeCategoryItem);
  const productCategoryNames = [...new Set((mockData.products || []).map((product) => product.category).filter(Boolean))];

  const productDerived = productCategoryNames.map((name) =>
    normalizeCategoryItem({
      name,
      description: `Inventory category used by ${name} products`,
      code: buildCategoryCode(name),
    })
  );

  const seeded = DEFAULT_CATEGORY_SEEDS.map((category) => normalizeCategoryItem(category));
  const mergedMap = new Map();

  [...flattenedExisting, ...productDerived, ...seeded].forEach((category, index) => {
    const normalized = normalizeCategoryItem(category, index);
    const key = normalized.name.toLowerCase();
    const current = mergedMap.get(key);
    mergedMap.set(key, {
      ...(current || {}),
      ...normalized,
      product_count: (mockData.products || []).filter((product) => product.category === normalized.name).length,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  const normalizedCategories = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  mockData.categories = normalizedCategories;
  return normalizedCategories;
};

const metadataAPI = {
  // Categories
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      const categories = ensureMockCategoriesDataset();
      return {
        data: {
          success: true,
          data: {
            categories,
            total: categories.length
          }
        }
      };
    }
  },

  createCategory: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      const categories = ensureMockCategoriesDataset();
      const newCategory = normalizeCategoryItem({
        ...payload,
        _id: createMetadataId('CAT'),
        id: categories.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      upsertTopLevelCategory(newCategory);

      return {
        data: {
          success: true,
          data: { category: newCategory }
        }
      };
    }
  },

  updateCategory: async (id, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      const categories = ensureMockCategoriesDataset();
      const current = categories.find((category) => category._id === id || category.id === id);
      const oldName = current?.name;
      const updatedCategory = normalizeCategoryItem({
        ...current,
        ...payload,
        _id: current?._id || id,
        updated_at: new Date().toISOString(),
      });

      mockData.categories = updateNestedCategory(mockData.categories, id, () => updatedCategory);

      if (oldName && payload.name && oldName !== payload.name) {
        (mockData.products || []).forEach((product) => {
          if (product.category === oldName) {
            product.category = payload.name;
          }
        });
      }

      ensureMockCategoriesDataset();

      return {
        data: {
          success: true,
          data: { category: updatedCategory }
        }
      };
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      const categories = ensureMockCategoriesDataset();
      const categoryToDelete = categories.find((category) => category._id === id || category.id === id);

      mockData.categories = removeNestedCategory(mockData.categories, id);

      if (categoryToDelete?.name) {
        (mockData.products || []).forEach((product) => {
          if (product.category === categoryToDelete.name) {
            product.category = 'Uncategorized';
          }
        });
      }

      ensureMockCategoriesDataset();

      return {
        data: {
          success: true,
          message: 'Category deleted successfully'
        }
      };
    }
  },
  
  // Brands
  getBrands: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/brands`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Fallback to mock data
      const brands = [...new Set(mockData.products.map(p => p.brand))];
      return {
        data: {
          success: true,
          data: brands
        }
      };
    }
  },
  
  // Units
  getUnits: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/units`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Fallback to mock data
      const units = [
        { _id: 'unit_001', name: 'pieces', short_name: 'pcs', description: 'Individual items or pieces', allow_decimal: false },
        { _id: 'unit_002', name: 'kg', short_name: 'kg', description: 'Kilograms - metric weight unit', allow_decimal: true },
        { _id: 'unit_003', name: 'liters', short_name: 'L', description: 'Liters - metric volume unit', allow_decimal: true },
        { _id: 'unit_004', name: 'meters', short_name: 'm', description: 'Meters - metric length unit', allow_decimal: true },
        { _id: 'unit_005', name: 'boxes', short_name: 'bx', description: 'Cardboard boxes for packaging', allow_decimal: false },
        { _id: 'unit_006', name: 'packs', short_name: 'pk', description: 'Packaged items or bundles', allow_decimal: false },
        { _id: 'unit_007', name: 'sets', short_name: 'set', description: 'Complete sets of items', allow_decimal: false },
        { _id: 'unit_008', name: 'pairs', short_name: 'pr', description: 'Pairs of items', allow_decimal: false },
        { _id: 'unit_009', name: 'grams', short_name: 'g', description: 'Grams - small metric weight unit', allow_decimal: true },
        { _id: 'unit_010', name: 'ounces', short_name: 'oz', description: 'Ounces - imperial weight unit', allow_decimal: true },
        { _id: 'unit_011', name: 'pounds', short_name: 'lb', description: 'Pounds - imperial weight unit', allow_decimal: true },
        { _id: 'unit_012', name: 'tons', short_name: 't', description: 'Tons - large weight unit', allow_decimal: true },
        { _id: 'unit_013', name: 'milliliters', short_name: 'mL', description: 'Milliliters - small metric volume unit', allow_decimal: true },
        { _id: 'unit_014', name: 'gallons', short_name: 'gal', description: 'Gallons - imperial volume unit', allow_decimal: true },
        { _id: 'unit_015', name: 'centimeters', short_name: 'cm', description: 'Centimeters - small metric length unit', allow_decimal: true },
        { _id: 'unit_016', name: 'inches', short_name: 'in', description: 'Inches - imperial length unit', allow_decimal: true },
        { _id: 'unit_017', name: 'feet', short_name: 'ft', description: 'Feet - imperial length unit', allow_decimal: true },
        { _id: 'unit_018', name: 'yards', short_name: 'yd', description: 'Yards - medium imperial length unit', allow_decimal: true },
        { _id: 'unit_019', name: 'cartons', short_name: 'ct', description: 'Cartons for bulk packaging', allow_decimal: false },
        { _id: 'unit_020', name: 'bottles', short_name: 'bt', description: 'Bottles for liquid products', allow_decimal: false },
        { _id: 'unit_021', name: 'bags', short_name: 'bg', description: 'Bags for various products', allow_decimal: false },
        { _id: 'unit_022', name: 'rolls', short_name: 'rl', description: 'Rolls of material or products', allow_decimal: false },
        { _id: 'unit_023', name: 'sheets', short_name: 'sh', description: 'Sheets of material or paper', allow_decimal: false },
        { _id: 'unit_024', name: 'dozens', short_name: 'dz', description: 'Dozens (12 items each)', allow_decimal: false },
        { _id: 'unit_025', name: 'reams', short_name: 'rm', description: 'Reams of paper (500 sheets each)', allow_decimal: false },
        { _id: 'unit_026', name: 'spools', short_name: 'sp', description: 'Spools of thread or wire', allow_decimal: false },
        { _id: 'unit_027', name: 'coils', short_name: 'cl', description: 'Coils of material or cable', allow_decimal: false },
        { _id: 'unit_028', name: 'bundles', short_name: 'bd', description: 'Bundles of items grouped together', allow_decimal: false },
        { _id: 'unit_029', name: 'crates', short_name: 'cr', description: 'Crates for large item storage', allow_decimal: false },
        { _id: 'unit_030', name: 'pallets', short_name: 'pt', description: 'Pallets for industrial shipping', allow_decimal: false },
        { _id: 'unit_031', name: 'containers', short_name: 'cn', description: 'Containers for bulk storage', allow_decimal: false }
      ];
      return {
        data: {
          success: true,
          data: units
        }
      };
    }
  },

  // Unit CRUD operations
  createUnit: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/units`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Mock success for demo
      const newUnit = {
        _id: `unit_${Date.now()}`,
        ...payload
      };
      return {
        data: {
          success: true,
          data: newUnit
        }
      };
    }
  },

  updateUnit: async (id, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/units/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Mock success for demo
      const updatedUnit = {
        _id: id,
        ...payload
      };
      return {
        data: {
          success: true,
          data: updatedUnit
        }
      };
    }
  },

  deleteUnit: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/units/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Mock success for demo
      return {
        data: {
          success: true,
          message: 'Unit deleted successfully'
        }
      };
    }
  },
  
  // Suppliers
  getSuppliers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/suppliers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Fallback to mock data
      const suppliers = [...new Set(mockData.products.map(p => p.supplier))];
      return {
        data: {
          success: true,
          data: suppliers
        }
      };
    }
  },
  
  // Warranties
  getWarranties: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/warranties`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      // Fallback to mock data
      const warranties = ['No warranty', '1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime'];
      return {
        data: {
          success: true,
          data: warranties
        }
      };
    }
  }
};
const usersAPI = {
  getAll: async (params = {}) => {
    // Get users from localStorage or use base data
    let baseUsers = [];
    const storedUsers = localStorage.getItem('users');
    
    if (storedUsers) {
      baseUsers = JSON.parse(storedUsers);
    } else {
      // Use base users if no localStorage data
      baseUsers = [
        {
          _id: 'USR_001',
          username: 'johnsmith',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
          role: 'admin',
          department: 'Management',
          phone: '+1-555-0101',
          isActive: true,
          lastLogin: '2024-04-23T09:15:00Z',
          createdAt: '2024-01-15T10:00:00Z',
          permissions: ['users_read', 'users_write', 'users_delete', 'inventory_read', 'inventory_write', 'inventory_delete', 'assets_read', 'assets_write', 'assets_delete', 'transactions_read', 'transactions_write', 'transactions_delete', 'sales_read', 'sales_write', 'sales_delete', 'purchases_read', 'purchases_write', 'purchases_delete', 'reports_view', 'reports_export', 'analytics_view', 'settings_manage', 'system_admin', 'backup_manage', 'roles_manage']
        },
        {
          _id: 'USR_002',
          username: 'sarahjohnson',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'manager',
          department: 'Sales',
          phone: '+1-555-0102',
          isActive: true,
          lastLogin: '2024-04-22T08:30:00Z',
          createdAt: '2024-02-10T09:00:00Z',
          permissions: ['users_read', 'users_write', 'inventory_read', 'inventory_write', 'inventory_delete', 'assets_read', 'assets_write', 'transactions_read', 'transactions_write', 'sales_read', 'sales_write', 'purchases_read', 'purchases_write', 'reports_view', 'reports_export', 'analytics_view']
        },
        {
          _id: 'USR_003',
          username: 'mikewilson',
          email: 'mike.wilson@example.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'staff',
          department: 'Sales',
          phone: '+1-555-0103',
          isActive: true,
          lastLogin: '2024-04-21T17:45:00Z',
          createdAt: '2024-03-05T11:00:00Z',
          permissions: ['inventory_read', 'inventory_write', 'assets_read', 'transactions_read', 'transactions_write', 'sales_read', 'sales_write', 'reports_view']
        },
        {
          _id: 'USR_004',
          username: 'emilydavis',
          email: 'emily.davis@example.com',
          firstName: 'Emily',
          lastName: 'Davis',
          role: 'staff',
          department: 'Warehouse',
          phone: '+1-555-0104',
          isActive: false,
          lastLogin: '2024-04-15T14:20:00Z',
          createdAt: '2024-03-20T13:00:00Z',
          permissions: ['inventory_read', 'inventory_write', 'assets_read', 'transactions_read', 'sales_read', 'reports_view']
        },
        {
          _id: 'USR_005',
          username: 'robertbrown',
          email: 'robert.brown@example.com',
          firstName: 'Robert',
          lastName: 'Brown',
          role: 'staff',
          department: 'Customer Support',
          phone: '+1-555-0105',
          isActive: true,
          lastLogin: '2024-04-23T16:10:00Z',
          createdAt: '2024-04-01T10:00:00Z',
          permissions: ['inventory_read', 'assets_read', 'transactions_read', 'sales_read', 'purchases_read', 'reports_view']
        }
      ];
    }

    // Apply filters
    let filteredUsers = baseUsers;
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        `${user.firstName} ${user.lastName} ${user.email} ${user.username} ${user.department}`.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.role) {
      filteredUsers = filteredUsers.filter(user => user.role === params.role);
    }
    
    if (params.department) {
      filteredUsers = filteredUsers.filter(user => user.department === params.department);
    }
    
    if (params.status !== undefined) {
      const isActive = params.status === 'true';
      filteredUsers = filteredUsers.filter(user => user.isActive === isActive);
    }

    return {
      data: {
        data: {
          users: filteredUsers,
          pagination: {
            total: filteredUsers.length,
            page: params.page || 1,
            pages: 1,
            limit: 20
          }
        }
      }
    };
  },

  getLoginHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/users/login-history?${queryString}` : '/users/login-history';
      const data = await authRequest(endpoint, {
        method: 'GET',
        authenticated: true,
      });

      return { data };
    } catch (error) {
      console.log('Backend login history failed, falling back to localStorage logs');
    }

    const storedLoginHistory = localStorage.getItem('loginHistory');
    const logs = storedLoginHistory ? JSON.parse(storedLoginHistory) : [];

    return {
      data: {
        success: true,
        data: {
          logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        },
      },
    };
  },
  
  create: async (userData) => {
    console.log('Creating new user:', userData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new user ID
    const newUserId = `USR_${Date.now()}`;
    
    const newUser = {
      _id: newUserId,
      ...userData,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };
    
    console.log('User created successfully:', newUser);
    
    return {
      data: {
        success: true,
        data: newUser,
        message: 'User created successfully'
      }
    };
  },
  
  update: async (id, userData) => {
    console.log('Updating user:', id, userData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = {
      _id: id,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    console.log('User updated successfully:', updatedUser);
    
    return {
      data: {
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      }
    };
  },
  
  delete: async (id) => {
    console.log('Deleting user:', id);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get current users from localStorage or use base data
    let currentUsers = [];
    const storedUsers = localStorage.getItem('users');
    
    if (storedUsers) {
      currentUsers = JSON.parse(storedUsers);
    } else {
      // Use base users if no localStorage data
      currentUsers = [
        {
          _id: 'USR_001',
          username: 'johnsmith',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
          role: 'admin',
          department: 'Management',
          phone: '+1-555-0101',
          isActive: true,
          lastLogin: '2024-04-23T09:15:00Z',
          createdAt: '2024-01-15T10:00:00Z',
          permissions: ['users_read', 'users_write', 'users_delete', 'inventory_read', 'inventory_write', 'inventory_delete', 'assets_read', 'assets_write', 'assets_delete', 'transactions_read', 'transactions_write', 'transactions_delete', 'sales_read', 'sales_write', 'sales_delete', 'purchases_read', 'purchases_write', 'purchases_delete', 'reports_view', 'reports_export', 'analytics_view', 'settings_manage', 'system_admin', 'backup_manage', 'roles_manage']
        },
        {
          _id: 'USR_002',
          username: 'sarahjohnson',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'manager',
          department: 'Sales',
          phone: '+1-555-0102',
          isActive: true,
          lastLogin: '2024-04-22T08:30:00Z',
          createdAt: '2024-02-10T09:00:00Z',
          permissions: ['users_read', 'users_write', 'inventory_read', 'inventory_write', 'inventory_delete', 'assets_read', 'assets_write', 'transactions_read', 'transactions_write', 'sales_read', 'sales_write', 'purchases_read', 'purchases_write', 'reports_view', 'reports_export', 'analytics_view']
        },
        {
          _id: 'USR_003',
          username: 'mikewilson',
          email: 'mike.wilson@example.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'staff',
          department: 'Sales',
          phone: '+1-555-0103',
          isActive: true,
          lastLogin: '2024-04-21T17:45:00Z',
          createdAt: '2024-03-05T11:00:00Z',
          permissions: ['inventory_read', 'inventory_write', 'assets_read', 'transactions_read', 'transactions_write', 'sales_read', 'sales_write', 'reports_view']
        },
        {
          _id: 'USR_004',
          username: 'emilydavis',
          email: 'emily.davis@example.com',
          firstName: 'Emily',
          lastName: 'Davis',
          role: 'staff',
          department: 'Warehouse',
          phone: '+1-555-0104',
          isActive: false,
          lastLogin: '2024-04-15T14:20:00Z',
          createdAt: '2024-03-20T13:00:00Z',
          permissions: ['inventory_read', 'inventory_write', 'assets_read', 'transactions_read', 'sales_read', 'reports_view']
        },
        {
          _id: 'USR_005',
          username: 'robertbrown',
          email: 'robert.brown@example.com',
          firstName: 'Robert',
          lastName: 'Brown',
          role: 'staff',
          department: 'Customer Support',
          phone: '+1-555-0105',
          isActive: true,
          lastLogin: '2024-04-23T16:10:00Z',
          createdAt: '2024-04-01T10:00:00Z',
          permissions: ['inventory_read', 'assets_read', 'transactions_read', 'sales_read', 'purchases_read', 'reports_view']
        }
      ];
    }
    
    // Remove the user from the array
    const updatedUsers = currentUsers.filter(user => user._id !== id);
    const deletedUser = currentUsers.find(user => user._id === id);
    
    // Update localStorage
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    console.log('User deleted successfully:', deletedUser?.firstName || 'Unknown');
    console.log('Remaining users:', updatedUsers.length);
    
    return {
      data: {
        success: true,
        message: 'User deleted successfully',
        deletedUser: deletedUser
      }
    };
  },
  
  updateStatus: async (id, status) => {
    console.log('Updating user status:', id, status);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('User status updated successfully:', id, status);
    
    return {
      data: {
        success: true,
        message: 'User status updated successfully'
      }
    };
  }
};
const stockAdjustmentsAPI = {
  getAll: async (params = {}) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/stock-adjustments${queryString ? '?' + queryString : ''}`, {
          credentials: 'include',
          headers: buildHeaders(true),
        });
        
        if (!response.ok) {
          await createApiError(response, 'Failed to load stock adjustments');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.warn('Backend API failed, falling back to mock data:', error);
      }
    }
    
    // Fallback to mock data
    let items = [...mockData.stockAdjustments];
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.product.name.toLowerCase().includes(searchLower) ||
        item.product.sku.toLowerCase().includes(searchLower) ||
        item.reason.toLowerCase().includes(searchLower) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower))
      );
    }
    
    if (params.type && params.type !== 'all') {
      items = items.filter(item => item.type === params.type);
    }
    
    if (params.reason && params.reason !== 'all') {
      items = items.filter(item => item.reason === params.reason);
    }
    
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      items = items.filter(item => new Date(item.createdAt) >= startDate);
    }
    
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      items = items.filter(item => new Date(item.createdAt) <= endDate);
    }
    
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      success: true,
      data: {
        adjustments: items.slice(startIndex, endIndex),
        pagination: {
          current: page,
          pages: Math.ceil(items.length / limit),
          total: items.length,
          limit
        }
      }
    };
  },
  
  create: async (data) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/stock-adjustments`, {
          method: 'POST',
          credentials: 'include',
          headers: buildHeaders(true),
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          await createApiError(response, 'Failed to create stock adjustment');
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.warn('Backend API failed, falling back to mock data:', error);
      }
    }
    
    // Fallback to mock data
    const newAdjustment = {
      _id: `ADJ_${Date.now()}`,
      product: mockData.products.find(p => p._id === data.product) || { _id: data.product, name: 'Unknown Product', sku: 'UNKNOWN' },
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes || '',
      created_by: { _id: 'user_001', firstName: 'John', lastName: 'Smith' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.stockAdjustments.unshift(newAdjustment);
    
    return {
      success: true,
      data: { adjustment: newAdjustment }
    };
  },

  update: async (id, data) => {
    const backendAvailable = await checkBackendAvailability();

    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/stock-adjustments/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: buildHeaders(true),
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          await createApiError(response, 'Failed to update stock adjustment');
        }

        return await response.json();
      } catch (error) {
        console.warn('Backend API failed, falling back to mock data:', error);
      }
    }

    const index = mockData.stockAdjustments.findIndex(item => item._id === id);
    if (index === -1) {
      throw new Error('Adjustment not found');
    }

    const existingAdjustment = mockData.stockAdjustments[index];
    const previousProduct = mockData.products.find(p => p._id === existingAdjustment.product?._id || p._id === existingAdjustment.product);
    const nextProduct = mockData.products.find(p => p._id === data.product);

    if (!nextProduct) {
      throw new Error('Product not found');
    }

    const previousSigned = existingAdjustment.type === 'increase' ? existingAdjustment.quantity : -existingAdjustment.quantity;
    const nextSigned = data.type === 'increase' ? data.quantity : -data.quantity;

    if (previousProduct && previousProduct._id === nextProduct._id) {
      const nextQuantity = previousProduct.quantity - previousSigned + nextSigned;
      if (nextQuantity < 0) {
        throw new Error('Updated adjustment would create negative stock');
      }
      previousProduct.quantity = nextQuantity;
    } else {
      if (previousProduct) {
        previousProduct.quantity -= previousSigned;
      }
      const nextQuantity = nextProduct.quantity + nextSigned;
      if (nextQuantity < 0) {
        throw new Error('Updated adjustment would create negative stock');
      }
      nextProduct.quantity = nextQuantity;
    }

    const updatedAdjustment = {
      ...existingAdjustment,
      product: {
        _id: nextProduct._id,
        name: nextProduct.name,
        sku: nextProduct.sku,
      },
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };

    mockData.stockAdjustments[index] = updatedAdjustment;

    return {
      success: true,
      data: { adjustment: updatedAdjustment }
    };
  },
  
  delete: async (id) => {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_BASE_URL}/stock-adjustments/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: buildHeaders(true),
        });
        
        if (!response.ok) {
          await createApiError(response, 'Failed to delete stock adjustment');
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.warn('Backend API failed, falling back to mock data:', error);
      }
    }
    
    // Fallback to mock data
    const index = mockData.stockAdjustments.findIndex(item => item._id === id);
    if (index > -1) {
      const [removedAdjustment] = mockData.stockAdjustments.splice(index, 1);
      const productId = removedAdjustment?.product?._id || removedAdjustment?.product;
      const product = mockData.products.find(item => item._id === productId);

      if (product && removedAdjustment) {
        const signedQuantity = removedAdjustment.type === 'increase'
          ? removedAdjustment.quantity
          : -removedAdjustment.quantity;
        product.quantity -= signedQuantity;
      }
    }
    
    return { success: true };
  }
};
const warehousesAPI = mockApi.inventory; // Alias for warehouses management
const transactionsAPI = {
  getAll: async (params = {}) => {
    ensureOperationalCollections();
    let items = [...mockData.transactions];

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter((item) =>
        `${item.transaction_id} ${item.reference?.order_id || ''} ${item.reference?.invoice_id || ''} ${item.reference?.notes || ''}`
          .toLowerCase()
          .includes(searchLower)
      );
    }

    if (params.type) {
      items = items.filter((item) => item.type === params.type);
    }

    if (params.status) {
      items = items.filter((item) => item.status === params.status);
    }

    if (params.startDate) {
      const startDate = new Date(params.startDate);
      items = items.filter((item) => new Date(item.date) >= startDate);
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      items = items.filter((item) => new Date(item.date) <= endDate);
    }

    const page = Number(params.page || 1);
    const limit = 20;
    const startIndex = (page - 1) * limit;
    const pagedItems = items.slice(startIndex, startIndex + limit);

    return {
      data: {
        transactions: pagedItems,
        pagination: {
          total: items.length,
          pages: Math.max(1, Math.ceil(items.length / limit)),
        }
      }
    };
  },

  create: async (data) => {
    ensureOperationalCollections();
    const transaction = createTransactionRecord({
      type: data.type,
      status: data.payment?.status === 'pending' ? 'pending' : 'completed',
      amountTotal: data.amount?.total || 0,
      items: (data.items || []).map((item) => ({
        inventory_item: item.inventory_item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
      })),
      orderId: data.reference?.order_id || `MANUAL_${Date.now()}`,
      invoiceId: data.reference?.invoice_id || '',
      notes: data.reference?.notes || '',
      paymentMethod: data.payment?.method || 'bank_transfer',
      paymentStatus: data.payment?.status || 'pending',
      date: new Date().toISOString(),
    });

    mockData.transactions.unshift(transaction);
    return {
      data: {
        success: true,
        data: transaction
      }
    };
  },

  update: async (id, data) => {
    ensureOperationalCollections();
    const index = mockData.transactions.findIndex((item) => item._id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    mockData.transactions[index] = {
      ...mockData.transactions[index],
      ...data,
      amount: {
        ...mockData.transactions[index].amount,
        ...(data.amount || {}),
      },
      reference: {
        ...mockData.transactions[index].reference,
        ...(data.reference || {}),
      },
      payment: {
        ...mockData.transactions[index].payment,
        ...(data.payment || {}),
      },
      updated_at: new Date().toISOString(),
    };

    return {
      data: {
        success: true,
        data: mockData.transactions[index]
      }
    };
  },

  approve: async (id) => {
    ensureOperationalCollections();
    const index = mockData.transactions.findIndex((item) => item._id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    mockData.transactions[index] = {
      ...mockData.transactions[index],
      status: 'completed',
      payment: {
        ...mockData.transactions[index].payment,
        status: 'completed',
      },
      updated_at: new Date().toISOString(),
    };

    return {
      data: {
        success: true,
        data: mockData.transactions[index]
      }
    };
  },

  cancel: async (id) => {
    ensureOperationalCollections();
    const index = mockData.transactions.findIndex((item) => item._id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    mockData.transactions[index] = {
      ...mockData.transactions[index],
      status: 'cancelled',
      payment: {
        ...mockData.transactions[index].payment,
        status: 'cancelled',
      },
      updated_at: new Date().toISOString(),
    };

    return {
      data: {
        success: true,
        data: mockData.transactions[index]
      }
    };
  }
};
const authAPI = {
  login: async (credentials) => {
    const data = await authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return { data };
  },

  register: async (userData) => {
    const data = await authRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return { data };
  },

  getMe: async () => {
    const data = await authRequest('/auth/me', {
      method: 'GET',
      authenticated: true,
    });

    return { data };
  },

  changePassword: async (payload) => {
    const data = await authRequest('/auth/change-password', {
      method: 'PUT',
      authenticated: true,
      body: JSON.stringify(payload),
    });

    return { data };
  },
};
const getDashboardOverview = async () => {
  const backendAvailable = await checkBackendAvailability();

  if (backendAvailable) {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard/overview`, {
        headers: buildHeaders(true),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Backend dashboard overview failed, falling back to mock data');
    }
  }

  const products = Array.isArray(mockData.products) ? mockData.products : [];
  const assets = Array.isArray(mockData.assets) ? mockData.assets : [];
  const sales = Array.isArray(mockData.sales) ? mockData.sales : [];
  const purchases = Array.isArray(mockData.purchases) ? mockData.purchases : [];
  const expenses = Array.isArray(mockData.expenses) ? mockData.expenses : [];
  const alerts = Array.isArray(mockData.alerts) ? mockData.alerts : [];

  const monthlySales = sales.reduce((sum, sale) => sum + Number(sale.total_amount || sale.total || sale.amount || 0), 0);
  const monthlyPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.total_amount || purchase.total || purchase.amount || 0), 0);
  const monthlyExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount || expense.total || 0), 0);
  const totalInventoryValue = products.reduce((sum, product) => {
    const quantity = Number(product.quantity || product.stock || 0);
    const unitCost = Number(product.price?.cost || product.price?.selling || product.price || 0);
    return sum + quantity * unitCost;
  }, 0);

  return {
    success: true,
    data: {
      totalInventoryValue,
      lowStockCount: products.filter((product) => Number(product.quantity || 0) <= Number(product.minStock || product.reorderPoint || 0)).length,
      activeAssets: assets.filter((asset) => asset.status === 'active').length,
      monthlySales,
      monthlyPurchases,
      monthlyExpense,
      activeAlerts: alerts.filter((alert) => alert.status === 'active').length,
    },
  };
};

const getTransactionsAnalysis = async (params = {}) => {
  const backendAvailable = await checkBackendAvailability();
  const queryParams = new URLSearchParams();

  if (params.period) {
    queryParams.append('period', params.period);
  }

  if (backendAvailable) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/transactions/analysis${queryParams.toString() ? `?${queryParams}` : ''}`,
        {
          headers: buildHeaders(true),
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Backend transaction analytics failed, falling back to mock data');
    }
  }

  const transactions = Array.isArray(mockData.transactions) ? mockData.transactions : [];
  const periodDays = Number.parseInt(params.period, 10) || 30;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter((transaction) => {
    const rawDate = transaction?.date || transaction?.transaction_date || transaction?.createdAt;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    return parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate >= startDate;
  });

  const trendMap = new Map();
  const revenueMap = new Map();
  const supplierMap = new Map();
  const paymentStatusMap = new Map();

  recentTransactions.forEach((transaction) => {
    const rawDate = transaction?.date || transaction?.transaction_date || transaction?.createdAt;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const dateKey = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString().split('T')[0]
      : parsedDate.toISOString().split('T')[0];
    const amount = Number(
      transaction?.amount?.total ??
      transaction?.amount ??
      transaction?.total_amount ??
      transaction?.total ??
      0
    );
    const type = transaction?.type || transaction?.transaction_type || 'other';
    const supplierName =
      transaction?.parties?.from ||
      transaction?.supplier?.name ||
      transaction?.supplier_name ||
      'Unknown supplier';
    const paymentStatus = transaction?.payment?.status || transaction?.status || 'unknown';

    const existingTrend = trendMap.get(dateKey) || { _id: dateKey, totalAmount: 0, count: 0 };
    existingTrend.totalAmount += amount;
    existingTrend.count += 1;
    trendMap.set(dateKey, existingTrend);

    const existingRevenue = revenueMap.get(type) || { _id: type, totalAmount: 0, count: 0, avgAmount: 0 };
    existingRevenue.totalAmount += amount;
    existingRevenue.count += 1;
    existingRevenue.avgAmount = existingRevenue.totalAmount / existingRevenue.count;
    revenueMap.set(type, existingRevenue);

    if (type === 'purchase') {
      const existingSupplier = supplierMap.get(supplierName) || { _id: supplierName, totalAmount: 0, count: 0 };
      existingSupplier.totalAmount += amount;
      existingSupplier.count += 1;
      supplierMap.set(supplierName, existingSupplier);
    }

    const existingPaymentStatus = paymentStatusMap.get(paymentStatus) || { _id: paymentStatus, count: 0, totalAmount: 0 };
    existingPaymentStatus.count += 1;
    existingPaymentStatus.totalAmount += amount;
    paymentStatusMap.set(paymentStatus, existingPaymentStatus);
  });

  return {
    success: true,
    data: {
      transactionTrends: Array.from(trendMap.values()).sort((a, b) => a._id.localeCompare(b._id)),
      revenueByType: Array.from(revenueMap.values()),
      topSuppliers: Array.from(supplierMap.values()).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10),
      paymentStatus: Array.from(paymentStatusMap.values()),
    },
  };
};

const analyticsAPI = {
  ...mockApi.inventory,
  getDashboardOverview,
  getTransactionsAnalysis,
};
const demoAPI = mockApi.inventory; // Alias for demo management
const aiAPI = {
  // AI API functions
  predictDemand: async (params) => {
    const { inventory_id, period } = params;
    const product = mockData.products.find(p => p._id === inventory_id);
    
    // Generate mock demand prediction
    const predictedDemand = Math.floor(Math.random() * 50) + 10;
    const confidence = Math.floor(Math.random() * 30) + 70;
    
    return {
      data: {
        success: true,
        data: {
          predictedDemand: {
            next30Days: predictedDemand,
            next90Days: Math.floor(predictedDemand * 2.5)
          },
          confidence: confidence,
          recommendation: confidence > 80 ? 'High confidence prediction - stock recommended' : 'Moderate confidence - monitor closely'
        }
      }
    };
  },

  getRestockSuggestions: async (params) => {
    const lowStockProducts = mockData.products.filter(p => p.quantity <= p.minStock);
    
    const suggestions = lowStockProducts.map(product => ({
      inventory_id: product._id,
      name: product.name,
      current_stock: product.quantity,
      suggested_quantity: product.maxStock - product.quantity,
      urgency: product.quantity === 0 ? 'critical' : product.quantity <= product.minStock * 0.5 ? 'urgent' : 'normal',
      supplier: { company_name: product.supplier || 'Default Supplier' },
      estimated_cost: (product.maxStock - product.quantity) * product.price,
      reason: product.quantity === 0 ? 'Out of stock - immediate reorder required' : 'Below minimum stock level'
    }));

    return {
      data: {
        success: true,
        data: {
          suggestions,
          total_suggestions: suggestions.length,
          critical_count: suggestions.filter(s => s.urgency === 'critical').length
        }
      }
    };
  },

  getExpenseInsights: async (params) => {
    const { period = 30 } = params;
    const expenses = mockData.expenses || [];
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const avgDailyExpense = totalExpenses / period;
    
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      if (!acc[category]) acc[category] = { total: 0, count: 0 };
      acc[category].total += exp.amount || 0;
      acc[category].count++;
      return acc;
    }, {});

    const topExpenseCategories = Object.entries(categoryBreakdown)
      .map(([name, data]) => ({ _id: name, totalAmount: data.total, count: data.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const costOptimization = mockData.products
      .filter(p => p.quantity > p.maxStock)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        maxStock: p.maxStock,
        potentialSavings: (p.quantity - p.maxStock) * p.price * 0.1
      }))
      .slice(0, 5);

    return {
      data: {
        success: true,
        data: {
          summary: {
            totalExpenses,
            avgDailyExpense,
            unusualTransactionsCount: Math.floor(Math.random() * 3),
            potentialSavings: costOptimization.reduce((sum, item) => sum + item.potentialSavings, 0)
          },
          topExpenseCategories,
          costOptimization
        }
      }
    };
  },

  getFraudDetection: async (params) => {
    const { period = 30 } = params;
    
    // Generate mock fraud alerts based on transactions
    const sales = mockData.sales || [];
    const fraudAlerts = [];
    
    // Simulate some potential fraud patterns
    const alertTypes = [
      { type: 'duplicate_transaction', severity: 'high', description: 'Multiple identical transactions detected' },
      { type: 'unusual_time', severity: 'medium', description: 'Transaction outside normal business hours' },
      { type: 'large_amount', severity: 'high', description: 'Unusually large transaction amount' },
      { type: 'suspicious_pattern', severity: 'medium', description: 'Abnormal transaction pattern detected' },
      { type: 'user_anomaly', severity: 'low', description: 'Unusual user activity pattern' }
    ];

    // Randomly generate a few alerts
    const numAlerts = Math.floor(Math.random() * 4);
    for (let i = 0; i < numAlerts; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const riskScore = Math.floor(Math.random() * 50) + 50;
      
      fraudAlerts.push({
        _id: `FRAUD_${Date.now()}_${i}`,
        type: alertType.type,
        severity: alertType.severity,
        risk_score: riskScore,
        details: {
          description: alertType.description,
          timestamp: new Date(Date.now() - Math.random() * period * 24 * 60 * 60 * 1000).toISOString(),
          transaction_id: sales[i]?._id || `TXN_${Date.now()}`,
          amount: sales[i]?.total_amount || Math.floor(Math.random() * 10000),
          user: sales[i]?.customer_name || 'Unknown User'
        }
      });
    }

    // Sort by risk score (highest first)
    fraudAlerts.sort((a, b) => b.risk_score - a.risk_score);

    const highRiskAlerts = fraudAlerts.filter(a => a.severity === 'high').length;
    const mediumRiskAlerts = fraudAlerts.filter(a => a.severity === 'medium').length;

    return {
      data: {
        success: true,
        data: {
          summary: {
            totalAlerts: fraudAlerts.length,
            highRiskAlerts,
            mediumRiskAlerts,
            lowRiskAlerts: fraudAlerts.length - highRiskAlerts - mediumRiskAlerts
          },
          fraudAlerts
        }
      }
    };
  }
};

const ensureSalesCollections = () => {
  mockData.sales = Array.isArray(mockData.sales) ? mockData.sales : [];
  mockData.invoices = Array.isArray(mockData.invoices) ? mockData.invoices : [];
  mockData.payments = Array.isArray(mockData.payments) ? mockData.payments : [];
  mockData.salesReturns = Array.isArray(mockData.salesReturns) ? mockData.salesReturns : [];
  mockData.quotations = Array.isArray(mockData.quotations) ? mockData.quotations : [];
  mockData.salesReports = Array.isArray(mockData.salesReports) ? mockData.salesReports : [];
  mockData.salesAgents = Array.isArray(mockData.salesAgents) ? mockData.salesAgents : [];
  mockData.products = Array.isArray(mockData.products) ? mockData.products : [];
};

const nextSequence = (collection, prefix) => `${prefix}-${new Date().getFullYear()}-${String(collection.length + 1).padStart(3, '0')}`;

const normalizeSaleRecord = (data) => {
  ensureSalesCollections();

  const saleNumber = nextSequence(mockData.sales, 'SALE');
  const saleDate = data.sale_date || data.date || new Date().toISOString();
  const items = (data.items || []).map((item) => {
    const inventoryItem = mockData.products.find((product) => product._id === item.product);
    return {
      product_id: item.product,
      product_name: item.name || inventoryItem?.name || 'Unknown Product',
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.price || 0),
      unit: item.unit || inventoryItem?.unit || 'pcs',
      total: Number(item.quantity || 0) * Number(item.price || 0),
    };
  });

  const totalAmount = Number(data.total_amount ?? data.total ?? 0);
  const paymentMethod = data.payment_method || data.paymentMethod || 'cash';
  const paymentStatus = data.payment_status || data.paymentStatus || (paymentMethod === 'purchase_order' ? 'pending' : 'paid');
  const customerName = data.customer_name || data.customer || 'Walk-in Customer';

  return {
    _id: `SALE_${Date.now()}`,
    sale_id: saleNumber,
    customer_name: customerName,
    customer: customerName,
    sale_date: saleDate,
    createdAt: saleDate,
    created_at: saleDate,
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items,
    subtotal: Number(data.subtotal || 0),
    tax: Number(data.tax || 0),
    total_amount: totalAmount,
    total: totalAmount,
    payment_method: paymentMethod,
    paymentMethod,
    payment_status: paymentStatus,
    status: data.status || 'completed',
    salesperson: data.salesperson || 'System',
    notes: data.notes || '',
  };
};

const applySaleInventoryImpact = (sale) => {
  sale.items.forEach((item) => {
    const inventoryIndex = mockData.products.findIndex((product) => product._id === item.product_id);
    if (inventoryIndex >= 0) {
      const currentQuantity = Number(mockData.products[inventoryIndex].quantity || 0);
      mockData.products[inventoryIndex] = {
        ...mockData.products[inventoryIndex],
        quantity: Math.max(0, currentQuantity - Number(item.quantity || 0)),
        updatedAt: new Date().toISOString(),
      };
    }
  });
};

const buildInvoiceFromSale = (sale) => ({
  _id: `INV_${Date.now()}`,
  invoice_id: nextSequence(mockData.invoices, 'INV'),
  invoice_number: nextSequence(mockData.invoices, 'INV'),
  sale_id: sale.sale_id,
  customer_name: sale.customer_name,
  invoice_date: sale.sale_date,
  due_date: sale.sale_date,
  total_amount: sale.total_amount,
  amount_due: sale.payment_status === 'paid' ? 0 : sale.total_amount,
  amount_paid: sale.payment_status === 'paid' ? sale.total_amount : 0,
  status: sale.payment_status === 'paid' ? 'paid' : sale.payment_status === 'partial' ? 'pending' : 'pending',
  payment_method: sale.payment_method,
  payment_status: sale.payment_status === 'paid' ? 'fully_paid' : sale.payment_status === 'partial' ? 'partially_paid' : 'unpaid',
  items: sale.items,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const buildPaymentFromSale = (sale, invoice) => ({
  _id: `PAY_${Date.now()}`,
  payment_id: nextSequence(mockData.payments, 'PAY'),
  invoice_id: invoice?.invoice_id || null,
  sale_id: sale.sale_id,
  customer_name: sale.customer_name,
  payment_date: sale.sale_date,
  payment_method: sale.payment_method,
  payment_type: sale.payment_status === 'partial' ? 'partial_payment' : 'full_payment',
  amount: sale.payment_status === 'partial' ? Number((sale.total_amount || 0) / 2) : sale.total_amount,
  status: 'completed',
  transaction_id: `TXN_${Date.now()}`,
  description: `Payment for ${invoice?.invoice_number || sale.sale_id}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const syncInvoicesAndPayments = () => {
  ensureSalesCollections();

  mockData.invoices = mockData.invoices.map((invoice) => {
    const invoicePayments = mockData.payments.filter((payment) => payment.invoice_id === invoice.invoice_id);
    const amountPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const amountDue = Math.max(0, Number(invoice.total_amount || 0) - amountPaid);

    let paymentStatus = 'unpaid';
    let status = 'pending';

    if (amountDue <= 0 && Number(invoice.total_amount || 0) > 0) {
      paymentStatus = 'fully_paid';
      status = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
      status = 'pending';
    }

    return {
      ...invoice,
      amount_paid: amountPaid,
      amount_due: amountDue,
      payment_status: paymentStatus,
      status,
      updated_at: new Date().toISOString(),
    };
  });
};

const regenerateSalesReports = () => {
  ensureSalesCollections();

  const sales = [...mockData.sales].sort((a, b) => new Date(b.sale_date || b.createdAt || 0) - new Date(a.sale_date || a.createdAt || 0));
  const periods = [
    { report_type: 'daily', label: 'Daily' },
    { report_type: 'weekly', label: 'Weekly' },
    { report_type: 'monthly', label: 'Monthly' },
    { report_type: 'quarterly', label: 'Quarterly' },
  ];

  mockData.salesReports = periods.map((period, index) => {
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount || sale.total || 0), 0);
    const totalOrders = sales.length;
    const activeCustomers = new Set(sales.map((sale) => sale.customer_name).filter(Boolean)).size;

    return {
      _id: `SREP_${index + 1}`,
      report_id: `${period.label.toUpperCase()}-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      report_name: `${period.label} Sales Performance`,
      report_type: period.report_type,
      period_start: sales[sales.length - 1]?.sale_date || new Date().toISOString(),
      period_end: sales[0]?.sale_date || new Date().toISOString(),
      metrics: {
        total_sales: totalSales,
        total_orders: totalOrders,
        active_customers: activeCustomers,
      },
      trend: index % 2 === 0 ? 'up' : 'down',
      generated_at: new Date().toISOString(),
    };
  });
};

const ensureOperationalCollections = () => {
  mockData.transactions = Array.isArray(mockData.transactions) ? mockData.transactions : [];
  mockData.purchases = Array.isArray(mockData.purchases) ? mockData.purchases : [];
  mockData.assets = Array.isArray(mockData.assets) ? mockData.assets : [];
  mockData.products = Array.isArray(mockData.products) ? mockData.products : [];
};

const createTransactionRecord = ({
  type,
  status = 'completed',
  amountTotal = 0,
  items = [],
  orderId = '',
  invoiceId = '',
  notes = '',
  paymentMethod = 'bank_transfer',
  paymentStatus = 'pending',
  date = new Date().toISOString(),
  metadata = {},
}) => ({
  _id: `TRX_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  transaction_id: `TRX_${Date.now()}`,
  type,
  items,
  amount: {
    total: Number(amountTotal || 0),
    currency: 'USD',
  },
  reference: {
    order_id: orderId,
    invoice_id: invoiceId,
    notes,
    ...metadata,
  },
  payment: {
    method: paymentMethod,
    status: paymentStatus,
    due_date: undefined,
  },
  date,
  status,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const upsertTransactionByOrderId = (orderId, builder) => {
  ensureOperationalCollections();
  const existingIndex = mockData.transactions.findIndex(
    (transaction) => transaction.reference?.order_id === orderId
  );
  const nextTransaction = builder(mockData.transactions[existingIndex]);

  if (existingIndex >= 0) {
    mockData.transactions[existingIndex] = nextTransaction;
    return nextTransaction;
  }

  mockData.transactions.unshift(nextTransaction);
  return nextTransaction;
};

const removeTransactionByOrderId = (orderId) => {
  ensureOperationalCollections();
  mockData.transactions = mockData.transactions.filter(
    (transaction) => transaction.reference?.order_id !== orderId
  );
};

const applyPurchaseInventoryImpact = (purchase, direction = 1) => {
  ensureOperationalCollections();
  (purchase.items || []).forEach((item) => {
    const inventoryId = item.inventory_id || item.product || item.product_id;
    const inventoryIndex = mockData.products.findIndex((product) => product._id === inventoryId);
    if (inventoryIndex >= 0) {
      const currentQuantity = Number(mockData.products[inventoryIndex].quantity || 0);
      mockData.products[inventoryIndex] = {
        ...mockData.products[inventoryIndex],
        quantity: Math.max(0, currentQuantity + direction * Number(item.quantity || 0)),
        updatedAt: new Date().toISOString(),
      };
    }
  });
};

const syncPurchaseTransaction = (purchase) =>
  upsertTransactionByOrderId(purchase.purchase_id, (existingTransaction) =>
    createTransactionRecord({
      type: purchase.status === 'returned' ? 'return' : 'purchase',
      status:
        purchase.status === 'cancelled'
          ? 'cancelled'
          : purchase.status === 'ordered'
            ? 'pending'
            : 'completed',
      amountTotal: purchase.total_amount || purchase.final_amount || 0,
      items: (purchase.items || []).map((item) => ({
        inventory_item: item.inventory_id || item.product || item.product_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || item.purchase_price || 0),
      })),
      orderId: purchase.purchase_id,
      invoiceId: purchase.invoice_id || '',
      notes: purchase.notes || purchase.return_reason || '',
      paymentMethod: purchase.payment_method || 'bank_transfer',
      paymentStatus: purchase.payment_status || 'pending',
      date: purchase.purchase_date || new Date().toISOString(),
      metadata: {
        supplier_name: purchase.supplier_name || '',
        purchase_id: purchase.purchase_id,
      },
    })
  );

const syncAssetTransaction = (asset, transactionStatus = 'completed') =>
  upsertTransactionByOrderId(asset._id, () =>
    createTransactionRecord({
      type: asset.status === 'disposed' ? 'disposal' : 'asset',
      status: transactionStatus,
      amountTotal: asset.purchase_cost?.amount || 0,
      items: [
        {
          inventory_item: asset._id,
          quantity: 1,
          unit_price: Number(asset.purchase_cost?.amount || 0),
        },
      ],
      orderId: asset._id,
      invoiceId: '',
      notes: asset.description || asset.asset_name,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed',
      date: asset.purchase_date || new Date().toISOString(),
      metadata: {
        asset_name: asset.asset_name,
        category: asset.category,
      },
    })
  );

// Invoices API
const invoicesAPI = {
  getAll: async (params = {}) => {
    syncInvoicesAndPayments();
    console.log('Invoices API called with params:', params);
    let items = [...mockData.invoices];
    console.log('Total invoices available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.customer_name.toLowerCase().includes(searchLower) ||
        item.invoice_number.toLowerCase().includes(searchLower) ||
        item.invoice_id.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', items.length);
    }
    
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
      console.log('After status filter:', items.length);
    }
    
    if (params.startDate && params.endDate) {
      items = items.filter(item => {
        const invoiceDate = new Date(item.invoice_date);
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        return invoiceDate >= start && invoiceDate <= end;
      });
      console.log('After date filter:', items.length);
    }

    const result = {
      data: {
        success: true,
        data: {
          invoices: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Invoices API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const invoice = mockData.invoices.find(i => i._id === id || i.invoice_id === id);
    return {
      data: {
        success: true,
        data: invoice
      }
    };
  },
  
  create: async (data) => {
    const newInvoice = {
      _id: `INV_${String(mockData.invoices.length + 1).padStart(3, '0')}`,
      invoice_id: `INV-2026-${String(mockData.invoices.length + 1).padStart(3, '0')}`,
      invoice_number: `INV-2026-${String(mockData.invoices.length + 1).padStart(3, '0')}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockData.invoices.push(newInvoice);
    return {
      data: {
        success: true,
        data: newInvoice
      }
    };
  }
};

// Payments API
const paymentsAPI = {
  getAll: async (params = {}) => {
    syncInvoicesAndPayments();
    console.log('Payments API called with params:', params);
    let items = [...mockData.payments];
    console.log('Total payments available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.customer_name.toLowerCase().includes(searchLower) ||
        item.payment_id.toLowerCase().includes(searchLower) ||
        item.transaction_id.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }
    
    if (params.paymentMethod && params.paymentMethod !== 'all') {
      items = items.filter(item => item.payment_method === params.paymentMethod);
    }

    if (params.startDate && params.endDate) {
      items = items.filter((item) => {
        const paymentDate = new Date(item.payment_date);
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    const result = {
      data: {
        success: true,
        data: {
          payments: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Payments API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const payment = mockData.payments.find(p => p._id === id || p.payment_id === id);
    return {
      data: {
        success: true,
        data: payment
      }
    };
  },

  create: async (data) => {
    ensureSalesCollections();
    const payment = {
      _id: `PAY_${Date.now()}`,
      payment_id: nextSequence(mockData.payments, 'PAY'),
      invoice_id: data.invoice_id || null,
      sale_id: data.sale_id || null,
      customer_name: data.customer_name || 'Walk-in Customer',
      payment_date: data.payment_date || new Date().toISOString(),
      payment_method: data.payment_method || 'cash',
      payment_type: data.payment_type || 'full_payment',
      amount: Number(data.amount || 0),
      status: data.status || 'completed',
      transaction_id: data.transaction_id || `TXN_${Date.now()}`,
      description: data.description || 'Recorded payment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockData.payments.unshift(payment);
    syncInvoicesAndPayments();

    if (payment.sale_id) {
      const saleIndex = mockData.sales.findIndex((sale) => sale.sale_id === payment.sale_id || sale._id === payment.sale_id);
      if (saleIndex >= 0) {
        const sale = mockData.sales[saleIndex];
        const paidAmount = mockData.payments
          .filter((item) => item.sale_id === sale.sale_id)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const paymentStatus = paidAmount >= Number(sale.total_amount || 0) ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
        mockData.sales[saleIndex] = {
          ...sale,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        };
      }
    }

    regenerateSalesReports();

    return {
      data: {
        success: true,
        data: payment
      }
    };
  }
};

// Sales Returns API
const salesReturnsAPI = {
  getAll: async (params = {}) => {
    console.log('Sales Returns API called with params:', params);
    let items = [...mockData.salesReturns];
    console.log('Total sales returns available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.customer_name.toLowerCase().includes(searchLower) ||
        item.return_id.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }
    
    if (params.reason && params.reason !== 'all') {
      items = items.filter(item => item.reason === params.reason);
    }

    const result = {
      data: {
        success: true,
        data: {
          salesReturns: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Sales Returns API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const returnItem = mockData.salesReturns.find(r => r._id === id || r.return_id === id);
    return {
      data: {
        success: true,
        data: returnItem
      }
    };
  }
};

// Quotations API
const quotationsAPI = {
  getAll: async (params = {}) => {
    console.log('Quotations API called with params:', params);
    let items = [...mockData.quotations];
    console.log('Total quotations available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.customer_name.toLowerCase().includes(searchLower) ||
        item.quotation_id.toLowerCase().includes(searchLower) ||
        item.quotation_number.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }

    const result = {
      data: {
        success: true,
        data: {
          quotations: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Quotations API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const quotation = mockData.quotations.find(q => q._id === id || q.quotation_id === id);
    return {
      data: {
        success: true,
        data: quotation
      }
    };
  }
};

// Sales Reports API
const salesReportsAPI = {
  getAll: async (params = {}) => {
    regenerateSalesReports();
    console.log('Sales Reports API called with params:', params);
    let items = [...mockData.salesReports];
    console.log('Total sales reports available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.report_name.toLowerCase().includes(searchLower) ||
        item.report_id.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.reportType && params.reportType !== 'all') {
      items = items.filter(item => item.report_type === params.reportType);
    }

    const result = {
      data: {
        success: true,
        data: {
          salesReports: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Sales Reports API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const report = mockData.salesReports.find(r => r._id === id || r.report_id === id);
    return {
      data: {
        success: true,
        data: report
      }
    };
  }
};

// Sales Agents API
const salesAgentsAPI = {
  getAll: async (params = {}) => {
    ensureSalesCollections();
    console.log('Sales Agents API called with params:', params);
    let items = [...mockData.salesAgents].map((agent) => {
      const agentSales = mockData.sales.filter((sale) => (sale.salesperson || '').toLowerCase() === (agent.name || '').toLowerCase());
      const totalSales = agentSales.reduce((sum, sale) => sum + Number(sale.total_amount || sale.total || 0), 0);
      return {
        ...agent,
        total_sales: totalSales || agent.total_sales || 0,
      };
    });
    console.log('Total sales agents available:', items.length);
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.agent_id.toLowerCase().includes(searchLower)
      );
    }
    
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }
    
    if (params.territory && params.territory !== 'all') {
      items = items.filter(item => item.territory === params.territory);
    }

    const result = {
      data: {
        success: true,
        data: {
          salesAgents: items,
          total: items.length,
          page: 1,
          totalPages: 1
        }
      }
    };
    console.log('Sales Agents API returning:', result);
    return result;
  },
  
  getById: async (id) => {
    const agent = mockData.salesAgents.find(a => a._id === id || a.agent_id === id);
    return {
      data: {
        success: true,
        data: agent
      }
    };
  }
};

export {
  inventoryAPI,
  categoriesAPI,
  customersAPI,
  contactsAPI,
  salesAPI,
  purchasesAPI,
  stockTransfersAPI,
  expensesAPI,
  paymentAccountsAPI,
  aiInsightsAPI,
  alertsAPI,
  assetsAPI,
  suppliersAPI,
  metadataAPI,
  usersAPI,
  stockAdjustmentsAPI,
  warehousesAPI,
  transactionsAPI,
  authAPI,
  analyticsAPI,
  demoAPI,
  aiAPI,
  invoicesAPI,
  paymentsAPI,
  salesReturnsAPI,
  quotationsAPI,
  salesReportsAPI,
  salesAgentsAPI,
  SOCKET_URL,
  checkBackendAvailability
};
