import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Flame, 
  DollarSign, 
  Trophy, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  PackageCheck, 
  Trash2, 
  Gift, 
  UserCheck, 
  Store, 
  Layers,
  History,
  RotateCcw,
  Star
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

// Catalogo predeterminado de productos sugeridos
const INITIAL_PRODUCT_CATALOG = [
  'Galleta de orea and creme',
  'Galleta de chin chin',
  'Brownies de chocolate',
  'Muffins de arandano'
];

// Datos históricos de ejemplo iniciales
const INITIAL_TANDAS_HISTORY = [
  {
    id: 'tanda-101',
    name: 'Tanda Fin de Semana (Feria)',
    date: '2026-09-12',
    investment: 85.00,
    revenue: 210.00,
    profit: 125.00,
    margin: 147.0,
    items: [
      { name: 'Brownies de chocolate', baked: 20, leftover: 2, sold: 18, wasteType: 'merma' },
      { name: 'Galleta de orea and creme', baked: 15, leftover: 0, sold: 15, wasteType: 'none' }
    ]
  }
];

export default function ControlTandas() {
  const [activeView, setActiveView] = useState('wizard'); // 'wizard' | 'historial'
  const [step, setStep] = useState(1); // 1: Compras, 2: Horneado, 3: Venta/Cierre, 4: Post-Mortem

  // Dynamic Catalog State
  const [catalog, setCatalog] = useState(INITIAL_PRODUCT_CATALOG);

  // Unit Prices State per Product
  const [unitPrices, setUnitPrices] = useState({
    'Galleta de orea and creme': 5.00,
    'Galleta de chin chin': 4.00,
    'Brownies de chocolate': 6.50,
    'Muffins de arandano': 6.00
  });

  // Step 1: Compras & Inversión State
  const [tandaName, setTandaName] = useState(`Tanda ${new Date().toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}`);
  const [selectedProducts, setSelectedProducts] = useState(['Brownies de chocolate']);
  const [customProductInput, setCustomProductInput] = useState('');
  const [totalInvestment, setTotalInvestment] = useState(75.00);

  // Step 2: Rendimiento / Horneado State (unidades que salieron del horno por producto)
  const [bakedQuantities, setBakedQuantities] = useState({
    'Brownies de chocolate': 18
  });

  // Step 3: Sobrantes & Venta Total State
  const [leftoverQuantities, setLeftoverQuantities] = useState({
    'Brownies de chocolate': 2
  });

  const [wasteTypes, setWasteTypes] = useState({
    'Brownies de chocolate': 'merma'
  });

  const [totalRevenue, setTotalRevenue] = useState(104.00);

  // Histórico de Tandas
  const [tandasHistory, setTandasHistory] = useState(INITIAL_TANDAS_HISTORY);
  const [completedPostMortem, setCompletedPostMortem] = useState(null);

  // Fetch catalog from backend API on mount
  React.useEffect(() => {
    fetch('/api/tanda-products')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
          const priceMap = {};
          data.forEach(p => {
            if (typeof p === 'object') {
              priceMap[p.name] = p.price;
            } else {
              priceMap[p] = 5.00;
            }
          });
          setUnitPrices(prev => ({ ...priceMap, ...prev }));
        }
      })
      .catch(err => console.warn('Could not load tanda products:', err));
  }, []);

  // KPI calculations for Dashboard
  const kpiData = useMemo(() => {
    let totalProfit = 0;
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalBaked = 0;
    let totalSold = 0;
    let unsoldUnits = 0;
    let unsoldValue = 0;

    const productStats = {};

    tandasHistory.forEach(t => {
      const inv = parseFloat(t.investment !== undefined ? t.investment : t.investmentCost) || 0;
      const rev = parseFloat(t.revenue !== undefined ? t.revenue : t.totalEarned) || 0;
      const profit = parseFloat(t.profit !== undefined ? t.profit : t.netProfit) || (rev - inv);

      totalInvestment += inv;
      totalRevenue += rev;
      totalProfit += profit;

      const items = t.items || [];
      items.forEach(it => {
        const pName = it.name;
        const baked = parseInt(it.baked) || 0;
        const leftover = parseInt(it.leftover) || 0;
        const sold = Math.max(0, baked - leftover);
        const price = unitPrices[pName] || 5.00;

        totalBaked += baked;
        totalSold += sold;
        unsoldUnits += leftover;
        unsoldValue += leftover * price;

        if (!productStats[pName]) {
          productStats[pName] = { baked: 0, sold: 0, leftover: 0, revenue: 0, wasteType: { merma: 0, personal: 0, regalo: 0 } };
        }
        productStats[pName].baked += baked;
        productStats[pName].sold += sold;
        productStats[pName].leftover += leftover;
        productStats[pName].revenue += sold * price;

        const wType = it.wasteType || 'merma';
        if (productStats[pName].wasteType[wType] !== undefined) {
          productStats[pName].wasteType[wType] += leftover;
        } else {
          productStats[pName].wasteType.merma += leftover;
        }
      });
    });

    let starProduct = 'N/A';
    let maxSales = 0;
    Object.keys(productStats).forEach(p => {
      if (productStats[p].sold > maxSales) {
        maxSales = productStats[p].sold;
        starProduct = p;
      }
    });

    const salesEfficiency = totalBaked > 0 ? (totalSold / totalBaked) * 100 : 0;

    return {
      totalProfit,
      totalInvestment,
      totalRevenue,
      totalBaked,
      totalSold,
      unsoldUnits,
      unsoldValue,
      starProduct,
      starProductSales: maxSales,
      salesEfficiency,
      productStats
    };
  }, [tandasHistory, unitPrices]);

  const DESTINO_COLORS = ['#10B981', '#F59E0B', '#F43F5E'];

  const destinoData = useMemo(() => {
    let soldCount = 0;
    let giftCount = 0;
    let wasteCount = 0;

    tandasHistory.forEach(t => {
      (t.items || []).forEach(it => {
        const baked = parseInt(it.baked) || 0;
        const leftover = parseInt(it.leftover) || 0;
        const sold = Math.max(0, baked - leftover);
        soldCount += sold;

        const wType = it.wasteType || 'merma';
        if (wType === 'personal' || wType === 'regalo') {
          giftCount += leftover;
        } else {
          wasteCount += leftover;
        }
      });
    });

    return [
      { name: 'Vendido', value: soldCount },
      { name: 'Consumo / Regalo', value: giftCount },
      { name: 'Merma', value: wasteCount }
    ];
  }, [tandasHistory]);

  const historialBarData = useMemo(() => {
    return tandasHistory.slice(0, 6).reverse().map(t => ({
      name: t.name ? (t.name.length > 10 ? t.name.substring(0, 10) + '...' : t.name) : t.date,
      Inversión: parseFloat(t.investment || 0),
      Recaudación: parseFloat(t.revenue || 0)
    }));
  }, [tandasHistory]);

  const topRentablesData = useMemo(() => {
    const stats = kpiData.productStats;
    return Object.keys(stats)
      .map(p => ({
        name: p.length > 12 ? p.substring(0, 12) + '...' : p,
        ganancia: stats[p].revenue
      }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 5);
  }, [kpiData]);

  const sobrantesData = useMemo(() => {
    const stats = kpiData.productStats;
    return Object.keys(stats)
      .map(p => ({
        name: p.length > 12 ? p.substring(0, 12) + '...' : p,
        sobrantes: stats[p].leftover
      }))
      .sort((a, b) => b.sobrantes - a.sobrantes)
      .slice(0, 5);
  }, [kpiData]);

  // Delete product from catalog
  const handleDeleteProduct = (prodName) => {
    if (catalog.length <= 1) {
      return alert('Debes mantener al menos un producto en la lista.');
    }
    if (window.confirm(`¿Deseas eliminar "${prodName}" de la lista de productos?`)) {
      const updated = catalog.filter(p => p !== prodName);
      setCatalog(updated);
      setSelectedProducts(prev => {
        const filtered = prev.filter(p => p !== prodName);
        return filtered.length > 0 ? filtered : [updated[0]];
      });
      fetch('/api/tanda-products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prodName })
      }).catch(err => console.error('Error deleting product:', err));
    }
  };

  // Toggle producto en selección múltiple
  const toggleProductSelection = (prodName) => {
    if (selectedProducts.includes(prodName)) {
      if (selectedProducts.length === 1) return alert('Debes seleccionar al menos un producto para la tanda.');
      setSelectedProducts(selectedProducts.filter(p => p !== prodName));
    } else {
      setSelectedProducts([...selectedProducts, prodName]);
      // Initialize default baked quantity
      if (!bakedQuantities[prodName]) {
        setBakedQuantities(prev => ({ ...prev, [prodName]: 12 }));
        setLeftoverQuantities(prev => ({ ...prev, [prodName]: 0 }));
      }
    }
  };

  // Agregar producto personalizado
  const handleAddCustomProduct = () => {
    const trimmed = customProductInput.trim();
    if (!trimmed) return;

    if (!catalog.includes(trimmed)) {
      setCatalog(prev => [...prev, trimmed]);
    }
    if (!selectedProducts.includes(trimmed)) {
      setSelectedProducts(prev => [...prev, trimmed]);
      setBakedQuantities(prev => ({ ...prev, [trimmed]: 10 }));
      setLeftoverQuantities(prev => ({ ...prev, [trimmed]: 0 }));
    }
    setCustomProductInput('');

    fetch('/api/tanda-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed })
  };

  // Modificar cantidad horneada
  const updateBakedQty = (prodName, delta) => {
    setBakedQuantities(prev => {
      const current = prev[prodName] || 0;
      const nextVal = Math.max(1, current + delta);
      return { ...prev, [prodName]: nextVal };
    });
  };

  // Modificar cantidad sobrante
  const updateLeftoverQty = (prodName, delta) => {
    setLeftoverQuantities(prev => {
      const maxBaked = bakedQuantities[prodName] || 0;
      const current = prev[prodName] || 0;
      const nextVal = Math.min(maxBaked, Math.max(0, current + delta));
      return { ...prev, [prodName]: nextVal };
    });
  };

  // Totales calculados para la tanda actual
  const summaryMetrics = useMemo(() => {
    const items = selectedProducts.map(name => {
      const baked = bakedQuantities[name] || 0;
      const leftover = leftoverQuantities[name] || 0;
      const sold = Math.max(0, baked - leftover);
      return {
        name,
        baked,
        leftover,
        sold,
        wasteType: wasteTypes[name] || 'merma'
      };
    });

    const totalBaked = items.reduce((acc, i) => acc + i.baked, 0);
    const totalSold = items.reduce((acc, i) => acc + i.sold, 0);
    const totalLeftover = items.reduce((acc, i) => acc + i.leftover, 0);

    const netProfit = totalRevenue - totalInvestment;
    const roiMargin = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    return {
      items,
      totalBaked,
      totalSold,
      totalLeftover,
      netProfit,
      roiMargin
    };
  }, [selectedProducts, bakedQuantities, leftoverQuantities, wasteTypes, totalInvestment, totalRevenue]);

  // Finalizar Tanda y Generar Post-Mortem
  const handleFinishTanda = (e) => {
    e.preventDefault();
    if (totalRevenue <= 0 && totalRevenue !== 0) {
      alert('Por favor ingresa el dinero total recaudado.');
      return;
    }

    const newTandaRecord = {
      id: `tanda-${Date.now()}`,
      name: tandaName || 'Tanda de Producción',
      date: new Date().toISOString().split('T')[0],
      investment: totalInvestment,
      revenue: totalRevenue,
      profit: summaryMetrics.netProfit,
      margin: summaryMetrics.roiMargin,
      items: summaryMetrics.items
    };

    setCompletedPostMortem(newTandaRecord);
    setTandasHistory([newTandaRecord, ...tandasHistory]);
    setStep(4); // Pasar al Post-Mortem
  };

  // Reiniciar para nueva tanda
  const handleResetForNewTanda = () => {
    setTandaName(`Tanda ${new Date().toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}`);
    setSelectedProducts(['Brownies de Chocolate Belga', 'Galletas Artesanales Oreo']);
    setTotalInvestment(75.00);
    setBakedQuantities({
      'Brownies de Chocolate Belga': 18,
      'Galletas Artesanales Oreo': 15
    });
    setLeftoverQuantities({
      'Brownies de Chocolate Belga': 0,
      'Galletas Artesanales Oreo': 0
    });
    setTotalRevenue(195.00);
    setCompletedPostMortem(null);
    setStep(1);
    setActiveView('wizard');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20">
      
      {/* Top Mobile iOS Header */}
      <header className="bg-slate-950 text-white px-4 py-5 shadow-md border-b border-amber-500/30 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">Control de Tandas</h1>
              <p className="text-[11px] text-slate-400 font-medium">Ciclo Completo: Compras → Horno → Ventas</p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-amber-300">
            {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">

        {/* Sub-tabs Header Switcher */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl grid grid-cols-3 gap-1 mb-6">
          <button
            onClick={() => setActiveView('wizard')}
            className={`py-3 text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeView === 'wizard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Tanda Activa</span>
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`py-3 text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeView === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('historial')}
            className={`py-3 text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeView === 'historial'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-sky-600" />
            <span>Histórico</span>
          </button>
        </div>

        {activeView === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {tandasHistory.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-inner">
                  🧁
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">¡Aún no hay Tandas registradas!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Registra tu primera tanda de producción para ver el análisis de rentabilidad, productos estrella y control de mermas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('wizard')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear mi Primera Tanda</span>
                </button>
              </div>
            ) : (
              <>
                {/* 4 KPI CARDS ROW */}
                <div className="grid grid-cols-2 gap-3">
                  {/* KPI 1: Ganancia Neta Total */}
                  <div className="bg-emerald-50/90 p-4 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                        Ganancia Neta Total
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl font-black text-emerald-700">
                      S/ {kpiData.totalProfit.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                      Recaudado - Inversión
                    </span>
                  </div>

                  {/* KPI 2: Producto Estrella */}
                  <div className="bg-amber-50/90 p-4 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                        Producto Estrella
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Star className="w-4 h-4 fill-amber-200" />
                      </div>
                    </div>
                    <p className="text-xs font-black text-amber-950 truncate" title={kpiData.starProduct}>
                      {kpiData.starProduct}
                    </p>
                    <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                      {kpiData.starProductSales} vendidas
                    </span>
                  </div>

                  {/* KPI 3: Dinero en Merma/Regalos */}
                  <div className="bg-rose-50/90 p-4 rounded-3xl border border-rose-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider">
                        Merma / Regalos
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl font-black text-rose-700">
                      S/ {kpiData.unsoldValue.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                      {kpiData.unsoldUnits} unidades no vendidas
                    </span>
                  </div>

                  {/* KPI 4: Eficiencia de Venta */}
                  <div className="bg-purple-50/90 p-4 rounded-3xl border border-purple-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase text-purple-900 tracking-wider">
                        Eficiencia Venta
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl font-black text-purple-700">
                      {kpiData.salesEfficiency.toFixed(1)}%
                    </p>
                    <span className="text-[10px] text-purple-600 font-bold block mt-0.5">
                      {kpiData.totalSold}/{kpiData.totalBaked} horneadas
                    </span>
                  </div>
                </div>

                {/* GRID 2x2 DE GRÁFICOS RECHARTS PASTEL */}
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Gráfico 1: Destino de Producción (PieChart Dona) */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        1. Destino de Producción (Dona)
                      </h4>
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={destinoData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {destinoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DESTINO_COLORS[index % DESTINO_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} unidades`, 'Cantidad']} />
                          <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico 2: Historial de Tandas (BarChart Inversión vs Recaudación) */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        2. Historial de Tandas (Inversión vs Recaudación)
                      </h4>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historialBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(value) => [`S/ ${value}`, 'Monto']} />
                          <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="Inversión" fill="#F87171" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="Recaudación" fill="#34D399" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico 3: Top Productos Más Rentables (BarChart Horizontal) */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        3. Top Productos Más Rentables
                      </h4>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topRentablesData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={85} />
                          <Tooltip formatter={(value) => [`S/ ${value}`, 'Ganancia Estimada']} />
                          <Bar dataKey="ganancia" fill="#A78BFA" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico 4: Alerta de Sobrantes (BarChart) */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        4. Alerta de Sobrantes (Unidades sin Vender)
                      </h4>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sobrantesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(value) => [`${value} unidades`, 'Sobrantes']} />
                          <Bar dataKey="sobrantes" fill="#FB7185" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        )}

        {activeView === 'wizard' ? (
          <div>

            {/* Step Lifecycle Bar (Only visible steps 1 to 3) */}
            {step <= 3 && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm mb-5 flex items-center justify-between">
                {[
                  { id: 1, name: 'Compras', icon: ShoppingBag },
                  { id: 2, name: 'Horneado', icon: Flame },
                  { id: 3, name: 'Cierre', icon: DollarSign }
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setStep(id)}
                    className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
                      step === id 
                        ? 'bg-amber-50 text-amber-900 font-extrabold scale-105' 
                        : step > id 
                          ? 'text-emerald-600 font-bold' 
                          : 'text-slate-400 font-medium'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      step === id 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : step > id 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px]">{name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* PASO 1: Creación e Inversión (Compras) */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Paso 1: Inversión en Compras</h2>
                    <p className="text-xs text-slate-500">¿Qué vas a hornear y cuánto invertiste?</p>
                  </div>
                </div>

                {/* Batch Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre o Identificador de la Tanda
                  </label>
                  <input
                    type="text"
                    value={tandaName}
                    onChange={(e) => setTandaName(e.target.value)}
                    placeholder="Ej. Tanda Fin de Semana"
                    className="w-full h-12 px-4 rounded-2xl border border-slate-300 font-semibold text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                {/* Product Multi-Selection Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Seleccionar Productos a Preparar
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {catalog.map((prodItem) => {
                      const prodName = typeof prodItem === 'string' ? prodItem : prodItem.name;
                      const isSelected = selectedProducts.includes(prodName);
                      const price = unitPrices[prodName] || (typeof prodItem === 'object' && prodItem.price) || 5.00;

                      return (
                        <div key={prodName} className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-400'
                            : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => toggleProductSelection(prodName)}
                              className="flex-1 text-left text-xs font-bold text-slate-800 flex items-center justify-between"
                            >
                              <span>{prodName}</span>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                isSelected ? 'bg-amber-500 text-white font-black' : 'border border-slate-300'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prodName)}
                              title={`Eliminar ${prodName}`}
                              className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {isSelected && (
                            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-900">Precio de venta unitario al público:</span>
                              <div className="flex items-center space-x-1">
                                <span className="font-extrabold text-amber-900">S/</span>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  value={price}
                                  onChange={(e) => {
                                    const newP = parseFloat(e.target.value) || 0;
                                    setUnitPrices(prev => ({ ...prev, [prodName]: newP }));
                                    fetch('/api/tanda-products', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name: prodName, price: newP })
                                    }).catch(err => console.error(err));
                                  }}
                                  className="w-20 h-9 px-2 rounded-xl border border-amber-300 font-extrabold text-right text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Item */}
                  <div className="mt-3 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Otro producto (ej. Alfajores)"
                      value={customProductInput}
                      onChange={(e) => setCustomProductInput(e.target.value)}
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomProduct}
                      className="h-11 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Total Spent Investment Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                    Costo Total de Compras / Inversión (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-lg">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={totalInvestment}
                      onChange={(e) => setTotalInvestment(parseFloat(e.target.value) || 0)}
                      className="w-full h-14 pl-11 pr-4 rounded-2xl border-2 border-slate-300 font-black text-2xl text-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Ingresa el total gastado en harina, mantequilla, huevos, empaques, etc.</p>
                </div>

                {/* Continue to Step 2 */}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black text-base rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Pasar a Rendimiento de Horneado</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* PASO 2: Rendimiento (Horneado) */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Paso 2: Rendimiento del Horno</h2>
                    <p className="text-xs text-slate-500">¿Cuántas unidades salieron listas del horno?</p>
                  </div>
                </div>

                {/* Products Yield Steppers */}
                <div className="space-y-4">
                  {selectedProducts.map((prodName) => (
                    <div key={prodName} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <span className="block text-xs font-bold text-slate-900">{prodName}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => updateBakedQty(prodName, -1)}
                          className="w-12 h-12 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 text-lg shadow-sm active:scale-95 flex items-center justify-center"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        
                        <input
                          type="number"
                          min="1"
                          value={bakedQuantities[prodName] !== undefined ? bakedQuantities[prodName] : 12}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setBakedQuantities(prev => ({ ...prev, [prodName]: raw === '' ? '' : Math.max(0, parseInt(raw) || 0) }));
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                              setBakedQuantities(prev => ({ ...prev, [prodName]: 1 }));
                            }
                          }}
                          className="flex-1 h-12 rounded-xl border border-slate-300 text-center font-black text-xl text-slate-900 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => updateBakedQty(prodName, 1)}
                          className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-md active:scale-95 flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Baked Summary Metric */}
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Horneado</span>
                    <p className="text-2xl font-black text-rose-950">{summaryMetrics.totalBaked} <span className="text-xs font-normal">unidades</span></p>
                  </div>
                  <Flame className="w-8 h-8 text-rose-500" />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-2/3 h-14 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>Pasar a Ventas & Cierre</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Cierre de Tanda y Cuadre */}
            {step === 3 && (
              <form onSubmit={handleFinishTanda} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Paso 3: Cierre & Recaudación</h2>
                    <p className="text-xs text-slate-500">Registra sobrantes y el dinero cobrado</p>
                  </div>
                </div>

                {/* Leftover Steppers per Product */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ¿Cuántas unidades SOBRARON de cada producto?
                  </label>
                  
                  {selectedProducts.map((prodName) => {
                    const baked = parseInt(bakedQuantities[prodName]) || 0;
                    const leftover = leftoverQuantities[prodName] !== undefined ? leftoverQuantities[prodName] : 0;
                    const sold = Math.max(0, baked - (parseInt(leftover) || 0));

                    return (
                      <div key={prodName} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-900">{prodName}</span>
                          <span className="text-xs text-emerald-700 font-extrabold">{sold} vendidas de {baked}</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updateLeftoverQty(prodName, -1)}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 text-lg shadow-sm flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            max={baked}
                            value={leftover}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setLeftoverQuantities(prev => ({
                                ...prev,
                                [prodName]: raw === '' ? '' : Math.min(baked, Math.max(0, parseInt(raw) || 0))
                              }));
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '') {
                                setLeftoverQuantities(prev => ({ ...prev, [prodName]: 0 }));
                              }
                            }}
                            className="flex-1 h-11 rounded-xl border border-slate-300 text-center font-bold text-lg text-slate-900 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => updateLeftoverQty(prodName, 1)}
                            className="w-11 h-11 rounded-xl bg-emerald-700 text-white font-bold text-lg shadow-sm flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {leftover > 0 && (
                          <div className="flex space-x-1.5 pt-1">
                            {[
                              { id: 'merma', label: '🗑️ Merma' },
                              { id: 'personal', label: '😋 Consumo' },
                              { id: 'regalo', label: '🎁 Regalo' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setWasteTypes(prev => ({ ...prev, [prodName]: opt.id }))}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                                  (wasteTypes[prodName] || 'merma') === opt.id
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total Revenue Collected */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                    Dinero Total Recaudado (Efectivo + Yape) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold text-xl">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      placeholder="0.00"
                      value={totalRevenue}
                      onChange={(e) => setTotalRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full h-16 pl-12 pr-4 rounded-2xl border-2 border-emerald-500 font-black text-3xl text-slate-900 focus:ring-4 focus:ring-emerald-500/15 outline-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Finalizar & Ver Post-Mortem</span>
                  </button>
                </div>
              </form>
            )}

            {/* PASO 4: EL POST-MORTEM (Resumen de la Tanda) */}
            {step === 4 && completedPostMortem && (
              <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="text-center space-y-1 border-b border-slate-100 pb-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center shadow-md">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{completedPostMortem.name}</h2>
                  <p className="text-xs text-slate-500">Cierre realizado el {completedPostMortem.date}</p>
                </div>

                {/* Net Profit Card */}
                <div className={`p-5 rounded-2xl border text-center space-y-1 shadow-sm ${
                  completedPostMortem.profit >= 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ganancia Neta de la Tanda</span>
                  <p className={`text-4xl font-black ${
                    completedPostMortem.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {completedPostMortem.profit >= 0 ? '+' : ''}S/ {completedPostMortem.profit.toFixed(2)}
                  </p>
                  <div className="inline-block mt-1 px-3 py-1 bg-white rounded-full text-xs font-black shadow-xs">
                    Margen ROI: {completedPostMortem.margin.toFixed(1)}%
                  </div>
                </div>

                {/* Financial Overview Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Inversión Inicial</span>
                    <p className="text-lg font-black text-slate-800">S/ {completedPostMortem.investment.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Ingreso Recaudado</span>
                    <p className="text-lg font-black text-slate-800">S/ {completedPostMortem.revenue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items Rendimiento Breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Desglose de Rendimiento</h3>
                  <div className="space-y-2">
                    {completedPostMortem.items.map((it) => (
                      <div key={it.name} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{it.name}</p>
                          <p className="text-slate-500">{it.sold} vendidas de {it.baked} horneadas</p>
                        </div>
                        {it.leftover === 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg">
                            ⭐ 100% Vendido
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg">
                            {it.leftover} sobrantes ({it.wasteType})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restart Button */}
                <button
                  type="button"
                  onClick={handleResetForNewTanda}
                  className="w-full h-14 bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span>Iniciar Nueva Tanda de Producción</span>
                </button>
              </div>
            )}

          </div>
        ) : (

          /* VIEW: HISTORICO DE TANDAS (CARDS FEED) */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-slate-900">Tandas Anteriores Finalizadas</h3>
              <span className="text-xs text-slate-400">{tandasHistory.length} tandas</span>
            </div>

            {tandasHistory.map((tanda) => (
              <div key={tanda.id} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400">{tanda.date}</span>
                    <h4 className="text-base font-extrabold text-slate-900">{tanda.name}</h4>
                  </div>
                  <div className={`text-right px-3 py-1 rounded-xl text-xs font-black ${
                    tanda.profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {tanda.profit >= 0 ? '+' : ''}S/ {tanda.profit.toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Inversión</span>
                    <span className="font-extrabold text-slate-800">S/ {tanda.investment.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Recaudado</span>
                    <span className="font-extrabold text-slate-800">S/ {tanda.revenue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {tanda.items.map(it => (
                    <div key={it.name} className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>• {it.name}</span>
                      <span className="font-bold text-slate-900">{it.sold}/{it.baked} vendidos</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
