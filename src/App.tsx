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
};

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
  const [reefNameDisplay, setReefNameDisplay] = useState('');
  const [reefInfoDisplay, setReefInfoDisplay] = useState('');

  useEffect(() => {
    getItems();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getItems();
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!nearestReef) return;
    let i = 0;
    setReefNameDisplay('');
    const fullText = nearestReef.name;
    const timer = setInterval(() => {
      setReefNameDisplay(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [nearestReef]);

  useEffect(() => {
    if (!nearestReef || !oceanCondition) return;

    const fullInfo = `Reef ID: ${nearestReef.id}
Latitude: ${nearestReef.latitude}
Longitude: ${nearestReef.longitude}
Health Score: ${nearestReef.health_score}
Protection Status: ${nearestReef.protection_status}
Reef Type: ${nearestReef.reef_type}
Bleaching Index: ${nearestReef.bleaching_index}
Marine Life Health: ${nearestReef.marine_life_health}
Species Count: ${nearestReef.species_count}

Ocean Conditions:
Acidity: ${oceanCondition.acidity}
Temperature: ${oceanCondition.temp}
Salinity: ${oceanCondition.salinity}
Dissolved Oxygen: ${oceanCondition.dissolved_oxygen}
Pollution Index: ${oceanCondition.pollution_index}
Notes: ${oceanCondition.notes}`;

    let i = 0;
    setReefInfoDisplay('');
    const timer = setInterval(() => {
      setReefInfoDisplay(fullInfo.slice(0, i + 1));
      i++;
      if (i >= fullInfo.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [nearestReef, oceanCondition]);

  async function signIn() {
    if (!email) return alert('Enter email');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Magic link sent to email');
  }

  async function getItems() {
    const { data, error } = await supabase.from('reefs').select('*');
    if (error) console.error(error);
    else setItems(data || []);
  }

  async function addItem() {
    const params = (window as any).__APP_PARAMS__;
    const { data, error } = await supabase.from('reefs').select('*');
    if (error) console.error(error);
    else setItems(data || []);

    let nearestReef: Reef = null;
    let shortestDistance = Infinity;

    for (let reef of data) {
      const distance = getDistance(Number(params.lat1), Number(params.lng1), Number(reef.latitude), Number(reef.longitude));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestReef = reef;
      }
    }

    setNearestReef(nearestReef);
    await getOceanConditions(nearestReef);
    await getSpeciesByReef(nearestReef);
  }

  async function getSpeciesByReef(reef: Reef) {
    const { data, error } = await supabase
      .from('species_by_reef')
      .select('*')
      .eq("reef_id", reef.id)
      .neq("species_type", "unknown");
    if (error) console.error(error);
    else setSpeciesByReef(data || []);
  }

  async function getOceanConditions(reef: Reef) {
    const { data, error } = await supabase
      .from('ocean_conditions')
      .select('*')
      .eq("reef_id", reef.id);
    if (error) console.error(error);
    else setOceanCondition(data[0] || null);
  }

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={addItem}>Find nearest coral reef</button>

      {nearestReef ? (
        <div>
          <h2>Name: {reefNameDisplay}</h2>
          <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
            {reefInfoDisplay}
          </pre>

          <p><strong>Species Info</strong></p>
          <ul>
            {speciesByReef.map((species) => (
              <li key={species.reef_id}>
                <p>Species: {species.species_name}</p>
                <p>Species Type: {species.species_type}</p>
                <p>Abundance: {species.abundance}</p>
              </li>
            ))}
          </ul>
          <p>Unknown species are not shown</p>
        </div>
      ) : (
        <p>Click the button to find your nearest coral reef.</p>
      )}
    </div>
  );
}