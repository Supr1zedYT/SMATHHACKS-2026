import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';


type Reef = {
  name: string;
  latitude: number;
  longitude: number;
  id: string; 
  health_score: number;
  protection_status: string;
  reef_type: string;
  bleaching_index: number;
  marine_life_health: number;
  species_count: number;
};// get ocean conditions based on reef id
type OceanCondition = {
  acidity: number;
  temp: number;
  reef_id: string;
  salinity: number;
  dissolved_oxygen: number;
  pollution_index: number;
  notes: string;
};
type SpeciesbyReef = {
  reef_id: string;
  species_name: string;
  species_type: number;
  abundance: string;
};

export default function App() {
  const [items, setItems] = useState([]);
  const [email, setEmail] = useState('');
const [nearestReef, setNearestReef] = useState<Reef | null>(null);
const [oceanCondition, setOceanCondition] = useState<OceanCondition | null>(null);
const [speciesByReef, setSpeciesByReef] = useState<SpeciesbyReef[]>([]);
  useEffect(() => {
    getItems();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getItems();
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function signIn() {
    if (!email) return alert('Enter email');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Magic link sent to email');
  }

async function getItems() {
  const { data, error } = await supabase
    .from('reefs')
    .select('*');
  if (error) console.error(error);
  else setItems(data || []);
}

async function addItem() {
const params = (window as any).__APP_PARAMS__;
console.log(params.lat1);
 const { data, error } = await supabase
    .from('reefs')
    .select('*');
  if (error) console.error(error);
  else setItems(data || []);

let nearestReef:Reef = null;
let shortestDistance = Infinity;

for (let reef of data) {
  const distance = getDistance(Number(params.lat1), Number(params.lng1), Number(reef.latitude), Number(reef.longitude));

  if (distance < shortestDistance) {
    shortestDistance = distance;
    nearestReef = reef;
  }

}

console.log("Nearest reef:", nearestReef);
console.log("Distance (km):", shortestDistance);
  setNearestReef(nearestReef);
  await getOceanConditions(nearestReef);
  await getSpeciesByReef(nearestReef);
}
async function getSpeciesByReef(reef: Reef) {

  console.log("Fetching species for reef ID:", reef.id);
  const { data, error } = await supabase
  .from('species_by_reef')
  .select('*')
  .eq("reef_id", reef.id)
  .neq("species_type", "unknown");
  if (error) console.error(error);
  else setSpeciesByReef(data || []);
}




// get ocean conditions based on reef id
async function getOceanConditions(reef: Reef) {

  
console.log("Fetching ocean conditions for reef ID:", reef.id);
  const { data, error } = await supabase
    .from('ocean_conditions')
    .select('*')
    .eq("reef_id",  reef.id);

  if (error) console.error(error);
  else console.log("Ocean conditions for reef", reef.name, ":", data);
  setOceanCondition(data[0] || null);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

  return (
   
<div style={{ padding: "20px" }}>
<button onClick={addItem}>Find nearest coral reef</button>
      <h1>Nearest Reef</h1>

      {nearestReef ? (
        <div>
          <p><strong>Reef Info</strong></p>
          <p>Name: {nearestReef.name}</p>
	  <p>Reef ID: {nearestReef.id}</p>
    

          <p>Latitude: {nearestReef.latitude}</p>
          <p>Longitude: {nearestReef.longitude}</p>
          <p>Health Score: {nearestReef.health_score}</p>
          <p>Protection Status: {nearestReef.protection_status}</p>
          <p>Reef Type: {nearestReef.reef_type}</p>
          <p>Bleaching Index: {nearestReef.bleaching_index}</p>
          <p>Marine Life Health: {nearestReef.marine_life_health}</p>
          <p>Species Count: {nearestReef.species_count}</p>
          <br>
          </br>
          <li><ul>{speciesByReef.map((species) => (
            <li key={species.id}>
              <p>Species: {species.species_name}</p>
              <p>Species Type: {species.species_type}</p>
              <p>Abundance: {species.abundance}</p>
              
            </li>

          ))}</ul>

          </li>
          <p>'unknown species are not shown'</p>
          
          
          <br>
          </br>
          <p><strong>Ocean Conditions:</strong></p>
          {oceanCondition && (
            <div>
              <p>Acidity: {oceanCondition.acidity}</p>
              <p>Temperature: {oceanCondition.temp}</p>
              <p>Salinity: {oceanCondition.salinity}</p>
              <p>Dissolved Oxygen: {oceanCondition.dissolved_oxygen}</p>
              <p>Pollution Index: {oceanCondition.pollution_index}</p>
              <p>Notes: {oceanCondition.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <p>Finding nearest reef...</p>
      )}

    </div>
  );
}