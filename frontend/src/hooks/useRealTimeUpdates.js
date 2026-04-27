// Real-time Updates Hook - Connects all pages with live data synchronization
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { SOCKET_URL } from '../services/api';

// Global real-time event emitter for cross-component communication
class RealTimeEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
  }

  // Subscribe to real-time events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Emit real-time events
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in real-time event callback:', error);
        }
      });
    }
  }

  // Initialize WebSocket connection
  initWebSocket() {
    if (this.isConnecting || this.websocket?.connected) {
      return;
    }

    this.isConnecting = true;

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const isLocalDemoToken = !token || token.startsWith('mock-jwt-token-');
    const isVercelSocketTarget = /https?:\/\/[^/]*vercel\.app(?:\/|$)/i.test(SOCKET_URL);

    if (isLocalDemoToken || isVercelSocketTarget) {
      this.isConnecting = false;
      this.emit('connection', { status: 'polling', mode: isVercelSocketTarget ? 'serverless' : 'local-demo' });
      this.fallbackToPolling();
      return;
    }
    
    try {
      this.websocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        auth: { token },
      });

      this.websocket.on('connect', () => {
        console.log('Real-time WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connection', { status: 'connected' });
      });

      this.websocket.on('inventory:updated', (payload) => this.handleRealTimeUpdate({ type: 'inventory_update', payload }));
      this.websocket.on('inventory:stock-adjusted', (payload) => this.handleRealTimeUpdate({ type: 'inventory_update', payload }));
      this.websocket.on('inventory:created', (payload) => this.handleRealTimeUpdate({ type: 'inventory_update', payload }));
      this.websocket.on('inventory:deleted', (payload) => this.handleRealTimeUpdate({ type: 'inventory_update', payload }));
      this.websocket.on('customers:updated', (payload) => this.handleRealTimeUpdate({ type: 'customer_updated', payload }));
      this.websocket.on('suppliers:updated', (payload) => this.handleRealTimeUpdate({ type: 'supplier_updated', payload }));
      this.websocket.on('expenses:created', (payload) => this.handleRealTimeUpdate({ type: 'expense_created', payload }));
      this.websocket.on('sales:created', (payload) => this.handleRealTimeUpdate({ type: 'sale_created', payload }));
      this.websocket.on('purchases:created', (payload) => this.handleRealTimeUpdate({ type: 'purchase_created', payload }));

      this.websocket.on('disconnect', () => {
        console.log('Real-time WebSocket disconnected');
        this.isConnecting = false;
        this.emit('connection', { status: 'polling' });
        this.fallbackToPolling();
      });

      this.websocket.on('connect_error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('connection', { status: 'polling' });
        this.fallbackToPolling();
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.isConnecting = false;
      this.emit('connection', { status: 'polling' });
      this.fallbackToPolling();
    }
  }

  // Handle real-time updates
  handleRealTimeUpdate(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'inventory_update':
        this.emit('inventory:updated', payload);
        break;
      case 'sale_created':
        this.emit('sales:created', payload);
        break;
      case 'purchase_created':
        this.emit('purchases:created', payload);
        break;
      case 'user_activity':
        this.emit('user:activity', payload);
        break;
      case 'alert_triggered':
        this.emit('alerts:triggered', payload);
        break;
      case 'asset_updated':
        this.emit('assets:updated', payload);
        break;
      case 'customer_updated':
        this.emit('customers:updated', payload);
        break;
      case 'supplier_updated':
        this.emit('suppliers:updated', payload);
        break;
      case 'expense_created':
        this.emit('expenses:created', payload);
        break;
      default:
        console.log('Unknown real-time update type:', type);
    }
  }

  // Attempt to reconnect WebSocket
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.fallbackToPolling();
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.initWebSocket();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Fallback to polling if WebSocket fails
  fallbackToPolling() {
    console.log('Using polling fallback for real-time updates');
    if (this.pollingInterval) {
      return;
    }
    this.emit('connection', { status: 'polling' });
    
    // Start polling every 5 seconds
    this.pollingInterval = setInterval(() => {
      this.emit('polling:update', { timestamp: Date.now() });
      this.emit('connection', { status: 'polling' });
    }, 5000);
  }

  // Send message through WebSocket
  send(data) {
    if (this.websocket?.connected) {
      this.websocket.emit('client:event', data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Cleanup
  cleanup() {
    if (this.websocket) {
      this.websocket.disconnect();
      this.websocket = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isConnecting = false;
    this.listeners.clear();
  }
}

// Global instance
const realTimeEmitter = new RealTimeEventEmitter();

// Custom hook for real-time updates
export const useRealTimeUpdates = (options = {}) => {
  const { 
    enableWebSocket = true, 
    autoConnect = true 
  } = options;
  
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const subscribersRef = useRef(new Set());

  // Initialize connection
  useEffect(() => {
    if (autoConnect && enableWebSocket) {
      realTimeEmitter.initWebSocket();
    }

    // Subscribe to connection events
    const unsubscribeConnection = realTimeEmitter.subscribe('connection', (data) => {
      setConnectionStatus(data.status);
    });

    // Subscribe to polling updates
    const unsubscribePolling = realTimeEmitter.subscribe('polling:update', (data) => {
      setLastUpdate(data.timestamp);
      // Refresh all active queries when polling
      queryClient.invalidateQueries();
    });

    return () => {
      unsubscribeConnection();
      unsubscribePolling();
    };
  }, [autoConnect, enableWebSocket, queryClient]);

  // Subscribe to specific real-time events
  const subscribe = useCallback((event, callback) => {
    const unsubscribe = realTimeEmitter.subscribe(event, callback);
    subscribersRef.current.add(unsubscribe);
    
    return () => {
      unsubscribe();
      subscribersRef.current.delete(unsubscribe);
    };
  }, []);

  // Invalidate specific queries when data changes
  const invalidateQueries = useCallback((queryKeys) => {
    if (Array.isArray(queryKeys)) {
      queryKeys.forEach(key => queryClient.invalidateQueries(key));
    } else {
      queryClient.invalidateQueries(queryKeys);
    }
  }, [queryClient]);

  // Send real-time message
  const sendMessage = useCallback((data) => {
    realTimeEmitter.send(data);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const subscriberSet = subscribersRef.current;
    return () => {
      subscriberSet.forEach(unsubscribe => unsubscribe());
      subscriberSet.clear();
    };
  }, []);

  return {
    connectionStatus,
    lastUpdate,
    subscribe,
    invalidateQueries,
    sendMessage,
    isConnected: connectionStatus === 'connected',
    isPolling: connectionStatus === 'polling'
  };
};

// Real-time data synchronization hook
export const useRealTimeDataSync = (queryKey, fetchData, options = {}) => {
  const { 
    subscribe, 
    invalidateQueries, 
    connectionStatus 
  } = useRealTimeUpdates(options);
  
  const [lastSync, setLastSync] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);

  useEffect(() => {
    // Subscribe to relevant real-time events based on query key
    let unsubscribe = null;
    
    if (queryKey.includes('inventory')) {
      unsubscribe = subscribe('inventory:updated', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        // Show notification for important updates
        if (data.type === 'critical') {
          toast.error(`Critical inventory update: ${data.message}`);
        } else {
          toast.success(`Inventory updated: ${data.message}`);
        }
      });
    } else if (queryKey.includes('sales')) {
      unsubscribe = subscribe('sales:created', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`New sale: ${data.customerName} - $${data.amount}`);
      });
    } else if (queryKey.includes('purchases')) {
      unsubscribe = subscribe('purchases:created', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`New purchase: ${data.supplierName} - $${data.amount}`);
      });
    } else if (queryKey.includes('assets')) {
      unsubscribe = subscribe('assets:updated', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`Asset updated: ${data.assetName}`);
      });
    } else if (queryKey.includes('customers')) {
      unsubscribe = subscribe('customers:updated', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`Customer updated: ${data.customerName}`);
      });
    } else if (queryKey.includes('suppliers')) {
      unsubscribe = subscribe('suppliers:updated', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`Supplier updated: ${data.supplierName}`);
      });
    } else if (queryKey.includes('expenses')) {
      unsubscribe = subscribe('expenses:created', (data) => {
        invalidateQueries(queryKey);
        setLastSync(new Date());
        setIsRealTime(true);
        
        toast.success(`New expense: ${data.category} - $${data.amount}`);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryKey, subscribe, invalidateQueries]);

  return {
    lastSync,
    isRealTime,
    connectionStatus
  };
};

