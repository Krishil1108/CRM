import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';

const InventoryReports = ({ data, graphType, dateRange }) => {
  
  // Color palette for charts
  const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];
  
  // Status colors
  const STATUS_COLORS = {
    'In Stock': '#00C49F',
    'Out of Stock': '#FF8042',
    'Low Stock': '#FFBB28'
  };

  // Prepare data for different chart types
  const prepareStockStatusData = () => {
    if (!data?.stockStatus || !Array.isArray(data.stockStatus)) {
      // Return default data structure if no data available
      return [
        { name: 'In Stock', value: 0, count: 0, status: 'In Stock', color: STATUS_COLORS['In Stock'] },
        { name: 'Out of Stock', value: 0, count: 0, status: 'Out of Stock', color: STATUS_COLORS['Out of Stock'] },
        { name: 'Low Stock', value: 0, count: 0, status: 'Low Stock', color: STATUS_COLORS['Low Stock'] }
      ];
    }
    
    return data.stockStatus.map((item, index) => ({
      name: item.status, // Use 'name' for proper legend display
      value: item.count || 0, // Use 'value' for pie chart dataKey
      count: item.count || 0,
      status: item.status,
      color: STATUS_COLORS[item.status] || COLORS[index % COLORS.length]
    }));
  };

  const prepareCategoryData = () => {
    if (!data?.categoryDistribution) return [];
    
    return data.categoryDistribution.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));
  };

  const prepareTimelineData = () => {
    if (!data?.timeline) return [];
    
    return data.timeline.map(item => ({
      ...item,
      year: new Date(item.date).getFullYear(),
      month: format(new Date(item.date), 'MMM yyyy'),
      totalValue: item.totalValue || 0,
      totalItems: item.totalItems || 0,
      inStock: item.inStock || 0,
      outOfStock: item.outOfStock || 0,
      lowStock: item.lowStock || 0
    }));
  };

  const prepareHistogramData = () => {
    if (!data?.valueDistribution) return [];
    
    return data.valueDistribution.map((item, index) => ({
      range: item.range,
      count: item.count,
      value: item.totalValue || 0,
      fill: COLORS[index % COLORS.length]
    }));
  };

  const renderPieChart = () => {
    const pieData = prepareStockStatusData().map(item => ({
    ...item,
    name: item.status // Ensure proper legend field
  }));
    
    return (
      <div className="chart-container">
        <h3>Inventory Status Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={140}
              fill="#8884d8"
              dataKey="count"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Items']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = () => {
    const barData = prepareCategoryData();
    
    return (
      <div className="chart-container">
        <h3>Inventory by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <Tooltip 
              formatter={(value, name) => [value, name === 'count' ? 'Items' : name === 'totalValue' ? 'Value (₹)' : name]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#0088FE" name="Item Count" />
            <Bar dataKey="totalValue" fill="#00C49F" name="Total Value (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    const lineData = prepareTimelineData();
    
    // Ensure we have meaningful data for the chart
    const hasData = lineData && lineData.length > 0;
    const maxItems = hasData ? Math.max(...lineData.map(d => d.totalItems)) : 0;
    const minItems = hasData ? Math.min(...lineData.map(d => d.totalItems)) : 0;
    const maxValue = hasData ? Math.max(...lineData.map(d => d.totalValue)) : 0;
    
    return (
      <div className="chart-container">
        <h3>Inventory Growth Trend (Last 10 Years)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={lineData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year"
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
              domain={hasData ? [Math.max(0, minItems - 1), maxItems + 1] : [0, 10]}
              allowDecimals={false}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'totalValue' ? `₹${value.toLocaleString('en-IN')}` : `${value} items`,
                name === 'totalValue' ? 'Total Value' : 
                name === 'totalItems' ? 'Total Items' :
                name === 'inStock' ? 'In Stock' :
                name === 'outOfStock' ? 'Out of Stock' :
                name === 'lowStock' ? 'Low Stock' : name
              ]}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalItems" 
              stroke="#0088FE" 
              strokeWidth={3}
              dot={{ fill: '#0088FE', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#0088FE', strokeWidth: 2 }}
              name="Total Items"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="inStock" 
              stroke="#00C49F" 
              strokeWidth={2}
              dot={{ fill: '#00C49F', strokeWidth: 1, r: 4 }}
              name="In Stock"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="outOfStock" 
              stroke="#FF8042" 
              strokeWidth={2}
              dot={{ fill: '#FF8042', strokeWidth: 1, r: 4 }}
              name="Out of Stock"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="lowStock" 
              stroke="#FFBB28" 
              strokeWidth={2}
              dot={{ fill: '#FFBB28', strokeWidth: 1, r: 4 }}
              name="Low Stock"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHistogram = () => {
    const histData = prepareHistogramData();
    
    return (
      <div className="chart-container">
        <h3>Inventory Value Distribution</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={histData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'value' ? `₹${value.toLocaleString('en-IN')}` : value,
                name === 'value' ? 'Total Value' : 'Item Count'
              ]}
            />
            <Legend />
            <Bar dataKey="count" fill="#FFBB28" name="Item Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderColumnChart = () => {
    const columnData = prepareTimelineData();
    
    return (
      <div className="chart-container">
        <h3>Comprehensive Inventory Analysis</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={columnData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'totalValue' ? `₹${value.toLocaleString('en-IN')}` : value,
                name === 'totalValue' ? 'Total Value' : 
                name === 'totalItems' ? 'Total Items' : name
              ]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            <Bar dataKey="totalItems" fill="#0088FE" name="Total Items" />
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#FF8042" 
              strokeWidth={3}
              name="Total Value (₹)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderChart = () => {
    switch (graphType) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'histogram':
        return renderHistogram();
      case 'column':
        return renderColumnChart();
      default:
        return renderLineChart();
    }
  };

  // Show message if no data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">📦</div>
        <h3>No Inventory Data Available</h3>
        <p>No inventory data found for the selected date range and filters.</p>
        <div className="date-range-info">
          <small>
            Selected Range: {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
          </small>
        </div>
      </div>
    );
  }

  // Helper function to format metrics with conditional display
  const formatMetric = (value, fallback = 'No data', isNumeric = true, isCurrency = false) => {
    if (value === null || value === undefined || (value === 0 && !isNumeric)) {
      return fallback;
    }
    if (isCurrency) {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return isNumeric ? value.toLocaleString() : value;
  };

  // Check if we have meaningful data
  const hasData = data && Object.keys(data).length > 0 && data.totalItems > 0;

  return (
    <div className="inventory-reports">
      <div className="reports-header">
        <h2>Inventory Analytics</h2>
        <div className="date-range-display">
          <span>📅 {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}</span>
        </div>
      </div>
      
      {renderChart()}
      
      {/* Enhanced Key Insights */}
      <div className="chart-insights">
        <div className="insight-card">
          <h4>Key Insights</h4>
          <ul>
            <li className={!hasData ? 'metric-inactive' : ''}>
              Total inventory items: <strong>{formatMetric(data.totalItems, '0')}</strong>
            </li>
            <li className={!hasData || !data.totalValue ? 'metric-inactive' : ''}>
              Total inventory value: <strong>{formatMetric(data.totalValue, 'No value data', true, true)}</strong>
            </li>
            <li className={!hasData || !data.inStockItems ? 'metric-inactive' : ''}>
              Items in stock: <strong>{formatMetric(data.inStockItems, 'No stock data')}</strong>
            </li>
            <li className={!hasData || (!data.outOfStockItems && data.outOfStockItems !== 0) ? 'metric-inactive' : ''}>
              Items out of stock: <strong>{formatMetric(data.outOfStockItems, 'No stock data')}</strong>
            </li>
            <li className={!hasData || (!data.lowStockItems && data.lowStockItems !== 0) ? 'metric-inactive' : ''}>
              Low stock items: <strong>{formatMetric(data.lowStockItems, 'No stock data')}</strong>
            </li>
            <li className={!hasData || !data.topCategory || data.topCategory === 'No data' ? 'metric-inactive' : ''}>
              Top category: <strong>{data.topCategory || 'No category data'}</strong>
            </li>
          </ul>
          {!hasData && (
            <div className="no-data-notice">
              <p><em>Add some inventory items to see detailed analytics and insights.</em></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;