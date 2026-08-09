import React, { useState } from 'react';
import { InventoryItem, Theme } from '../types';
import { Package, Search, Plus, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

interface StaffInventoryProps {
  inventory: InventoryItem[];
  theme: Theme;
  isAdmin?: boolean;
}

const StaffInventory: React.FC<StaffInventoryProps> = ({ inventory, theme, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-500" />
            Store & Inventory
          </h1>
          <p className="text-slate-400">Manage medical supplies, consumables, and equipment.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-64"
            />
          </div>
          {isAdmin && (
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-3 sm:p-6 border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 mb-1">Total Items</p>
              <h3 className="text-3xl font-bold">{inventory.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 sm:p-6 border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 mb-1">Low Stock Alerts</p>
              <h3 className="text-3xl font-bold text-amber-500">
                {inventory.filter(i => i.stockLevel <= i.reorderLevel).length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 sm:p-6 border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 mb-1">Recent Transactions</p>
              <h3 className="text-3xl font-bold">14</h3>
            </div>
            <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
              <ArrowDown className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex-1">
        <div className="w-full overflow-x-auto border-inherit rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="p-4 font-medium text-slate-400">Item Name</th>
                <th className="p-4 font-medium text-slate-400">Category</th>
                <th className="p-4 font-medium text-slate-400">Stock Level</th>
                <th className="p-4 font-medium text-slate-400">Status</th>
                <th className="p-4 font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">ID: {item.id}</p>
                  </td>
                  <td className="p-4">
                    <span className="capitalize px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.stockLevel}</span>
                      <span className="text-slate-400 text-sm">{item.unit}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {item.stockLevel <= item.reorderLevel ? (
                      <span className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-green-500 text-sm font-medium">In Stock</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Receive Stock">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Dispense Stock">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 sm:p-8 text-center text-slate-400">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffInventory;
