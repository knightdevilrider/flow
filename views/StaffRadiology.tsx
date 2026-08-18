import React, { useState } from 'react';
import { RegistryTable } from '../components/RegistryTable';
import { RadiologyOrder, Theme } from '../types';
import { Activity, Search, Upload, CheckCircle, Clock } from 'lucide-react';

interface StaffRadiologyProps {
  orders: RadiologyOrder[];
  theme: Theme;
  isAdmin?: boolean;
}

const StaffRadiology: React.FC<StaffRadiologyProps> = ({ orders, theme, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = orders.filter(order => 
    order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full">
      <div className="shrink-0 w-full">
        <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" />
            Radiology & Imaging (RIS)
          </h1>
          <p className="text-slate-400">Manage radiology orders and diagnostic reports.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex-1">
        <div className="w-full overflow-x-auto border-inherit rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="p-4 font-medium text-slate-400">Patient</th>
                <th className="p-4 font-medium text-slate-400">Test Required</th>
                <th className="p-4 font-medium text-slate-400">Ordered By</th>
                <th className="p-4 font-medium text-slate-400">Status</th>
                <th className="p-4 font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-white">{order.patientName}</p>
                    <p className="text-xs text-slate-500">ID: {order.patientId}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-purple-400">{order.testName}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-300">Dr. {order.orderedBy}</span>
                    <p className="text-xs text-slate-500">
                      {new Date(order.orderedAt).toLocaleString()}
                    </p>
                  </td>
                  <td className="p-4">
                    {order.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {order.status === 'pending' ? (
                      <button className="flex items-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        Upload Result
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-sm">
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 sm:p-8 text-center text-slate-400">
                    No radiology orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">
        <RegistryTable 
          patients={typeof patients !== "undefined" ? patients : (typeof orders !== "undefined" ? orders : []) as any} 
          theme={theme} 
          onRowClick={typeof setTimelinePatient !== "undefined" ? (p) => isAdmin && setTimelinePatient(p) : undefined} 
          hideCategoryFilter={true} 
        />
      </div>
    </div>
  );
};
export default StaffRadiology;
