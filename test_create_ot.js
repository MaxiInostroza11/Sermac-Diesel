import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function testCreate() {
  console.log("Testing insert into ordenes...");
  const { data, error } = await supabase.from('ordenes').insert({
    cliente_id: null,
    marca_modelo: 'Toyota Yaris',
    patente_vehiculo: 'AA1122',
    observaciones: 'Test',
    tipo: 'cliente',
    orden_padre_id: null,
    estado: 'ingresada',
    mecanico_id: null,
    kilometraje: null,
    nivel_combustible: null,
    danos_existentes: null,
  }).select().single();
  
  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert success:", data);
  }
}

testCreate();