// Global real-time state management
export const useRealTimeState = () => {
  const [globalState, setGlobalState] = useState({
    notifications: [],
    activeUsers: [],
    systemStats: {
      totalSales: 0,
      totalPurchases: 0,
      totalInventory: 0,
      activeUsers: 0
    },
    lastUpdates: {}
  });

  const { subscribe } = useRealTimeUpdates();

  useEffect(() => {
    // Subscribe to all real-time events for global state
    const unsubscribers = [];

    unsubscribers.push(subscribe('sales:created', (data) => {
      setGlobalState(prev => ({
        ...prev,
        systemStats: {
          ...prev.systemStats,
          totalSales: prev.systemStats.totalSales + data.amount
        },
        lastUpdates: {
          ...prev.lastUpdates,
          sales: new Date()
        }
      }));
    }));

    unsubscribers.push(subscribe('purchases:created', (data) => {
      setGlobalState(prev => ({
        ...prev,
        systemStats: {
          ...prev.systemStats,
          totalPurchases: prev.systemStats.totalPurchases + data.amount
        },
        lastUpdates: {
          ...prev.lastUpdates,
          purchases: new Date()
        }
      }));
    }));

    unsubscribers.push(subscribe('user:activity', (data) => {
      setGlobalState(prev => ({
        ...prev,
        activeUsers: data.activeUsers || prev.activeUsers,
        lastUpdates: {
          ...prev.lastUpdates,
          userActivity: new Date()
        }
      }));
    }));

    unsubscribers.push(subscribe('alerts:triggered', (data) => {
      setGlobalState(prev => ({
        ...prev,
        notifications: [...prev.notifications, {
          id: Date.now(),
          type: data.severity,
          message: data.message,
          timestamp: new Date()
        }].slice(-10) // Keep only last 10 notifications
      }));
    }));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe]);

  return {
    globalState,
    setGlobalState
  };
};

export default useRealTimeUpdates;
