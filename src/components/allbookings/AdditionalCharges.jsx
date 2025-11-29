import React from 'react';
import { FaPlus, FaTimes, FaMoneyBillWave, FaFileAlt } from 'react-icons/fa';

const AdditionalCharges = ({
  charges,
  newCharge,
  setNewCharge,
  onAddCharge,
  onRemoveCharge,
  onSaveAll,
  unsavedCount,
  loading,
  formatCurrency
}) => {
  const total = charges.reduce(
    (sum, c) => sum + parseFloat(c.amount || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <FaMoneyBillWave className="mr-2 text-indigo-600" />
        Additional Charges
      </h2>

      {/* ADD NEW CHARGE BOX */}
      <div className="bg-indigo-50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* ✅ UPDATED DROPDOWN */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Charge Type
            </label>
            <select
              value={newCharge.type}
              onChange={(e) =>
                setNewCharge({ ...newCharge, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
              bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Charge Type</option>
              <option value="Challan">Challan</option>
              <option value="Damage">Damage</option>
              <option value="Other Charges">Other Charges</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={newCharge.amount}
              onChange={(e) =>
                setNewCharge({ ...newCharge, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
              focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              onClick={onAddCharge}
              disabled={
                loading || !newCharge.type || !newCharge.amount
              }
              className={`w-full px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center transition-colors ${
                loading || !newCharge.type || !newCharge.amount
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <FaPlus className="mr-2" />
              Add Charge
            </button>
          </div>
        </div>

        {/* Save All */}
        {unsavedCount > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={onSaveAll}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center"
            >
              💾 Save All ({unsavedCount})
            </button>
          </div>
        )}
      </div>

      {/* CHARGES LIST */}
      {charges.length > 0 ? (
        <div className="space-y-2">
          {charges.map((charge, index) => (
            <div
              key={charge.id || index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                charge.savedToBackend
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {charge.type}
                </div>
                <div
                  className={`text-xs ${
                    charge.savedToBackend
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}
                >
                  {charge.savedToBackend ? '✔ Saved' : '⏳ Pending'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-indigo-600">
                  ₹{charge.amount}
                </div>

                <button
                  onClick={() =>
                    onRemoveCharge(charge.id, charge.savedToBackend)
                  }
                  disabled={loading}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}

          {/* TOTAL */}
          <div className="bg-indigo-100 p-3 border-2 border-indigo-300 rounded-lg mt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">
                Total Additional Charges:
              </span>
              <span className="text-xl font-bold text-indigo-600">
                ₹{total}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-2" />
          No additional charges added
        </div>
      )}
    </div>
  );
};

export default AdditionalCharges;
