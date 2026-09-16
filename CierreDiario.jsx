import React, { useState, useMemo } from 'react';
import { 
  Sun, 
  Moon, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Minus, 
  History, 
  ChevronRight, 
  PieChart as PieChartIcon, 
  Package, 
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// Productos precargados sugeridos (se pueden sobreescribir o cargar dinámicamente)
const DEFAULT_PRODUCTS = [
  { id: 'croissant', name: 'Croissant Crujiente de Mantequilla', defaultPrice: 8.50 },
  { id: 'torta_cereza', name: 'Torta Cereza Retro (Porción)', defaultPrice: 15.00 },
  { id: 'torta_lavanda', name: 'Torta Royal Lavanda (Porción)', defaultPrice: 16.00 },
  { id: 'corazon_crema', name: 'Corazón de Crema y Cintas (Porción)', defaultPrice: 15.50 },
  { id: 'cupcake', name: 'Cupcake Red Velvet', defaultPrice: 9.00 },
  { id: 'cheesecake', name: 'Cheesecake Cítrico y Frutal', defaultPrice: 14.00 }
];

// Datos históricos simulados iniciales
const INITIAL_HISTORY = [
  { id: '1', date: '2026-09-12', product: 'Croissant Crujiente', produced: 25, leftover: 2, sold: 23, price: 8.50, expected: 195.50, real: 195.50, diff: 0, status: 'ok', wasteType: 'merma' },
  { id: '2', date: '2026-09-13', product: 'Torta Cereza Retro', produced: 15, leftover: 1, sold: 14, price: 15.00, expected: 210.00, real: 210.00, diff: 0, status: 'ok', wasteType: 'personal' },
  { id: '3', date: '2026-09-14', product: 'Cheesecake Cítrico', produced: 18, leftover: 3, sold: 15, price: 14.00, expected: 210.00, real: 200.00, diff: -10.00, status: 'faltante', notes: 'Pago de taxi delivery S/ 10', wasteType: 'regalo' },
  { id: '4', date: '2026-09-15', product: 'Croissant Crujiente', produced: 30, leftover: 4, sold: 26, price: 8.50, expected: 221.00, real: 221.00, diff: 0, status: 'ok', wasteType: 'merma' }
];

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#4A7A96'];

export default function CierreDiario() {
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' | 'historial'
  const [currentStep, setCurrentStep] = useState(1); // 1: Producción, 2: Cierre, 3: Arqueo

  // Form State
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCTS[0].name);
  const [customProduct, setCustomProduct] = useState('');
  const [unitPrice, setUnitPrice] = useState(DEFAULT_PRODUCTS[0].defaultPrice);
  const [producedQty, setProducedQty] = useState(15);
  
  const [leftoverQty, setLeftoverQty] = useState(0);
  const [wasteDestination, setWasteDestination] = useState('merma'); // 'personal' | 'regalo' | 'merma' | 'stock'
  
  const [realCash, setRealCash] = useState('');
  const [notes, setNotes] = useState('');

  // History State
  const [history, setHistory] = useState(INITIAL_HISTORY);

  // Derived Calculations
  const productName = customProduct.trim() !== '' ? customProduct : selectedProduct;
  const soldQty = Math.max(0, producedQty - leftoverQty);
  const expectedIncome = soldQty * unitPrice;
  
  const parsedRealCash = parseFloat(realCash) || 0;
  const cashDifference = realCash !== '' ? parsedRealCash - expectedIncome : 0;
  
  const isCashBalanced = realCash !== '' && Math.abs(cashDifference) < 0.01;
  const isCashDeficit = realCash !== '' && cashDifference < -0.01;
  const isCashSurplus = realCash !== '' && cashDifference > 0.01;

  // Handle Product Preset Selection
  const handleProductSelect = (prodName) => {
    setSelectedProduct(prodName);
    setCustomProduct('');
    const preset = DEFAULT_PRODUCTS.find(p => p.name === prodName);
    if (preset) {
      setUnitPrice(preset.defaultPrice);
    }
  };

  // Submit Closure Record
  const handleSaveClosure = (e) => {
    e.preventDefault();
    if (parsedRealCash <= 0 && realCash === '') {
      alert('Por favor ingresa el dinero real en caja.');
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      product: productName,
      produced: producedQty,
      leftover: leftoverQty,
      sold: soldQty,
      price: unitPrice,
      expected: expectedIncome,
      real: parsedRealCash,
      diff: cashDifference,
      status: isCashBalanced ? 'ok' : isCashDeficit ? 'faltante' : 'sobrante',
      wasteType: wasteDestination,
      notes: notes
    };

    setHistory([newRecord, ...history]);
    alert('¡Cierre diario registrado con éxito! 🎉');

    // Reset Form
    setCurrentStep(1);
    setProducedQty(15);
    setLeftoverQty(0);
    setRealCash('');
    setNotes('');
    setActiveTab('historial');
  };

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return history.slice().reverse().map(item => ({
      date: item.date.slice(5),
      ganancia: item.real,
      esperado: item.expected
    }));
  }, [history]);

  const wastePieData = useMemo(() => {
    const counts = { vendi: 0, merma: 0, regalo: 0, personal: 0 };
    history.forEach(item => {
      counts.vendi += item.sold;
      if (item.leftover > 0) {
        if (item.wasteType === 'merma') counts.merma += item.leftover;
        else if (item.wasteType === 'regalo') counts.regalo += item.leftover;
        else counts.personal += item.leftover;
      }
    });
    return [
      { name: 'Vendidos', value: counts.vendi },
      { name: 'Consumo Personal', value: counts.personal },
      { name: 'Regalo / Muestra', value: counts.regalo },
      { name: 'Merma / Pérdida', value: counts.merma }
    ].filter(d => d.value > 0);
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      
      {/* Top Mobile Header */}
      <header className="bg-slate-900 text-white px-4 py-5 shadow-lg border-b border-amber-500/30 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Cierre Diario</h1>
              <p className="text-xs text-slate-400">Ventas Callejeras & Inventario</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
            {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1.5 rounded-2xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`py-3 text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'nuevo'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>Nuevo Cierre</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`py-3 text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'historial'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-amber-600" />
            <span>Historial</span>
          </button>
        </div>

        {activeTab === 'nuevo' ? (
          <div>
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
              {[
                { step: 1, label: 'Mañana', icon: Sun },
                { step: 2, label: 'Noche', icon: Moon },
                { step: 3, label: 'Arqueo', icon: DollarSign }
              ].map(({ step, label, icon: Icon }) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`flex flex-col items-center space-y-1 transition-all ${
                    currentStep === step 
                      ? 'text-sky-700 font-bold scale-105' 
                      : currentStep > step 
                        ? 'text-emerald-600 font-medium' 
                        : 'text-slate-400 font-medium'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    currentStep === step 
                      ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-4 ring-sky-100' 
                      : currentStep > step 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-500' 
                        : 'bg-white text-slate-400 border-slate-300'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1: Producción del Día (Mañana) */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Paso 1: Producción (Mañana)</h2>
                      <p className="text-xs text-slate-500">¿Qué postre preparaste hoy para vender?</p>
                    </div>
                  </div>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Seleccionar Producto
                  </label>
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    {DEFAULT_PRODUCTS.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleProductSelect(prod.name)}
                        className={`w-full p-3.5 rounded-2xl text-left font-medium text-sm border transition-all flex items-center justify-between ${
                          selectedProduct === prod.name && customProduct === ''
                            ? 'bg-sky-50 border-sky-600 text-sky-950 font-semibold ring-2 ring-sky-500/20 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{prod.name}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                          S/ {prod.defaultPrice.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Product Input */}
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      O escribe otro producto personalizado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tarta de Manzana Artesanal"
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Unit Price Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Precio de Venta Unitario (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-300 text-slate-900 font-bold text-lg focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none"
                    />
                  </div>
                </div>

                {/* Produced Quantity Stepper */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Cantidad Producida Hoy
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setProducedQty(Math.max(1, producedQty - 1))}
                      className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 flex items-center justify-center transition-all font-bold text-xl border border-slate-300"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      value={producedQty}
                      onChange={(e) => setProducedQty(parseInt(e.target.value) || 0)}
                      className="flex-1 h-14 rounded-2xl border border-slate-300 text-center font-extrabold text-2xl text-slate-900 outline-none focus:border-sky-600"
                    />

                    <button
                      type="button"
                      onClick={() => setProducedQty(producedQty + 1)}
                      className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white flex items-center justify-center transition-all font-bold text-xl shadow-md"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Next Step Button */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full h-14 mt-4 bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-sky-700/25 flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Continuar a Cierre Nocturno</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2: Cierre Nocturno (Sobrantes) */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Paso 2: Conteo de Cierre (Noche)</h2>
                      <p className="text-xs text-slate-500">Producto: <span className="font-semibold text-slate-800">{productName}</span></p>
                    </div>
                  </div>
                </div>

                {/* Summary Banner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Producidos en la mañana:</span>
                    <p className="text-lg font-bold text-slate-900">{producedQty} unidades</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium">Precio Unitario:</span>
                    <p className="text-lg font-bold text-slate-900">S/ {unitPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Leftover Stepper */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    ¿Cuántas unidades te sobraron hoy?
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setLeftoverQty(Math.max(0, leftoverQty - 1))}
                      className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 flex items-center justify-center transition-all font-bold text-xl border border-slate-300"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    
                    <input
                      type="number"
                      min="0"
                      max={producedQty}
                      value={leftoverQty}
                      onChange={(e) => setLeftoverQty(Math.min(producedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="flex-1 h-14 rounded-2xl border border-slate-300 text-center font-extrabold text-2xl text-slate-900 outline-none focus:border-indigo-600"
                    />

                    <button
                      type="button"
                      onClick={() => setLeftoverQty(Math.min(producedQty, leftoverQty + 1))}
                      className="w-14 h-14 rounded-2xl bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white flex items-center justify-center transition-all font-bold text-xl shadow-md"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Calculated Sold Metric */}
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Unidades Vendidas</span>
                      <p className="text-2xl font-black text-emerald-950">{soldQty} <span className="text-sm font-normal text-emerald-800">unidades</span></p>
                    </div>
                  </div>
                </div>

                {/* Leftover Classification if > 0 */}
                {leftoverQty > 0 && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                      ¿Dónde fueron las {leftoverQty} unidad(es) sobrante(s)?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'merma', label: '🗑️ Pérdida / Merma' },
                        { id: 'personal', label: '😋 Consumo Personal' },
                        { id: 'regalo', label: '🎁 Regalo / Muestra' },
                        { id: 'stock', label: '📦 Stock para Mañana' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setWasteDestination(opt.id)}
                          className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                            wasteDestination === opt.id
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nav Buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-2/3 h-14 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-base rounded-2xl shadow-lg shadow-indigo-700/25 flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>Ir al Cuadre de Caja</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Arqueo / Cuadre de Caja */}
            {currentStep === 3 && (
              <form onSubmit={handleSaveClosure} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Paso 3: Arqueo de Caja</h2>
                      <p className="text-xs text-slate-500">Reconciliación de efectivo y transferencias</p>
                    </div>
                  </div>
                </div>

                {/* Expected Income Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md text-center space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ingreso Esperado ({soldQty} vendidos x S/ {unitPrice.toFixed(2)})
                  </span>
                  <p className="text-4xl font-black text-amber-400">
                    S/ {expectedIncome.toFixed(2)}
                  </p>
                </div>

                {/* Real Cash Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Dinero Real en Caja (Efectivo + Yape / Plin) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold text-xl">S/</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      placeholder="0.00"
                      value={realCash}
                      onChange={(e) => setRealCash(e.target.value)}
                      required
                      className="w-full h-16 pl-12 pr-4 rounded-2xl border-2 border-slate-300 text-slate-900 font-black text-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Visual Status Reconciliation Feedback */}
                {realCash !== '' && (
                  <div className="transition-all duration-300">
                    {isCashBalanced && (
                      <div className="p-4 rounded-2xl bg-emerald-500 text-white flex items-center space-x-3 shadow-md animate-in zoom-in-95">
                        <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-base">¡Caja Cuadrada Perfectamente! 🎉</p>
                          <p className="text-xs text-emerald-100">El dinero coincide con las ventas calculadas.</p>
                        </div>
                      </div>
                    )}

                    {isCashDeficit && (
                      <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 space-y-1 shadow-sm animate-in zoom-in-95">
                        <div className="flex items-center space-x-2 text-rose-700 font-bold">
                          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                          <span>Faltante en Caja: -S/ {Math.abs(cashDifference).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-rose-800 pl-8">
                          El dinero en caja es menor al esperado. Puedes agregar una nota abajo explicando el motivo (ej. gasto de pasajes).
                        </p>
                      </div>
                    )}

                    {isCashSurplus && (
                      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-1 shadow-sm animate-in zoom-in-95">
                        <div className="flex items-center space-x-2 text-amber-800 font-bold">
                          <AlertCircle className="w-6 h-6 flex-shrink-0" />
                          <span>Sobrante en Caja: +S/ {cashDifference.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-amber-800 pl-8">
                          Hay más dinero en caja del calculado. Revisa si hubo propinas o cobros extras.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Notas / Observaciones (Opcional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ej. Se pagó taxi de regreso S/ 8.00 o descuento a cliente recurrente."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Guardar Cierre</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (

          /* HISTORIAL & DASHBOARD TAB */
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Ingreso Total</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900">
                  S/ {history.reduce((acc, curr) => acc + curr.real, 0).toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">Últimos cierres</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-sky-600 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Vendidos</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900">
                  {history.reduce((acc, curr) => acc + curr.sold, 0)} <span className="text-xs font-normal text-slate-500">unds</span>
                </p>
                <span className="text-[10px] text-slate-400">Total acumulado</span>
              </div>
            </div>

            {/* Bar Chart: Daily Earnings */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Ingresos por Día (S/)</span>
                </h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(val) => [`S/ ${val.toFixed(2)}`, 'Dinero Real']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="ganancia" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Sales vs Leftovers Distribution */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-sky-600" />
                  <span>Distribución: Vendidos vs Mermas</span>
                </h3>
              </div>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wastePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {wastePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {wastePieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{entry.name}: <strong>{entry.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Log Records Feed */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 px-1">Registros Recientes</h3>
              {history.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{record.date}</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      record.status === 'ok' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : record.status === 'faltante' 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status === 'ok' ? '✅ Cuadrado' : record.status === 'faltante' ? `🚨 Faltante -S/ ${Math.abs(record.diff).toFixed(2)}` : `💡 Sobrante +S/ ${record.diff.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{record.product}</h4>
                      <p className="text-xs text-slate-500">
                        {record.produced} prod. / {record.sold} vend. / {record.leftover} sobrantes
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900">S/ {record.real.toFixed(2)}</span>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                      "{record.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
