'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

// Ikonok a kategóriákhoz
const CategoryIcon = ({ category, className }) => {
  const icons = {
    'Élelmiszer': '🛒', 'Háztartás': '🧼', 'Szórakozás': '🎉', 'Közlekedés': '🚗',
    'Albérlet': '🏠', 'Rezsi': '💡', 'Egyéb': '📎',
  };
  return <span className={className}>{icons[category] || '📎'}</span>;
};

export default function ElszamolasPage() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Új kiadás állapota
  const [currentUser, setCurrentUser] = useState('Bálint');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Élelmiszer');
  
  // Szűrés és havi nézet állapota
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterPayer, setFilterPayer] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modalok állapota
  const [isRezsiModalOpen, setIsRezsiModalOpen] = useState(false);
  const [isApaModalOpen, setIsApaModalOpen] = useState(false);
  
  const [rezsiCosts, setRezsiCosts] = useState({
    villany: '', viz: '', gaz: '', vodafone: '', biztositas: '',
  });

  const [apaNewAmount, setApaNewAmount] = useState('');
  const [apaNewDescription, setApaNewDescription] = useState('');
  const [apaNewCategory, setApaNewCategory] = useState('Egyéb');

  // Konstansok
  const categories = ['Élelmiszer', 'Háztartás', 'Szórakozás', 'Közlekedés', 'Egyéb'];
  const userNames = { Bálint: 'Bálint', Martin: 'Martin', Apa: 'Apa' };
  const FIX_ALBERLET = 250000;
  const FIX_KOZOS_KOLTSEG = 14604;
  const [limit, setLimit] = useState(10);


  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) { setError('Nem sikerült betölteni az adatokat.'); } else { setExpenses(data || []); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  useEffect(() => {
    if (isLoading || expenses.length === 0) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const hasAlberlet = expenses.some(exp => exp.created_at.startsWith(currentMonth) && exp.description === 'Albérlet');
    const hasKozosKoltseg = expenses.some(exp => exp.created_at.startsWith(currentMonth) && exp.description === 'Közös költség');
    const costsToAdd = [];
    if (!hasAlberlet) { costsToAdd.push({ amount: FIX_ALBERLET, description: 'Albérlet', category: 'Albérlet', payer: 'Apa', created_at: new Date().toISOString() }); }
    if (!hasKozosKoltseg) { costsToAdd.push({ amount: FIX_KOZOS_KOLTSEG, description: 'Közös költség', category: 'Rezsi', payer: 'Apa', created_at: new Date().toISOString() }); }
    if (costsToAdd.length > 0) {
      const addCosts = async () => {
        const { error } = await supabase.from('expenses').insert(costsToAdd);
        if (error) { setError('Hiba az automatikus költségek rögzítésekor.'); } else { fetchExpenses(); }
      };
      addCosts();
    }
  }, [isLoading, expenses, fetchExpenses]);

  const availableMonths = useMemo(() => Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort().reverse(), [expenses]);
  const monthlyExpenses = useMemo(() => expenses.filter(exp => exp.created_at.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const filteredExpenses = useMemo(() => monthlyExpenses.filter(exp => 
    (filterPayer ? exp.payer === filterPayer : true) && (filterCategory ? exp.category === filterCategory : true) && (searchTerm ? exp.description.toLowerCase().includes(searchTerm.toLowerCase()) : true)
  ), [monthlyExpenses, filterPayer, filterCategory, searchTerm]);

  const addExpense = async (e) => {
    e.preventDefault();
    if (!newAmount || isNaN(parseFloat(newAmount)) || !newDescription.trim()) return;
    const { error } = await supabase.from('expenses').insert([{ amount: parseFloat(newAmount), description: newDescription, category: newCategory, payer: currentUser }]);
    if (error) { setError('Nem sikerült a kiadást menteni.'); } else { setNewAmount(''); setNewDescription(''); fetchExpenses(); }
  };

  const addVariableRezsi = async () => {
    const costsToInsert = Object.entries(rezsiCosts).filter(([, value]) => value && parseFloat(value) > 0).map(([key, value]) => ({
      amount: parseFloat(value), description: key.charAt(0).toUpperCase() + key.slice(1), category: 'Rezsi', payer: 'Apa', created_at: `${selectedMonth}-02T12:00:00.000Z`
    }));
    if (costsToInsert.length === 0) { setIsRezsiModalOpen(false); return; }
    const { error } = await supabase.from('expenses').insert(costsToInsert);
    if (error) { setError('Hiba a rezsi rögzítésekor.'); } else { setIsRezsiModalOpen(false); setRezsiCosts({ villany: '', viz: '', gaz: '', vodafone: '', biztositas: '' }); fetchExpenses(); }
  };

  const addApaExpense = async (e) => {
    e.preventDefault();
    if (!apaNewAmount || isNaN(parseFloat(apaNewAmount)) || !apaNewDescription.trim()) return;
    const { error } = await supabase.from('expenses').insert([{ amount: parseFloat(apaNewAmount), description: apaNewDescription, category: apaNewCategory, payer: 'Apa' }]);
    if (error) { setError('Hiba Apa költségének rögzítésekor.'); } else {
      setApaNewAmount(''); setApaNewDescription(''); setIsApaModalOpen(false); fetchExpenses();
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Biztosan törlöd?')) return;
    const { error } = await supabase.from('expenses').delete().match({ id });
    if (error) { setError('Hiba a törlés során.'); } else { fetchExpenses(); }
  };

  const calculation = useMemo(() => {
    const balintSpent = monthlyExpenses.filter(e => e.payer === 'Bálint').reduce((s, e) => s + e.amount, 0);
    const martinSpent = monthlyExpenses.filter(e => e.payer === 'Martin').reduce((s, e) => s + e.amount, 0);
    const apaPaid = monthlyExpenses.filter(e => e.payer === 'Apa').reduce((s, e) => s + e.amount, 0);
    const boysTotalSpent = balintSpent + martinSpent;
    const totalMonthlyCost = boysTotalSpent + apaPaid;
    const difference = balintSpent - (boysTotalSpent / 2);
    let balanceMessage = 'A kettőtök költése egyensúlyban van.';
    if (difference > 1) balanceMessage = `Martin tartozik Bálintnak ${Math.abs(difference).toLocaleString('hu-HU')} Ft-tal.`;
    if (difference < -1) balanceMessage = `Bálint tartozik Martinnak ${Math.abs(difference).toLocaleString('hu-HU')} Ft-tal.`;
    return { balintSpent, martinSpent, apaPaid, totalMonthlyCost, balanceMessage };
  }, [monthlyExpenses]);

  const grandTotalCost = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  
  const historicalSummary = useMemo(() => {
    const summary = {};
    expenses.forEach(exp => {
      const month = exp.created_at.slice(0, 7);
      if (!summary[month]) {
        summary[month] = { Bálint: 0, Martin: 0, Apa: 0, total: 0 };
      }
      summary[month][exp.payer] += exp.amount;
      summary[month].total += exp.amount;
    });
    return Object.entries(summary).sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

  const exportToExcel = () => {
    const data = filteredExpenses.map(e => ({ 'Dátum': new Date(e.created_at).toLocaleDateString('hu-HU'), 'Leírás': e.description, 'Kategória': e.category, 'Fizető': userNames[e.payer], 'Összeg (Ft)': e.amount }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedMonth}`);
    XLSX.writeFile(workbook, `elszamolas_${selectedMonth}.xlsx`);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center"><h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Havi Elszámolás</h1></header>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div>
                <label htmlFor="month-select" className="text-sm font-semibold text-gray-400 mr-2">Hónap:</label>
                <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2">
                    {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
            </div>
            <div className='flex flex-wrap gap-2'>
                <button onClick={() => setIsRezsiModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 font-bold py-2 px-4 rounded-lg">💡 Változó Rezsi</button>
                <button onClick={() => setIsApaModalOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 font-bold py-2 px-4 rounded-lg">💸 Plusz Költség (Apa)</button>
                <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-4 rounded-lg">📄 Export Excelbe</button>
            </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center">{error}</div>}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Összegzés ({selectedMonth})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className='bg-gray-900/40 p-4 rounded-lg'>
                <h3 className='font-bold text-lg mb-3 text-pink-400'>Mi Ketten</h3>
                <p className="text-sm text-gray-400">Bálint költése</p><p className="text-xl font-bold text-green-400">{calculation.balintSpent.toLocaleString('hu-HU')} Ft</p>
                <p className="text-sm text-gray-400 mt-2">Martin költése</p><p className="text-xl font-bold text-blue-400">{calculation.martinSpent.toLocaleString('hu-HU')} Ft</p>
                <div className="mt-4 pt-3 border-t border-gray-700"><p className="text-md font-semibold text-pink-400">{calculation.balanceMessage}</p></div>
            </div>
            <div className="bg-gray-900/40 p-4 rounded-lg flex flex-col justify-center">
              <h3 className="font-bold text-lg mb-3 text-yellow-400">Támogatás</h3>

              <p className="text-sm text-gray-400">Apa által fizetve</p>
              <p className="text-2xl font-bold">
                {calculation.apaPaid.toLocaleString('hu-HU')} Ft
              </p>
              <p className="text-sm text-gray-400 mt-4">Anya által fizetve</p>
              {selectedMonth === "2025-08" ? (
                <p className="text-2xl font-bold text-red-400">—</p> // vagy üresen hagyhatod
              ) : (
                <p className="text-2xl font-bold">100 000 Ft</p>
              )}
              <p className="text-sm text-gray-400 mt-4">Mama által fizetve</p>
              <p className="text-2xl font-bold">60 000 Ft</p>
            </div>
            <div className='bg-gray-900/40 p-4 rounded-lg flex flex-col justify-center'>
                 <h3 className='font-bold text-lg mb-3 text-purple-300'>Teljes Megélhetés</h3>
                 <p className="text-sm text-gray-400">A hónap teljes költsége</p><p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">{calculation.totalMonthlyCost.toLocaleString('hu-HU')} Ft</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Új kiadás hozzáadása</h2>
          <div className="flex justify-center rounded-lg bg-gray-700/50 p-1 mb-4">
            {['Bálint', 'Martin'].map(u => (<button key={u} onClick={() => setCurrentUser(u)} className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-all ${currentUser === u ? (u === 'Bálint' ? 'bg-green-500' : 'bg-blue-500') : 'text-gray-300'}`}>{u}</button>))}
          </div>
          <form onSubmit={addExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="number" placeholder="Összeg (Ft)" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3" required />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
            </div>
            <input type="text" placeholder="Leírás" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3" required />
            <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg">Hozzáadás</button>
          </form>
        </div>
        

        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Kiadások ({selectedMonth})</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <select value={filterPayer} onChange={e => setFilterPayer(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <option value="">Összes fizető</option>
              {Object.keys(userNames).map(u => <option key={u} value={u}>{userNames[u]}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <option value="">Összes kategória</option>
              {['Élelmiszer', 'Háztartás', 'Szórakozás', 'Közlekedés', 'Albérlet', 'Rezsi', 'Egyéb'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Keresés..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>Összes</option>
            </select>
          </div>

          {isLoading ? <p>Betöltés...</p> : filteredExpenses.length === 0 ? <p className="text-center text-gray-400 bg-gray-800/50 p-6 rounded-lg">Nincs kiadás ebben a hónapban.</p> : (
            <ul className="space-y-3">
            <AnimatePresence>
              {(limit === -1 ? filteredExpenses : filteredExpenses.slice(0, limit)).map(exp => (
                <motion.li key={exp.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CategoryIcon category={exp.category} className="text-2xl" />
                    <div>
                      <p className="font-semibold">{exp.description}</p>
                      <p className={`text-sm ${exp.payer === 'Bálint' ? 'text-green-400' : exp.payer === 'Martin' ? 'text-blue-400' : 'text-yellow-400'}`}>{userNames[exp.payer]} fizette</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <p className="font-bold text-lg">{exp.amount.toLocaleString("hu-HU")} Ft</p>
                    <button onClick={() => deleteExpense(exp.id)} className="text-gray-500 hover:text-red-500 text-xl">🗑️</button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          )}
        </div>
        
        {/* NAGY ÖSSZESÍTŐ SZEKCIÓ */}
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div>
                    <h2 className="text-2xl font-bold text-purple-300 mb-3">Történeti Összesítő</h2>
                    <p className="text-gray-400 text-sm">
                        A közös kasszába <strong className="text-white">Anya 100.000 Ft-tal</strong>, <strong className="text-white">Mama (Apa anyukája) 60.000 Ft-tal</strong> járul hozzá havonta. <strong className="text-white">Apa</strong> fizeti az albérletet, a közös költséget és a rezsi többi részét.
                    </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                    <p className="text-md font-semibold text-gray-400">A megélhetés teljes költsége eddig:</p>
                    <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        {grandTotalCost.toLocaleString('hu-HU')} Ft
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historicalSummary.map(([month, data]) => (
                    <div key={month} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <h4 className="font-bold text-lg text-center text-purple-300 mb-3">{month}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Apa:</span> <span className="font-semibold text-yellow-400">{data.Apa.toLocaleString('hu-HU')} Ft</span></div>
                            <div className="flex justify-between"><span>Bálint:</span> <span className="font-semibold text-green-400">{data.Bálint.toLocaleString('hu-HU')} Ft</span></div>
                            <div className="flex justify-between"><span>Martin:</span> <span className="font-semibold text-blue-400">{data.Martin.toLocaleString('hu-HU')} Ft</span></div>
                            <div className="flex justify-between border-t border-gray-600 mt-2 pt-2"><strong>Összesen:</strong> <strong className="text-purple-300">{data.total.toLocaleString('hu-HU')} Ft</strong></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>


        {/* MODALOK */}
        <AnimatePresence>
            {isRezsiModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
                        <h2 className="text-2xl font-bold text-purple-300 mb-6">Változó rezsi rögzítése ({selectedMonth})</h2>
                        <div className="space-y-4">{Object.keys(rezsiCosts).map(key => (<input key={key} type="number" placeholder={key.charAt(0).toUpperCase() + key.slice(1)} value={rezsiCosts[key]} onChange={e => setRezsiCosts({...rezsiCosts, [key]: e.target.value})} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3" />))}</div>
                        <p className='text-xs text-gray-400 mt-4'>Ezeket a tételeket "Apa" nevére rögzítjük.</p>
                        <div className="flex gap-4 mt-6"><button onClick={addVariableRezsi} className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 rounded-lg">Mentés</button><button onClick={() => setIsRezsiModalOpen(false)} className="w-full bg-gray-600 hover:bg-gray-700 font-bold py-3 rounded-lg">Mégse</button></div>
                    </motion.div>
                </motion.div>
            )}
            {isApaModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
                        <h2 className="text-2xl font-bold text-purple-300 mb-6">Plusz költség Apa nevére</h2>
                        <form onSubmit={addApaExpense} className="space-y-4">
                            <input type="number" placeholder="Összeg (Ft)" value={apaNewAmount} onChange={e => setApaNewAmount(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3" required />
                            <select value={apaNewCategory} onChange={e => setApaNewCategory(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            <input type="text" placeholder="Leírás" value={apaNewDescription} onChange={e => setApaNewDescription(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3" required />
                            <div className="flex gap-4 pt-2">
                                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold py-3 rounded-lg">Mentés</button>
                                <button type="button" onClick={() => setIsApaModalOpen(false)} className="w-full bg-gray-600 hover:bg-gray-700 font-bold py-3 rounded-lg">Mégse</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}