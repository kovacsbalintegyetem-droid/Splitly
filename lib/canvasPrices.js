// Ez a fájl tartalmazza az Excelből kinyert árakat.
// Ezt fogjuk használni a Supabase tábla feltöltéséhez és az admin felületen.

export const canvasPrices = [
    // Négyzetes
    { size: "20x20", customer_price: 5500, purchase_price: 4326 },
    { size: "30x30", customer_price: 7500, purchase_price: 5978 },
    { size: "40x40", customer_price: 9500, purchase_price: 7630 },
    { size: "50x50", customer_price: 12500, purchase_price: 9944 },
    { size: "60x60", customer_price: 16500, purchase_price: 13005 },
    { size: "70x70", customer_price: 19500, purchase_price: 15469 },
    { size: "80x80", customer_price: 24500, purchase_price: 19456 },
    { size: "90x90", customer_price: 28500, purchase_price: 22695 },
    { size: "100x100", customer_price: 35000, purchase_price: 27838 },
    // Téglalap
    { size: "20x30", customer_price: 7500, purchase_price: 6216 },
    { size: "30x45", customer_price: 10000, purchase_price: 8379 },
    { size: "40x60", customer_price: 12500, purchase_price: 10486 },
    { size: "50x75", customer_price: 15500, purchase_price: 12985 },
    { size: "60x90", customer_price: 19500, purchase_price: 16646 },
    { size: "70x105", customer_price: 22000, purchase_price: 18739 },
    { size: "80x120", customer_price: 27500, purchase_price: 23023 },
    { size: "90x135", customer_price: 32000, purchase_price: 27062 },
    { size: "100x150", customer_price: 39000, purchase_price: 32760 },
  ];
  
  // Futtathatsz egy egyszeri scriptet, ami ezzel a listával feltölti a 'canvas_products' táblát a Supabase-ban.
  // Példa script (ezt egy külön fájlban futtathatod Node.js-sel):
  /*
  import { createClient } from '@supabase/supabase-js';
  import { canvasPrices } from './canvasPrices.js';
  
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  async function uploadPrices() {
    const { data, error } = await supabaseAdmin
      .from('canvas_products')
      .insert(canvasPrices);
  
    if (error) {
      console.error('Hiba az árak feltöltésekor:', error);
    } else {
      console.log('Árak sikeresen feltöltve:', data);
    }
  }
  
  uploadPrices();
  */
  